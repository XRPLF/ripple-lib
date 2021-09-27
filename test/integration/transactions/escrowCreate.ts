/* eslint-disable mocha/no-hooks-for-single-case -- Use of hooks is restricted when there is a single test case. */
import _ from 'lodash'

import { EscrowCreate } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('EscrowCreate', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const wallet1 = await generateFundedWallet(this.client)
    const tx: EscrowCreate = {
      Account: this.wallet.getClassicAddress(),
      TransactionType: 'EscrowCreate',
      Amount: '10000',
      Destination: wallet1.getClassicAddress(),
      FinishAfter: Math.round(Date.now() / 1000) - 0x386d4380 + 1000000,
    }
    await testTransaction(this.client, tx, this.wallet)
  })
})
