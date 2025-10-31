/**
 * Core Export - Framework-Agnostic FHEVM SDK
 *
 * Import path: @fhevm-sdk/core
 *
 * This export contains ZERO framework dependencies
 * Safe to use in Node.js, React, Vue, or any JavaScript environment
 */
export { createFhevmConfig, type CreateFhevmConfigParameters, type FhevmConfig, type State, type PartializedState, } from '../createConfig.js';
export { createStorage, getDefaultStorage, noopStorage, type Storage, type BaseStorage, type CreateStorageParameters, type StorageItemMap, } from '../createStorage.js';
export { hydrate, type HydrateParameters, } from '../hydrate.js';
export * from '../actions/index.js';
export type { FhevmInstance, FhevmInstanceConfig, } from '../fhevmTypes.js';
export type { Compute, ExactPartial } from '../types/utils.js';
