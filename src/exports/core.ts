/**
 * Core Export - Framework-Agnostic FHEVM SDK
 *
 * Import path: @fhevm-sdk/core
 *
 * This export contains ZERO framework dependencies
 * Safe to use in Node.js, React, Vue, or any JavaScript environment
 */

// Configuration
export {
  createFhevmConfig,
  type CreateFhevmConfigParameters,
  type FhevmConfig,
  type State,
  type PartializedState,
} from '../createConfig.js'

// Storage
export {
  createStorage,
  getDefaultStorage,
  noopStorage,
  type Storage,
  type BaseStorage,
  type CreateStorageParameters,
  type StorageItemMap,
} from '../createStorage.js'

// Hydration (for framework adapters)
export {
  hydrate,
  type HydrateParameters,
} from '../hydrate.js'

// Actions
export * from '../actions/index.js'

// Types
export type {
  FhevmInstance,
  FhevmInstanceConfig,
} from '../fhevmTypes.js'

// Utilities
export type { Compute, ExactPartial } from '../types/utils.js'
