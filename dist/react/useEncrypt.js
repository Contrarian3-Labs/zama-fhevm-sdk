/**
 * useEncrypt Hook - Encrypt Values for FHEVM
 *
 * React hook that wraps the encrypt action
 * Provides a callback to encrypt values with loading/error states
 *
 * This is a thin wrapper (~15 lines) that calls the core encrypt action
 */
'use client';
import { useCallback, useState } from 'react';
import { encrypt } from '../actions/encrypt.js';
import { useConfig } from './useConfig.js';
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
export function useEncrypt(parameters = {}) {
    const config = useConfig(parameters);
    const [data, setData] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState(undefined);
    const encryptFn = useCallback(async (params) => {
        setIsLoading(true);
        setIsError(false);
        setError(undefined);
        try {
            // Call core encrypt action
            const result = await encrypt(config, params);
            setData(result);
            setIsLoading(false);
            setIsError(false);
            setError(undefined);
            return result;
        }
        catch (err) {
            setData(undefined);
            setIsLoading(false);
            setIsError(true);
            setError(err);
            throw err;
        }
    }, [config]);
    const reset = useCallback(() => {
        setData(undefined);
        setIsLoading(false);
        setIsError(false);
        setError(undefined);
    }, []);
    return {
        encrypt: encryptFn,
        data,
        isLoading,
        isError,
        error,
        reset,
    };
}
