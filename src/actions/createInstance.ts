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

import { isAddress, Eip1193Provider, JsonRpcProvider } from 'ethers'
import type { FhevmConfig } from '../createConfig.js'
import type { FhevmInstance } from '../fhevmTypes.js'
import { isFhevmWindowType, RelayerSDKLoader } from '../internal/RelayerSDKLoader.js'
import { publicKeyStorageGet, publicKeyStorageSet } from '../internal/PublicKeyStorage.js'
import type {
  FhevmInitSDKOptions,
  FhevmInitSDKType,
  FhevmLoadSDKType,
  FhevmWindowType,
} from '../internal/fhevmTypes.js'

/////////////////////////////////////////////////////////////////////////////////////////////////
// Types
/////////////////////////////////////////////////////////////////////////////////////////////////

export type CreateInstanceParameters = {
  provider: Eip1193Provider | string
  chainId?: number | undefined
  signal?: AbortSignal | undefined
}

export type CreateInstanceReturnType = FhevmInstance

export class FhevmAbortError extends Error {
  constructor(message = 'FHEVM operation was cancelled') {
    super(message)
    this.name = 'FhevmAbortError'
  }
}

export class FhevmError extends Error {
  code: string
  constructor(code: string, message?: string, options?: ErrorOptions) {
    super(message, options)
    this.code = code
    this.name = 'FhevmError'
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Helper Functions
/////////////////////////////////////////////////////////////////////////////////////////////////

function throwFhevmError(
  code: string,
  message?: string,
  cause?: unknown
): never {
  throw new FhevmError(code, message, cause ? { cause } : undefined)
}

function checkIsAddress(a: unknown): a is `0x${string}` {
  if (typeof a !== 'string') return false
  if (!isAddress(a)) return false
  return true
}

async function getChainId(providerOrUrl: Eip1193Provider | string): Promise<number> {
  if (typeof providerOrUrl === 'string') {
    const provider = new JsonRpcProvider(providerOrUrl)
    return Number((await provider.getNetwork()).chainId)
  }
  const chainId = await providerOrUrl.request({ method: 'eth_chainId' })
  return Number.parseInt(chainId as string, 16)
}

async function getWeb3Client(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl)
  try {
    const version = await rpc.send('web3_clientVersion', [])
    return version
  } catch (e) {
    throwFhevmError(
      'WEB3_CLIENTVERSION_ERROR',
      `The URL ${rpcUrl} is not a Web3 node or is not reachable. Please check the endpoint.`,
      e
    )
  } finally {
    rpc.destroy()
  }
}

async function tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl: string): Promise<
  | {
      ACLAddress: `0x${string}`
      InputVerifierAddress: `0x${string}`
      KMSVerifierAddress: `0x${string}`
    }
  | undefined
> {
  const version = await getWeb3Client(rpcUrl)
  if (
    typeof version !== 'string' ||
    !version.toLowerCase().includes('hardhat')
  ) {
    return undefined
  }
  try {
    const metadata = await getFHEVMRelayerMetadata(rpcUrl)
    if (!metadata || typeof metadata !== 'object') return undefined
    if (
      !(
        'ACLAddress' in metadata &&
        typeof metadata.ACLAddress === 'string' &&
        metadata.ACLAddress.startsWith('0x')
      )
    ) {
      return undefined
    }
    if (
      !(
        'InputVerifierAddress' in metadata &&
        typeof metadata.InputVerifierAddress === 'string' &&
        metadata.InputVerifierAddress.startsWith('0x')
      )
    ) {
      return undefined
    }
    if (
      !(
        'KMSVerifierAddress' in metadata &&
        typeof metadata.KMSVerifierAddress === 'string' &&
        metadata.KMSVerifierAddress.startsWith('0x')
      )
    ) {
      return undefined
    }
    return metadata
  } catch {
    return undefined
  }
}

async function getFHEVMRelayerMetadata(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl)
  try {
    const version = await rpc.send('fhevm_relayer_metadata', [])
    return version
  } catch (e) {
    throwFhevmError(
      'FHEVM_RELAYER_METADATA_ERROR',
      `The URL ${rpcUrl} is not a FHEVM Hardhat node or is not reachable. Please check the endpoint.`,
      e
    )
  } finally {
    rpc.destroy()
  }
}

type MockResolveResult = { isMock: true; chainId: number; rpcUrl: string }
type GenericResolveResult = { isMock: false; chainId: number; rpcUrl?: string }
type ResolveResult = MockResolveResult | GenericResolveResult

async function resolve(
  providerOrUrl: Eip1193Provider | string,
  mockChains?: Record<number, string>
): Promise<ResolveResult> {
  const chainId = await getChainId(providerOrUrl)
  let rpcUrl = typeof providerOrUrl === 'string' ? providerOrUrl : undefined

  const _mockChains: Record<number, string> = {
    31337: 'http://localhost:8545',
    ...(mockChains ?? {}),
  }

  if (Object.hasOwn(_mockChains, chainId)) {
    if (!rpcUrl) {
      rpcUrl = _mockChains[chainId]
    }
    return { isMock: true, chainId, rpcUrl }
  }

  return { isMock: false, chainId, rpcUrl }
}

// Environment-safe window access helpers
const isFhevmInitialized = (): boolean => {
  if (typeof window === 'undefined') return false
  if (!isFhevmWindowType(window, console.log)) return false
  return (window as unknown as FhevmWindowType).relayerSDK.__initialized__ === true
}

