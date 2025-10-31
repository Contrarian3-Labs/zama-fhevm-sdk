/**
 * @fileoverview FHEVM public decryption action following Wagmi's action pattern.
 *
 * Provides framework-agnostic decryption of publicly marked FHEVM ciphertext handles.
 * Unlike userDecrypt, NO signature is required - handles must be marked via
 * FHE.makePubliclyDecryptable() in the smart contract.
 *
 * **Architecture:**
 * ```
 * publicDecrypt(config, params)
 * ├── Validate handles (format, length)
 * └── Call instance.publicDecrypt() - NO signature needed
 * ```
 *
 * **Security Model:**
 * - NO user authentication required
 * - Handles must be marked as publicly decryptable on-chain
 * - Gateway validates handle permissions
 * - Decrypted values are PUBLIC (visible to everyone)
 *
 * **Key Differences from decrypt():**
 * - ✅ NO EIP-712 signature required
 * - ✅ NO signer parameter needed
 * - ✅ NO storage/caching needed
 * - ⚠️ Handles must be marked via FHE.makePubliclyDecryptable() in smart contract
 * - ⚠️ Decrypted values are PUBLIC (anyone can decrypt them)
 *
 * @module actions/publicDecrypt
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/actions Wagmi actions pattern}
 */

import type { FhevmConfig } from '../createConfig.js'
import type { FhevmInstance } from '../fhevmTypes.js'

/////////////////////////////////////////////////////////////////////////////////////////////////
// Types
/////////////////////////////////////////////////////////////////////////////////////////////////

export type PublicDecryptParameters = {
  instance: FhevmInstance
  handles: readonly string[]
  chainId?: number | undefined
}

export type PublicDecryptReturnType = Record<string, string | bigint | boolean>

