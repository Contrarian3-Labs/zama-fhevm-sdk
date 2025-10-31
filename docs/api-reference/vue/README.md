---
description: Vue composables and plugin for FHEVM SDK.
---

# Vue API Reference

Vue 3 composables and plugin for building encrypted dApps with FHEVM SDK.

## Overview

The Vue adapter provides a set of composables that integrate seamlessly with Vue 3's Composition API. All composables return reactive refs that automatically update when state changes.

## Plugin

### [createFhevmPlugin()](createFhevmPlugin.md)

Creates a Vue plugin to provide FHEVM configuration to all components.

```typescript
import { createFhevmPlugin } from '@fhevm-sdk/vue'

app.use(createFhevmPlugin(config))
```

## Composables

### [useFhevmInstance()](useFhevmInstance.md)

Create and manage FHEVM instance for encryption/decryption operations.

```typescript
const { instance, status, error } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})
```

### [useEncrypt()](useEncrypt.md)

Encrypt values for FHEVM smart contracts.

```typescript
const { encrypt } = useEncrypt()

const encrypted = await encrypt({
  instance: instance.value,
  contractAddress: '0x...',
  userAddress: '0x...',
  values: [{ type: 'euint8', value: 42 }]
})
```

### [useDecrypt()](useDecrypt.md)

Decrypt encrypted handles from FHEVM smart contracts.

```typescript
const { decrypt } = useDecrypt()

const results = await decrypt({
  instance: instance.value,
  signer,
  requests: [{
    handle: '0x...',
    type: 'euint8',
    contractAddress: '0x...',
    userAddress: '0x...'
  }]
})
```

## Quick Example

```html
<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance, useEncrypt, useDecrypt } from '@fhevm-sdk/vue'
import { BrowserProvider } from 'ethers'

// Create FHEVM instance
const { instance, status } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

// Get encrypt/decrypt functions
const { encrypt } = useEncrypt()
const { decrypt } = useDecrypt()

// Encrypt a value
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

// Decrypt a handle
const handleDecrypt = async (handle: string) => {
  if (!instance.value) return
  
  const provider = new BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  const results = await decrypt({
    instance: instance.value,
    signer,
    requests: [{
      handle,
      type: 'euint8',
      contractAddress: '0x...' as `0x${string}`,
      userAddress: await signer.getAddress() as `0x${string}`
    }]
  })
  
  console.log('Decrypted:', results[handle])
}
</script>

<template>
  <div>
    <p>Status: {{ status }}</p>
    <button v-if="instance" @click="handleEncrypt">Encrypt</button>
    <button v-if="instance" @click="handleDecrypt('0x...')">Decrypt</button>
  </div>
</template>
```

## Features

- **Reactive:** All returned values are reactive refs
- **Type-Safe:** Full TypeScript support with type inference
- **Composable:** Easy to combine with other Vue composables
- **SSR Compatible:** Works with Nuxt 3 (client-side only)

## React vs Vue API

The API is similar between React and Vue, with the main difference being Vue's reactive refs:

| Feature | React | Vue |
|---------|-------|-----|
| Return values | Direct values | Reactive refs |
| Instance access | `instance` | `instance.value` |
| Status access | `status` | `status.value` |
| Error access | `error` | `error.value` |

**Example:**

```typescript
// React
const { instance, status } = useFhevmInstance({ ... })
if (instance) { /* use instance */ }

// Vue
const { instance, status } = useFhevmInstance({ ... })
if (instance.value) { /* use instance.value */ }
```

## See Also

- [Quick Start - Vue](../../getting-started/quick-start-vue.md)
- [Core Concepts](../../core-concepts/README.md)
- [Examples](../../examples/README.md)
- [React API](../react/README.md) - React version
