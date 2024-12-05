import { assert } from 'chai'

import { Payment, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import {
  fetchAccountReserveFee,
  generateFundedWallet,
  testTransaction,
} from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Payment', function () {
  let testContext: XrplIntegrationTestContext
  let paymentTx: Payment
  let amount: string
  const DEFAULT_AMOUNT = '10000000'
  // This wallet is used for DeliverMax related tests
  let senderWallet: Wallet

  beforeEach(async () => {
    // this payment transaction JSON needs to be refreshed before every test.
    // Because, we tinker with Amount and DeliverMax fields in the API v2 tests
    paymentTx = {
      TransactionType: 'Payment',
      Account: senderWallet.classicAddress,
      Amount: amount,
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
    }
  })

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    senderWallet = await generateFundedWallet(testContext.client)
    // Make sure the amount sent satisfies minimum reserve requirement to fund an account.
    amount =
      (await fetchAccountReserveFee(testContext.client)) ?? DEFAULT_AMOUNT
  })
  afterAll(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const tx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: senderWallet.classicAddress,
        Amount: '1000',
      }
      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction API v2: Payment Transaction: Specify Only Amount field',
    async () => {
      const result = await testTransaction(
        testContext.client,
        paymentTx,
        senderWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, amount)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction API v2: Payment Transaction: Specify Only DeliverMax field',
    async () => {
      // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
      paymentTx.DeliverMax = paymentTx.Amount
      // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
      delete paymentTx.Amount

      const result = await testTransaction(
        testContext.client,
        paymentTx,
        senderWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, amount)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction API v2: Payment Transaction: identical DeliverMax and Amount fields',
    async () => {
      // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
      paymentTx.DeliverMax = paymentTx.Amount

      const result = await testTransaction(
        testContext.client,
        paymentTx,
        senderWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, amount)
    },
    TIMEOUT,
  )
})
