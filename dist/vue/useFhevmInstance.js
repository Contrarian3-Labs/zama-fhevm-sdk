/**
 * useFhevmInstance Composable - Create FHEVM Instance
 *
 * Vue composable that wraps the createInstance action
 * Manages instance creation with Vue reactive state
 *
 * This is a thin wrapper (~25 lines) that calls the core createInstance action
 */
import { ref, watch, onBeforeUnmount, toValue } from 'vue';
import { createInstance, FhevmAbortError } from '../actions/createInstance.js';
import { useConfig } from './useConfig.js';
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
export function useFhevmInstance(parameters) {
    const config = useConfig(parameters);
    const instance = ref(undefined);
    const isLoading = ref(false);
    const isError = ref(false);
    const error = ref(undefined);
    let abortController = null;
    const refresh = () => {
        // Abort any pending request
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
        instance.value = undefined;
        error.value = undefined;
        isError.value = false;
        isLoading.value = false;
    };
    const loadInstance = async () => {
        const providerValue = toValue(parameters.provider);
        const chainIdValue = toValue(parameters.chainId);
        const enabledValue = toValue(parameters.enabled) ?? true;
        // Return early if not enabled or no provider
        if (!enabledValue || !providerValue) {
            if (abortController) {
                abortController.abort();
                abortController = null;
            }
            instance.value = undefined;
            isLoading.value = false;
            return;
        }
        // Check if instance already exists in cache
        const cachedInstance = config.getInstance({ chainId: chainIdValue });
        if (cachedInstance) {
            instance.value = cachedInstance;
            isLoading.value = false;
            isError.value = false;
            error.value = undefined;
            return;
        }
        // Create abort controller for this request
        abortController = new AbortController();
        const signal = abortController.signal;
        isLoading.value = true;
        isError.value = false;
        error.value = undefined;
        try {
            // Call core createInstance action
            const newInstance = await createInstance(config, {
                provider: providerValue,
                chainId: chainIdValue,
                signal,
            });
            // Ignore if aborted
            if (signal.aborted)
                return;
            instance.value = newInstance;
            isLoading.value = false;
            isError.value = false;
            error.value = undefined;
        }
        catch (err) {
            // Ignore abort errors
            if (err instanceof FhevmAbortError || signal.aborted)
                return;
            instance.value = undefined;
            isLoading.value = false;
            isError.value = true;
            error.value = err;
        }
    };
    // Watch parameters and reload when they change
    watch(() => [toValue(parameters.provider), toValue(parameters.chainId), toValue(parameters.enabled)], () => {
        loadInstance();
    }, { immediate: true });
    // Cleanup on unmount
    onBeforeUnmount(() => {
        if (abortController) {
            abortController.abort();
        }
    });
    return {
        instance,
        isLoading,
        isError,
        error,
        refresh,
    };
}
