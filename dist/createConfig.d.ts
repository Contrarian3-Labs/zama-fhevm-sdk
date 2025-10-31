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
import { type Mutate, type StoreApi } from 'zustand/vanilla';
import type { FhevmInstance } from './fhevmTypes.js';
import { type Storage } from './createStorage.js';
import type { Compute } from './types/utils.js';
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
export declare function createFhevmConfig<const chains extends readonly [number, ...number[]]>(parameters: CreateFhevmConfigParameters<chains>): FhevmConfig<chains>;
export type CreateFhevmConfigParameters<chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[]
]> = Compute<{
    chains: chains;
    mockChains?: Record<number, string> | undefined;
    storage?: Storage | null | undefined;
    ssr?: boolean | undefined;
    autoConnect?: boolean | undefined;
}>;
export type FhevmConfig<chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[]
]> = {
    readonly chains: chains;
    readonly storage: Storage | null;
    readonly mockChains: Record<number, string> | undefined;
    readonly autoConnect: boolean;
    readonly state: State<chains>;
    setState(value: State<chains> | ((state: State<chains>) => State<chains>)): void;
    subscribe<state>(selector: (state: State<chains>) => state, listener: (state: state, previousState: state) => void, options?: {
        emitImmediately?: boolean | undefined;
        equalityFn?: ((a: state, b: state) => boolean) | undefined;
    } | undefined): () => void;
    getInstance<chainId extends chains[number]>(parameters?: {
        chainId?: chainId | chains[number] | undefined;
    }): FhevmInstance | null;
    /**
     * Not part of versioned API, proceed with caution.
     * @internal
     */
    _internal: Internal<chains>;
};
type Internal<chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[]
]> = {
    readonly store: Mutate<StoreApi<any>, [['zustand/persist', any]]>;
    readonly instances: Map<number, FhevmInstance>;
    readonly ssr: boolean;
    chains: {
        setState(value: readonly [number, ...number[]] | ((state: readonly [number, ...number[]]) => readonly [number, ...number[]])): void;
        subscribe(listener: (state: readonly [number, ...number[]], prevState: readonly [number, ...number[]]) => void): () => void;
    };
};
export type State<chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[]
]> = {
    chainId: chains[number];
    instance: FhevmInstance | null;
    status: 'idle' | 'loading' | 'ready' | 'error';
    error: Error | null;
};
export type PartializedState<chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[]
]> = Compute<{
    chainId?: chains[number] | undefined;
}>;
export {};
