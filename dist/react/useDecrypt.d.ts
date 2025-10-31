/**
 * useDecrypt Hook - Decrypt FHEVM Ciphertext Handles
 *
 * React hook that wraps the decrypt action
 * Provides a callback to decrypt ciphertext handles with loading/error states
 *
 * This is a thin wrapper (~15 lines) that calls the core decrypt action
 */
import { type DecryptParameters, type DecryptReturnType } from '../actions/decrypt.js';
import type { FhevmConfig } from '../createConfig.js';
export type UseDecryptParameters = {
    config?: FhevmConfig | undefined;
};
export type UseDecryptReturnType = {
    decrypt: (parameters: DecryptParameters) => Promise<DecryptReturnType>;
    data: DecryptReturnType | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | undefined;
    reset: () => void;
};
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
export declare function useDecrypt(parameters?: UseDecryptParameters): UseDecryptReturnType;
