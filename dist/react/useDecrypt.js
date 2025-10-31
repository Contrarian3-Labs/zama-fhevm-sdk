/**
 * useDecrypt Hook - Decrypt FHEVM Ciphertext Handles
 *
 * React hook that wraps the decrypt action
 * Provides a callback to decrypt ciphertext handles with loading/error states
 *
 * This is a thin wrapper (~15 lines) that calls the core decrypt action
 */
'use client';
import { useCallback, useState } from 'react';
import { decrypt } from '../actions/decrypt.js';
import { useConfig } from './useConfig.js';
/**
 * Hook for decrypting FHEVM ciphertext handles
 *
 * @param parameters - Hook configuration
 * @returns Object with decrypt function, data, and state
 *
 * @example
 * ```tsx
 * import { useFhevmInstance, useDecrypt } from '@fhevm-sdk/react'
 * import { BrowserProvider } from 'ethers'
 *
 * function Component() {
 *   const { instance } = useFhevmInstance({ provider: window.ethereum })
 *   const { decrypt, data, isLoading, error } = useDecrypt()
 *   const config = useConfig()
 *
 *   const handleDecrypt = async () => {
 *     if (!instance) return
 *
 *     const provider = new BrowserProvider(window.ethereum)
 *     const signer = await provider.getSigner()
 *
 *     const decrypted = await decrypt({
 *       instance,
 *       requests: [
 *         { handle: '0x...', contractAddress: '0x...' },
 *         { handle: '0x...', contractAddress: '0x...' },
 *       ],
 *       signer,
 *       storage: config.storage,
 *     })
 *
 *     console.log('Decrypted values:', decrypted)
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleDecrypt} disabled={isLoading}>
 *         {isLoading ? 'Decrypting...' : 'Decrypt'}
 *       </button>
 *       {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
 *       {error && <div>Error: {error.message}</div>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useDecrypt(parameters = {}) {
    const config = useConfig(parameters);
    const [data, setData] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState(undefined);
    const decryptFn = useCallback(async (params) => {
        setIsLoading(true);
        setIsError(false);
        setError(undefined);
        try {
            // Call core decrypt action
            const result = await decrypt(config, params);
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
        decrypt: decryptFn,
        data,
        isLoading,
        isError,
        error,
        reset,
    };
}
