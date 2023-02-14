import { assert } from 'chai'

import { getNFTokenID } from '../../src'
import * as NFTokenResponse from '../fixtures/rippled/mintNFTMeta.json'

describe('parseNFTokenID', function () {
  it('decode a valid NFTokenID', function () {
    const result = getNFTokenID(NFTokenResponse.meta)
    const expectedNFTokenID =
      '00081388DC1AB4937C899037B2FDFC3CB20F6F64E73120BB5F8AA66A00000228'
    assert.equal(result, expectedNFTokenID)
  })

  it('fails with nice error when given raw response instead of meta', function () {
    assert.throws(() => {
      // @ts-expect-error - Validating error for javascript users
      const _ = getNFTokenID(NFTokenResponse)
    }, /^Unable to parse the parameter given to getNFTokenID.*/u)
  })
})
