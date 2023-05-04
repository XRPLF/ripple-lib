import * as assert from 'assert'
import { ripemd160 } from '@noble/hashes/ripemd160'
import { sha256 } from '@noble/hashes/sha256'
import { hexToBytes } from '@noble/curves/abstract/utils'

function bytesToHex(a: Iterable<number> | ArrayLike<number>): string {
  return Array.from(a, (byteValue) => {
    const hex = byteValue.toString(16).toUpperCase()
    return hex.length > 1 ? hex : `0${hex}`
  }).join('')
}

function hexToNumberArray(a: string): number[] {
  assert.ok(a.length % 2 === 0)
  return Array.from(hexToBytes(a))
}

function computePublicKeyHash(publicKeyBytes: Uint8Array): Uint8Array {
  return ripemd160(sha256(publicKeyBytes))
}

export { bytesToHex, hexToNumberArray, computePublicKeyHash }
