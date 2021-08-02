import { Amount } from "../common";

export interface CheckLedgerEntry {
    LedgerEntryType: 'Check'
    Account: string
    Destination: string
    Flags: 0
    OwnerNode: string
    PreviousTxnID: string
    PreviousTxnLgrSeq: number
    SendMax: Amount
    Sequence: number
    DestinationNode?: string
    DestinationTag?: number
    Expiration?: number
    InvoiceID?: string
    SourceTag?: number
  }