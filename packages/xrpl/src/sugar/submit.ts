import { decode, encode, XrplDefinitionsBase } from 'ripple-binary-codec'

import type { Client, SubmitRequest, SubmitResponse, Wallet } from '..'
import { ValidationError, XrplError } from '../errors'
import { TxResponse } from '../models/methods'
import { type BaseTransaction, type Transaction } from '../models/transactions'
import { hashes } from '../utils'

/** Approximate time for a ledger to close, in milliseconds */
const LEDGER_CLOSE_TIME = 1000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Submits a signed/unsigned transaction.
 * Steps performed on a transaction:
 *    1. Autofill.
 *    2. Sign & Encode.
 *    3. Submit.
 *
 * @param this - A Client.
 * @param transaction - A transaction to autofill, sign & encode, and submit.
 * @param opts - (Optional) Options used to sign and submit a transaction.
 * @param opts.autofill - If true, autofill a transaction.
 * @param opts.failHard - If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
 * @param opts.wallet - A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
 * @param opts.definitions - Custom rippled type definitions. Used for sidechains and new amendments.
 * @returns A promise that contains SubmitResponse.
 * @throws RippledError if submit request fails.
 */
async function submit<T extends BaseTransaction = Transaction>(
  this: Client,
  transaction: T | string,
  opts?: {
    // If true, autofill a transaction.
    autofill?: boolean
    // If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
    failHard?: boolean
    // A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
    wallet?: Wallet
    // Custom rippled types to use instead of the default. Used for sidechains and amendments.
    definitions?: InstanceType<typeof XrplDefinitionsBase>
  },
): Promise<SubmitResponse> {
  const signedTx = await getSignedTx(this, transaction, opts)
  return submitRequest(this, signedTx, opts?.failHard, opts?.definitions)
}

/**
 * Asynchronously submits a transaction and verifies that it has been included in a
 * validated ledger (or has errored/will not be included for some reason).
 * See [Reliable Transaction Submission](https://xrpl.org/reliable-transaction-submission.html).
 *
 * @param this - A Client.
 * @param transaction - A transaction to autofill, sign & encode, and submit.
 * @param opts - (Optional) Options used to sign and submit a transaction.
 * @param opts.autofill - If true, autofill a transaction.
 * @param opts.failHard - If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
 * @param opts.wallet - A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
 * @param opts.definitions - Custom rippled type definitions. Used for sidechains and new amendments.
 * @returns A promise that contains TxResponse, that will return when the transaction has been validated.
 */
async function submitAndWait<T extends BaseTransaction = Transaction>(
  this: Client,
  transaction: T | string,
  opts?: {
    // If true, autofill a transaction.
    autofill?: boolean
    // If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
    failHard?: boolean
    // A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
    wallet?: Wallet
    // Custom rippled types to use instead of the default. Used for sidechains and amendments.
    definitions?: InstanceType<typeof XrplDefinitionsBase>
  },
): Promise<TxResponse> {
  const signedTx = await getSignedTx(this, transaction, opts)

  const lastLedger = getLastLedgerSequence(signedTx, opts?.definitions)
  if (lastLedger == null) {
    throw new ValidationError(
      'Transaction must contain a LastLedgerSequence value for reliable submission.',
    )
  }

  const response = await submitRequest(
    this,
    signedTx,
    opts?.failHard,
    opts?.definitions,
  )

  const txHash = hashes.hashSignedTx(signedTx)
  return waitForFinalTransactionOutcome(
    this,
    txHash,
    lastLedger,
    response.result.engine_result,
  )
}

// Helper functions

// Encodes and submits a signed transaction.
// eslint-disable-next-line max-params -- All params are required
async function submitRequest<T extends BaseTransaction = Transaction>(
  client: Client,
  signedTransaction: T | string,
  failHard = false,
  definitions?: InstanceType<typeof XrplDefinitionsBase>,
): Promise<SubmitResponse> {
  if (!isSigned(signedTransaction, definitions)) {
    throw new ValidationError('Transaction must be signed')
  }

  const signedTxEncoded =
    typeof signedTransaction === 'string'
      ? signedTransaction
      : encode(signedTransaction, definitions)
  const request: SubmitRequest = {
    command: 'submit',
    tx_blob: signedTxEncoded,
    fail_hard: isAccountDelete(signedTransaction, definitions) || failHard,
  }
  return client.request(request)
}

