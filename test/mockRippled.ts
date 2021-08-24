import _ from 'lodash'
import fs from 'fs'
import assert from 'assert'
import {Server as WebSocketServer} from 'ws'
import {EventEmitter2} from 'eventemitter2'
import fixtures from './fixtures/rippled'
import addresses from './fixtures/addresses.json'
import fullLedger from './fixtures/rippled/ledgerFull38129.json'
import {getFreePort} from './testUtils'
import { Request } from '../src'

function isUSD(json) {
  return json === 'USD' || json === '0000000000000000000000005553440000000000'
}

function isBTC(json) {
  return json === 'BTC' || json === '0000000000000000000000004254430000000000'
}

function createResponse(request, response, overrides = {}) {
  const result = Object.assign({}, response.result, overrides)
  const change =
    response.result && !_.isEmpty(overrides)
      ? {id: request.id, result: result}
      : {id: request.id}
  return JSON.stringify(Object.assign({}, response, change))
}

function createLedgerResponse(request, response) {
  const newResponse = JSON.parse(createResponse(request, response))
  if (newResponse.result && newResponse.result.ledger) {
    if (!request.transactions) {
      delete newResponse.result.ledger.transactions
    }
    if (!request.accounts) {
      delete newResponse.result.ledger.accountState
    }
    // the following fields were not in the ledger response in the past
    if (newResponse.result.ledger.close_flags == null) {
      newResponse.result.ledger.close_flags = 0
    }
    if (newResponse.result.ledger.parent_close_time == null) {
      newResponse.result.ledger.parent_close_time =
        newResponse.result.ledger.close_time - 10
    }
    newResponse.result.ledger_index = newResponse.result.ledger.ledger_index
  }
  return JSON.stringify(newResponse)
}

// We mock out WebSocketServer in these tests and add a lot of custom
// properties not defined on the normal WebSocketServer object.
type MockedWebSocketServer = any

