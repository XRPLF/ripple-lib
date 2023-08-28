const { encode, decode, XrplDefinitions } = require('../src')
const normalDefinitionsJson = require('../src/enums/definitions.json')
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
    const tx = { ...txJson, TransactionType: 'NewTestTransaction' }
    // Before updating the types, this should not be encodable
    expect(() => encode(tx)).toThrow()

    // Normally this would be generated directly from rippled with something like `server_definitions`.
    // Added here to make it easier to see what is actually changing in the definitions.json file.
    const definitions = JSON.parse(JSON.stringify(normalDefinitionsJson))
    definitions.TRANSACTION_TYPES['NewTestTransaction'] = 75

    const newDefs = new XrplDefinitions(definitions)

    const encoded = encode(tx, newDefs)
    expect(() => decode(encoded)).toThrow()
    const decoded = decode(encoded, newDefs)
    expect(decoded).toStrictEqual(tx)
  })

  test('can encode and decode a new Field', function () {
    const tx = { ...txJson, NewFieldDefinition: 10 }

    // Before updating the types, undefined fields will be ignored on encode
    expect(decode(encode(tx))).not.toStrictEqual(tx)

    // Normally this would be generated directly from rippled with something like `server_definitions`.
    // Added here to make it easier to see what is actually changing in the definitions.json file.
    const definitions = JSON.parse(JSON.stringify(normalDefinitionsJson))

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

  test('can encode and decode a new Field nested in STObject in STArray in STObject', function () {
    const tx = {
      ...txJson,
      NewFieldArray: [
        {
          NewField: {
            NewFieldValue: 10,
          },
        },
      ],
    }

    // Before updating the types, undefined fields will be ignored on encode
    expect(decode(encode(tx))).not.toStrictEqual(tx)

    // Normally this would be generated directly from rippled with something like `server_definitions`.
    // Added here to make it easier to see what is actually changing in the definitions.json file.
    const definitions = JSON.parse(JSON.stringify(normalDefinitionsJson))

    definitions.FIELDS.push([
      'NewFieldArray',
      {
        nth: 100,
        isVLEncoded: false,
        isSerialized: true,
        isSigningField: true,
        type: 'STArray',
      },
    ])

    definitions.FIELDS.push([
      'NewField',
      {
        nth: 101,
        isVLEncoded: false,
        isSerialized: true,
        isSigningField: true,
        type: 'STObject',
      },
    ])

    definitions.FIELDS.push([
      'NewFieldValue',
      {
        nth: 102,
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
    const tx = {
      ...txJson,
      TestField: 10, // Should work the same as a UInt32
    }

    // Normally this would be generated directly from rippled with something like `server_definitions`.
    // Added here to make it easier to see what is actually changing in the definitions.json file.
    const definitions = JSON.parse(JSON.stringify(normalDefinitionsJson))
    definitions.TYPES.NewType = 48
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
