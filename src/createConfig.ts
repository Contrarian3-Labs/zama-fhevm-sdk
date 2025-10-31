/**
 * @fileoverview Core configuration system for FHEVM SDK following Wagmi's createConfig pattern.
 *
 * This module provides framework-agnostic state management using Zustand vanilla store,
 * exactly mirroring Wagmi's architecture (wagmi/core/src/createConfig.ts).
 *
 * **Architecture Overview:**
 * - **Zustand Store**: Central state container (chainId, instance, status, error)
 * - **Instance Cache**: Map<chainId, FhevmInstance> for efficient reuse
 * - **Persistence**: Optional state hydration via Storage abstraction
 * - **SSR Support**: Configurable skipHydration for server-side rendering
 *
 * **State Flow:**
 * ```
 * 1. createFhevmConfig() → Initial state (idle)
 * 2. createInstance() → Update state (loading → ready/error)
 * 3. Framework hooks → Subscribe to state changes
 * ```
 *
 * **Wagmi Pattern Match:**
 * - Store creation: wagmi/core/src/createConfig.ts:205-263
 * - Instance caching: wagmi/core/src/createConfig.ts:117 (clients Map)
 * - State management: wagmi/core/src/createConfig.ts:265-295
 *
 * @module createConfig
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/createConfig.ts Wagmi createConfig}
 */

import type { Eip1193Provider } from 'ethers'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { createStore, type Mutate, type StoreApi } from 'zustand/vanilla'

import type { FhevmInstance } from './fhevmTypes.js'
import {
  createStorage,
  getDefaultStorage,
  type Storage,
} from './createStorage.js'
import type { Compute } from './types/utils.js'

/////////////////////////////////////////////////////////////////////////////////////////////////
// Create Config
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the core FHEVM configuration object with Zustand-based state management.
 *
 * This is the entry point for the FHEVM SDK, following Wagmi's createConfig pattern exactly.
 * Creates a framework-agnostic configuration that can be used with React, Vue, or vanilla JS.
 *
 * **Key Features:**
 * - **Instance Caching**: Reuses FhevmInstance across calls to avoid expensive re-initialization
 * - **State Persistence**: Optionally persists chainId to localStorage/IndexedDB
 * - **SSR Compatible**: Supports server-side rendering with skipHydration
 * - **Type-Safe**: Full TypeScript support with generic chain IDs
 *
 * **Architecture:**
 * ```
 * Config
 * ├── Zustand Store (state management)
 * │   ├── chainId: Current chain
 * │   ├── instance: FhevmInstance | null
 * │   ├── status: 'idle' | 'loading' | 'ready' | 'error'
 * │   └── error: Error | null
 * ├── Instance Cache (Map<chainId, FhevmInstance>)
 * └── Storage (optional persistence layer)
 * ```
 *
 * @template chains - Readonly tuple of chain IDs (e.g., [31337, 8009] for Hardhat + Sepolia)
 *
 * @param parameters - Configuration parameters
 * @param parameters.chains - Array of supported chain IDs (at least 1 required)
 * @param parameters.mockChains - Optional map of chainId → RPC URL for mock/local chains (e.g., { 31337: 'http://localhost:8545' })
 * @param parameters.storage - Storage backend for persistence (default: localStorage in browser, null in SSR). Set to null to disable persistence.
 * @param parameters.ssr - Enable SSR mode (skips hydration, disables persistence). Default: false
 * @param parameters.autoConnect - Automatically create instance on mount. Default: true
 *
 * @returns FhevmConfig object with state management, instance cache, and subscription methods
 *
 * @throws {Error} If chains array is empty (enforced by TypeScript)
 *
 * @example
 * // Basic usage with single chain
 * const config = createFhevmConfig({
 *   chains: [31337], // Hardhat local
 *   mockChains: { 31337: 'http://localhost:8545' }
 * })
 *
 * @example
 * // Multi-chain with persistence
 * const config = createFhevmConfig({
 *   chains: [31337, 8009], // Hardhat + Sepolia
 *   mockChains: { 31337: 'http://localhost:8545' },
 *   storage: createStorage({ storage: localStorage })
 * })
 *
 * @example
 * // SSR mode (Next.js, Nuxt)
 * const config = createFhevmConfig({
 *   chains: [8009],
 *   ssr: true, // Disables persistence, skips hydration
 *   storage: null
 * })
 *
 * @example
 * // Subscribe to state changes
 * const unsubscribe = config.subscribe(
 *   (state) => state.status,
 *   (status) => console.log('Status changed:', status)
 * )
 *
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/createConfig.ts#L37-L97 Wagmi createConfig implementation}
 * @see {@link FhevmConfig} for return type details
 * @see {@link createInstance} for instance creation after config setup
 */
