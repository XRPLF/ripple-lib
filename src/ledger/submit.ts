import { encode } from 'ripple-binary-codec'

import type { Client, SubmitRequest, SubmitResponse, Wallet } from '..'
import { RippledError } from '../common/errors'
import { Transaction } from '../models/transactions'
import { sign } from '../wallet/signer'

import autofill from './autofill'

/**
 * Submits an unsigned transaction.
 * Steps performed on a transaction:
 *    1. Autofill.
 *    2. Sign & Encode.
 *    3. Submit.
 *
 * @param client - A Client.
 * @param wallet - A Wallet to sign a transaction.
 * @param transaction - A transaction to autofill, sign & encode, and submit.
 * @returns A promise that contains SubmitResponse.
 * @throws RippledError if submit request fails.
 */
async function submitTransaction(
  client: Client,
  wallet: Wallet,
  transaction: Transaction,
): Promise<SubmitResponse> {
  const tx: Transaction = await autofill(client, transaction)
  const signedTxEncoded: string = sign(wallet, tx)
  return submitRequest(client, signedTxEncoded)
}

/**
 * Encodes and submits a signed transaction.
 *
 * @param client - A Client.
 * @param signedTransaction - A signed transaction to encode (if not already) and submit.
 * @returns A promise that contains SubmitResponse.
 * @throws RippledError if submit request fails.
 */
async function submitSignedTransaction(
  client: Client,
  signedTransaction: Transaction | string,
): Promise<SubmitResponse> {
  const signedTxEncoded =
    typeof signedTransaction === 'string'
      ? signedTransaction
      : encode(signedTransaction)
  return submitRequest(client, signedTxEncoded)
}

async function submitRequest(
  client: Client,
  txSerialized: string,
): Promise<SubmitResponse> {
  const request: SubmitRequest = {
    command: 'submit',
    tx_blob: txSerialized,
  }
  const response: SubmitResponse = await client.request(request)
  if (response.result.engine_result !== 'tesSUCCESS') {
    throw new RippledError(response.result.engine_result_message)
  }
  return response
}

export { submitTransaction, submitSignedTransaction }
