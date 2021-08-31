/* eslint-disable complexity -- verifies 19 tx types hence a lot of checks needed */
/* eslint-disable max-lines-per-function -- need to work with a lot of Tx verifications */
/* eslint-disable import/max-dependencies -- need to test more than 5 TxTypes */

import _ from "lodash";
import { encode, decode } from "ripple-binary-codec";

import { ValidationError } from "../../common/errors";
import Metadata from "../common/metadata";

import { AccountDelete, verifyAccountDelete } from "./accountDelete";
import { AccountSet, verifyAccountSet } from "./accountSet";
import { CheckCancel, verifyCheckCancel } from "./checkCancel";
import { CheckCash, verifyCheckCash } from "./checkCash";
import { CheckCreate, verifyCheckCreate } from "./checkCreate";
import { DepositPreauth, verifyDepositPreauth } from "./depositPreauth";
import { EscrowCancel, verifyEscrowCancel } from "./escrowCancel";
import { EscrowCreate, verifyEscrowCreate } from "./escrowCreate";
import { EscrowFinish, verifyEscrowFinish } from "./escrowFinish";
import { OfferCancel, verifyOfferCancel } from "./offerCancel";
import { OfferCreate, verifyOfferCreate } from "./offerCreate";
import {
  PaymentChannelClaim,
  verifyPaymentChannelClaim,
} from "./paymentChannelClaim";
import {
  PaymentChannelCreate,
  verifyPaymentChannelCreate,
} from "./paymentChannelCreate";
import {
  PaymentChannelFund,
  verifyPaymentChannelFund,
} from "./paymentChannelFund";
import {
  PaymentTransaction,
  verifyPaymentTransaction,
} from "./paymentTransaction";
import { SetRegularKey, verifySetRegularKey } from "./setRegularKey";
import { SignerListSet, verifySignerListSet } from "./signerListSet";
import { TicketCreate, verifyTicketCreate } from "./ticketCreate";
import { TrustSet, verifyTrustSet } from "./trustSet";

export type Transaction =
  | AccountDelete
  | AccountSet
  | CheckCancel
  | CheckCash
  | CheckCreate
  | DepositPreauth
  | EscrowCancel
  | EscrowCreate
  | EscrowFinish
  | OfferCancel
  | OfferCreate
  | PaymentTransaction
  | PaymentChannelClaim
  | PaymentChannelCreate
  | PaymentChannelFund
  | SetRegularKey
  | SignerListSet
  | TicketCreate
  | TrustSet;

export interface TransactionAndMetadata {
  transaction: Transaction;
  metadata: Metadata;
}

/**
 * Verifies various Transaction Types.
 * Encode/decode and individual type validation.
 *
 * @param tx - A Transaction.
 * @throws ValidationError When the Transaction is malformed.
 */
export function verify(tx: Transaction): void {
  switch (tx.TransactionType) {
    case "AccountDelete":
      verifyAccountDelete(tx);
      break;

    case "AccountSet":
      verifyAccountSet(tx);
      break;

    case "CheckCancel":
      verifyCheckCancel(tx);
      break;

    case "CheckCash":
      verifyCheckCash(tx);
      break;

    case "CheckCreate":
      verifyCheckCreate(tx);
      break;

    case "DepositPreauth":
      verifyDepositPreauth(tx);
      break;

    case "EscrowCancel":
      verifyEscrowCancel(tx);
      break;

    case "EscrowCreate":
      verifyEscrowCreate(tx);
      break;

    case "EscrowFinish":
      verifyEscrowFinish(tx);
      break;

    case "OfferCancel":
      verifyOfferCancel(tx);
      break;

    case "OfferCreate":
      verifyOfferCreate(tx);
      break;

    case "Payment":
      verifyPaymentTransaction(tx);
      break;

    case "PaymentChannelClaim":
      verifyPaymentChannelClaim(tx);
      break;

    case "PaymentChannelCreate":
      verifyPaymentChannelCreate(tx);
      break;

    case "PaymentChannelFund":
      verifyPaymentChannelFund(tx);
      break;

    case "SetRegularKey":
      verifySetRegularKey(tx);
      break;

    case "SignerListSet":
      verifySignerListSet(tx);
      break;

    case "TicketCreate":
      verifyTicketCreate(tx);
      break;

    case "TrustSet":
      verifyTrustSet(tx);
      break;

    default:
      throw new ValidationError(`Invalid field TransactionType`);
  }

  if (
    !_.isEqual(
      decode(encode(tx)),
      _.omitBy(tx, (value) => value == null)
    )
  ) {
    throw new ValidationError(`Invalid Transaction: ${tx.TransactionType}`);
  }
}
