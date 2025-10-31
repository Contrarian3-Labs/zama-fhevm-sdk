/**
 * useEncrypt Composable - Encrypt Values for FHEVM
 *
 * Vue composable that wraps the encrypt action
 * Provides a function to encrypt values with reactive loading/error states
 *
 * This is a thin wrapper (~15 lines) that calls the core encrypt action
 */

import { ref, toRaw, type Ref } from 'vue'
import { encrypt, type EncryptParameters, type EncryptReturnType } from '../actions/encrypt.js'
import type { FhevmConfig } from '../createConfig.js'
import { useConfig } from './useConfig.js'

export type UseEncryptParameters = {
  config?: FhevmConfig | undefined
}

export type UseEncryptReturnType = {
  encrypt: (parameters: Omit<EncryptParameters, 'instance'> & { instance: EncryptParameters['instance'] }) => Promise<EncryptReturnType>
  data: Ref<EncryptReturnType | undefined>
  isLoading: Ref<boolean>
  isError: Ref<boolean>
  error: Ref<Error | undefined>
  reset: () => void
}

/**
 * Composable for encrypting values for FHEVM contracts
 *
 * @param parameters - Composable configuration
 * @returns Object with encrypt function, reactive data, and state
 *
 * @example
 * ```vue
 * <script setup>
 * import { useFhevmInstance, useEncrypt } from '@fhevm-sdk/vue'
 *
 * const { instance } = useFhevmInstance({ provider: window.ethereum })
 * const { encrypt, data, isLoading, error } = useEncrypt()
 *
 * const handleEncrypt = async () => {
 *   if (!instance.value) return
 *
 *   const encrypted = await encrypt({
 *     instance: instance.value,
 *     contractAddress: '0x...',
 *     userAddress: '0x...',
 *     values: [
 *       { type: 'euint8', value: 42 },
 *       { type: 'ebool', value: true },
 *     ],
 *   })
 *
 *   console.log('Encrypted:', encrypted)
 * }
 * </script>
 *
 * <template>
 *   <button @click="handleEncrypt" :disabled="isLoading">
 *     {{ isLoading ? 'Encrypting...' : 'Encrypt' }}
 *   </button>
 * </template>
 * ```
 */
export function useEncrypt(
  parameters: UseEncryptParameters = {}
): UseEncryptReturnType {
  const config = useConfig(parameters)

  const data = ref<EncryptReturnType | undefined>(undefined)
  const isLoading = ref(false)
  const isError = ref(false)
  const error = ref<Error | undefined>(undefined)

  const encryptFn = async (params: Omit<EncryptParameters, 'instance'> & { instance: EncryptParameters['instance'] }) => {
    isLoading.value = true
    isError.value = false
    error.value = undefined

    try {
      // CRITICAL: Unwrap Vue Proxy from instance parameter
      // FhevmInstance has private fields inaccessible through Proxy
      const rawParams = {
        ...params,
        instance: toRaw(params.instance),
      }

      // Call core encrypt action
      const result = await encrypt(config, rawParams)

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
    encrypt: encryptFn,
    data,
    isLoading,
    isError,
    error,
    reset,
  }
}
