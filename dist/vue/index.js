/**
 * Vue Adapter - FHEVM SDK Vue Integration
 *
 * Import path: @fhevm-sdk/vue
 */
// Re-export core functionality (selective to avoid conflicts)
export { 
// Config
createFhevmConfig, 
// Storage
createStorage, getDefaultStorage, noopStorage, 
// Hydration
hydrate, 
// Actions
createInstance, FhevmError, FhevmAbortError, encrypt, encryptWith, decrypt, getDecryptionSignature, publicDecrypt, } from '../exports/core.js';
// Plugin
export { FhevmPlugin, fhevmConfigKey } from './plugin.js';
// Composables
export { useConfig } from './useConfig.js';
export { useFhevmInstance } from './useFhevmInstance.js';
export { useEncrypt } from './useEncrypt.js';
export { useDecrypt } from './useDecrypt.js';
export { usePublicDecrypt } from './usePublicDecrypt.js';
export { useFHEEncryption } from './useFHEEncryption.js';
export { useInMemoryStorage, provideInMemoryStorage } from './useInMemoryStorage.js';
