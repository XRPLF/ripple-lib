// import requests from '../../fixtures/requests'
// import responses from '../../fixtures/responses'
import {TestSuite} from '../../utils'
// const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  // 'prepareEscrowCancellation': async (client, address) => {
  //   const result = await client.prepareEscrowCancellation(
  //     address,
  //     requests.prepareEscrowCancellation.normal,
  //     instructionsWithMaxLedgerVersionOffset
  //   )
  //   assertResultMatch(
  //     result,
  //     responses.prepareEscrowCancellation.normal,
  //     'prepare'
  //   )
  // },

  // 'prepareEscrowCancellation with memos': async (client, address) => {
  //   const result = await client.prepareEscrowCancellation(
  //     address,
  //     requests.prepareEscrowCancellation.memos
  //   )
  //   assertResultMatch(
  //     result,
  //     responses.prepareEscrowCancellation.memos,
  //     'prepare'
  //   )
  // },

  // 'with ticket': async (client, address) => {
  //   const localInstructions = {
  //     ...instructionsWithMaxLedgerVersionOffset,
  //     maxFee: '0.000012',
  //     ticketSequence: 23
  //   }
  //   const result = await client.prepareEscrowCancellation(
  //     address,
  //     requests.prepareEscrowCancellation.normal,
  //     localInstructions
  //   )
  //   assertResultMatch(
  //     result,
  //     responses.prepareEscrowCancellation.ticket,
  //     'prepare'
  //   )
  // }
}
