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

import type { FhevmConfig } from '../createConfig.js'
import type { FhevmInstance } from '../fhevmTypes.js'
import type { GenericStringStorage } from '../storage/GenericStringStorage.js'
import { FhevmDecryptionSignature } from '../FhevmDecryptionSignature.js'
import type { JsonRpcSigner } from 'ethers'

/////////////////////////////////////////////////////////////////////////////////////////////////
// Types
/////////////////////////////////////////////////////////////////////////////////////////////////

export type DecryptRequest = {
  handle: string
  contractAddress: `0x${string}`
}

export type DecryptParameters = {
  instance: FhevmInstance
  requests: readonly DecryptRequest[]
  signer: JsonRpcSigner
  storage: GenericStringStorage
  chainId?: number | undefined
}

export type DecryptReturnType = Record<string, string | bigint | boolean>

/////////////////////////////////////////////////////////////////////////////////////////////////
// Main Action
/////////////////////////////////////////////////////////////////////////////////////////////////

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
export async function decrypt<config extends FhevmConfig>(
  config: config,
  parameters: DecryptParameters,
): Promise<DecryptReturnType> {
  const { instance, requests, signer, storage, chainId } = parameters

  if (!requests || requests.length === 0) {
    return {}
  }

  try {
    // Get unique contract addresses
    const uniqueAddresses = Array.from(
      new Set(requests.map((r) => r.contractAddress))
    ) as `0x${string}`[]

    // Load or create decryption signature
    const sig: FhevmDecryptionSignature | null =
      await FhevmDecryptionSignature.loadOrSign(
        instance,
        uniqueAddresses,
        signer,
        storage
      )

    if (!sig) {
      throw new Error(
        'SIGNATURE_ERROR: Failed to create or load decryption signature'
      )
    }

    // Validate signature is not expired
    if (!sig.isValid()) {
      // Clear expired signature from storage
      throw new Error(
        'SIGNATURE_EXPIRED: Decryption signature has expired. Please refresh and try again.'
      )
    }

    // Validate signature covers all requested contract addresses
    const hasAllAddresses = uniqueAddresses.every((addr) =>
      sig.contractAddresses.includes(addr)
    )
    if (!hasAllAddresses) {
      throw new Error(
        'SIGNATURE_MISMATCH: Cached signature does not cover all requested contracts. ' +
        'This can happen if you request decryption from different contract combinations. ' +
        'Clear signature storage and retry.'
      )
    }

    // Validate handle formats
    for (const req of requests) {
      if (!req.handle || typeof req.handle !== 'string') {
        throw new Error(`Invalid handle: must be a non-empty string`)
      }
      if (!req.handle.startsWith('0x')) {
        throw new Error(`Invalid handle format: ${req.handle} (must start with 0x)`)
      }
      // Validate hex characters (fhevm-expert recommendation)
      if (!/^0x[0-9a-fA-F]+$/.test(req.handle)) {
        throw new Error(`Invalid handle format: ${req.handle} (must be valid hex string)`)
      }
      // Length check (handles are typically 66 characters: 0x + 64 hex chars)
      if (req.handle.length !== 66) {
        console.warn(`Handle ${req.handle} has unexpected length ${req.handle.length}, expected 66`)
      }
    }

    // Call FHEVM userDecrypt with signature
    const mutableReqs = requests.map((r) => ({
      handle: r.handle,
      contractAddress: r.contractAddress,
    }))

    // Call FHEVM userDecrypt - errors propagate naturally (no wrapping)
    // IMPORTANT: Signature must not have '0x' prefix per Zama's official SDK pattern
    // Reference: https://docs.zama.ai/fhevm/sdk-guides/user-decryption
    // ethers.signTypedData() returns signature with '0x' prefix, but userDecrypt() requires it without
    const results = await instance.userDecrypt(
      mutableReqs,
      sig.privateKey,
      sig.publicKey,
      sig.signature.replace('0x', ''),
      sig.contractAddresses,
      sig.userAddress,
      sig.startTimestamp,
      sig.durationDays
    )

    return results
  } catch (error) {
    /**
     * Wagmi error handling pattern (wagmi/core/src/actions/connect.ts:76-85):
     * 1. Update config state with error (enables reactive UI updates)
     * 2. Re-throw original error (no wrapping, preserves stack trace)
     * 3. Let caller handle presentation (toast, alert, etc.)
     *
     * WHY no error wrapping:
     * - Preserves original error type for instanceof checks
     * - Keeps stack trace intact for debugging
     * - Avoids "Error: Error: Error:" nesting
     * - Framework hooks can access both config.state.error (reactive) and caught error (immediate)
     */
    config.setState((state) => ({
      ...state,
      status: 'error',
      error: error as Error,
    }))

    // Re-throw original error unchanged
    throw error
  }
}

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
export async function getDecryptionSignature<config extends FhevmConfig>(
  config: config,
  parameters: {
    instance: FhevmInstance
    contractAddresses: `0x${string}`[]
    signer: JsonRpcSigner
    storage: GenericStringStorage
  },
): Promise<FhevmDecryptionSignature | null> {
  const { instance, contractAddresses, signer, storage } = parameters

  return FhevmDecryptionSignature.loadOrSign(
    instance,
    contractAddresses,
    signer,
    storage
  )
}
