/**
 * @fileoverview FHEVM instance creation action following Wagmi's action pattern.
 *
 * Provides framework-agnostic creation of FhevmInstance for encryption/decryption operations.
 * Handles both mock (local Hardhat) and production (testnet/mainnet) instances seamlessly.
 *
 * **Architecture:**
 * ```
 * createInstance(config, params)
 * ├── Resolve chainId and network type (mock vs production)
 * ├── Check instance cache (Map<chainId, FhevmInstance>)
 * ├── If Mock Chain:
 * │   ├── Detect FHEVM Hardhat node (fhevm_relayer_metadata RPC)
 * │   └── Create mock instance (dynamic import for tree-shaking)
 * └── If Production Chain:
 *     ├── Load relayer SDK (browser only, SSR throws error)
 *     ├── Fetch/cache public keys from ACL contract
 *     └── Create production instance
 * ```
 *
 * **Mock vs Production:**
 * - **Mock**: Local Hardhat node with FHEVM plugin (chainId 31337 by default)
 *   - Uses fhevmMock library (lighter weight)
 *   - No browser requirement (works in Node.js)
 *   - Suitable for testing and SSR
 * - **Production**: Real FHEVM networks (Sepolia testnet, mainnet)
 *   - Uses relayer SDK (requires window.relayerSDK)
 *   - Browser only (throws error in SSR)
 *   - Fetches public keys from blockchain
 *
 * **Network Configuration:**
 * Supports Sepolia testnet (11155111) by default.
 * For additional chains, ensure relayer SDK provides appropriate config.
 *
 * **Security Considerations:**
 * - Public keys cached in storage to avoid repeated blockchain calls
 * - Signature validation in decrypt ensures user authorization
 * - Instance creation requires ACL contract verification
 *
 * @module actions/createInstance
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/actions Wagmi actions pattern}
 */
import { Eip1193Provider } from 'ethers';
import type { FhevmConfig } from '../createConfig.js';
import type { FhevmInstance } from '../fhevmTypes.js';
export type CreateInstanceParameters = {
    provider: Eip1193Provider | string;
    chainId?: number | undefined;
    signal?: AbortSignal | undefined;
};
export type CreateInstanceReturnType = FhevmInstance;
export declare class FhevmAbortError extends Error {
    constructor(message?: string);
}
export declare class FhevmError extends Error {
    code: string;
    constructor(code: string, message?: string, options?: ErrorOptions);
}
/**
 * Creates FHEVM instance for homomorphic encryption operations.
 *
 * This is the core instance creation action, following Wagmi's action pattern (config, params) => Promise<Result>.
 * Handles instance caching, mock vs production detection, and SDK initialization.
 *
 * **Instance Lifecycle:**
 * 1. Resolve chainId from provider
 * 2. Check cache (config._internal.instances Map)
 * 3. Detect network type (mock or production)
 * 4. Create appropriate instance (mock or production)
 * 5. Cache instance for reuse
 * 6. Update config state (status: 'ready', instance)
 *
 * **Mock Chain Detection:**
 * - Checks config.mockChains (explicit mock chain config)
 * - Default: chainId 31337 treated as mock (Hardhat default)
 * - Verifies Hardhat node with `web3_clientVersion` RPC call
 * - Fetches FHEVM metadata with `fhevm_relayer_metadata` RPC call
 *
 * **Production Chain Requirements:**
 * - Browser environment (window.relayerSDK required)
 * - Throws SSR_NOT_SUPPORTED error if window is undefined
 * - Loads and initializes relayer SDK automatically
 * - Fetches public keys from ACL contract on blockchain
 *
 * **Caching Strategy:**
 * Instance creation is expensive (network calls, WASM loading, crypto initialization).
 * Instances cached by chainId in config._internal.instances Map.
 * Subsequent calls return cached instance immediately.
 *
 * **Abort Signal Support:**
 * Long-running operations (network calls, SDK loading) can be cancelled via AbortSignal.
 * Throws FhevmAbortError if signal.aborted becomes true during creation.
 *
 * @template config - FHEVM configuration type
 *
 * @param config - FHEVM configuration object from createFhevmConfig()
 * @param parameters - Instance creation parameters
 * @param parameters.provider - EIP-1193 provider (window.ethereum) OR RPC URL string
 * @param parameters.chainId - Optional chainId override (auto-detected from provider if not provided)
 * @param parameters.signal - Optional AbortSignal for cancellation
 *
 * @returns Promise<FhevmInstance> - Instance with createEncryptedInput, userDecrypt, etc.
 *
 * @throws {FhevmError} CHAIN_NOT_CONFIGURED - chainId not in config.chains or config.mockChains
 * @throws {FhevmError} SSR_NOT_SUPPORTED - Production instance requested in SSR (no window)
 * @throws {FhevmError} INVALID_ACL_ADDRESS - ACL contract address invalid for network
 * @throws {FhevmAbortError} - Operation cancelled via signal.abort()
 * @throws {Error} - Propagates SDK initialization and network errors
 *
 * @example
 * // Basic usage with MetaMask
 * const config = createFhevmConfig({ chains: [31337] })
 * const instance = await createInstance(config, {
 *   provider: window.ethereum
 * })
 * // chainId auto-detected from window.ethereum
 *
 * @example
 * // Mock chain with RPC URL (Hardhat local)
 * const config = createFhevmConfig({
 *   chains: [31337],
 *   mockChains: { 31337: 'http://localhost:8545' }
 * })
 * const instance = await createInstance(config, {
 *   provider: 'http://localhost:8545'
 * })
 * // Creates mock instance (works in Node.js/SSR)
 *
 * @example
 * // Production chain (Sepolia testnet)
 * const config = createFhevmConfig({ chains: [11155111] })
 * const instance = await createInstance(config, {
 *   provider: window.ethereum,
 *   chainId: 11155111
 * })
 * // Loads relayer SDK, fetches public keys from blockchain
 *
 * @example
 * // With abort signal (cancel after 10 seconds)
 * const controller = new AbortController()
 * setTimeout(() => controller.abort(), 10000)
 *
 * try {
 *   const instance = await createInstance(config, {
 *     provider: window.ethereum,
 *     signal: controller.signal
 *   })
 * } catch (error) {
 *   if (error instanceof FhevmAbortError) {
 *     console.log('Instance creation cancelled')
 *   }
 * }
 *
 * @example
 * // Instance caching (second call is instant)
 * const instance1 = await createInstance(config, { provider })
 * const instance2 = await createInstance(config, { provider })
 * console.log(instance1 === instance2) // true (same cached instance)
 *
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/actions/connect.ts Wagmi connect action (similar pattern)}
 * @see {@link FhevmInstance} for available instance methods
 * @see {@link encrypt} and {@link decrypt} for using the instance
 */
export declare function createInstance<config extends FhevmConfig>(config: config, parameters: CreateInstanceParameters): Promise<CreateInstanceReturnType>;
