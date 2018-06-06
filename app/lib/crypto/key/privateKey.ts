import * as assert from "assert"
import * as KeyPath from "../keyPath"
import * as BigNum from "bignum"
import {sha512hmac} from "../hash"
import {integerAsBuffer} from "../../utils/conversions"
import * as PublicKey from "./publicKey"
import {ChainCode, ExtendedKey, getExtendedKey as extendedKey, Key} from "./key"
import {privateKeyTweakAdd} from "secp256k1"

export interface PrivateKey extends Key {
  type: "private"
}

/**
 * SECP256K1 N (order)
 * @type {BigNum}
 */
export const SECP256K1_N = BigNum.fromBuffer(
  Buffer.from(
    "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
    "hex"
  )
)

/**
 * Derive a descendant extended private key from a parent extended private key (likely a master
 * key), using either a keypath or child index.
 *
 * @param {ExtendedKey<PrivateKey>} masterKey
 * @param {KeyPath | string | number} keyPath  or index
 * @returns {any}
 */
export const derive =
  (masterKey: ExtendedKey<PrivateKey>, keyPath: KeyPath.KeyPath | string | number) => {
    let extendedKey: ExtendedKey<PrivateKey>
    if (typeof keyPath !== "number") {
      const path =
        typeof keyPath === "string" ? KeyPath.fromString(keyPath) : keyPath
      extendedKey = path.reduce(deriveChildKey, masterKey)
    } else {
      // with child index
      extendedKey = deriveChildKey(masterKey, keyPath)
    }

    return extendedKey
  }

/**
 * Extended key from private key bytes and chainCode
 * @param {Buffer} private key bytes
 * @param {ChainCode} chainCode
 * @returns {ExtendedKey<PrivateKey>}
 */
export const getExtendedKey = (bytes: Buffer, chainCode: ChainCode): ExtendedKey<PrivateKey> => {
  return extendedKey(bytes, chainCode, "private")
}

/**
 * Generate extended private key
 * @param {PrivateKey} parentKey
 * @param {ChainCode} chainCode
 * @param {number} childIndex
 * @returns {ExtendedKey<PrivateKey>}
 */
const deriveChildKey = (
  parentKey: ExtendedKey<PrivateKey>,
  childIndex: number
): ExtendedKey<PrivateKey> => {

  let data: Buffer
  const childIndexBuffer = integerAsBuffer(childIndex)
  if (KeyPath.isHardened(childIndex)) {
    const buf =
      Buffer.concat([Buffer.from([0]), parentKey.key.bytes], parentKey.key.bytes.length + 1)
    data = Buffer.concat([buf, childIndexBuffer], buf.length + childIndexBuffer.length)
  } else {
    const pubkey = PublicKey.create(parentKey)
    data =
      Buffer.concat(
        [pubkey.key.bytes, childIndexBuffer],
        pubkey.key.bytes.length + childIndexBuffer.length
      )
  }
  const I: Buffer = sha512hmac(parentKey.chainCode, data)
  const IL = I.slice(0, 32)
  const IR = I.slice(32, 64)
  const p = BigNum.fromBuffer(IL)
  // Private point should be less than the secp256k1 order
  assert(p.cmp(SECP256K1_N) <= 0, "can't generate child private key")
  // ki = parse256(IL) + kpar (mod n)
  const keyBytes = privateKeyTweakAdd(parentKey.key.bytes, IL)
  if (keyBytes === null) {
    // In case ki == 0, proceed with the next value for i
    return deriveChildKey(parentKey, childIndex + 1)
  }

  return getExtendedKey(keyBytes, IR)
}