const fhevmLoadSDK: FhevmLoadSDKType = () => {
  const loader = new RelayerSDKLoader({ trace: console.log })
  return loader.load()
}

const fhevmInitSDK: FhevmInitSDKType = async (options?: FhevmInitSDKOptions) => {
  if (typeof window === 'undefined') {
    throw new Error('window is not available (SSR environment)')
  }
  if (!isFhevmWindowType(window, console.log)) {
    throw new Error('window.relayerSDK is not available')
  }
  const result = await (window as unknown as FhevmWindowType).relayerSDK.initSDK(options)
  ;(window as unknown as FhevmWindowType).relayerSDK.__initialized__ = result
  if (!result) {
    throw new Error('window.relayerSDK.initSDK failed.')
  }
  return true
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Main Action
/////////////////////////////////////////////////////////////////////////////////////////////////

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
export async function createInstance<config extends FhevmConfig>(
  config: config,
  parameters: CreateInstanceParameters,
): Promise<CreateInstanceReturnType> {
  const { provider: providerOrUrl, chainId: providedChainId, signal } = parameters

  const throwIfAborted = () => {
    if (signal?.aborted) throw new FhevmAbortError()
  }

  // Resolve chainId and check if mock
  const { isMock, rpcUrl, chainId } = await resolve(
    providerOrUrl,
    config.mockChains
  )

  // Validate chainId is configured
  const isConfigured =
    config.chains.includes(chainId as any) ||
    (config.mockChains && Object.hasOwn(config.mockChains, chainId))

  if (!isConfigured) {
    throw new FhevmError(
      'CHAIN_NOT_CONFIGURED',
      `Chain ${chainId} is not configured in FHEVM config. ` +
      `Configured chains: [${config.chains.join(', ')}]` +
      `${config.mockChains ? `, mock chains: [${Object.keys(config.mockChains).join(', ')}]` : ''}`
    )
  }

  // Update config state
  config.setState((state) => ({
    ...state,
    chainId,
    status: 'loading',
    error: null,
  }))

  try {
    // Check if instance already exists in cache
    const cachedInstance = config._internal.instances.get(chainId)
    if (cachedInstance) {
      config.setState((state) => ({
        ...state,
        instance: cachedInstance,
        status: 'ready',
      }))
      return cachedInstance
    }

    if (isMock) {
      // Check if it's a FHEVM Hardhat Node
      const fhevmRelayerMetadata = await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl)

      if (fhevmRelayerMetadata) {
        throwIfAborted()

        // Dynamic import to avoid including fhevm-mock in production bundle
        const fhevmMock = await import('../internal/mock/fhevmMock.js')
        const mockInstance = await fhevmMock.fhevmMockCreateInstance({
          rpcUrl,
          chainId,
          metadata: fhevmRelayerMetadata,
        })

        throwIfAborted()

        // Cache and update state
        config._internal.instances.set(chainId, mockInstance)
        config.setState((state) => ({
          ...state,
          instance: mockInstance,
          status: 'ready',
        }))

        return mockInstance
      }
    }

    throwIfAborted()

    // Browser environment check for production instance
    if (typeof window === 'undefined') {
      throw new FhevmError(
        'SSR_NOT_SUPPORTED',
        'Production FHEVM instances require browser environment (window.relayerSDK). Use mock chains for SSR.'
      )
    }

    if (!isFhevmWindowType(window, console.log)) {
      // Load SDK
      await fhevmLoadSDK()
      throwIfAborted()
    }

    if (!isFhevmInitialized()) {
      // Initialize SDK
      await fhevmInitSDK()
      throwIfAborted()
    }

    const relayerSDK = (window as unknown as FhevmWindowType).relayerSDK

    // Network configuration selection
    // Currently supports Sepolia (11155111). For additional chains:
    // 1. Ensure relayer SDK provides config (e.g., relayerSDK.MainnetConfig)
    // 2. Add mapping: chainId → network config
    // 3. Update config.chains to include new chainId
    const networkConfig = relayerSDK.SepoliaConfig

    // Validate this chainId is supported by the selected network config
    // Note: Sepolia testnet chainId is 11155111, not 8009 (which may be a custom chain)
    if (chainId !== 11155111) {
      console.warn(
        `[createInstance] Using SepoliaConfig for chainId ${chainId}. ` +
        `This may not work correctly if ${chainId} is not Sepolia testnet. ` +
        `Supported chainId: 11155111 (Sepolia)`
      )
    }

    const aclAddress = networkConfig.aclContractAddress
    if (!checkIsAddress(aclAddress)) {
      throw new FhevmError(
        'INVALID_ACL_ADDRESS',
        `Invalid ACL contract address: ${aclAddress} for chain ${chainId}`
      )
    }

    const pub = await publicKeyStorageGet(aclAddress)
    throwIfAborted()

    const instanceConfig = {
      ...networkConfig,
      network: providerOrUrl,
      publicKey: pub.publicKey,
      publicParams: pub.publicParams,
    }

    const instance = await relayerSDK.createInstance(instanceConfig)

    // Save public key even if aborted
    await publicKeyStorageSet(
      aclAddress,
      instance.getPublicKey(),
      instance.getPublicParams(2048)
    )

    throwIfAborted()

    // Cache and update state
    config._internal.instances.set(chainId, instance)
    config.setState((state) => ({
      ...state,
      instance,
      status: 'ready',
    }))

    return instance
  } catch (error) {
    // Update state with error
    config.setState((state) => ({
      ...state,
      instance: null,
      status: 'error',
      error: error as Error,
    }))
    throw error
  }
}
