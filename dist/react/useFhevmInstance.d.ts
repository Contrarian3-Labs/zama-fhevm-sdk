/**
 * useFhevmInstance Hook - Create FHEVM Instance
 *
 * React hook that wraps the createInstance action
 * Manages instance creation with React state and lifecycle
 *
 * This is a thin wrapper (~20 lines) that calls the core createInstance action
 */
import type { Eip1193Provider } from 'ethers';
import { type CreateInstanceReturnType } from '../actions/createInstance.js';
import type { FhevmConfig } from '../createConfig.js';
export type UseFhevmInstanceParameters = {
    provider: Eip1193Provider | string | undefined;
    chainId?: number | undefined;
    enabled?: boolean;
    config?: FhevmConfig | undefined;
};
export type UseFhevmInstanceReturnType = {
    instance: CreateInstanceReturnType | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | undefined;
    refresh: () => void;
};
/**
 * Hook for creating and managing FHEVM instances
 *
 * @param parameters - Instance creation parameters
 * @returns Object with instance, loading state, error state, and refresh function
 *
 * @example
 * ```tsx
 * import { useFhevmInstance } from '@fhevm-sdk/react'
 *
 * function Component() {
 *   const { instance, isLoading, error } = useFhevmInstance({
 *     provider: window.ethereum,
 *     chainId: 31337,
 *   })
 *
 *   if (isLoading) return <div>Loading FHEVM...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!instance) return null
 *
 *   return <div>FHEVM Ready!</div>
 * }
 * ```
 */
export declare function useFhevmInstance(parameters: UseFhevmInstanceParameters): UseFhevmInstanceReturnType;
