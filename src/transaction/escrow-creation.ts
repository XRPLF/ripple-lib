import type { Client } from '..'
import { Memo } from '../common/types/objects'
import { ISOTimeToRippleTime, xrpToDrops } from '../utils'

import { Instructions, Prepare, TransactionJSON } from './types'
import * as utils from './utils'

const ValidationError = utils.common.errors.ValidationError

export interface EscrowCreation {
  amount: string
  destination: string
  memos?: Memo[]
  condition?: string
  allowCancelAfter?: string
  allowExecuteAfter?: string
  sourceTag?: number
  destinationTag?: number
}

function createEscrowCreationTransaction(
  account: string,
  payment: EscrowCreation,
): TransactionJSON {
  const txJSON: any = {
    TransactionType: 'EscrowCreate',
    Account: account,
    Destination: payment.destination,
    Amount: xrpToDrops(payment.amount),
  }

  if (payment.condition != null) {
    txJSON.Condition = payment.condition
  }
  if (payment.allowCancelAfter != null) {
    txJSON.CancelAfter = ISOTimeToRippleTime(payment.allowCancelAfter)
  }
  if (payment.allowExecuteAfter != null) {
    txJSON.FinishAfter = ISOTimeToRippleTime(payment.allowExecuteAfter)
  }
  if (payment.sourceTag != null) {
    txJSON.SourceTag = payment.sourceTag
  }
  if (payment.destinationTag != null) {
    txJSON.DestinationTag = payment.destinationTag
  }
  if (payment.memos != null) {
    txJSON.Memos = payment.memos.map(utils.convertMemo)
  }
  if (
    Boolean(payment.allowCancelAfter) &&
    Boolean(payment.allowExecuteAfter) &&
    txJSON.CancelAfter <= txJSON.FinishAfter
  ) {
    throw new ValidationError(
      'prepareEscrowCreation: ' +
        '"allowCancelAfter" must be after "allowExecuteAfter"',
    )
  }
  return txJSON
}

async function prepareEscrowCreation(
  this: Client,
  address: string,
  escrowCreation: EscrowCreation,
  instructions: Instructions = {},
): Promise<Prepare> {
  try {
    const txJSON = createEscrowCreationTransaction(address, escrowCreation)
    return await utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default prepareEscrowCreation
