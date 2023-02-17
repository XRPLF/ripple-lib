/* eslint-disable @typescript-eslint/no-magic-numbers -- this file mimics
   behavior in rippled. Magic numbers are used for lengths and conditions */
/* eslint-disable no-bitwise  -- this file mimics behavior in rippled. It uses
   bitwise operators for and-ing numbers with a mask and bit shifting. */

import BigNumber from 'bignumber.js'
import { decode, encode, XrplDefinitionsBase } from 'ripple-binary-codec'

import { ValidationError, XrplError } from '../../errors'
import type { Ledger } from '../../models/ledger'
import { LedgerEntry } from '../../models/ledger'
import {
  BaseTransaction,
  Transaction,
  TransactionMetadata,
} from '../../models/transactions'

import HashPrefix from './HashPrefix'
import sha512Half from './sha512Half'
import SHAMap, { NodeType } from './SHAMap'

const HEX = 16

interface HashLedgerHeaderOptions {
  computeTreeHashes?: boolean
  definitions?: InstanceType<typeof XrplDefinitionsBase>
}

function intToHex(integer: number, byteLength: number): string {
  const foo = Number(integer)
    .toString(HEX)
    .padStart(byteLength * 2, '0')

  return foo
}

function bytesToHex(bytes: number[]): string {
  return Buffer.from(bytes).toString('hex')
}

function bigintToHex(
  integerString: string | number | BigNumber,
  byteLength: number,
): string {
  const hex = new BigNumber(integerString).toString(HEX)
  return hex.padStart(byteLength * 2, '0')
}

function addLengthPrefix(hex: string): string {
  const length = hex.length / 2
  if (length <= 192) {
    return bytesToHex([length]) + hex
  }
  if (length <= 12480) {
    const prefix = length - 193
    return bytesToHex([193 + (prefix >>> 8), prefix & 0xff]) + hex
  }
  if (length <= 918744) {
    const prefix = length - 12481
    return (
      bytesToHex([
        241 + (prefix >>> 16),
        (prefix >>> 8) & 0xff,
        prefix & 0xff,
      ]) + hex
    )
  }
  throw new XrplError('Variable integer overflow.')
}

/**
 * Hashes the Transaction object as the ledger does. Throws if the transaction is unsigned.
 *
 * @param tx - A transaction to hash. Tx may be in binary blob form. Tx must be signed.
 * @param definitions - rippled types to use instead of the default. Used for sidechains and amendments.
 * @returns A hash of tx.
 * @throws ValidationError if the Transaction is unsigned.\
 * @category Utilities
 */
export function hashSignedTx<T extends BaseTransaction = Transaction>(
  tx: T | string,
  definitions?: InstanceType<typeof XrplDefinitionsBase>,
): string {
  let txBlob: string
  let txObject: T
  if (typeof tx === 'string') {
    txBlob = tx
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Required until updated in binary codec. */
    txObject = decode(tx, definitions) as unknown as T
  } else {
    txBlob = encode(tx, definitions)
    txObject = tx
  }

  if (txObject.TxnSignature === undefined && txObject.Signers === undefined) {
    throw new ValidationError('The transaction must be signed to hash it.')
  }

  const prefix = HashPrefix.TRANSACTION_ID.toString(16).toUpperCase()
  return sha512Half(prefix.concat(txBlob))
}

/**
 * Compute the hash of a ledger.
 *
 * @param ledgerHeader - Ledger to compute the hash of.
 * @returns The hash of the ledger.
 * @category Utilities
 */
export function hashLedgerHeader(ledgerHeader: Ledger): string {
  const prefix = HashPrefix.LEDGER.toString(HEX).toUpperCase()

  const ledger =
    prefix +
    intToHex(Number(ledgerHeader.ledger_index), 4) +
    bigintToHex(ledgerHeader.total_coins, 8) +
    ledgerHeader.parent_hash +
    ledgerHeader.transaction_hash +
    ledgerHeader.account_hash +
    intToHex(ledgerHeader.parent_close_time, 4) +
    intToHex(ledgerHeader.close_time, 4) +
    intToHex(ledgerHeader.close_time_resolution, 1) +
    intToHex(ledgerHeader.close_flags, 1)

  return sha512Half(ledger)
}

