/**
 * useEncrypt Composable - Encrypt Values for FHEVM
 *
 * Vue composable that wraps the encrypt action
 * Provides a function to encrypt values with reactive loading/error states
 *
 * This is a thin wrapper (~15 lines) that calls the core encrypt action
 */
import { type Ref } from 'vue';
import { type EncryptParameters, type EncryptReturnType } from '../actions/encrypt.js';
import type { FhevmConfig } from '../createConfig.js';
export type UseEncryptParameters = {
    config?: FhevmConfig | undefined;
};
export type UseEncryptReturnType = {
    encrypt: (parameters: Omit<EncryptParameters, 'instance'> & {
        instance: EncryptParameters['instance'];
    }) => Promise<EncryptReturnType>;
    data: Ref<EncryptReturnType | undefined>;
    isLoading: Ref<boolean>;
    isError: Ref<boolean>;
    error: Ref<Error | undefined>;
    reset: () => void;
};
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
export declare function useEncrypt(parameters?: UseEncryptParameters): UseEncryptReturnType;
