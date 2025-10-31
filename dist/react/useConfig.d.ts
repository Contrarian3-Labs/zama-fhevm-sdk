/**
 * useConfig Hook - Access FHEVM Configuration
 *
 * React hook to access FHEVM config from context
 * Following Wagmi's useConfig.ts pattern
 *
 * Reference: wagmi/packages/react/src/hooks/useConfig.ts
 */
import type { FhevmConfig } from '../createConfig.js';
export type UseConfigParameters = {
    config?: FhevmConfig | undefined;
};
export type UseConfigReturnType = FhevmConfig;
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
export declare function useConfig(parameters?: UseConfigParameters): UseConfigReturnType;
