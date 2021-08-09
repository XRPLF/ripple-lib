import { ValidationError } from "../../common/errors";
import { Amount, IssuedCurrencyAmount } from "../common";
import { CommonFields, verifyCommonFields } from "./common";

export enum OfferCreateFlag {
    tfPassive = 0x00010000,
    tfImmediateOrCancel = 0x00020000,
    tfFillOrKill = 0x00040000,
    tfSell = 0x00080000,
}

export enum AccountSetFlag {
    asfAccountTxnID = 5
    .
}
export interface AccountSet extends CommonFields {
    TransactionType: "OfferCreate";
    Flags: undefined
    setFlag?: number | AccountSetFlag
}

export interface OfferCreate extends CommonFields {
    TransactionType: "OfferCreate";
    Flags?: number | Array<OfferCreateFlag>
    Expiration?: number;
    OfferSequence?: number;
    TakerGets: Amount;
    TakerPays: Amount;
}

/**
 * Verify the form and type of an OfferCreate at runtime.
 * 
 * @param tx - An OfferCreate Transaction
 * @returns - Void.
 * @throws - When the OfferCreate is Malformed.
 */
 export function verifyOfferCreate(tx: OfferCreate): void {
    verifyCommonFields(tx)

    if (tx.TakerGets === undefined)
        throw new ValidationError("OfferCreate: missing field TakerGets")

    if (tx.TakerPays === undefined)
        throw new ValidationError("OfferCreate: missing field TakerPays")

    const isIssuedCurrency = (obj: IssuedCurrencyAmount): boolean => {
        return Object.keys(obj).length === 3 
            && typeof obj.value === 'string'
            && typeof obj.issuer === 'string'
            && typeof obj.currency === 'string'
    }

    if (typeof tx.TakerGets !== 'string' && !isIssuedCurrency(tx.TakerGets))
        throw new ValidationError("OfferCreate: invalid TakerGets")

    if (typeof tx.TakerPays !== 'string' && !isIssuedCurrency(tx.TakerPays))
        throw new ValidationError("OfferCreate: invalid TakerPays")

    if (tx.Expiration !== undefined && typeof tx.Expiration !== 'number')
        throw new ValidationError("OfferCreate: invalid Expiration")

    if (tx.OfferSequence !== undefined && typeof tx.OfferSequence !== 'number')
        throw new ValidationError("OfferCreate: invalid OfferSequence")
}

const order: OfferCreate = {
    TransactionType: "OfferCreate",
    Account: "r...",
    TakerPays: "...",
    TakerGets: "TakerGets..",
    Flags: [
        OfferCreateFlags.tfFillOrKill,
        OfferCreateFlags.tfPassive
    ]
}
const accset: AccountSet = {
    TransactionType: "OfferCreate",
    setFlag: AccountSetFlag.asfAccountTxnID
}