export function createMockRippled(port) {
  const mock = new WebSocketServer({port: port}) as MockedWebSocketServer
  Object.assign(mock, EventEmitter2.prototype)

  mock.responses = {}

  mock.addResponse = (request: Request, response: object | ((r: Request) => object)) => {
    const command = request.command
    mock.responses[command] = response
  }

  mock.getResponse = (request: Request) : object => {
    if (!(request.command in mock.responses)) {
      throw new Error(`No handler for ${request.command}`)
    }
    const functionOrObject = mock.responses[request.command]
    if (typeof functionOrObject === 'function') {
      return functionOrObject(request)
    }
    return functionOrObject
  }

  const close = mock.close
  mock.close = function () {
    if (mock.expectedRequests != null) {
      const allRequestsMade = Object.entries(mock.expectedRequests).every(function (
        _, counter
      ) {
        return counter === 0
      })
      if (!allRequestsMade) {
        const json = JSON.stringify(mock.expectedRequests, null, 2)
        const indent = '      '
        const indented = indent + json.replace(/\n/g, '\n' + indent)
        assert(false, 'Not all expected requests were made:\n' + indented)
      }
    }
    close.call(mock)
  }

  mock.expect = function (expectedRequests) {
    mock.expectedRequests = expectedRequests
  }

  mock.suppressOutput = false

  mock.on('connection', function (this: MockedWebSocketServer, conn: any) {
    if (mock.config.breakNextConnection) {
      mock.config.breakNextConnection = false
      conn.terminate()
      return
    }
    this.socket = conn
    conn.config = {}
    conn.on('message', function (requestJSON) {
      try {
        const request = JSON.parse(requestJSON)
        if (request.command in mock.responses) {
          conn.send(createResponse(request, mock.getResponse(request)))
        } else {
          // TODO: remove this block once all the handlers have been removed
          mock.emit('request_' + request.command, request, conn)
        }
      } catch (err) {
        if (!mock.suppressOutput)
          console.error('Error: ' + err.message)
        conn.close(4000, err.message)
      }
    })
  })

  mock.config = {}

  mock.onAny(function (this: MockedWebSocketServer) {
    if (this.event.indexOf('request_') !== 0) {
      return
    }
    if (mock.listeners(this.event).length === 0) {
      throw new Error('No event handler registered in mock rippled for ' + this.event)
    }
    if (mock.expectedRequests == null) {
      return // TODO: fail here to require expectedRequests
    }
    const expectedCount = mock.expectedRequests[this.event]
    if (expectedCount == null || expectedCount === 0) {
      throw new Error('Unexpected request: ' + this.event)
    }
    mock.expectedRequests[this.event] -= 1
  })

  mock.on('request_test_command', function (request, conn) {
    assert.strictEqual(request.command, 'test_command')
    if (request.data.disconnectIn) {
      setTimeout(conn.terminate.bind(conn), request.data.disconnectIn)
      conn.send(
        createResponse(request, {
          status: 'success',
          type: 'response',
          result: {}
        })
      )
    } else if (request.data.openOnOtherPort) {
      getFreePort().then((newPort) => {
        createMockRippled(newPort)
        conn.send(
          createResponse(request, {
            status: 'success',
            type: 'response',
            result: {port: newPort}
          })
        )
      })
    } else if (request.data.closeServerAndReopen) {
      setTimeout(() => {
        conn.terminate()
        close.call(mock, () => {
          setTimeout(() => {
            createMockRippled(port)
          }, request.data.closeServerAndReopen)
        })
      }, 10)
    } else if (request.data.unrecognizedResponse) {
      conn.send(
        createResponse(request, {
          status: 'unrecognized',
          type: 'response',
          result: {}
        })
      )
    }
  })

  mock.on('request_global_config', function (request, conn) {
    assert.strictEqual(request.command, 'global_config')
    mock.config = Object.assign(conn.config, request.data)
    conn.send(
      createResponse(request, {
        status: 'success',
        type: 'response',
        result: {}
      })
    )
  })

  mock.on('request_ledger', function (request, conn) {
    assert.strictEqual(request.command, 'ledger')
    if (request.ledger_index === 34) {
      conn.send(createLedgerResponse(request, fixtures.ledger.notFound))
    } else if (request.ledger_index === 6) {
      conn.send(createResponse(request, fixtures.ledger.withStateAsHashes))
    } else if (request.ledger_index === 9038215) {
      conn.send(createLedgerResponse(request, fixtures.ledger.withoutCloseTime))
    } else if (request.ledger_index === 4181996) {
      conn.send(createLedgerResponse(request, fixtures.ledger.withSettingsTx))
    } else if (
      request.ledger_index === 22420574 &&
      request.expand === true &&
      request.transactions === true
    ) {
      conn.send(
        createLedgerResponse(request, fixtures.ledger.withPartialPayment)
      )
    } else if (request.ledger_index === 100001) {
      conn.send(
        createLedgerResponse(request, fixtures.ledger.pre2014withPartial)
      )
    } else if (request.ledger_index === 38129) {
      const response = Object.assign({}, fixtures.ledger.normal, {
        result: {ledger: fullLedger}
      })
      conn.send(createLedgerResponse(request, response))
    } else if (
      request.ledger_hash ===
      '15F20E5FA6EA9770BBFFDBD62787400960B04BE32803B20C41F117F41C13830D'
    ) {
      conn.send(createLedgerResponse(request, fixtures.ledger.normalByHash))
    } else if (
      request.ledger_index === 'validated' ||
      request.ledger_index === 14661789 ||
      request.ledger_index === 14661788 /* getTransaction - order */
    ) {
      conn.send(createLedgerResponse(request, fixtures.ledger.normal))
    } else {
      assert(false, 'Unrecognized ledger request: ' + JSON.stringify(request))
    }
  })

  mock.on('request_ping', function (request, conn) {
    // NOTE: We give the response a timeout of 2 second, so that tests can
    // set their timeout threshold to greater than or less than this number
    // to test timeouts.
    setTimeout(() => {
      conn.send(
        createResponse(request, {
          result: {},
          status: 'success',
          type: 'response'
        })
      )
    }, 1000 * 2)
  })

  let requestsCache = undefined

  mock.on('request_book_offers', function (request, conn) {
    if (request.taker_pays.issuer === 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw') {
      conn.send(createResponse(request, fixtures.book_offers.xrp_usd))
    } else if (
      request.taker_gets.issuer === 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw'
    ) {
      conn.send(createResponse(request, fixtures.book_offers.usd_xrp))
    } else if (
      isBTC(request.taker_gets.currency) &&
      isUSD(request.taker_pays.currency)
    ) {
      conn.send(
        fixtures.book_offers.fabric.requestBookOffersBidsResponse(request)
      )
    } else if (
      isUSD(request.taker_gets.currency) &&
      isBTC(request.taker_pays.currency)
    ) {
      conn.send(
        fixtures.book_offers.fabric.requestBookOffersAsksResponse(request)
      )
    } else {
      const rippledDir = 'test/fixtures/rippled'
      if (!requestsCache) {
        requestsCache = fs.readdirSync(rippledDir + '/requests')
      }
      for (var i = 0; i < requestsCache.length; i++) {
        const file = requestsCache[i]
        const json = fs.readFileSync(rippledDir + '/requests/' + file, 'utf8')
        const r = JSON.parse(json)
        const requestWithoutId = _.omit(Object.assign({}, request), 'id')
        if (_.isEqual(requestWithoutId, r)) {
          const responseFile =
            rippledDir + '/responses/' + file.split('.')[0] + '-res.json'
          const res = fs.readFileSync(responseFile, 'utf8')
          const response = createResponse(request, {
            id: 0,
            type: 'response',
            status: 'success',
            result: JSON.parse(res)
          })
          conn.send(response)
          return
        }
      }

      assert(false, 'Unrecognized order book: ' + JSON.stringify(request))
    }
  })

  mock.on('request_ripple_path_find', function (request, conn) {
    let response = null
    if (request.subcommand === 'close') {
      // for path_find command
      return
    }
    if (request.source_account === 'rB2NTuTTS3eNCsWxZYzJ4wqRqxNLZqA9Vx') {
      // getPaths - result path has source_amount in drops
      response = createResponse(request, {
        id: 0,
        type: 'response',
        status: 'success',
        result: {
          alternatives: [
            {
              destination_amount: {
                currency: 'EUR',
                issuer: 'rGpGaj4sxEZGenW1prqER25EUi7x4fqK9u',
                value: '1'
              },
              paths_canonical: [],
              paths_computed: [
                [
                  {
                    currency: 'USD',
                    issuer: 'rGpGaj4sxEZGenW1prqER25EUi7x4fqK9u',
                    type: 48,
                    type_hex: '0000000000000030'
                  },
                  {
                    currency: 'EUR',
                    issuer: 'rGpGaj4sxEZGenW1prqER25EUi7x4fqK9u',
                    type: 48,
                    type_hex: '0000000000000030'
                  }
                ]
              ],
              source_amount: '1000000'
            }
          ],
          destination_account: 'rhpJkBfZGQyT1xeDbwtKEuSrSXw3QZSAy5',
          destination_amount: {
            currency: 'EUR',
            issuer: 'rGpGaj4sxEZGenW1prqER25EUi7x4fqK9u',
            value: '-1'
          },
          destination_currencies: ['EUR', 'XRP'],
          full_reply: true,
          id: 2,
          source_account: 'rB2NTuTTS3eNCsWxZYzJ4wqRqxNLZqA9Vx',
          status: 'success'
        }
      })
    } else if (request.source_account === addresses.NOTFOUND) {
      response = createResponse(request, fixtures.path_find.srcActNotFound)
    } else if (request.source_account === addresses.SOURCE_LOW_FUNDS) {
      response = createResponse(request, fixtures.path_find.sourceAmountLow)
    } else if (request.source_account === addresses.OTHER_ACCOUNT) {
      response = createResponse(request, fixtures.path_find.sendUSD)
    } else if (request.source_account === addresses.THIRD_ACCOUNT) {
      response = createResponse(request, fixtures.path_find.XrpToXrp, {
        destination_amount: request.destination_amount,
        destination_address: request.destination_address
      })
    } else if (request.source_account === addresses.ACCOUNT) {
      if (
        request.destination_account === 'ra5nK24KXen9AHvsdFTKHSANinZseWnPcX' &&
        // Important: Ensure that destination_amount.value is correct
        request.destination_amount.value === '-1'
      ) {
        response = createResponse(request, fixtures.path_find.sendAll)
      } else {
        response = fixtures.path_find.generate.generateIOUPaymentPaths(
          request.id,
          request.source_account,
          request.destination_account,
          request.destination_amount
        )
      }
    } else {
      assert(
        false,
        'Unrecognized path find request: ' + JSON.stringify(request)
      )
    }
    conn.send(response)
  })

  return mock
}
