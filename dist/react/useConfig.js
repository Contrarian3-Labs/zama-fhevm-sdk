/**
 * useConfig Hook - Access FHEVM Configuration
 *
 * React hook to access FHEVM config from context
 * Following Wagmi's useConfig.ts pattern
 *
 * Reference: wagmi/packages/react/src/hooks/useConfig.ts
 */
'use client';
import { useContext } from 'react';
import { FhevmContext } from './context.js';
/**
 * Hook for accessing FHEVM configuration
 *
 * @param parameters - Optional config override
 * @returns FHEVM configuration object
 *
 * @example
 * ```tsx
 * import { useConfig } from '@fhevm-sdk/react'
 *
 * function Component() {
 *   const config = useConfig()
 *   console.log(config.chains) // [31337]
 *   return <div>...</div>
 * }
 * ```
 */
export function useConfig(parameters = {}) {
    // Allow explicit config override (useful for testing or nested providers)
    const { config } = parameters;
    // Get config from context
    const contextConfig = useContext(FhevmContext);
    // Use explicit config if provided, otherwise use context
    const resolvedConfig = config ?? contextConfig;
    if (!resolvedConfig) {
        throw new Error('useConfig must be used within FhevmProvider.\n\n' +
            'Wrap your app with FhevmProvider:\n' +
            '<FhevmProvider config={fhevmConfig}><App /></FhevmProvider>\n\n' +
            'Or pass config directly:\n' +
            'useConfig({ config: fhevmConfig })');
    }
    return resolvedConfig;
}
