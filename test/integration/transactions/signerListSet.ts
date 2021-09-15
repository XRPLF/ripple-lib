import { assert } from 'chai'
import _ from 'lodash'
import { Client } from 'xrpl-local'
import { SignerListSet } from 'xrpl-local/models/transactions'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { wallet } from '../wallet'

// how long before each test case times out
const TIMEOUT = 20000

describe('SignerListSet', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const client: Client = this.client
    const tx: SignerListSet = {
      TransactionType: 'SignerListSet',
      Account: wallet.getClassicAddress(),
      SignerEntries: [
        {
          SignerEntry: {
            Account: 'r5nx8ZkwEbFztnc8Qyi22DE9JYjRzNmvs',
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: 'r3RtUvGw9nMoJ5FuHxuoVJvcENhKtuF9ud',
            SignerWeight: 1,
          },
        },
      ],
      SignerQuorum: 2,
    }
    const response = await client.submitTransaction(wallet, tx)
    assert.equal(response.status, 'success')
  })
})
