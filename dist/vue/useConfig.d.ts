/**
 * useConfig Composable - Access FHEVM Configuration
 *
 * Vue composable to access FHEVM config from plugin injection
 * Following Wagmi's useConfig.ts pattern
 *
 * Reference: wagmi/packages/vue/src/composables/useConfig.ts
 */
import type { FhevmConfig } from '../createConfig.js';
export type UseConfigParameters = {
    config?: FhevmConfig | undefined;
};
export type UseConfigReturnType = FhevmConfig;
/**
 * Composable for accessing FHEVM configuration
 *
 * @param parameters - Optional config override
 * @returns FHEVM configuration object
 *
 * @example
 * ```vue
 * <script setup>
 * import { useConfig } from '@fhevm-sdk/vue'
 *
 * const config = useConfig()
 * console.log(config.chains) // [31337]
 * </script>
 * ```
 */
export declare function useConfig(parameters?: UseConfigParameters): UseConfigReturnType;
