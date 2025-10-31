/**
 * FHEVM SDK Core Actions
 *
 * Pure, framework-agnostic functions following Wagmi's action pattern
 * All actions follow: (config, parameters) => Promise<Result>
 */

export {
  createInstance,
  type CreateInstanceParameters,
  type CreateInstanceReturnType,
  FhevmAbortError,
  FhevmError,
} from './createInstance.js'

export {
  encrypt,
  encryptWith,
  getEncryptionMethod,
  toHex,
  buildParamsFromAbi,
  type EncryptParameters,
  type EncryptionType,
  type EncryptResult,
  type EncryptReturnType,
} from './encrypt.js'

export {
  decrypt,
  getDecryptionSignature,
  type DecryptRequest,
  type DecryptParameters,
  type DecryptReturnType,
} from './decrypt.js'

export {
  publicDecrypt,
  type PublicDecryptParameters,
  type PublicDecryptReturnType,
} from './publicDecrypt.js'
