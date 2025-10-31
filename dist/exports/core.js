/**
 * Core Export - Framework-Agnostic FHEVM SDK
 *
 * Import path: @fhevm-sdk/core
 *
 * This export contains ZERO framework dependencies
 * Safe to use in Node.js, React, Vue, or any JavaScript environment
 */
// Configuration
export { createFhevmConfig, } from '../createConfig.js';
// Storage
export { createStorage, getDefaultStorage, noopStorage, } from '../createStorage.js';
// Hydration (for framework adapters)
export { hydrate, } from '../hydrate.js';
// Actions
export * from '../actions/index.js';
