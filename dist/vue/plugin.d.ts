/**
 * Vue Plugin - FHEVM SDK Vue Integration
 *
 * Provides FHEVM config to Vue 3 components via provide/inject
 * Following Wagmi's plugin.ts pattern exactly
 *
 * Reference: wagmi/packages/vue/src/plugin.ts
 */
import type { FhevmConfig, State } from '../createConfig.js';
/**
 * Symbol key for config injection
 * Used with Vue's provide/inject system
 */
export declare const fhevmConfigKey: unique symbol;
export type FhevmPluginOptions = {
    config: FhevmConfig;
    initialState?: State | undefined;
    autoConnect?: boolean | undefined;
};
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
export declare const FhevmPlugin: {
    install(app: import("vue").App<any>, options: FhevmPluginOptions): void;
};
