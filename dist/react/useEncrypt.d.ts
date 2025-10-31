/**
 * useEncrypt Hook - Encrypt Values for FHEVM
 *
 * React hook that wraps the encrypt action
 * Provides a callback to encrypt values with loading/error states
 *
 * This is a thin wrapper (~15 lines) that calls the core encrypt action
 */
import { type EncryptParameters, type EncryptReturnType } from '../actions/encrypt.js';
import type { FhevmConfig } from '../createConfig.js';
export type UseEncryptParameters = {
    config?: FhevmConfig | undefined;
};
export type UseEncryptReturnType = {
    encrypt: (parameters: Omit<EncryptParameters, 'instance'> & {
        instance: EncryptParameters['instance'];
    }) => Promise<EncryptReturnType>;
    data: EncryptReturnType | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | undefined;
    reset: () => void;
};
/**
 * Hook for encrypting values for FHEVM contracts
 *
 * @param parameters - Hook configuration
 * @returns Object with encrypt function, data, and state
 *
 * @example
 * ```tsx
 * import { useFhevmInstance, useEncrypt } from '@fhevm-sdk/react'
 *
 * function Component() {
 *   const { instance } = useFhevmInstance({ provider: window.ethereum })
 *   const { encrypt, data, isLoading, error } = useEncrypt()
 *
 *   const handleEncrypt = async () => {
 *     if (!instance) return
 *
 *     const encrypted = await encrypt({
 *       instance,
 *       contractAddress: '0x...',
 *       userAddress: '0x...',
 *       values: [
 *         { type: 'euint8', value: 42 },
 *         { type: 'ebool', value: true },
 *       ],
 *     })
 *
 *     console.log('Encrypted:', encrypted)
 *   }
 *
 *   return (
 *     <button onClick={handleEncrypt} disabled={isLoading}>
 *       {isLoading ? 'Encrypting...' : 'Encrypt'}
 *     </button>
 *   )
 * }
 * ```
 */
export declare function useEncrypt(parameters?: UseEncryptParameters): UseEncryptReturnType;
