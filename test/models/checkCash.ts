import { ValidationError } from "xrpl-local/common/errors";
import { verifyCheckCash } from "./../../src/models/transactions/checkCash";
import { assert } from "chai";
import { verify } from "../../src/models/transactions";

/**
 * CheckCash Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CheckCash', function () {
  it(`verifies valid CheckCash`, function () {
    const validCheckCash = {
      Account: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      TransactionType: 'CheckCash',
      Amount: '100000000',
      CheckID:
        '838766BA2B995C00744175F69A1B11E32C3DBC40E64801A4056FCBD657F57334',
      Fee: '12',
    } as any

    assert.doesNotThrow(() => verifyCheckCash(validCheckCash));
    assert.doesNotThrow(() => verify(validCheckCash));
  });

  it(`throws w/ invalid CheckID`, function () {
    const invalidCheckID = {
      Account: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      TransactionType: 'CheckCash',
      Amount: '100000000',
      CheckID: 83876645678567890,
    } as any

    assert.throws(
      () => verifyCheckCash(invalidCheckID),
      ValidationError,
      "CheckCash: invalid CheckID"
    );
    assert.throws(
      () => verify(invalidCheckID),
      ValidationError,
      "CheckCash: invalid CheckID"
    );
  });

  it(`throws w/ invalid Amount`, function () {
    const invalidAmount = {
      Account: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      TransactionType: 'CheckCash',
      Amount: 100000000,
      CheckID:
        '838766BA2B995C00744175F69A1B11E32C3DBC40E64801A4056FCBD657F57334',
    } as any

    assert.throws(
      () => verifyCheckCash(invalidAmount),
      ValidationError,
      "CheckCash: invalid Amount"
    );
    assert.throws(
      () => verify(invalidAmount),
      ValidationError,
      "CheckCash: invalid Amount"
    );
  });

  it(`throws w/ having both Amount and DeliverMin`, function () {
    const invalidDeliverMin = {
      Account: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      TransactionType: 'CheckCash',
      Amount: '100000000',
      DeliverMin: 852156963,
      CheckID:
        '838766BA2B995C00744175F69A1B11E32C3DBC40E64801A4056FCBD657F57334',
    } as any

    assert.throws(
      () => verifyCheckCash(invalidDeliverMin),
      ValidationError,
      "CheckCash: cannot have both Amount and DeliverMin"
    );
    assert.throws(
      () => verify(invalidDeliverMin),
      ValidationError,
      "CheckCash: cannot have both Amount and DeliverMin"
    );
  });

  it(`throws w/ invalid DeliverMin`, function () {
    const invalidDeliverMin = {
      Account: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      TransactionType: 'CheckCash',
      DeliverMin: 852156963,
      CheckID:
        '838766BA2B995C00744175F69A1B11E32C3DBC40E64801A4056FCBD657F57334',
    } as any

    assert.throws(
      () => verifyCheckCash(invalidDeliverMin),
      ValidationError,
      "CheckCash: invalid DeliverMin"
    );
    assert.throws(
      () => verify(invalidDeliverMin),
      ValidationError,
      "CheckCash: invalid DeliverMin"
    );
  });
});
