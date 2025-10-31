/**
 * useFhevmInstance Composable - Create FHEVM Instance
 *
 * Vue composable that wraps the createInstance action
 * Manages instance creation with Vue reactive state
 *
 * This is a thin wrapper (~25 lines) that calls the core createInstance action
 */
import { type Ref, type MaybeRefOrGetter } from 'vue';
import type { Eip1193Provider } from 'ethers';
import { type CreateInstanceReturnType } from '../actions/createInstance.js';
import type { FhevmConfig } from '../createConfig.js';
export type UseFhevmInstanceParameters = {
    provider: MaybeRefOrGetter<Eip1193Provider | string | undefined>;
    chainId?: MaybeRefOrGetter<number | undefined>;
    enabled?: MaybeRefOrGetter<boolean>;
    config?: FhevmConfig | undefined;
};
export type UseFhevmInstanceReturnType = {
    instance: Ref<CreateInstanceReturnType | undefined>;
    isLoading: Ref<boolean>;
    isError: Ref<boolean>;
    error: Ref<Error | undefined>;
    refresh: () => void;
};
/**
 * Composable for creating and managing FHEVM instances
 *
 * @param parameters - Instance creation parameters (can be refs)
 * @returns Object with reactive instance, loading state, error state, and refresh function
 *
 * @example
 * ```vue
 * <script setup>
 * import { ref } from 'vue'
 * import { useFhevmInstance } from '@fhevm-sdk/vue'
 *
 * const provider = ref(window.ethereum)
 * const { instance, isLoading, error } = useFhevmInstance({
 *   provider,
 *   chainId: 31337,
 * })
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading FHEVM...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <div v-else-if="instance">FHEVM Ready!</div>
 * </template>
 * ```
 */
export declare function useFhevmInstance(parameters: UseFhevmInstanceParameters): UseFhevmInstanceReturnType;
