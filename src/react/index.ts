/**
 * React Adapter - FHEVM SDK React Integration
 *
 * Import path: @fhevm-sdk/react
 */

// Re-export core functionality (selective to avoid conflicts)
export {
  // Config
  createFhevmConfig,
  type CreateFhevmConfigParameters,
  type FhevmConfig,
  type State,
  type PartializedState,
  // Storage
  createStorage,
  getDefaultStorage,
  noopStorage,
  type Storage,
  type BaseStorage,
  type CreateStorageParameters,
  type StorageItemMap,
  // Hydration
  hydrate,
  type HydrateParameters,
  // Actions
  createInstance,
  type CreateInstanceParameters,
  type CreateInstanceReturnType,
  FhevmError,
  FhevmAbortError,
  encrypt,
  encryptWith,
  type EncryptParameters,
  type EncryptionType,
  type EncryptReturnType,
  decrypt,
  getDecryptionSignature,
  type DecryptRequest,
  type DecryptParameters,
  type DecryptReturnType,
  publicDecrypt,
  type PublicDecryptParameters,
  type PublicDecryptReturnType,
  // Types
  type FhevmInstance,
  type FhevmInstanceConfig,
  // Utilities
  type Compute,
  type ExactPartial,
} from '../exports/core.js'

// Context and Provider
export { FhevmContext, FhevmProvider, type FhevmProviderProps } from './context.js'

// Hooks - New Pattern (Wagmi-inspired, thin wrappers calling core actions)
export { useConfig, type UseConfigParameters, type UseConfigReturnType } from './useConfig.js'
export { useFhevmInstance, type UseFhevmInstanceParameters, type UseFhevmInstanceReturnType } from './useFhevmInstance.js'
export { useEncrypt, type UseEncryptParameters, type UseEncryptReturnType } from './useEncrypt.js'
export { useDecrypt, type UseDecryptParameters, type UseDecryptReturnType } from './useDecrypt.js'
export { usePublicDecrypt, type UsePublicDecryptParameters, type UsePublicDecryptReturnType } from './usePublicDecrypt.js'

// Legacy hooks (old pattern - kept for backward compatibility, will be deprecated)
export { useFhevm, type FhevmGoState } from "./useFhevm.js";
export { useFHEEncryption } from "./useFHEEncryption.js";
export { useFHEDecrypt } from "./useFHEDecrypt.js";
export { useInMemoryStorage, InMemoryStorageProvider } from "./useInMemoryStorage.js";
