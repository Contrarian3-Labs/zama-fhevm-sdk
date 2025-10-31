/**
 * Main Export - FHEVM SDK
 *
 * Default export includes core functionality + React hooks
 * For Vue, use: import { ... } from '@fhevm-sdk/vue'
 */

// Core Configuration
export * from '../createConfig.js'
export * from '../createStorage.js'

// Core Actions
export * from '../actions/index.js'

// Types
export * from '../fhevmTypes.js'
export * from '../FhevmDecryptionSignature.js'

// Storage
export * from '../storage/index.js'

// React Hooks (included in main entry for React template)
// Vue users should import from '@fhevm-sdk/vue'
export * from '../react/index.js'

// Type utilities
export type { Compute, ExactPartial } from '../types/utils.js'
