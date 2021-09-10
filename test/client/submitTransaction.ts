import { assert } from 'chai'

import { RippledError } from 'xrpl-local/common/errors'
import { Transaction } from 'xrpl-local/models/transactions'
import Wallet from 'xrpl-local/wallet'

import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import { assertRejects } from '../testUtils'

describe('client.submitTransaction', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  const publicKey =
    '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D'
  const privateKey =
    '00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F'
  const address = 'rhvh5SrgBL5V8oeV9EpDuVszeJSSCEkbPc'

  const transaction: Transaction = {
    TransactionType: 'Payment',
    Account: address,
    Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
    Amount: '20000000',
    Sequence: 1,
    Fee: '12',
    SigningPubKey: publicKey,
    LastLedgerSequence: 12312,
  }

  it('should submit an unsigned transaction', async function () {
    const tx: Transaction = { ...transaction }
    const wallet = new Wallet(publicKey, privateKey)

    this.mockRippled.addResponse('account_info', rippled.account_info.normal)
    this.mockRippled.addResponse('ledger', rippled.ledger.normal)
    this.mockRippled.addResponse('server_info', rippled.server_info.normal)
    this.mockRippled.addResponse('submit', rippled.submit.success)

    try {
      const response = await this.client.submitTransaction(wallet, tx)
      assert(response.result.engine_result, 'tesSUCCESS')
    } catch (_error) {
      assert(false, 'Did not expect an error to be thrown')
    }
  })

  it('should throw a RippledError on failed submit response', async function () {
    const tx: Transaction = { ...transaction }
    const wallet = new Wallet(publicKey, privateKey)

    this.mockRippled.addResponse('account_info', rippled.account_info.normal)
    this.mockRippled.addResponse('ledger', rippled.ledger.normal)
    this.mockRippled.addResponse('server_info', rippled.server_info.normal)
    this.mockRippled.addResponse('submit', rippled.submit.failure)

    return assertRejects(
      this.client.submitTransaction(wallet, tx),
      RippledError,
    )
  })
})
