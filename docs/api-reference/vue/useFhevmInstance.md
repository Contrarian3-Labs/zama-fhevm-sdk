---
description: Vue composable for managing FHEVM instance creation and lifecycle.
---

# useFhevmInstance()

Vue composable that creates and manages an FHEVM instance for encryption and decryption operations. Returns reactive refs for instance state, status, and errors.

## Import Path

```typescript
import { useFhevmInstance } from '@fhevm-sdk/vue'
```

## Type Signature

```typescript
function useFhevmInstance(
  parameters?: UseFhevmInstanceParameters
): UseFhevmInstanceReturnType
```

## Parameters

### `parameters` (optional)

Configuration object for instance creation.

**Type:** `UseFhevmInstanceParameters`

**Properties:**

#### `provider` (optional)

EIP-1193 provider for blockchain interaction (e.g., `window.ethereum`).

- **Type:** `EIP1193Provider`
- **Default:** `undefined`
- **Example:** `window.ethereum`

#### `chainId` (optional)

Chain ID to create instance for. Must be in the config's `chains` array.

- **Type:** `number`
- **Example:** `31337` (Hardhat local)
- **Example:** `11155111` (Sepolia testnet)

#### `enabled` (optional)

Conditionally enable instance creation. Useful for waiting on wallet connection.

- **Type:** `boolean`
- **Default:** `true`
- **Example:** `computed(() => !!provider.value && !!address.value)`

## Returns

**Type:** `UseFhevmInstanceReturnType`

An object with reactive refs:

### `instance`

The FHEVM instance, or `null` if not ready.

- **Type:** `Ref<FhevmInstance | null>`
- **Usage:** `instance.value?.getPublicKey()`

### `status`

Current status of instance creation.

- **Type:** `Ref<'idle' | 'loading' | 'ready' | 'error'>`
- **Values:**
  - `'idle'`: Not started or disabled
  - `'loading'`: Creating instance
  - `'ready'`: Instance ready to use
  - `'error'`: Creation failed

### `error`

Error object if instance creation failed.

- **Type:** `Ref<Error | null>`

### `isLoading`

Convenience flag for loading state.

- **Type:** `Ref<boolean>`
- **Computed:** `status.value === 'loading'`

### `isReady`

Convenience flag for ready state.

- **Type:** `Ref<boolean>`
- **Computed:** `status.value === 'ready'`

### `isError`

Convenience flag for error state.

- **Type:** `Ref<boolean>`
- **Computed:** `status.value === 'error'`

## Examples

### Basic Usage

```html
<script setup lang="ts">
import { useFhevmInstance } from '@fhevm-sdk/vue'

const { instance, status, error } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})
</script>

<template>
  <div>
    <p>Status: {{ status }}</p>
    <p v-if="error">Error: {{ error.message }}</p>
    <p v-else-if="instance">Instance ready!</p>
  </div>
</template>
```

### Conditional Creation

```html
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFhevmInstance } from '@fhevm-sdk/vue'

const provider = ref(window.ethereum)
const address = ref<string>()
const chainId = ref(31337)

// Only create instance when wallet is connected
const { instance, status } = useFhevmInstance({
  provider: provider.value,
  chainId: chainId.value,
  enabled: computed(() => !!provider.value && !!address.value)
})
</script>

<template>
  <div>
    <button v-if="!address" @click="connectWallet">
      Connect Wallet
    </button>
    <div v-else>
      <p>Status: {{ status }}</p>
      <button v-if="instance" @click="encrypt">
        Encrypt Value
      </button>
    </div>
  </div>
</template>
```

### With Loading States

```html
<script setup lang="ts">
import { useFhevmInstance } from '@fhevm-sdk/vue'

const { instance, isLoading, isReady, isError, error } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})
</script>

<template>
  <div>
    <div v-if="isLoading" class="spinner">
      Creating FHEVM instance...
    </div>
    
    <div v-else-if="isError" class="error">
      Failed to create instance: {{ error?.message }}
    </div>
    
    <div v-else-if="isReady">
      <p>✅ FHEVM instance ready!</p>
      <button @click="doEncryption">Encrypt</button>
    </div>
  </div>
</template>
```

### Multi-Chain Support

```html
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFhevmInstance } from '@fhevm-sdk/vue'

const selectedChain = ref(31337)

const { instance, status } = useFhevmInstance({
  provider: window.ethereum,
  chainId: selectedChain.value
})

// Watch for chain changes
watch(selectedChain, (newChain) => {
  console.log('Switching to chain:', newChain)
  // Instance will automatically recreate
})
</script>

<template>
  <div>
    <select v-model="selectedChain">
      <option :value="31337">Hardhat Local</option>
      <option :value="11155111">Sepolia Testnet</option>
    </select>
    
    <p>Status: {{ status }}</p>
  </div>
</template>
```

### With Wagmi (Wallet Integration)

```html
<script setup lang="ts">
import { useAccount, usePublicClient } from '@wagmi/vue'
import { useFhevmInstance } from '@fhevm-sdk/vue'
import { computed } from 'vue'

const { address, isConnected } = useAccount()
const publicClient = usePublicClient()

const { instance, status } = useFhevmInstance({
  provider: window.ethereum,
  chainId: publicClient.value?.chain?.id,
  enabled: computed(() => isConnected.value)
})
</script>

<template>
  <div>
    <p v-if="!isConnected">Please connect wallet</p>
    <p v-else>Status: {{ status }}</p>
  </div>
</template>
```

## Behavior

### Automatic Caching

Instances are cached per chain ID. If an instance already exists for the requested chain, it's returned immediately without recreation.

### Reactivity

All returned values are reactive refs. When parameters change (provider, chainId, enabled), the composable automatically recreates the instance.

### Error Handling

Errors are captured and exposed via the `error` ref. The composable does not throw errors.

## Notes

::: info
**Instance Creation Time:** First instance creation takes 2-3 seconds (fetches public keys, loads WASM). Subsequent calls for the same chain return cached instance in <10ms.
:::

::: warning
**Provider Required:** A valid EIP-1193 provider is required. Ensure MetaMask or another wallet is installed and accessible.
:::

::: tip
**Mock Chains:** For local development, configure mock chains in your FHEVM config for 100x faster operations.
:::

## See Also

- [`useEncrypt()`](useEncrypt.md) - Encrypt values using the instance
- [`useDecrypt()`](useDecrypt.md) - Decrypt handles using the instance
- [`createFhevmPlugin()`](createFhevmPlugin.md) - Vue plugin setup
- [Core Concepts: FHEVM Instance](../../core-concepts/fhevm-instance.md)
- [Quick Start - Vue](../../getting-started/quick-start-vue.md)

## Type Definitions

```typescript
type UseFhevmInstanceParameters = {
  provider?: EIP1193Provider
  chainId?: number
  enabled?: boolean | Ref<boolean> | ComputedRef<boolean>
}

type UseFhevmInstanceReturnType = {
  instance: Ref<FhevmInstance | null>
  status: Ref<'idle' | 'loading' | 'ready' | 'error'>
  error: Ref<Error | null>
  isLoading: Ref<boolean>
  isReady: Ref<boolean>
  isError: Ref<boolean>
}
```

