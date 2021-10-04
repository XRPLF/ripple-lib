import { LedgerIndex } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The deposit_authorized command indicates whether one account is authorized to
 * send payments directly to another. Expects a response in the form of a {@link
 * DepositAuthorizedResponse}
 */
export interface DepositAuthorizedRequest extends BaseRequest {
  command: 'deposit_authorized'
  /** The sender of a possible payment. */
  source_account: string
  /** The recipient of a possible payment. */
  destination_account: string
  /** A 20-byte hex string for the ledger version to use. */
  ledger_hash?: string
  /** The ledger index of the ledger to use, or a shortcut string to choose a
   * ledger automatically.  */
  ledger_index?: LedgerIndex
}

/**
 * Expected response from a {@link DepositAuthorizedRequest}.
 */
export interface DepositAuthorizedResponse extends BaseResponse {
  result: {
    /**	Whether the specified source account is authorized to send payments
     * directly to the destination account. If true, either the destination
     * account does not require Deposit Authorization or the source account is
     * preauthorized. */
    deposit_authorized: boolean
    /** The destination account specified in the request. */
    destination_account: string
    /** The identifying hash of the ledger that was used to generate this
     * response. */
    ledger_hash?: string
    /** The ledger index of the ledger version that was used to generate this
     * response. */
    ledger_index?: number
    /** The ledger index of the current in-progress ledger version, which was
     * used to generate this response. */
    ledger_current_index?: number
    /** The source account specified in the request. */
    source_account: string
    /** If true, the information comes from a validated ledger version. */
    validated?: boolean
  }
}
