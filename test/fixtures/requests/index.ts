import header from './computeLedgerHash.json'
import transactions from './computeLedgerHashTransactions.json'
import normalOrderBook from './getOrderbook.json'
import withXRPOrderBook from './getOrderbookWithXrp.json'
import normalSign from './sign.json'
import signAsSign from './signAs.json'
import escrowSign from './signEscrow.json'
import signPaymentChannelClaim from './signPaymentChannelClaim.json'
import ticketSign from './signTicket.json'

const sign = {
  normal: normalSign,
  ticket: ticketSign,
  escrow: escrowSign,
  signAs: signAsSign,
}

const getOrderbook = {
  normal: normalOrderBook,
  withXRP: withXRPOrderBook,
}

const computeLedgerHash = {
  header,
  transactions,
}

const requests = {
  computeLedgerHash,
  getOrderbook,
  sign,
  signPaymentChannelClaim,
}

export default requests
