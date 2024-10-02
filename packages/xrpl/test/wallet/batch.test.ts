import { assert } from 'chai'

import { Batch, ECDSA, Wallet } from '../../src'
import { signMultiBatch } from '../../src/Wallet/batch'

describe('Wallet batch operations', function () {
  describe('signMultiBatch', function () {
    let transaction: Batch

    beforeEach(() => {
      transaction = {
        Account: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
        Flags: 1,
        RawTransactions: [
          {
            RawTransaction: {
              Account: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
              Amount: '5000000',
              BatchTxn: {
                BatchIndex: 1,
                OuterAccount: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
                Sequence: 215,
              },
              Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
              Fee: '0',
              NetworkID: 21336,
              Sequence: 0,
              SigningPubKey: '',
              TransactionType: 'Payment',
            },
          },
          {
            RawTransaction: {
              Account: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
              Amount: '1000000',
              BatchTxn: {
                BatchIndex: 0,
                OuterAccount: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
                Sequence: 470,
              },
              Destination: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
              Fee: '0',
              NetworkID: 21336,
              Sequence: 0,
              SigningPubKey: '',
              TransactionType: 'Payment',
            },
          },
        ],
        TransactionType: 'Batch',
        TxIDs: [
          'ABE4871E9083DF66727045D49DEEDD3A6F166EB7F8D1E92FE868F02E76B2C5CA',
          '795AAC88B59E95C3497609749127E69F12958BC016C600C770AEEB1474C840B4',
        ],
      }
    })
    it('succeeds with secp256k1 seed', function () {
      const secpWallet = Wallet.fromSeed('spkcsko6Ag3RbCSVXV2FJ8Pd4Zac1', {
        algorithm: ECDSA.secp256k1,
      })
      signMultiBatch(secpWallet, transaction)
      const expected = [
        {
          BatchSigner: {
            Account: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
            SigningPubKey:
              '02691AC5AE1C4C333AE5DF8A93BDC495F0EEBFC6DB0DA7EB6EF808F3AFC006E3FE',
            TxnSignature:
              '30450221008E595499C334127A23190F61FB9ADD8B8C501D543E37945B11FABB66B097A6130220138C908E8C4929B47E994A46D611FAC17AB295CFB8D9E0828B32F2947B97394B',
          },
        },
      ]
      assert.property(transaction, 'BatchSigners')
      assert.strictEqual(
        JSON.stringify(transaction.BatchSigners),
        JSON.stringify(expected),
      )
    })

    it('succeeds with ed25519 seed', function () {
      const edWallet = Wallet.fromSeed('spkcsko6Ag3RbCSVXV2FJ8Pd4Zac1', {
        algorithm: ECDSA.ed25519,
      })
      signMultiBatch(edWallet, transaction)
      const expected = [
        {
          BatchSigner: {
            Account: 'rJy554HmWFFJQGnRfZuoo8nV97XSMq77h7',
            SigningPubKey:
              'ED3CC3D14FD80C213BC92A98AFE13A405A030F845EDCFD5E395286A6E9E62BA638',
            TxnSignature:
              'E3337EE8C746523B5F96BEBE1190164B8B384EE2DC99F327D95ABC14E27F3AE16CC00DA7D61FC535DBFF0ADA3AF06394F8A703EE952A141BD871B75166C5CD0A',
          },
        },
      ]
      assert.property(transaction, 'BatchSigners')
      assert.strictEqual(
        JSON.stringify(transaction.BatchSigners),
        JSON.stringify(expected),
      )
    })
  })
})
