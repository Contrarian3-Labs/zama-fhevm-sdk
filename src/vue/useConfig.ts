/**
 * useConfig Composable - Access FHEVM Configuration
 *
 * Vue composable to access FHEVM config from plugin injection
 * Following Wagmi's useConfig.ts pattern
 *
 * Reference: wagmi/packages/vue/src/composables/useConfig.ts
 */

import { inject } from 'vue'
import { fhevmConfigKey } from './plugin.js'
import type { FhevmConfig } from '../createConfig.js'

export type UseConfigParameters = {
  config?: FhevmConfig | undefined
}

export type UseConfigReturnType = FhevmConfig

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
export function useConfig(
  parameters: UseConfigParameters = {},
): UseConfigReturnType {
  // Allow explicit config override (useful for testing)
  const { config } = parameters

  // Inject config from plugin
  const injectedConfig = inject(fhevmConfigKey)

  // Use explicit config if provided, otherwise use injected
  const resolvedConfig = config ?? injectedConfig

  if (!resolvedConfig) {
    throw new Error(
      'useConfig must be used after installing FhevmPlugin.\n\n' +
        'Install the plugin in your Vue app:\n' +
        'app.use(FhevmPlugin, { config: fhevmConfig })\n\n' +
        'Or pass config directly:\n' +
        'useConfig({ config: fhevmConfig })'
    )
  }

  return resolvedConfig as FhevmConfig
}
