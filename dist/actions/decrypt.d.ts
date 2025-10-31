/**
 * @fileoverview FHEVM decryption action following Wagmi's action pattern.
 *
 * Provides framework-agnostic decryption of FHEVM ciphertext handles using EIP-712 signatures.
 * Extracted from React hook (useFHEDecrypt.ts:56-123) to separate business logic from UI concerns.
 *
 * **Architecture:**
 * ```
 * decrypt(config, params)
 * ├── Validate handles (format, length)
 * ├── Load/create EIP-712 signature (cached in storage)
 * ├── Validate signature (expiry, contract coverage)
 * └── Call instance.userDecrypt() with signature
 * ```
 *
 * **Security Model:**
 * - Uses EIP-712 typed signatures for user authorization
 * - Signatures are cached in storage (default: 7 days validity)
 * - Each signature is scoped to specific contract addresses
 * - Expired signatures are automatically rejected
 *
 * **Error Handling:**
 * Follows Wagmi's connect.ts pattern (wagmi/core/src/actions/connect.ts:50-85):
 * - Update config state with error
 * - Re-throw original error (no wrapping)
 * - Let caller handle error presentation
 *
 * @module actions/decrypt
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/actions/connect.ts Wagmi connect action}
 */
import type { FhevmConfig } from '../createConfig.js';
import type { FhevmInstance } from '../fhevmTypes.js';
import type { GenericStringStorage } from '../storage/GenericStringStorage.js';
import { FhevmDecryptionSignature } from '../FhevmDecryptionSignature.js';
import type { JsonRpcSigner } from 'ethers';
export type DecryptRequest = {
    handle: string;
    contractAddress: `0x${string}`;
};
export type DecryptParameters = {
    instance: FhevmInstance;
    requests: readonly DecryptRequest[];
    signer: JsonRpcSigner;
    storage: GenericStringStorage;
    chainId?: number | undefined;
};
export type DecryptReturnType = Record<string, string | bigint | boolean>;
/**
 * Decrypts FHEVM ciphertext handles using EIP-712 signature authorization.
 *
 * This is the core decryption action, following Wagmi's action pattern (config, params) => Promise<Result>.
 * Handles signature caching, validation, and batch decryption of multiple handles.
 *
 * **Security Flow:**
 * 1. Load cached signature from storage OR prompt user to sign EIP-712 message
 * 2. Validate signature hasn't expired (default: 7 days)
 * 3. Validate signature covers all requested contract addresses
 * 4. Call FHEVM userDecrypt with signature proof
 *
 * **Signature Caching:**
 * Signatures are cached per (userAddress, contractAddresses) combination to avoid
 * repeated wallet prompts. Cache key format: `fhevm-sig-${userAddress}-${sortedAddresses}`.
 *
 * **Handle Validation:**
 * - Must be hex string starting with 0x
 * - Expected length: 66 characters (0x + 64 hex chars)
 * - Must contain only valid hex characters [0-9a-fA-F]
 *
 * @template config - FHEVM configuration type
 *
 * @param config - FHEVM configuration object from createFhevmConfig()
 * @param parameters - Decryption parameters
 * @param parameters.instance - FhevmInstance for cryptographic operations
 * @param parameters.requests - Array of {handle, contractAddress} pairs to decrypt
 * @param parameters.signer - Ethers JsonRpcSigner for EIP-712 signature
 * @param parameters.storage - Storage backend for signature caching (e.g., localStorage)
 * @param parameters.chainId - Optional chain ID for validation
 *
 * @returns Promise<Record<handle, decryptedValue>> - Map of handles to decrypted values (bigint | boolean | string)
 *
 * @throws {Error} SIGNATURE_ERROR - Failed to create or load signature
 * @throws {Error} SIGNATURE_EXPIRED - Cached signature has expired
 * @throws {Error} SIGNATURE_MISMATCH - Signature doesn't cover all requested contracts
 * @throws {Error} Invalid handle - Handle format validation failed
 * @throws {Error} Propagates userDecrypt errors (network, cryptographic failures)
 *
 * @example
 * // Basic usage with single handle
 * const config = createFhevmConfig({ chains: [31337] })
 * const instance = await createInstance(config, { provider })
 *
 * const decrypted = await decrypt(config, {
 *   instance,
 *   requests: [
 *     { handle: '0x1234...', contractAddress: '0xabcd...' }
 *   ],
 *   signer: await provider.getSigner(),
 *   storage: config.storage,
 * })
 * console.log(decrypted['0x1234...']) // 42n (bigint) or true (boolean)
 *
 * @example
 * // Batch decryption from multiple contracts
 * const decrypted = await decrypt(config, {
 *   instance,
 *   requests: [
 *     { handle: '0xaaa...', contractAddress: '0xContract1...' },
 *     { handle: '0xbbb...', contractAddress: '0xContract1...' },
 *     { handle: '0xccc...', contractAddress: '0xContract2...' },
 *   ],
 *   signer,
 *   storage: config.storage,
 * })
 * // User signs ONCE for both contracts (signature cached for 7 days)
 *
 * @example
 * // Error handling (Wagmi pattern)
 * try {
 *   const decrypted = await decrypt(config, { ... })
 * } catch (error) {
 *   // Config state already updated with error
 *   // Original error is thrown (no wrapping)
 *   if (error.message.includes('SIGNATURE_EXPIRED')) {
 *     // Clear cache and retry
 *   }
 * }
 *
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/actions/connect.ts#L50-L85 Wagmi connect error handling}
 * @see {@link FhevmDecryptionSignature} for signature lifecycle management
 * @see {@link getDecryptionSignature} for signature creation without decryption
 */