/////////////////////////////////////////////////////////////////////////////////////////////////
// Main Action
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Decrypts publicly marked FHEVM ciphertext handles without user authorization.
 *
 * This is the core public decryption action, following Wagmi's action pattern (config, params) => Promise<Result>.
 * Handles must be marked as publicly decryptable via FHE.makePubliclyDecryptable()
 * in the smart contract BEFORE calling this function.
 *
 * **Security Flow:**
 * 1. Validate handle formats
 * 2. Call FHEVM publicDecrypt (NO signature required)
 * 3. Gateway validates handles are marked as publicly decryptable
 * 4. Return decrypted values (visible to everyone)
 *
 * **Key Differences from decrypt():**
 * - NO EIP-712 signature required (no wallet prompt)
 * - NO storage/caching needed (no signature to cache)
 * - Handles must be marked via makePubliclyDecryptable in smart contract
 * - Decrypted values are PUBLIC (anyone can decrypt them)
 *
 * **When to Use:**
 * - ✅ Public leaderboards (game scores, rankings)
 * - ✅ Public auction results (after auction closes)
 * - ✅ Aggregated statistics (total supply, vote counts)
 * - ✅ Any data that should be transparent after computation
 *
 * **When NOT to Use:**
 * - ❌ User account balances (use decrypt with signature)
 * - ❌ Individual votes in private voting
 * - ❌ Personal health records
 * - ❌ Private messages
 *
 * @template config - FHEVM configuration type
 *
 * @param config - FHEVM configuration object from createFhevmConfig()
 * @param parameters - Public decryption parameters
 * @param parameters.instance - FhevmInstance for cryptographic operations
 * @param parameters.handles - Array of handle strings to decrypt (must be marked as publicly decryptable)
 * @param parameters.chainId - Optional chain ID for validation
 *
 * @returns Promise<Record<handle, decryptedValue>> - Map of handles to decrypted values (bigint | boolean | string)
 *
 * @throws {Error} Invalid handle - Handle format validation failed
 * @throws {Error} Handle not publicly decryptable - Contract didn't call makePubliclyDecryptable
 * @throws {Error} Propagates publicDecrypt errors (network, cryptographic failures)
 *
 * @example
 * // Basic usage with single handle
 * const config = createFhevmConfig({ chains: [31337] })
 * const instance = await createInstance(config, { provider })
 *
 * // Get handle from contract (contract must have called makePubliclyDecryptable)
 * const handle = await contract.publicScore() // euint32 handle
 *
 * const decrypted = await publicDecrypt(config, {
 *   instance,
 *   handles: [handle],
 * })
 * console.log(decrypted[handle]) // 42n (bigint) - NO signature prompt!
 *
 * @example
 * // Batch public decryption (leaderboard)
 * const handles = [
 *   await contract.topScore1(),
 *   await contract.topScore2(),
 *   await contract.topScore3(),
 * ]
 *
 * const decrypted = await publicDecrypt(config, {
 *   instance,
 *   handles,
 * })
 * // NO signature prompt - data is public
 * console.log('Top scores:', Object.values(decrypted)) // [100n, 95n, 90n]
 *
 * @example
 * // Mixed types (bool, uint, address)
 * const decrypted = await publicDecrypt(config, {
 *   instance,
 *   handles: [
 *     '0xaaa...', // ebool → true
 *     '0xbbb...', // euint32 → 242n
 *     '0xccc...', // eaddress → '0xfC4382C084...'
 *   ],
 * })
 *
 * @example
 * // Smart contract setup (Solidity)
 * ```solidity
 * contract PublicLeaderboard {
 *   euint32 public topScore;
 *
 *   function setTopScore(uint32 score) external {
 *     topScore = FHE.asEuint32(score);
 *     FHE.makePubliclyDecryptable(topScore); // ← CRITICAL
 *   }
 * }
 * ```
 *
 * @example
 * // Error handling (Wagmi pattern)
 * try {
 *   const decrypted = await publicDecrypt(config, { instance, handles })
 * } catch (error) {
 *   // Config state already updated with error
 *   // Original error is thrown (no wrapping)
 *   if (error.message.includes('not publicly decryptable')) {
 *     console.error('Contract forgot to call makePubliclyDecryptable')
 *   }
 * }
 *
 * @see {@link decrypt} for user-authorized decryption with EIP-712 signature
 * @see {@link https://github.com/zama-ai/fhevm/blob/main/docs/examples/fhe-public-decrypt-single-value.md FHEVM Public Decrypt Guide}
 */
export async function publicDecrypt<config extends FhevmConfig>(
  config: config,
  parameters: PublicDecryptParameters,
): Promise<PublicDecryptReturnType> {
  const { instance, handles, chainId } = parameters

  if (!handles || handles.length === 0) {
    return {}
  }

  try {
    // Validate handle formats (same validation as decrypt)
    for (const handle of handles) {
      if (!handle || typeof handle !== 'string') {
        throw new Error(`Invalid handle: must be a non-empty string`)
      }
      if (!handle.startsWith('0x')) {
        throw new Error(`Invalid handle format: ${handle} (must start with 0x)`)
      }
      // Validate hex characters
      if (!/^0x[0-9a-fA-F]+$/.test(handle)) {
        throw new Error(`Invalid handle format: ${handle} (must be valid hex string)`)
      }
      // Length check (handles are typically 66 characters: 0x + 64 hex chars)
      if (handle.length !== 66) {
        console.warn(`Handle ${handle} has unexpected length ${handle.length}, expected 66`)
      }
    }

    // Call FHEVM publicDecrypt - NO signature required
    // Convert readonly array to mutable array for FhevmInstance compatibility
    const results = await instance.publicDecrypt([...handles])

    return results
  } catch (error) {
    /**
     * Wagmi error handling pattern:
     * 1. Update config state with error (enables reactive UI updates)
     * 2. Re-throw original error (no wrapping, preserves stack trace)
     * 3. Let caller handle presentation (toast, alert, etc.)
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
