import * as _ from 'lodash'
import {convertKeysFromSnakeCaseToCamelCase} from './utils'
import BigNumber from 'bignumber.js'
import {RippleAPI} from '../index'

export type GetServerInfoResponse = {
  buildVersion: string,
  completeLedgers: string,
  hostID: string,
  ioLatencyMs: number,
  load?: {
    jobTypes: Array<Object>,
    threads: number
  },
  lastClose: {
    convergeTimeS: number,
    proposers: number
  },
  loadFactor: number,
  peers: number,
  pubkeyNode: string,
  pubkeyValidator?: string,
  serverState: string,
  validatedLedger: {
    age: number,
    baseFeeXRP: string,
    hash: string,
    reserveBaseXRP: string,
    reserveIncrementXRP: string,
    ledgerVersion: number
  },
  validationQuorum: number
}

function renameKeys(object, mapping) {
  _.forEach(mapping, (to, from) => {
    object[to] = object[from]
    delete object[from]
  })
}

function getServerInfo(this: RippleAPI): Promise<GetServerInfoResponse> {
  return this.request('server_info').then(response => {
    const info = convertKeysFromSnakeCaseToCamelCase(response.info)
    renameKeys(info, {hostid: 'hostID'})
    if (info.validatedLedger) {
      renameKeys(info.validatedLedger, {
        baseFeeXrp: 'baseFeeXRP',
        reserveBaseXrp: 'reserveBaseXRP',
        reserveIncXrp: 'reserveIncrementXRP',
        seq: 'ledgerVersion'
      })
      info.validatedLedger.baseFeeXRP =
        info.validatedLedger.baseFeeXRP.toString()
      info.validatedLedger.reserveBaseXRP =
        info.validatedLedger.reserveBaseXRP.toString()
      info.validatedLedger.reserveIncrementXRP =
        info.validatedLedger.reserveIncrementXRP.toString()
    }
    return info
  })
}

async function getFee(
  this: RippleAPI,
  cushion?: number,
  maximum: number | BigNumber | null = 1
): Promise<string> {
  if (cushion === undefined) {
    cushion = this._feeCushion
  }
  if (cushion === undefined) {
    cushion = 1.2
  }

  const serverInfo = (await this.request('server_info')).info
  const baseFeeXrp = new BigNumber(serverInfo.validated_ledger.base_fee_xrp)
  const fee = baseFeeXrp.times(serverInfo.load_factor).times(cushion)

  if (maximum) {
    // Cap fee to `maximum` XRP
    maximum = new BigNumber(maximum)
    if (fee.greaterThan(maximum)) {
      return maximum.toString(10)
    }
  }

  return fee.toString(10)
}

export {
  getServerInfo,
  getFee
}
