/**
 * React Hydrate Component - SSR Hydration Support
 *
 * Handles client-side hydration of FHEVM config state
 * Following Wagmi's hydrate.ts pattern exactly
 *
 * Reference: wagmi/packages/react/src/hydrate.ts
 */

'use client'

import { hydrate } from '../hydrate.js'
import type { FhevmConfig, State } from '../createConfig.js'
import { type ReactElement, useEffect, useRef } from 'react'

export type HydrateProps = {
  config: FhevmConfig
  initialState?: State | undefined
  autoConnect?: boolean | undefined
}

/**
 * Hydrate Component
 *
 * Internal component used by FhevmProvider to handle SSR hydration
 * Users should not use this directly - use FhevmProvider instead
 *
 * @internal
 */
export function Hydrate(parameters: React.PropsWithChildren<HydrateProps>) {
  const { children, config, initialState, autoConnect = true } = parameters

  const { onMount } = hydrate(config, {
    initialState,
    autoConnect,
  })

  // Hydrate for non-SSR (client-only)
  if (!config._internal.ssr) onMount()

  // Hydrate for SSR (server-rendered)
  const active = useRef(true)
  useEffect(() => {
    if (!active.current) return
    if (!config._internal.ssr) return
    onMount()
    return () => {
      active.current = false
    }
  }, [])

  return children as ReactElement
}
