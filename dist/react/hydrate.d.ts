/**
 * React Hydrate Component - SSR Hydration Support
 *
 * Handles client-side hydration of FHEVM config state
 * Following Wagmi's hydrate.ts pattern exactly
 *
 * Reference: wagmi/packages/react/src/hydrate.ts
 */
import type { FhevmConfig, State } from '../createConfig.js';
import { type ReactElement } from 'react';
export type HydrateProps = {
    config: FhevmConfig;
    initialState?: State | undefined;
    autoConnect?: boolean | undefined;
};
/**
 * Hydrate Component
 *
 * Internal component used by FhevmProvider to handle SSR hydration
 * Users should not use this directly - use FhevmProvider instead
 *
 * @internal
 */
export declare function Hydrate(parameters: React.PropsWithChildren<HydrateProps>): ReactElement;
