import { stringToHex } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateCredentialCreate } from '../../src/models/transactions/CredentialCreate'

/**
 * AMMDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('credentialCreate', function () {
  let credentialCreate

  beforeEach(function () {
    credentialCreate = {
      TransactionType: 'CredentialCreate',
      Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Subject: 'rNdY9XDnQ4Dr1EgefwU3CBRuAjt3sAutGg',
      CredentialType: stringToHex('Passport'),
      Expiration: 1212025,
      URI: stringToHex('TestURI'),
      Sequence: 1337,
      Flags: 0,
    } as any
  })

  it(`verifies valid credentialCreate`, function () {
    assert.doesNotThrow(() => validateCredentialCreate(credentialCreate))
    assert.doesNotThrow(() => validate(credentialCreate))
  })

  it(`throws w/ missing field Account`, function () {
    delete credentialCreate.Account
    const errorMessage = 'CredentialCreate: missing field Account'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ Account not string`, function () {
    credentialCreate.Account = 123
    const errorMessage = 'CredentialCreate: Account must be a string'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ missing field Subject`, function () {
    delete credentialCreate.Subject
    const errorMessage = 'CredentialCreate: missing field Subject'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ Subject not string`, function () {
    credentialCreate.Subject = 123
    const errorMessage = 'CredentialCreate: Subject must be a string'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ missing field credentialType`, function () {
    delete credentialCreate.CredentialType
    const errorMessage = 'CredentialCreate: missing field CredentialType'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credentialType field too long`, function () {
    credentialCreate.CredentialType = stringToHex(
      'PassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassportPassport',
    )
    const errorMessage =
      'CredentialCreate: CredentialType length must be < 128.'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credentialType field empty`, function () {
    credentialCreate.CredentialType = ''
    const errorMessage = 'CredentialCreate: CredentialType length must be > 0.'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ credentialType field not hex`, function () {
    credentialCreate.CredentialType = 'this is not hex'
    const errorMessage =
      'CredentialCreate: CredentialType myust be encoded in hex'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ Expiration field not number`, function () {
    credentialCreate.Expiration = 'this is not a number'
    const errorMessage = 'CredentialCreate: Expiration must be a number'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ URI field not a string`, function () {
    credentialCreate.URI = 123
    const errorMessage = 'CredentialCreate: URI must be a string'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ URI field empty`, function () {
    credentialCreate.URI = ''
    const errorMessage = 'CredentialCreate: URI length must be > 0'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ URI field too long`, function () {
    credentialCreate.URI = stringToHex(
      'This is beyond the character limit This is beyond the character limit This is beyond the character limit',
    )
    const errorMessage = 'CredentialCreate: URI length must be <= 256'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })

  it(`throws w/ URI field not hex`, function () {
    credentialCreate.CredentialType = 'this is not hex'
    const errorMessage = 'CredentialCreate: URI must be encoded in hex'
    assert.throws(
      () => validateCredentialCreate(credentialCreate),
      ValidationError,
      errorMessage,
    )
    assert.throws(
      () => validate(credentialCreate),
      ValidationError,
      errorMessage,
    )
  })
})
