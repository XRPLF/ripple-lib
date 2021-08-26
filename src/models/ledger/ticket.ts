import {BaseLedgerEntry} from './baseLedgerEntry'

export interface Ticket extends BaseLedgerEntry {
  LedgerEntryType: 'Ticket'
  Account: string
  Flags: number
  OwnerNode: string
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
  TicketSequence: number
}
