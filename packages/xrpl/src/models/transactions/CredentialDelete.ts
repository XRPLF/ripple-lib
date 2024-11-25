import { BaseTransaction } from '../../../dist/npm'
import { ValidationError } from '../../errors'

import { validateBaseTransaction, validateCredentialType } from './common'

/**
 * Deletes a Credential object.
 *
 * @category Transaction Models
 * */
export interface CredentialDelete extends BaseTransaction {
  TransactionType: 'CredentialDelete'

  /** The transaction submitter. */
  Account: string

  /** The person that the credential is for. If omitted, Account is assumed to be the subject. */
  Subject?: string

  /** The issuer of the credential. If omitted, Account is assumed to be the issuer. */
  Issuer?: string

  /** A (hex-encoded) value to identify the type of credential from the issuer. */
  CredentialType: string
}

/**
 * Verify the form and type of a CredentialDelete at runtime.
 *
 * @param tx - A CredentialDelete Transaction.
 * @throws When the CredentialDelete is Malformed.
 */
export function validateCredentialDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (!tx.Account && !tx.Issuer) {
    throw new ValidationError(
      'CredentialDelete: Neither `issuer` nor `subject` was provided',
    )
  }

  if (tx.Account == null) {
    throw new ValidationError('CredentialDelete: missing field Account')
  }

  if (typeof tx.Account !== 'string') {
    throw new ValidationError('CredentialDelete: Account must be a string')
  }

  if (tx.Subject && typeof tx.Subject !== 'string') {
    throw new ValidationError('CredentialDelete: Subject must be a string')
  }

  if (tx.Issuer && typeof tx.Issuer !== 'string') {
    throw new ValidationError('CredentialDelete: Issuer must be a string')
  }

  validateCredentialType(tx)
}