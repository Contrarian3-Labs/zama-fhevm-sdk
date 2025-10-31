/**
 * Vue Plugin - FHEVM SDK Vue Integration
 *
 * Provides FHEVM config to Vue 3 components via provide/inject
 * Following Wagmi's plugin.ts pattern exactly
 *
 * Reference: wagmi/packages/vue/src/plugin.ts
 */

import { hydrate, type HydrateParameters } from '../hydrate.js'
import type { FhevmConfig, State } from '../createConfig.js'
import type { Plugin } from 'vue'

/**
 * Symbol key for config injection
 * Used with Vue's provide/inject system
 */
export const fhevmConfigKey = Symbol('fhevmConfig')

export type FhevmPluginOptions = {
  config: FhevmConfig
  initialState?: State | undefined
  autoConnect?: boolean | undefined
}

/**
 * FHEVM Vue Plugin
 *
 * Install this plugin in your Vue app to provide FHEVM config to all components
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { createFhevmConfig, FhevmPlugin } from '@fhevm-sdk/vue'
 * import App from './App.vue'
 *
 * const fhevmConfig = createFhevmConfig({
 *   chains: [31337],
 *   ssr: false,
 * })
 *
 * const app = createApp(App)
 * app.use(FhevmPlugin, { config: fhevmConfig })
 * app.mount('#app')
 * ```
 */
export const FhevmPlugin = {
  install(app, options: FhevmPluginOptions) {
    const { config, autoConnect = true } = options

    // Provide config via Symbol-based injection
    app.provide(fhevmConfigKey, config)

    // Hydrate initial state and setup lifecycle
    const { onMount } = hydrate(config, { ...options, autoConnect })

    // Execute onMount immediately for Vue (no SSR support in this version)
    // Note: Vue SSR support is intentionally deferred to v1.0.
    // Current implementation works for client-side Vue apps (SPA, CSR).
    // For Vue SSR (Nuxt), users should:
    // 1. Use mock chains (works in Node.js)
    // 2. Initialize config in onMounted() hook (client-side only)
    // 3. Set ssr: false in createFhevmConfig()
    onMount()
  },
} satisfies Plugin<FhevmPluginOptions>
