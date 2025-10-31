/**
 * useDecrypt Composable - Decrypt FHEVM Ciphertext Handles
 *
 * Vue composable that wraps the decrypt action
 * Provides a function to decrypt ciphertext handles with reactive loading/error states
 *
 * This is a thin wrapper (~15 lines) that calls the core decrypt action
 */

import { ref, toRaw, type Ref } from 'vue'
import { decrypt, type DecryptParameters, type DecryptReturnType } from '../actions/decrypt.js'
import type { FhevmConfig } from '../createConfig.js'
import { useConfig } from './useConfig.js'

export type UseDecryptParameters = {
  config?: FhevmConfig | undefined
}

export type UseDecryptReturnType = {
  decrypt: (parameters: DecryptParameters) => Promise<DecryptReturnType>
  data: Ref<DecryptReturnType | undefined>
  isLoading: Ref<boolean>
  isError: Ref<boolean>
  error: Ref<Error | undefined>
  reset: () => void
}

/**
 * Composable for decrypting FHEVM ciphertext handles
 *
 * @param parameters - Composable configuration
 * @returns Object with decrypt function, reactive data, and state
 *
 * @example
 * ```vue
 * <script setup>
 * import { useFhevmInstance, useDecrypt, useConfig } from '@fhevm-sdk/vue'
 * import { BrowserProvider } from 'ethers'
 *
 * const { instance } = useFhevmInstance({ provider: window.ethereum })
 * const { decrypt, data, isLoading, error } = useDecrypt()
 * const config = useConfig()
 *
 * const handleDecrypt = async () => {
 *   if (!instance.value) return
 *
 *   const provider = new BrowserProvider(window.ethereum)
 *   const signer = await provider.getSigner()
 *
 *   const decrypted = await decrypt({
 *     instance: instance.value,
 *     requests: [
 *       { handle: '0x...', contractAddress: '0x...' },
 *       { handle: '0x...', contractAddress: '0x...' },
 *     ],
 *     signer,
 *     storage: config.storage,
 *   })
 *
 *   console.log('Decrypted values:', decrypted)
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button @click="handleDecrypt" :disabled="isLoading">
 *       {{ isLoading ? 'Decrypting...' : 'Decrypt' }}
 *     </button>
 *     <pre v-if="data">{{ JSON.stringify(data, null, 2) }}</pre>
 *     <div v-if="error">Error: {{ error.message }}</div>
 *   </div>
 * </template>
 * ```
 */
export function useDecrypt(
  parameters: UseDecryptParameters = {}
): UseDecryptReturnType {
  const config = useConfig(parameters)

  const data = ref<DecryptReturnType | undefined>(undefined)
  const isLoading = ref(false)
  const isError = ref(false)
  const error = ref<Error | undefined>(undefined)

  const decryptFn = async (params: DecryptParameters) => {
    isLoading.value = true
    isError.value = false
    error.value = undefined

    try {
      // CRITICAL: Unwrap Vue Proxy from instance, signer, and storage parameters
      // FhevmInstance and JsonRpcSigner have private fields inaccessible through Proxy
      // Storage needs to maintain same reference for signature caching
      const rawParams: DecryptParameters = {
        ...params,
        instance: toRaw(params.instance),
        signer: toRaw(params.signer),
        storage: params.storage ? toRaw(params.storage) : params.storage,
      }

      // Call core decrypt action
      const result = await decrypt(config, rawParams)

      data.value = result
      isLoading.value = false
      isError.value = false
      error.value = undefined

      return result
    } catch (err) {
      data.value = undefined
      isLoading.value = false
      isError.value = true
      error.value = err as Error

      throw err
    }
  }

  const reset = () => {
    data.value = undefined
    isLoading.value = false
    isError.value = false
    error.value = undefined
  }

  return {
    decrypt: decryptFn,
    data,
    isLoading,
    isError,
    error,
    reset,
  }
}
