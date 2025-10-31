---
description: Build your first encrypted dApp with Vue 3 in under 5 minutes.
---

# Quick Start (Vue)

Build a simple encrypted counter application with Vue 3 and FHEVM SDK.

## Prerequisites

- Node.js 20+
- Vue 3 project
- MetaMask wallet

::: info
Don't have a Vue 3 project yet? Create one with Vite:
```bash
npm create vite@latest my-fhevm-app -- --template vue-ts
cd my-fhevm-app
```
:::

## Step 1: Install Dependencies

```bash
npm install @fhevm-sdk ethers@^6.13.4
```

## Step 2: Create FHEVM Configuration

Create `src/fhevm.config.ts`:

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

export const fhevmConfig = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})
```

## Step 3: Register the FHEVM Plugin

In `src/main.ts`:

```typescript
import { createApp } from 'vue'
import { createFhevmPlugin } from '@fhevm-sdk/vue'
import { fhevmConfig } from './fhevm.config'
import App from './App.vue'

const app = createApp(App)

app.use(createFhevmPlugin(fhevmConfig))

app.mount('#app')
```

## Step 4: Use in Components

Create `src/components/EncryptedCounter.vue`:

```html
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFhevmInstance, useEncrypt, useDecrypt } from '@fhevm-sdk/vue'
import { BrowserProvider } from 'ethers'

const provider = computed(() => (window as any).ethereum)
const address = ref<string>('')

// Create FHEVM instance
const { instance, status } = useFhevmInstance({
  provider,
  enabled: computed(() => !!provider.value && !!address.value)
})

// Encryption
const { encrypt } = useEncrypt()

const handleIncrement = async () => {
  if (!instance.value || !address.value) return

  // 🔐 Encryption Process:
  // Values are encrypted locally and bound to a specific contract/user pair.
  const encrypted = await encrypt({
    instance: instance.value,
    contractAddress: '0x...' as `0x${string}`,
    userAddress: address.value as `0x${string}`,
    values: [{ type: 'euint8', value: 1 }]
  })

  console.log('Encrypted:', encrypted)
  // Call your contract here
}

// Decryption
const { decrypt } = useDecrypt()
const count = ref<number | null>(null)

const handleDecrypt = async (handle: string) => {
  if (!instance.value || !address.value) return

  const ethersProvider = new BrowserProvider(provider.value)
  const signer = await ethersProvider.getSigner()

  const results = await decrypt({
    instance: instance.value,
    signer,
    requests: [{
      handle,
      type: 'euint8',
      contractAddress: '0x...' as `0x${string}`,
      userAddress: address.value as `0x${string}`
    }]
  })

  count.value = Number(results[0])
}
</script>

<template>
  <div class="counter">
    <h2>Encrypted Counter</h2>
    
    <div class="status">
      Status: {{ status }}
    </div>
    
    <div class="count">
      Count: {{ count !== null ? count : 'Not decrypted' }}
    </div>
    
    <button @click="handleIncrement" :disabled="status !== 'ready'">
      Increment (Encrypted)
    </button>
    
    <button @click="handleDecrypt('0x...')" :disabled="status !== 'ready'">
      Decrypt Count
    </button>
  </div>
</template>
```

## Next Steps

- [Architecture Overview](architecture-overview.md) - Understand the three-layer design
- [Vue API Reference](../api-reference/vue/README.md) - Explore Vue composables
- [Core Concepts](../core-concepts/README.md) - Deep dive into FHEVM fundamentals
- [Examples](../examples/README.md) - See complete working examples

**Need help?** See [Troubleshooting](../troubleshooting/common-errors.md)
