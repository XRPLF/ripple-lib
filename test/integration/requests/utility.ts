import { assert } from 'chai'
import _ from 'lodash'

import { PingResponse, RandomResponse } from '../../../src'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('Utility method integration tests', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('ping', async function () {
    const response = (await this.client.request({
      command: 'ping',
    })) as PingResponse
    const expected: PingResponse = {
      id: 0,
      result: { role: 'admin', unlimited: true },
      status: 'success',
      type: 'response',
    }
    assert.deepEqual(response, expected)
  })

  it('random', async function () {
    const response = (await this.client.request({
      command: 'random',
    })) as RandomResponse
    const expected: RandomResponse = {
      id: 0,
      result: {
        random: '[random string of 64 bytes]',
      },
      status: 'success',
      type: 'response',
    }
    assert.equal(response.id, expected.id)
    assert.equal(response.status, expected.status)
    assert.equal(response.type, expected.type)
    assert.equal(response.result.random.length, 64)
  })
})
