/**
 * React Adapter - FHEVM SDK React Integration
 *
 * Import path: @fhevm-sdk/react
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
// Context and Provider
export { FhevmContext, FhevmProvider } from './context.js';
// Hooks - New Pattern (Wagmi-inspired, thin wrappers calling core actions)
export { useConfig } from './useConfig.js';
export { useFhevmInstance } from './useFhevmInstance.js';
export { useEncrypt } from './useEncrypt.js';
export { useDecrypt } from './useDecrypt.js';
export { usePublicDecrypt } from './usePublicDecrypt.js';
// Legacy hooks (old pattern - kept for backward compatibility, will be deprecated)
export { useFhevm } from "./useFhevm.js";
export { useFHEEncryption } from "./useFHEEncryption.js";
export { useFHEDecrypt } from "./useFHEDecrypt.js";
export { useInMemoryStorage, InMemoryStorageProvider } from "./useInMemoryStorage.js";