export declare function decrypt<config extends FhevmConfig>(config: config, parameters: DecryptParameters): Promise<DecryptReturnType>;
/**
 * Get or create an EIP-712 decryption signature without performing decryption.
 *
 * Useful for pre-warming signature cache or manually managing signature lifecycle.
 * Most users should use decrypt() which handles signatures automatically.
 *
 * **Use Cases:**
 * - Pre-fetch signature before user needs decryption (reduce latency)
 * - Check if signature exists in cache (avoid wallet prompt)
 * - Manually refresh expired signature
 *
 * @template config - FHEVM configuration type
 *
 * @param config - FHEVM configuration object
 * @param parameters - Signature parameters
 * @param parameters.instance - FhevmInstance for signature generation
 * @param parameters.contractAddresses - Contract addresses to authorize in signature
 * @param parameters.signer - Ethers JsonRpcSigner for EIP-712 signing
 * @param parameters.storage - Storage backend for caching
 *
 * @returns Promise<FhevmDecryptionSignature | null> - Signature object or null if signing failed
 *
 * @throws {Error} Propagates signature creation errors from EIP-712 signing
 *
 * @example
 * // Pre-warm signature cache on page load
 * useEffect(() => {
 *   getDecryptionSignature(config, {
 *     instance,
 *     contractAddresses: ['0xMyContract...'],
 *     signer,
 *     storage: config.storage,
 *   })
 * }, [])
 *
 * @example
 * // Check signature existence without triggering wallet
 * const sig = await getDecryptionSignature(config, { ... })
 * if (!sig || !sig.isValid()) {
 *   console.log('Need to request new signature')
 * }
 *
 * @see {@link FhevmDecryptionSignature.loadOrSign} for underlying implementation
 * @see {@link decrypt} for automatic signature management with decryption
 */
export declare function getDecryptionSignature<config extends FhevmConfig>(config: config, parameters: {
    instance: FhevmInstance;
    contractAddresses: `0x${string}`[];
    signer: JsonRpcSigner;
    storage: GenericStringStorage;
}): Promise<FhevmDecryptionSignature | null>;
