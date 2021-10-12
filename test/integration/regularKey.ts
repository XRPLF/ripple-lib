import { assert } from 'chai'
import _ from 'lodash'
import { decode } from 'ripple-binary-codec/dist'

import {
  AccountSet,
  Client,
  SignerListSet,
  SubmitMultisignedRequest,
  Transaction,
  SubmitMultisignedResponse,
  hashes,
  SetRegularKey,
  Wallet,
  AccountSetAsfFlags,
  OfferCreate,
} from 'xrpl-local'
import { convertStringToHex } from 'xrpl-local/utils'
import { multisign } from 'xrpl-local/wallet/signer'

import serverUrl from './serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from './setup'
import {
  generateFundedWallet,
  ledgerAccept,
  testTransaction,
  verifySubmittedTransaction,
} from './utils'

// how long before each test case times out
const TIMEOUT = 20000
const { hashSignedTx } = hashes

async function generateFundedWalletWithRegularKey(
  client: Client,
  returnMasterWallet = false,
  disableMasterKey = false,
): Promise<Wallet> {
  const regularKeyInfo = {
    seed: 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb',
    accountId: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  }

  const masterWallet = await generateFundedWallet(client)

  const regularKeyWallet = Wallet.fromSeed(regularKeyInfo.seed, {
    classicAddress: masterWallet.address,
  })

  const setRegularTx: SetRegularKey = {
    TransactionType: 'SetRegularKey',
    Account: masterWallet.address,
    RegularKey: regularKeyInfo.accountId,
  }

  // Add a regular key to the first account
  await client.submit(masterWallet, setRegularTx)

  if (disableMasterKey) {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: masterWallet.classicAddress,
      SetFlag: AccountSetAsfFlags.asfDisableMaster,
    }

    await testTransaction(client, accountSet, masterWallet)
  }

  if (returnMasterWallet) {
    return masterWallet
  }
  return regularKeyWallet
}

describe('regular key', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('sign and submit with a regular key', function () {
    const regularKeyWallet = await generateFundedWalletWithRegularKey(
      this.client,
    )

    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: regularKeyWallet.classicAddress,
      Domain: convertStringToHex('example.com'),
    }
  })

  it('sign and submit using the master key of an account with a regular key', async function () {
    const masterWallet = await generateFundedWalletWithRegularKey(
      this.client,
      true,
    )

    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: masterWallet.classicAddress,
      Domain: convertStringToHex('example.com'),
    }

    testTransaction(this.client, accountSet, masterWallet)
  })

  it('try to sign with master key after disabling', async function () {
    const masterWallet = await generateFundedWalletWithRegularKey(
      this.client,
      true,
      true,
    )

    const tx: OfferCreate = {
      TransactionType: 'OfferCreate',
      Account: masterWallet.classicAddress,
      TakerGets: '13100000',
      TakerPays: {
        currency: 'USD',
        issuer: masterWallet.classicAddress,
        value: '10',
      },
    }

    const client: Client = this.client
    const response = await client.submit(masterWallet, tx)
    assert.equal(
      response.result.engine_result,
      'tefMASTER_DISABLED',
      'Master key was disabled, yet the master key still was able to sign and submit a transaction',
    )
  })

  it('sign with regular key after disabling the master key', async function () {
    const regularKeyWallet = await generateFundedWalletWithRegularKey(
      this.client,
      false,
      true,
    )

    const tx: OfferCreate = {
      TransactionType: 'OfferCreate',
      Account: regularKeyWallet.classicAddress,
      TakerGets: '13100000',
      TakerPays: {
        currency: 'USD',
        issuer: regularKeyWallet.classicAddress,
        value: '10',
      },
    }

    await testTransaction(this.client, tx, regularKeyWallet)
  })

  it('submit_multisigned transaction with regular keys set', async function () {
    const client: Client = this.client

    const regularKeyWallet = await generateFundedWalletWithRegularKey(client)
    const signerWallet2 = await generateFundedWallet(this.client)

    // set up the multisigners for the account
    const signerListSet: SignerListSet = {
      TransactionType: 'SignerListSet',
      Account: this.wallet.classicAddress,
      SignerEntries: [
        {
          SignerEntry: {
            Account: regularKeyWallet.classicAddress,
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: signerWallet2.classicAddress,
            SignerWeight: 1,
          },
        },
      ],
      SignerQuorum: 2,
    }
    await testTransaction(this.client, signerListSet, this.wallet)

    // try to multisign
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.classicAddress,
      Domain: convertStringToHex('example.com'),
    }
    const accountSetTx = await client.autofill(accountSet, 2)
    const signed1 = regularKeyWallet.sign(accountSetTx, true)
    const signed2 = signerWallet2.sign(accountSetTx, true)
    const multisigned = multisign([signed1.tx_blob, signed2.tx_blob])
    const multisignedRequest: SubmitMultisignedRequest = {
      command: 'submit_multisigned',
      tx_json: decode(multisigned) as unknown as Transaction,
    }
    const submitResponse = await client.request(multisignedRequest)
    await ledgerAccept(client)
    assert.strictEqual(submitResponse.result.engine_result, 'tesSUCCESS')
    await verifySubmittedTransaction(this.client, multisigned)

    const expectedResponse: SubmitMultisignedResponse = {
      id: submitResponse.id,
      type: 'response',
      result: {
        engine_result: 'tesSUCCESS',
        engine_result_code: 0,
        engine_result_message:
          'The transaction was applied. Only final in a validated ledger.',
        tx_blob: multisigned,
        tx_json: {
          ...(decode(multisigned) as unknown as Transaction),
          hash: hashSignedTx(multisigned),
        },
      },
    }

    assert.deepEqual(submitResponse, expectedResponse)
  })
})
