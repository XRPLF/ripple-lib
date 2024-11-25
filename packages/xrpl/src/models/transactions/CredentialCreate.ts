import { HEX_REGEX } from '@xrplf/isomorphic/dist/utils'

import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isNumber,
  isString,
  validateBaseTransaction,
  validateCredentialType,
  validateOptionalField,
  validateRequiredField,
} from './common'

const MAX_URI_LENGTH = 256

/**
 * Creates a Credential object. It must be sent by the issuer.
 *
 * @category Transaction Models
 * */
export interface CredentialCreate extends BaseTransaction {
  TransactionType: 'CredentialCreate'

  /** The issuer of the credential. */
  Account: string

  /** The subject of the credential. */
  Subject: string

  /** A (hex-encoded) value to identify the type of credential from the issuer. */
  CredentialType: string

  /** Optional credential expiration. */
  Expiration?: number

  /** Optional additional data about the credential (such as a link to the VC document). */
  URI?: string
}

/**
 * Verify the form and type of a CredentialCreate at runtime.
 *
 * @param tx - A CredentialCreate Transaction.
 * @throws When the CredentialCreate is Malformed.
 */
export function validateCredentialCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Account', isString)

  validateRequiredField(tx, 'Subject', isString)

  validateOptionalField(tx, 'Expiration', isNumber)

  validateURI(tx.URI)

  validateCredentialType(tx)
}

function validateURI(uri: unknown): void {
  if (uri === undefined) {
    return
  }

  if (typeof uri !== 'string') {
    throw new ValidationError('CredentialCreate: invalid field URI')
  }

  if (uri.length === 0) {
    throw new ValidationError('CredentialCreate: URI length must be > 0')
  } else if (uri.length > MAX_URI_LENGTH) {
    throw new ValidationError(
      `CredentialCreate: URI length must be <= ${MAX_URI_LENGTH}`,
    )
  }

  if (!HEX_REGEX.test(uri)) {
    throw new ValidationError('CredentialCreate: URI must be encoded in hex')
  }
}
