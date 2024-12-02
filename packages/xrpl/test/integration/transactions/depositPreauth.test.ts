import { stringToHex } from '@xrplf/isomorphic/utils'

import { AuthorizeCredential, DepositPreauth, Wallet } from '../../../src'
import { CredentialAccept } from '../../../src/models/transactions/CredentialAccept'
import { CredentialCreate } from '../../../src/models/transactions/CredentialCreate'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { fundAccount, generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('DepositPreauth', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = Wallet.generate()
      await fundAccount(testContext.client, wallet2)
      const tx: DepositPreauth = {
        TransactionType: 'DepositPreauth',
        Account: testContext.wallet.classicAddress,
        Authorize: wallet2.classicAddress,
      }
      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'credentials',
    async () => {
      const subjectWallet = await generateFundedWallet(testContext.client)

      const credentialCreateTx: CredentialCreate = {
        TransactionType: 'CredentialCreate',
        Account: testContext.wallet.classicAddress,
        Subject: subjectWallet.classicAddress,
        CredentialType: stringToHex('Test Credential Type'),
      }

      await testTransaction(
        testContext.client,
        credentialCreateTx,
        testContext.wallet,
      )

      const credentialAcceptTx: CredentialAccept = {
        TransactionType: 'CredentialAccept',
        Account: subjectWallet.classicAddress,
        Issuer: testContext.wallet.classicAddress,
        CredentialType: stringToHex('Test Credential Type'),
      }

      await testTransaction(
        testContext.client,
        credentialAcceptTx,
        subjectWallet,
      )

      const authorizeCredentialObj: AuthorizeCredential = {
        Credential: {
          Issuer: testContext.wallet.classicAddress,
          CredentialType: stringToHex('Test Credential Type'),
        },
      }

      const wallet2 = Wallet.generate()
      await fundAccount(testContext.client, wallet2)
      const tx: DepositPreauth = {
        TransactionType: 'DepositPreauth',
        Account: testContext.wallet.classicAddress,
        AuthorizeCredentials: [authorizeCredentialObj],
      }
      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )
})
