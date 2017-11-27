import * as _ from 'lodash'
import * as utils from './utils'
import {validate} from '../common'
import parseAccountTrustline from './parse/account-trustline'
import {RippleAPI} from '../api'
import {ParsedTrustline} from '../common/types/objects/trustlines'

export type GetTrustlinesOptions = {
  counterparty?: string,
  currency?: string,
  limit?: number,
  ledgerVersion?: number
}

function currencyFilter(currency: string, trustline: ParsedTrustline) {
  return currency === null || trustline.specification.currency === currency
}

async function getTrustlines(
  this: RippleAPI, address: string, options: GetTrustlinesOptions = {}
): Promise<ParsedTrustline[]> {
  // 1. Validate
  validate.getTrustlines({address, options})
  const ledgerVersion = await this.getLedgerVersion()
  // 2. Make Request
  const responses = await this._requestAll('account_lines', {
    account: address,
    ledger_index: ledgerVersion,
    limit: utils.clamp(options.limit, 10, 400),
    peer: options.counterparty
  })
  // 3. Return Formatted Response
  const trustlines = _.flatMap(responses, response => response.lines)
  return trustlines.map(parseAccountTrustline).filter(trustline => {
    return currencyFilter(options.currency || null, trustline)
  })
}

export default getTrustlines
