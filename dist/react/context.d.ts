/**
 * React Context - FHEVM Configuration Context
 *
 * Provides FHEVM config to React components via Context API
 * Following Wagmi's context.ts pattern exactly
 *
 * Reference: wagmi/packages/react/src/context.ts
 */
import type { FhevmConfig } from '../createConfig.js';
import type { State } from '../createConfig.js';
/**
 * React Context for FHEVM configuration
 */
export declare const FhevmContext: import("react").Context<FhevmConfig | undefined>;
export type FhevmProviderProps = {
    config: FhevmConfig;
    initialState?: State | undefined;
    autoConnect?: boolean | undefined;
};
/**
 * FHEVM Provider Component
 *
 * Wraps your app to provide FHEVM config to all child components
 *
 * @example
 * ```tsx
 * import { createFhevmConfig, FhevmProvider } from '@fhevm-sdk/react'
 *
 * const fhevmConfig = createFhevmConfig({
 *   chains: [31337],
 *   ssr: true,
 * })
 *
 * function App() {
 *   return (
 *     <FhevmProvider config={fhevmConfig}>
 *       <YourApp />
 *     </FhevmProvider>
 *   )
 * }
 * ```
 */
export declare function FhevmProvider(parameters: React.PropsWithChildren<FhevmProviderProps>): import("react").FunctionComponentElement<import("react").PropsWithChildren<import("./hydrate.js").HydrateProps>>;
