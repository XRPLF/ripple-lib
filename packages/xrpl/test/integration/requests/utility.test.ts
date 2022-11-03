import { assert } from 'chai'
import _ from 'lodash'

import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('Utility method integration tests', () => {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'ping',
    async () => {
      try {
        const response = await testContext.client.request({
          command: 'ping',
        })
        const expected: unknown = {
          result: { role: 'admin', unlimited: true },
          type: 'response',
        }
        assert.deepEqual(_.omit(response, 'id'), expected)
      } catch (error) {
        console.error(error)
      }
    },
    TIMEOUT,
  )

  it(
    'random',
    async () => {
      const response = await testContext.client.request({
        command: 'random',
      })
      const expected = {
        id: 0,
        result: {
          random: '[random string of 64 bytes]',
        },
        type: 'response',
      }
      assert.equal(response.type, expected.type)
      assert.equal(response.result.random.length, 64)
    },
    TIMEOUT,
  )
})