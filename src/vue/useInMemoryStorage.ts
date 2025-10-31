/**
 * useInMemoryStorage - Vue Composable for In-Memory Storage
 *
 * Provides in-memory storage for FHEVM decryption signatures.
 * Mirrors React's useInMemoryStorage hook but uses Vue's provide/inject pattern.
 *
 * Storage is cleared on page refresh (unlike localStorage which persists).
 * This matches Next.js example behavior where signatures expire on app restart.
 */

import { inject, provide, type InjectionKey } from 'vue'
import { GenericStringInMemoryStorage, type GenericStringStorage } from '../storage/GenericStringStorage.js'

export type UseInMemoryStorageReturnType = {
  storage: GenericStringStorage
}

// Injection key for storage - store the actual instance, not a ref
const InMemoryStorageKey: InjectionKey<GenericStringStorage> = Symbol('InMemoryStorage')

/**
 * Provider function to initialize in-memory storage at the app root
 *
 * Call this once in your app setup (e.g., in main.ts or root component)
 *
 * @example
 * ```typescript
 * // In main.ts or App.vue setup
 * import { provideInMemoryStorage } from '@fhevm-sdk/vue'
 *
 * provideInMemoryStorage()
 * ```
 */
export function provideInMemoryStorage(): void {
  // Create storage instance directly without ref wrapper
  // This ensures the same instance is always returned
  const storage = new GenericStringInMemoryStorage()
  provide(InMemoryStorageKey, storage)
}

/**
 * Composable for accessing in-memory storage
 *
 * Must be used within a component tree where provideInMemoryStorage() was called.
 *
 * @returns Object with storage instance
 *
 * @throws {Error} If called outside of provider context
 *
 * @example
 * ```vue
 * <script setup>
 * import { useInMemoryStorage, useFhevmInstance, useDecrypt } from '@fhevm-sdk/vue'
 *
 * const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage()
 * const { instance } = useFhevmInstance({ provider: window.ethereum })
 * const { decrypt } = useDecrypt()
 *
 * const handleDecrypt = async () => {
 *   await decrypt({
 *     instance: instance.value,
 *     requests: [{ handle: '0x...', contractAddress: '0x...' }],
 *     signer,
 *     storage: fhevmDecryptionSignatureStorage,
 *   })
 * }
 * </script>
 * ```
 */
export function useInMemoryStorage(): UseInMemoryStorageReturnType {
  const storage = inject(InMemoryStorageKey)

  if (!storage) {
    throw new Error(
      'useInMemoryStorage must be used within a component tree where provideInMemoryStorage() was called. ' +
      'Call provideInMemoryStorage() in your app setup (e.g., main.ts or root component).'
    )
  }

  // Return the storage instance directly (no .value needed)
  return {
    storage
  }
}