export function createFhevmConfig<
  const chains extends readonly [number, ...number[]],
>(
  parameters: CreateFhevmConfigParameters<chains>,
): FhevmConfig<chains> {
  const {
    storage = createStorage({
      storage: getDefaultStorage(),
    }),
    ssr = false,
    autoConnect = true,
    ...rest
  } = parameters

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // Set up chains and instances
  /////////////////////////////////////////////////////////////////////////////////////////////////

  const chainsStore = createStore(() => rest.chains)

  /**
   * Instance cache to avoid redundant FHEVM initialization (expensive operation).
   * Mirrors Wagmi's clients Map pattern (wagmi/core/src/createConfig.ts:117).
   *
   * WHY: Creating FhevmInstance involves:
   * - Fetching public keys from the blockchain (network call)
   * - Loading WASM modules for cryptographic operations
   * - Initializing encryption context
   *
   * Caching prevents these expensive operations on every encrypt/decrypt call.
   */
  const instances = new Map<number, FhevmInstance>()

  function getInstance<chainId extends chains[number]>(
    config: { chainId?: chainId | chains[number] | undefined } = {},
  ): FhevmInstance | null {
    const chainId = config.chainId ?? store.getState().chainId
    return instances.get(chainId) ?? null
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // Create store
  /////////////////////////////////////////////////////////////////////////////////////////////////

  function getInitialState(): State<chains> {
    return {
      chainId: chainsStore.getState()[0],
      status: 'idle',
      instance: null,
      error: null,
    }
  }

  /**
   * Zustand vanilla store with subscribeWithSelector and conditional persist middleware.
   * Follows Wagmi's exact store creation pattern (wagmi/core/src/createConfig.ts:205-263).
   *
   * **Middleware Stack:**
   * 1. subscribeWithSelector: Enables granular subscriptions (e.g., only subscribe to status changes)
   * 2. persist (conditional): Only if storage is provided, persists state to localStorage/IndexedDB
   *
   * **WHY this architecture:**
   * - Wagmi uses Zustand vanilla (not React-specific) for framework-agnostic state management
   * - subscribeWithSelector is critical for performance (avoid re-renders on unrelated state changes)
   * - Conditional persist allows SSR mode (no storage) and browser mode (with storage) from same code
   *
   * **Persistence Strategy:**
   * - Only persist chainId (user's last selected network)
   * - DON'T persist instance (large WASM objects, not serializable)
   * - DON'T persist error/status (should always start fresh on page load)
   *
   * This matches Wagmi's philosophy: "Persist user preferences, not runtime state"
   */
  const store = createStore(
    subscribeWithSelector(
      // Conditional persist middleware: only if storage exists (null in SSR)
      storage
        ? persist(getInitialState, {
            name: 'fhevm.store',
            version: 1,
            partialize(state) {
              // Only persist minimal "user preference" data to keep storage size small
              return {
                chainId: state.chainId,
                // Deliberately excluded (not user preferences):
                // - instance: Runtime object, too large, not serializable
                // - error: Transient state, not useful across sessions
                // - status: Should always start as 'idle' on page load
              } satisfies PartializedState<chains>
            },
            merge(persistedState, currentState) {
              // Validate persisted chainId is still in configured chains (user may have changed config)
              const chainId = validatePersistedChainId(
                persistedState,
                currentState.chainId,
              )
              return {
                ...currentState,
                ...(persistedState as object),
                chainId,
                // Always reset runtime state on hydration (fresh start)
                instance: null,
                error: null,
                status: 'idle' as const,
              }
            },
            skipHydration: ssr, // SSR mode: don't read from storage on server
            storage: storage as Storage<Record<string, unknown>>,
          })
        : getInitialState, // No storage: just return initial state (no persistence)
    ),
  )

  function validatePersistedChainId(
    persistedState: unknown,
    defaultChainId: number,
  ): number {
    return persistedState &&
      typeof persistedState === 'object' &&
      'chainId' in persistedState &&
      typeof persistedState.chainId === 'number' &&
      chainsStore.getState().some((x) => x === persistedState.chainId)
      ? persistedState.chainId
      : defaultChainId
  }

  return {
    get chains() {
      return chainsStore.getState() as chains
    },
    get state() {
      return store.getState()
    },
    setState(value) {
      let newState: State<chains>
      if (typeof value === 'function') newState = value(store.getState())
      else newState = value

      // Reset state if it got set to something not matching the base state
      const initialState = getInitialState()
      if (typeof newState !== 'object') newState = initialState
      const isCorrupt = Object.keys(initialState).some((x) => !(x in newState))
      if (isCorrupt) newState = initialState

      store.setState(newState, true)
    },
    subscribe(selector, listener, options) {
      return store.subscribe(
        selector as unknown as (state: State<chains>) => any,
        listener,
        options,
      )
    },
    getInstance,
    storage,
    _internal: {
      store,
      instances,
      ssr: Boolean(ssr),
      chains: {
        setState(value) {
          const nextChains = (
            typeof value === 'function' ? value(chainsStore.getState()) : value
          ) as chains
          if (nextChains.length === 0) return
          return chainsStore.setState(nextChains, true)
        },
        subscribe(listener) {
          return chainsStore.subscribe(listener)
        },
      },
    },
    autoConnect,
    mockChains: rest.mockChains,
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Types
/////////////////////////////////////////////////////////////////////////////////////////////////

export type CreateFhevmConfigParameters<
  chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[],
  ],
> = Compute<{
  chains: chains
  mockChains?: Record<number, string> | undefined
  storage?: Storage | null | undefined
  ssr?: boolean | undefined
  autoConnect?: boolean | undefined
}>

export type FhevmConfig<
  chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[],
  ],
> = {
  readonly chains: chains
  readonly storage: Storage | null
  readonly mockChains: Record<number, string> | undefined
  readonly autoConnect: boolean

  readonly state: State<chains>
  setState(
    value: State<chains> | ((state: State<chains>) => State<chains>),
  ): void
  subscribe<state>(
    selector: (state: State<chains>) => state,
    listener: (state: state, previousState: state) => void,
    options?:
      | {
          emitImmediately?: boolean | undefined
          equalityFn?: ((a: state, b: state) => boolean) | undefined
        }
      | undefined,
  ): () => void

  getInstance<chainId extends chains[number]>(parameters?: {
    chainId?: chainId | chains[number] | undefined
  }): FhevmInstance | null

  /**
   * Not part of versioned API, proceed with caution.
   * @internal
   */
  _internal: Internal<chains>
}

type Internal<
  chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[],
  ],
> = {
  readonly store: Mutate<StoreApi<any>, [['zustand/persist', any]]>
  readonly instances: Map<number, FhevmInstance>
  readonly ssr: boolean
  chains: {
    setState(
      value:
        | readonly [number, ...number[]]
        | ((state: readonly [number, ...number[]]) => readonly [number, ...number[]]),
    ): void
    subscribe(
      listener: (
        state: readonly [number, ...number[]],
        prevState: readonly [number, ...number[]],
      ) => void,
    ): () => void
  }
}

export type State<
  chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[],
  ],
> = {
  chainId: chains[number]
  instance: FhevmInstance | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: Error | null
}

export type PartializedState<
  chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[],
  ],
> = Compute<{
  chainId?: chains[number] | undefined
}>
