import { LedgerIndex } from '../common'
import { Ledger } from '../ledger'
import { Transaction, TransactionAndMetadata } from '../transactions'
import TransactionMetadata from '../transactions/metadata'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * Retrieve information about the public ledger. Expects a response in the form
 * of a {@link LedgerResponse}.
 *
 * ```ts
 * const ledger: LedgerRequest = {
 *  "id": 14,
 *  "command": "ledger",
 *  "ledger_index": "validated",
 *  "full": false,
 *  "accounts": false,
 *  "transactions": false,
 *  "expand": false,
 *  "owner_funds": false
 * }
 * ```
 */
export interface LedgerRequest extends BaseRequest {
  command: 'ledger'
  /** A 20-byte hex string for the ledger version to use. */
  ledger_hash?: string
  /** The ledger index of the ledger to use, or a shortcut string to choose a
   * ledger automatically. */
  ledger_index?: LedgerIndex
  /** Admin required If true, return full information on the entire ledger.
   * Ignored if you did not specify a ledger version. Defaults to false. */
  full?: boolean
  /** Admin required. If true, return information on accounts in the ledger.
   * Ignored if you did not specify a ledger version. Defaults to false. */
  accounts?: boolean
  /** If true, return information on transactions in the specified ledger
   * version. Defaults to false. Ignored if you did not specify a ledger
   * version. */
  transactions?: boolean
  /** Provide full JSON-formatted information for transaction/account
   * information instead of only hashes. Defaults to false. Ignored unless you
   * request transactions, accounts, or both. */
  expand?: boolean
  /** If true, include owner_funds field in the metadata of OfferCreate
   * transactions in the response. Defaults to false. Ignored unless
   * transactions are included and expand is true. */
  owner_funds?: boolean
  /** If true, and transactions and expand are both also true, return
   * transaction information in binary format (hexadecimal string) instead of
   * JSON format */
  binary?: boolean
  /** If true, and the command is requesting the current ledger, includes an
   * array of queued transactions in the results. */
  queue?: boolean
}

interface ModifiedMetadata extends TransactionMetadata {
  owner_funds: string
}

interface ModifiedOfferCreateTransaction {
  transaction: Transaction
  metadata: ModifiedMetadata
}

interface LedgerQueueData {
  account: string
  tx:
    | TransactionAndMetadata
    | ModifiedOfferCreateTransaction
    | { tx_blob: string }
  retries_remaining: number
  preflight_result: string
  last_result?: string
  auth_change?: boolean
  fee?: string
  fee_level?: string
  max_spend_drops?: string
}

interface BinaryLedger
  extends Omit<Omit<Ledger, 'transactions'>, 'accountState'> {
  accountState?: string[]
  transactions?: string[]
}

/**
 * Response expected from a {@link LedgerResponse}.
 */
export interface LedgerResponse extends BaseResponse {
  result: {
    /**	The complete header data of this {@link Ledger}. */
    ledger: Ledger | BinaryLedger
    /** Unique identifying hash of the entire ledger. */
    ledger_hash: string
    /** The Ledger Index of this ledger. */
    ledger_index: number
    /** If true, this is a validated ledger version. If omitted or set to false,
     * this ledger's data is not final. */
    queue_data?: Array<LedgerQueueData | string>
    /** Array of objects describing queued transactions, in the same order as
     * the queue. If the request specified expand as true, members contain full
     * representations of the transactions, in either JSON or binary depending
     * on whether the request specified binary as true. */
    validated?: boolean
  }
}
