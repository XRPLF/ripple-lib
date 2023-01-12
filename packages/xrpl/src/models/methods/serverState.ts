import { BaseRequest, BaseResponse } from './baseMethod'
import { JobType, ServerState, StateAccountingFinal } from './serverInfo'

/**
 * The `server_state` command asks the server for various machine-readable
 * information about the rippled server's current state. The response is almost
 * the same as the server_info method, but uses units that are easier to process
 * instead of easier to read.
 *
 * @category Requests
 */
export interface ServerStateRequest extends BaseRequest {
  command: 'server_state'
}

/**
 * Response expected from a {@link ServerStateRequest}.
 *
 * @category Responses
 */
export interface ServerStateResponse extends BaseResponse {
  result: {
    state: {
      amendment_blocked?: boolean
      build_version: string
      complete_ledgers: string
      closed_ledger?: {
        age: number
        base_fee: number
        hash: string
        reserve_base: number
        reserve_inc: number
        seq: number
      }
      io_latency_ms: number
      jq_trans_overflow: string
      last_close: {
        // coverage_time_s only exists for "human" api requests. We make "non human" api requests,
        // therefore the type is coverage_time
        converge_time: number
        proposers: number
      }
      load?: {
        job_types: JobType[]
        threads: number
      }
      load_base: number
      load_factor: number
      load_factor_fee_escalation?: number
      load_factor_fee_queue?: number
      load_factor_fee_reference?: number
      load_factor_server?: number
      peer_disconnects?: string
      peer_disconnects_resources?: string
      peers: number
      pubkey_node: string
      pubkey_validator?: string
      server_state: ServerState
      server_state_duration_us: number
      // https://xrpl.org/rippled-server-states.html
      // The distinction between full, validating, and proposing is based on synchronization with the rest of the global network,
      // and it is normal for a server to fluctuate between these states as a course of general operation.
      // Construct a type that requires at least one of these fields to be present.
      state_accounting: StateAccountingFinal
      time: string
      uptime: number
      validated_ledger?: {
        age?: number
        base_fee: number
        close_time: number
        hash: string
        reserve_base: number
        reserve_inc: number
        seq: number
      }
      validation_quorum: number
      validator_list_expires?: number
    }
  }
}
