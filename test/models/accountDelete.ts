import { ValidationError } from 'xrpl-local/common/errors'
import { verifyAccountDelete } from './../../src/models/transactions/accountDelete'
import { verify } from './../../src/models/transactions'
import { assert } from 'chai'

/**
 * AccountDelete Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('AccountDelete Transaction Verification', function () {
    
    it (`verifies valid AccountDelete`, () => {
        const validAccountDelete = {
            TransactionType: "AccountDelete",
            Account: "rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm",
            Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
            DestinationTag: 13,
            Fee: "5000000",
            Sequence: 2470665,
            Flags: 2147483648
        } as any
        
        assert.doesNotThrow(() => {
            verifyAccountDelete(validAccountDelete)
            verify(validAccountDelete)
        })
    })


    it (`throws w/ missing Destination`, () => {
        const invalidDestination = {
            TransactionType: "AccountDelete",
            Account: "rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm",
            Fee: "5000000",
            Sequence: 2470665,
            Flags: 2147483648
        } as any

        assert.throws(
            () => {
                verifyAccountDelete(invalidDestination)
                verify(invalidDestination)
            },
            ValidationError,
            "AccountDelete: missing field Destination"
        )
    })

    it (`throws w/ invalid Destination`, () => {
        const invalidDestination = {
            TransactionType: "AccountDelete",
            Account: "rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm",
            Destination: 65478965,
            Fee: "5000000",
            Sequence: 2470665,
            Flags: 2147483648
        } as any

        assert.throws(
            () => {
                verifyAccountDelete(invalidDestination)
                verify(invalidDestination)
            },
            ValidationError,
            "AccountDelete: invalid Destination"
        )
    })

    it (`throws w/ invalid DestinationTag`, () => {
        const invalidDestinationTag = {
            TransactionType: "AccountDelete",
            Account: "rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm",
            Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
            DestinationTag: "gvftyujnbv",
            Fee: "5000000",
            Sequence: 2470665,
            Flags: 2147483648
        } as any

        assert.throws(
            () => {
                verifyAccountDelete(invalidDestinationTag)
                verify(invalidDestinationTag)
            },
            ValidationError,
            "AccountDelete: invalid DestinationTag"
        )
    })

})