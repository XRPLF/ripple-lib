import { assert } from 'chai'

import { RippledError } from 'xrpl-local/common/errors'
import { Transaction } from 'xrpl-local/models/transactions'

import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import { assertRejects } from '../testUtils'

describe('client.submitSignedTransaction', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  const signedTransaction: Transaction = {
    TransactionType: 'Payment',
    Sequence: 1,
    LastLedgerSequence: 12312,
    Amount: '20000000',
    Fee: '12',
    SigningPubKey:
      '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D',
    TxnSignature:
      '3045022100B3D311371EDAB371CD8F2B661A04B800B61D4B132E09B7B0712D3B2F11B1758302203906B44C4A150311D74FF6A35B146763C0B5B40AC30BD815113F058AA17B3E63',
    Account: 'rhvh5SrgBL5V8oeV9EpDuVszeJSSCEkbPc',
    Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
  }

  it('should submit a signed transaction', async function () {
    const signedTx: Transaction = { ...signedTransaction }

    this.mockRippled.addResponse('submit', rippled.submit.success)

    try {
      const response = await this.client.submitSignedTransaction(signedTx)
      assert(response.result.engine_result, 'tesSUCCESS')
    } catch (_error) {
      assert(false, 'Did not expect an error to be thrown')
    }
  })

  it('should throw a RippledError on failed submit response', async function () {
    const signedTx: Transaction = { ...signedTransaction }

    this.mockRippled.addResponse('submit', rippled.submit.failure)

    return assertRejects(
      this.client.submitSignedTransaction(signedTx),
      RippledError,
    )
  })
})
