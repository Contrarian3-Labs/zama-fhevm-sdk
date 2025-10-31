/**
 * React Context - FHEVM Configuration Context
 *
 * Provides FHEVM config to React components via Context API
 * Following Wagmi's context.ts pattern exactly
 *
 * Reference: wagmi/packages/react/src/context.ts
 */

'use client'

import type { FhevmConfig } from '../createConfig.js'
import { createContext, createElement } from 'react'
import { Hydrate } from './hydrate.js'
import type { State } from '../createConfig.js'

/**
 * React Context for FHEVM configuration
 */
export const FhevmContext = createContext<FhevmConfig | undefined>(undefined)

export type FhevmProviderProps = {
  config: FhevmConfig
  initialState?: State | undefined
  autoConnect?: boolean | undefined
}

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
export function FhevmProvider(
  parameters: React.PropsWithChildren<FhevmProviderProps>,
) {
  const { children, config } = parameters

  const props = { value: config }
  return createElement(
    Hydrate,
    parameters,
    createElement(FhevmContext.Provider, props, children),
  )
}
