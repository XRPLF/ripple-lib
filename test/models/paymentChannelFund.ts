import { ValidationError } from 'xrpl-local/common/errors'
import { verifyPaymentChannelFund } from './../../src/models/transactions/paymentChannelFund'
import { assert } from 'chai'
import { verify } from '../../src/models/transactions'

/**
 * PaymentChannelFund Transaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('PaymentChannelFund Transaction Verification', function () {
    let channel

    beforeEach(() => {
        channel = {
            "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn",
            "TransactionType": "PaymentChannelFund",
            "Channel": "C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198",
            "Amount": "200000",
            "Expiration": 543171558
        }
    })
    
    it (`verifies valid PaymentChannelFund`, () => {
        assert.doesNotThrow(() => {
            verifyPaymentChannelFund(channel)
            verify(channel)
        })
    })

    it (`verifies valid PaymentChannelFund w/o optional`, () => {
        delete channel.Expiration
        
        assert.doesNotThrow(() => {
            verifyPaymentChannelFund(channel)
            verify(channel)
        })
    })

    it (`throws w/ missing Amount`, () => {
        delete channel.Amount

        assert.throws(
            () => {
                verifyPaymentChannelFund(channel)
                verify(channel)
            },
            ValidationError,
            "PaymentChannelFund: missing Amount"
        )
    })

    it (`throws w/ missing Channel`, () => {
        delete channel.Channel

        assert.throws(
            () => {
                verifyPaymentChannelFund(channel)
                verify(channel)
            },
            ValidationError,
            "PaymentChannelFund: missing Channel"
        )
    })

    it (`throws w/ invalid Amount`, () => {
        channel.Amount = 100

        assert.throws(
            () => {
                verifyPaymentChannelFund(channel)
                verify(channel)
            },
            ValidationError,
            "PaymentChannelFund: Amount must be a string"
        )
    })

    it (`throws w/ invalid Channel`, () => {
        channel.Channel = 1000

        assert.throws(
            () => {
                verifyPaymentChannelFund(channel)
                verify(channel)
            },
            ValidationError,
            "PaymentChannelFund: Channel must be a string"
        )
    })

    it (`throws w/ invalid Expiration`, () => {
        channel.Expiration = "1000"
        
        assert.throws(
            () => {
                verifyPaymentChannelFund(channel)
                verify(channel)
            },
            ValidationError,
            "PaymentChannelFund: Expiration must be a number"
        )
    })

})