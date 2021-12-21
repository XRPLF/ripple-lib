import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * The NFTokenCancelOffer transaction deletes existing NFTokenOffer objects.
 * It is useful if you want to free up space on your account to lower your
 * reserve requirement.
 *
 * The transaction can be executed by the account that originally created
 * the NFTokenOffer, the account in the `Recipient` field of the NFTokenOffer
 * (if present), or any account if the NFTokenOffer has an `Expiration` and
 * the NFTokenOffer has already expired.
 */
export interface NFTokenCancelOffer extends BaseTransaction {
  TransactionType: 'NFTokenCancelOffer'
  /**
   * An array of identifiers of NFTokenOffer objects that should be cancelled
   * by this transaction.
   *
   * It is an error if an entry in this list points to an
   * object that is not an NFTokenOffer object. It is not an
   * error if an entry in this list points to an object that
   * does not exist. This field is required.
   */
  TokenOffers: string[]
}

/**
 * Verify the form and type of an NFTokenCancelOffer at runtime.
 *
 * @param tx - An NFTokenCancelOffer Transaction.
 * @throws When the NFTokenCancelOffer is Malformed.
 */
export function validateNFTokenCancelOffer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (!Array.isArray(tx.TokenOffers)) {
    throw new ValidationError('NFTokenCancelOffer: missing field TokenOffers')
  }

  if (tx.TokenOffers.length < 1) {
    throw new ValidationError('NFTokenCancelOffer: empty field TokenOffers')
  }
}
