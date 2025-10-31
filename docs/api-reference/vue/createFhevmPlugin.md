---
description: Vue plugin for providing FHEVM configuration to all components.
---

# createFhevmPlugin()

Creates a Vue plugin that provides FHEVM configuration to all components in your application. This enables the use of FHEVM composables like `useFhevmInstance()`, `useEncrypt()`, and `useDecrypt()` throughout your app.

## Import Path

```typescript
import { createFhevmPlugin } from '@fhevm-sdk/vue'
```

## Type Signature

```typescript
function createFhevmPlugin<
  const chains extends readonly [number, ...number[]]
>(
  config: FhevmConfig<chains>
): Plugin
```

## Parameters

### `config` (required)

FHEVM configuration created with `createFhevmConfig()`.

- **Type:** `FhevmConfig<chains>`
- **Created with:** [`createFhevmConfig()`](../core/createFhevmConfig.md)

## Returns

**Type:** `Plugin`

A Vue plugin that can be installed with `app.use()`.

## Examples

### Basic Setup

```typescript
// main.ts
import { createApp } from 'vue'
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createFhevmPlugin } from '@fhevm-sdk/vue'
import App from './App.vue'

// Create FHEVM config
const fhevmConfig = createFhevmConfig({
  chains: [31337], // Hardhat local
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

// Create Vue app
const app = createApp(App)

// Install FHEVM plugin
app.use(createFhevmPlugin(fhevmConfig))

// Mount app
app.mount('#app')
```

### Multi-Chain Configuration

```typescript
// config/fhevm.ts
import { createFhevmConfig } from '@fhevm-sdk/core'

export const fhevmConfig = createFhevmConfig({
  chains: [31337, 11155111], // Hardhat + Sepolia
  mockChains: {
    31337: 'http://localhost:8545' // Only Hardhat is mock
  }
})

// main.ts
import { createApp } from 'vue'
import { createFhevmPlugin } from '@fhevm-sdk/vue'
import { fhevmConfig } from './config/fhevm'
import App from './App.vue'

const app = createApp(App)
app.use(createFhevmPlugin(fhevmConfig))
app.mount('#app')
```

### With Custom Storage

```typescript
// main.ts
import { createApp } from 'vue'
import { createFhevmConfig, createStorage } from '@fhevm-sdk/core'
import { createFhevmPlugin } from '@fhevm-sdk/vue'
import App from './App.vue'

// Create config with custom storage
const fhevmConfig = createFhevmConfig({
  chains: [31337],
  storage: createStorage({
    storage: {
      async getItem(key) {
        // Custom get logic (e.g., IndexedDB)
        return await db.get(key)
      },
      async setItem(key, value) {
        await db.set(key, value)
      },
      async removeItem(key) {
        await db.delete(key)
      }
    }
  })
})

const app = createApp(App)
app.use(createFhevmPlugin(fhevmConfig))
app.mount('#app')
```

### SSR Configuration (Nuxt 3)

```typescript
// plugins/fhevm.client.ts
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createFhevmPlugin } from '@fhevm-sdk/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const fhevmConfig = createFhevmConfig({
    chains: [11155111], // Sepolia
    ssr: false // Client-side only
  })

  nuxtApp.vueApp.use(createFhevmPlugin(fhevmConfig))
})
```

### With Other Plugins

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { WagmiPlugin } from '@wagmi/vue'
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createFhevmPlugin } from '@fhevm-sdk/vue'
import App from './App.vue'

const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(WagmiPlugin, { config: wagmiConfig })
app.use(createFhevmPlugin(createFhevmConfig({
  chains: [31337]
})))

app.mount('#app')
```

## Using the Plugin

After installing the plugin, you can use FHEVM composables in any component:

```html
<script setup lang="ts">
import { useFhevmInstance, useEncrypt, useDecrypt } from '@fhevm-sdk/vue'

// These composables now have access to the config
const { instance, status } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { encrypt } = useEncrypt()
const { decrypt } = useDecrypt()
</script>

<template>
  <div>
    <p>FHEVM Status: {{ status }}</p>
  </div>
</template>
```

## Accessing Config Directly

You can also access the config directly using `useConfig()`:

```html
<script setup lang="ts">
import { useConfig } from '@fhevm-sdk/vue'

const config = useConfig()

// Access config properties
console.log('Supported chains:', config.chains)
console.log('Mock chains:', config.mockChains)

// Access state
const state = config.getState()
console.log('Current state:', state)

// Subscribe to changes
config.subscribe((state) => {
  console.log('State changed:', state)
})
</script>
```

## Plugin Behavior

### Singleton Pattern

The plugin provides a single FHEVM config instance to all components. This ensures:
- Consistent state across the application
- Efficient instance caching
- Shared signature cache

### Reactivity

The config state is reactive. When state changes (e.g., instance creation), all components using FHEVM composables will automatically update.

### Error Handling

Errors are captured in the config state and exposed through composables. The plugin does not throw errors during installation.

## Notes

::: info
**Single Config:** Install the plugin only once in your application. Multiple installations will create separate config instances and lead to inconsistent state.
:::

::: warning
**Client-Side Only:** FHEVM operations require browser APIs (Web Crypto, IndexedDB). For SSR frameworks like Nuxt, install the plugin as a client-side plugin.
:::

::: tip
**Type Safety:** The plugin preserves full TypeScript type safety. Chain IDs and other config properties are fully typed.
:::

## Complete Example

Here's a complete example with all features:

```typescript
// config/fhevm.ts
import { createFhevmConfig } from '@fhevm-sdk/core'

export const fhevmConfig = createFhevmConfig({
  // Supported chains
  chains: [31337, 11155111],
  
  // Mock chains for development
  mockChains: {
    31337: 'http://localhost:8545'
  },
  
  // SSR support
  ssr: typeof window === 'undefined',
  
  // Auto-connect when provider available
  autoConnect: true
})

// main.ts
import { createApp } from 'vue'
import { createFhevmPlugin } from '@fhevm-sdk/vue'
import { fhevmConfig } from './config/fhevm'
import App from './App.vue'

const app = createApp(App)
app.use(createFhevmPlugin(fhevmConfig))
app.mount('#app')

// App.vue
<script setup lang="ts">
import { useFhevmInstance, useEncrypt } from '@fhevm-sdk/vue'

const { instance, status, error } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { encrypt } = useEncrypt()

const handleEncrypt = async () => {
  if (!instance.value) return
  
  const encrypted = await encrypt({
    instance: instance.value,
    contractAddress: '0x...' as `0x${string}`,
    userAddress: '0x...' as `0x${string}`,
    values: [{ type: 'euint8', value: 42 }]
  })
  
  console.log('Encrypted:', encrypted)
}
</script>

<template>
  <div>
    <p>Status: {{ status }}</p>
    <p v-if="error">Error: {{ error.message }}</p>
    <button v-if="instance" @click="handleEncrypt">
      Encrypt Value
    </button>
  </div>
</template>
```

## See Also

- [`createFhevmConfig()`](../core/createFhevmConfig.md) - Create FHEVM configuration
- [`useFhevmInstance()`](useFhevmInstance.md) - Create FHEVM instance
- [`useEncrypt()`](useEncrypt.md) - Encrypt values
- [`useDecrypt()`](useDecrypt.md) - Decrypt handles
- [Quick Start - Vue](../../getting-started/quick-start-vue.md)

## Type Definitions

```typescript
type Plugin = {
  install(app: App): void
}

function createFhevmPlugin<
  const chains extends readonly [number, ...number[]]
>(
  config: FhevmConfig<chains>
): Plugin
```