/*
 * The core logic of reliable submission.  This polls the ledger until the result of the
 * transaction can be considered final, meaning it has either been included in a
 * validated ledger, or the transaction's lastLedgerSequence has been surpassed by the
 * latest ledger sequence (meaning it will never be included in a validated ledger).
 */
// eslint-disable-next-line max-params, max-lines-per-function -- this function needs to display and do with more information.
async function waitForFinalTransactionOutcome(
  client: Client,
  txHash: string,
  lastLedger: number,
  submissionResult: string,
): Promise<TxResponse> {
  await sleep(LEDGER_CLOSE_TIME)

  const latestLedger = await client.getLedgerIndex()

  if (lastLedger < latestLedger) {
    throw new XrplError(
      `The latest ledger sequence ${latestLedger} is greater than the transaction's LastLedgerSequence (${lastLedger}).\n` +
        `Preliminary result: ${submissionResult}`,
    )
  }

  const txResponse = await client
    .request({
      command: 'tx',
      transaction: txHash,
    })
    .catch(async (error) => {
      // error is of an unknown type and hence we assert type to extract the value we need.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-member-access -- ^
      const message = error?.data?.error as string
      if (message === 'txnNotFound') {
        return waitForFinalTransactionOutcome(
          client,
          txHash,
          lastLedger,
          submissionResult,
        )
      }
      throw new Error(
        `${message} \n Preliminary result: ${submissionResult}.\nFull error details: ${String(
          error,
        )}`,
      )
    })

  if (txResponse.result.validated) {
    return txResponse
  }

  return waitForFinalTransactionOutcome(
    client,
    txHash,
    lastLedger,
    submissionResult,
  )
}

// checks if the transaction has been signed
function isSigned<T extends BaseTransaction = Transaction>(
  transaction: T | string,
  definitions?: InstanceType<typeof XrplDefinitionsBase>,
): boolean {
  const tx =
    typeof transaction === 'string'
      ? decode(transaction, definitions)
      : transaction
  return (
    typeof tx !== 'string' &&
    (tx.SigningPubKey != null || tx.TxnSignature != null)
  )
}

// initializes a transaction for a submit request
async function getSignedTx<T extends BaseTransaction = Transaction>(
  client: Client,
  transaction: T | string,
  {
    autofill = true,
    wallet,
    definitions,
  }: {
    // If true, autofill a transaction.
    autofill?: boolean
    // If true, and the transaction fails locally, do not retry or relay the transaction to other servers.
    failHard?: boolean
    // A wallet to sign a transaction. It must be provided when submitting an unsigned transaction.
    wallet?: Wallet
    // Custom rippled types to use instead of the default. Used for sidechains and amendments.
    definitions?: InstanceType<typeof XrplDefinitionsBase>
  } = {},
): Promise<T | string> {
  if (isSigned(transaction, definitions)) {
    return transaction
  }

  if (!wallet) {
    throw new ValidationError(
      'Wallet must be provided when submitting an unsigned transaction',
    )
  }

  let tx =
    typeof transaction === 'string'
      ? // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- converts JsonObject to correct Transaction type
        (decode(transaction, definitions) as unknown as Transaction)
      : transaction

  if (autofill) {
    tx = await client.autofill(tx)
  }

  return wallet.sign(tx, false, definitions).tx_blob
}

// checks if there is a LastLedgerSequence as a part of the transaction
function getLastLedgerSequence<T extends BaseTransaction = Transaction>(
  transaction: T | string,
  definitions?: InstanceType<typeof XrplDefinitionsBase>,
): number | null {
  const tx =
    typeof transaction === 'string'
      ? decode(transaction, definitions)
      : transaction
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- converts LastLedgSeq to number if present.
  return tx.LastLedgerSequence as number | null
}

// checks if the transaction is an AccountDelete transaction
function isAccountDelete<T extends BaseTransaction = Transaction>(
  transaction: T | string,
  definitions?: InstanceType<typeof XrplDefinitionsBase>,
): boolean {
  const tx =
    typeof transaction === 'string'
      ? decode(transaction, definitions)
      : transaction
  return tx.TransactionType === 'AccountDelete'
}

export { submit, submitAndWait }