/**
 * Compute the root hash of the SHAMap containing all transactions.
 *
 * @param transactions - List of Transactions.
 * @param definitions - Custom rippled type definitions. Used by sidechains and new amendments.
 * @returns The root hash of the SHAMap.
 * @category Utilities
 */
export function hashTxTree(
  transactions: Array<Transaction & { metaData?: TransactionMetadata }>,
  definitions?: InstanceType<typeof XrplDefinitionsBase>,
): string {
  const shamap = new SHAMap()
  for (const txJSON of transactions) {
    const txBlobHex = encode(txJSON, definitions)
    const metaHex = encode(txJSON.metaData ?? {}, definitions)
    const txHash = hashSignedTx(txBlobHex, definitions)
    const data = addLengthPrefix(txBlobHex) + addLengthPrefix(metaHex)
    shamap.addItem(txHash, data, NodeType.TRANSACTION_METADATA)
  }

  return shamap.hash
}

/**
 * Compute the state hash of a list of LedgerEntries.
 *
 * @param entries - List of LedgerEntries.
 * @param definitions - Custom rippled types. Used by sidechains and new amendments.
 * @returns Hash of SHAMap that consists of all entries.
 * @category Utilities
 */
export function hashStateTree(
  entries: LedgerEntry[],
  definitions?: InstanceType<typeof XrplDefinitionsBase>,
): string {
  const shamap = new SHAMap()

  entries.forEach((ledgerEntry) => {
    const data = encode(ledgerEntry, definitions)
    shamap.addItem(ledgerEntry.index, data, NodeType.ACCOUNT_STATE)
  })

  return shamap.hash
}

function computeTransactionHash(
  ledger: Ledger,
  options: HashLedgerHeaderOptions,
): string {
  const { transaction_hash } = ledger

  if (!options.computeTreeHashes) {
    return transaction_hash
  }

  if (ledger.transactions == null) {
    throw new ValidationError('transactions is missing from the ledger')
  }

  const transactionHash = hashTxTree(ledger.transactions, options.definitions)

  if (transaction_hash !== transactionHash) {
    throw new ValidationError(
      'transactionHash in header' +
        ' does not match computed hash of transactions',
      {
        transactionHashInHeader: transaction_hash,
        computedHashOfTransactions: transactionHash,
      },
    )
  }

  return transactionHash
}

function computeStateHash(
  ledger: Ledger,
  options: HashLedgerHeaderOptions,
): string {
  const { account_hash } = ledger

  if (!options.computeTreeHashes) {
    return account_hash
  }

  if (ledger.accountState == null) {
    throw new ValidationError('accountState is missing from the ledger')
  }

  const stateHash = hashStateTree(ledger.accountState, options.definitions)

  if (account_hash !== stateHash) {
    throw new ValidationError(
      'stateHash in header does not match computed hash of state',
    )
  }

  return stateHash
}

/**
 * Compute the hash of a ledger.
 *
 * @param ledger - Ledger to compute the hash for.
 * @param options - Allow client to recompute Transaction and State Hashes.
 * @param options.computeTreeHashes - Whether to recompute the Transaction and State Hashes.
 * @param options.definitions - Custom rippled type definitions. Used for sidechains and new amendments.
 * @returns The has of ledger.
 * @category Utilities
 */
function hashLedger(
  ledger: Ledger,
  options: HashLedgerHeaderOptions = {},
): string {
  const subhashes = {
    transaction_hash: computeTransactionHash(ledger, options),
    account_hash: computeStateHash(ledger, options),
  }
  return hashLedgerHeader({ ...ledger, ...subhashes })
}

export default hashLedger
