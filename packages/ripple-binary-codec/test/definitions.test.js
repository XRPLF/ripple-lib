const { encode, decode, XrplDefinitions } = require('../src')
const normalDefinitionsJson = require('./fixtures/normal-definitions.json')
const { UInt32 } = require('../dist/types/uint-32')

const txJson = {
  Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  Amount: '1000',
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  Fee: '10',
  Flags: 0,
  Sequence: 1,
  TransactionType: 'Payment',
}

describe('encode and decode using new types as a parameter', function () {
  test('can encode and decode a new TransactionType', function () {
    const tx = Object.assign({}, txJson, {
      TransactionType: 'NewTestTransaction',
    })
    // Before updating the types, this should not be encodable
    expect(() => encode(tx)).toThrow()

    // Normally this would be generated directly from rippled with something like `server_definitions`.
    // Added here to make it easier to see what is actually changing in the definitions.json file.
    const definitions = { ...normalDefinitionsJson }
    definitions.TRANSACTION_TYPES['NewTestTransaction'] = 30

    const newDefs = new XrplDefinitions(definitions)

    const encoded = encode(tx, newDefs)
    expect(() => decode(encoded)).toThrow()
    const decoded = decode(encoded, newDefs)
    expect(decoded).toStrictEqual(tx)
  })

  test('can encode and decode a new Field', function () {
    const tx = Object.assign({}, txJson, {
      NewFieldDefinition: 10,
    })

    // Before updating the types, undefined fields will be ignored on encode
    expect(decode(encode(tx))).not.toStrictEqual(tx)

    // Normally this would be generated directly from rippled with something like `server_definitions`.
    // Added here to make it easier to see what is actually changing in the definitions.json file.
    const definitions = { ...normalDefinitionsJson }

    definitions.FIELDS.push([
      'NewFieldDefinition',
      {
        nth: 100,
        isVLEncoded: false,
        isSerialized: true,
        isSigningField: true,
        type: 'UInt32',
      },
    ])

    const newDefs = new XrplDefinitions(definitions)

    const encoded = encode(tx, newDefs)
    expect(() => decode(encoded)).toThrow()
    const decoded = decode(encoded, newDefs)
    expect(decoded).toStrictEqual(tx)
  })

  test('can encode and decode a new Type', function () {
    const tx = Object.assign({}, txJson, {
      TestField: 10, // Should work the same as a UInt32
    })

    // Normally this would be generated directly from rippled with something like `server_definitions`.
    // Added here to make it easier to see what is actually changing in the definitions.json file.
    const definitions = { ...normalDefinitionsJson }
    definitions.TYPES.NewType = 24
    definitions.FIELDS.push([
      'TestField',
      {
        nth: 100,
        isVLEncoded: true,
        isSerialized: true,
        isSigningField: true,
        type: 'NewType',
      },
    ])

    // Test that before updating the types this tx fails to decode correctly. Note that undefined fields are ignored on encode.
    expect(decode(encode(tx))).not.toStrictEqual(tx)

    class NewType extends UInt32 {
      // Should be the same as UInt32
    }

    const extendedCoreTypes = { NewType }

    const newDefs = new XrplDefinitions(definitions, extendedCoreTypes)

    const encoded = encode(tx, newDefs)
    expect(() => decode(encoded)).toThrow()
    const decoded = decode(encoded, newDefs)
    expect(decoded).toStrictEqual(tx)
  })
})
