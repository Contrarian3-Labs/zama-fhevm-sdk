/**
 * Main Export - FHEVM SDK
 *
 * Default export includes everything (backward compatibility)
 * For better tree-shaking, use subpath exports:
 * - import { ... } from '@fhevm-sdk/core'
 * - import { ... } from '@fhevm-sdk/react'
 * - import { ... } from '@fhevm-sdk/vue'
 */

// Export from main index (uses default exports/index.ts)
export * from "./exports/index.js";
