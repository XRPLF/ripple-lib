import { sha256 as nobleImpl } from '@noble/hashes/sha256'

import wrapNoble from '../internal/wrapNoble'

/**
 * Provide wrap noble-libs's sha256 implementation in HashFn
 */
export const sha256 = wrapNoble(nobleImpl)
