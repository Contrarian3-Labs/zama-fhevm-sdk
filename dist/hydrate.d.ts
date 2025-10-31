/**
 * hydrate - SSR Hydration Support
 *
 * Handles hydration of FHEVM config state for SSR environments
 * Following Wagmi's hydrate pattern
 *
 * Reference: wagmi/packages/core/src/hydrate.ts
 */
import type { FhevmConfig, State } from './createConfig.js';
export type HydrateParameters = {
    initialState?: State | undefined;
    autoConnect?: boolean | undefined;
};
/**
 * Hydrates FHEVM config with initial state for SSR
 *
 * @param config - FHEVM configuration object
 * @param parameters - Hydration parameters
 * @returns Object with onMount callback for component lifecycle
 *
 * @example
 * ```ts
 * const config = createFhevmConfig({ chains: [31337], ssr: true })
 * const { onMount } = hydrate(config, { initialState })
 *
 * // In React: useEffect(() => { onMount() }, [])
 * // In Vue: onMounted(() => { onMount() })
 * ```
 */
export declare function hydrate(config: FhevmConfig, parameters: HydrateParameters): {
    onMount(): Promise<void>;
};
