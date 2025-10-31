---
description: Vue composable for encrypting values with FHEVM.
---

# useEncrypt()

Vue composable that provides an `encrypt` function for encrypting values using FHEVM. Returns a reactive function that can be called to encrypt data for smart contracts.

## Import Path

```typescript
import { useEncrypt } from '@fhevm-sdk/vue'
```

## Type Signature

```typescript
function useEncrypt(): UseEncryptReturnType
```

## Parameters

None. The composable uses the FHEVM config from the plugin context.

## Returns

**Type:** `UseEncryptReturnType`

An object containing:

### `encrypt`

Async function to encrypt values.

- **Type:** `(params: EncryptParameters) => Promise<EncryptReturnType>`
- **Parameters:** See [encrypt() action](../actions/encrypt.md) for details
- **Returns:** `{ handles: string[], inputProof: string }`

## Examples

### Basic Usage

```html
<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance, useEncrypt } from '@fhevm-sdk/vue'

const { instance } = useFhevmInstance({
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
  <button @click="handleEncrypt">Encrypt Value</button>
</template>
```

### With Form Input

```html
<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance, useEncrypt } from '@fhevm-sdk/vue'

const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { encrypt } = useEncrypt()

const amount = ref(0)
const isEncrypting = ref(false)
const encryptedHandle = ref<string>()

const handleSubmit = async () => {
  if (!instance.value) return
  
  try {
    isEncrypting.value = true
    
    const encrypted = await encrypt({
      instance: instance.value,
      contractAddress: '0x...' as `0x${string}`,
      userAddress: '0x...' as `0x${string}`,
      values: [{ type: 'euint32', value: amount.value }]
    })
    
    encryptedHandle.value = encrypted.handles[0]
  } catch (error) {
    console.error('Encryption failed:', error)
  } finally {
    isEncrypting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input 
      v-model.number="amount" 
      type="number" 
      placeholder="Enter amount"
    />
    <button type="submit" :disabled="isEncrypting">
      {{ isEncrypting ? 'Encrypting...' : 'Encrypt' }}
    </button>
    <p v-if="encryptedHandle">Handle: {{ encryptedHandle }}</p>
  </form>
</template>
```

### Batch Encryption

```html
<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance, useEncrypt } from '@fhevm-sdk/vue'

const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { encrypt } = useEncrypt()

const encryptMultiple = async () => {
  if (!instance.value) return
  
  // Encrypt multiple values at once
  const encrypted = await encrypt({
    instance: instance.value,
    contractAddress: '0x...' as `0x${string}`,
    userAddress: '0x...' as `0x${string}`,
    values: [
      { type: 'euint32', value: 100 },
      { type: 'euint32', value: 200 },
      { type: 'ebool', value: true }
    ]
  })
  
  console.log('Handles:', encrypted.handles)
  // handles[0] = encrypted 100
  // handles[1] = encrypted 200
  // handles[2] = encrypted true
}
</script>

<template>
  <button @click="encryptMultiple">Encrypt Batch</button>
</template>
```

### With Error Handling

```html
<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance, useEncrypt } from '@fhevm-sdk/vue'

const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { encrypt } = useEncrypt()

const error = ref<string>()

const safeEncrypt = async (value: number) => {
  error.value = undefined
  
  try {
    if (!instance.value) {
      throw new Error('FHEVM instance not ready')
    }
    
    const encrypted = await encrypt({
      instance: instance.value,
      contractAddress: '0x...' as `0x${string}`,
      userAddress: '0x...' as `0x${string}`,
      values: [{ type: 'euint32', value }]
    })
    
    return encrypted
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Encryption failed'
    console.error('Encryption error:', err)
    return null
  }
}
</script>

<template>
  <div>
    <button @click="safeEncrypt(42)">Encrypt</button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
```

### With Contract Interaction

```html
<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance, useEncrypt } from '@fhevm-sdk/vue'
import { useContractWrite } from '@wagmi/vue'

const CONTRACT_ADDRESS = '0x...' as `0x${string}`

const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { encrypt } = useEncrypt()

const { writeAsync } = useContractWrite({
  address: CONTRACT_ADDRESS,
  abi: [/* your ABI */],
  functionName: 'increment'
})

const incrementCounter = async (amount: number) => {
  if (!instance.value) return
  
  // 1. Encrypt the amount
  const encrypted = await encrypt({
    instance: instance.value,
    contractAddress: CONTRACT_ADDRESS,
    userAddress: '0x...' as `0x${string}`,
    values: [{ type: 'euint32', value: amount }]
  })
  
  // 2. Send to contract
  const tx = await writeAsync({
    args: [encrypted.handles[0], encrypted.inputProof]
  })
  
  console.log('Transaction:', tx)
}
</script>

<template>
  <button @click="incrementCounter(5)">
    Increment by 5
  </button>
</template>
```

## Encryption Types

All FHEVM types are supported:

| Type | Range | Example |
|------|-------|---------|
| `ebool` | true/false | `{ type: 'ebool', value: true }` |
| `euint8` | 0-255 | `{ type: 'euint8', value: 42 }` |
| `euint16` | 0-65535 | `{ type: 'euint16', value: 1000 }` |
| `euint32` | 0-4B | `{ type: 'euint32', value: 1000000 }` |
| `euint64` | 0-2^64-1 | `{ type: 'euint64', value: 1000000n }` |
| `euint128` | 0-2^128-1 | `{ type: 'euint128', value: 1000000n }` |
| `euint256` | 0-2^256-1 | `{ type: 'euint256', value: 1000000n }` |
| `eaddress` | Ethereum address | `{ type: 'eaddress', value: '0x...' }` |

## Notes

::: info
**Binding:** Encrypted values are bound to a specific contract and user address. The contract can only process encrypted data sent by the authorized user.
:::

::: warning
**Instance Required:** Ensure the FHEVM instance is ready before calling `encrypt()`. Check `instance.value` is not null.
:::

::: tip
**Batch Operations:** Encrypting multiple values at once is more efficient than separate calls. Use the `values` array for batch encryption.
:::

## See Also

- [`useDecrypt()`](useDecrypt.md) - Decrypt encrypted handles
- [`useFhevmInstance()`](useFhevmInstance.md) - Create FHEVM instance
- [`encrypt()` action](../actions/encrypt.md) - Core encryption function
- [Core Concepts: Encryption](../../core-concepts/encryption.md)

## Type Definitions

```typescript
type UseEncryptReturnType = {
  encrypt: (params: EncryptParameters) => Promise<EncryptReturnType>
}

type EncryptParameters = {
  instance: FhevmInstance
  contractAddress: `0x${string}`
  userAddress: `0x${string}`
  values: Array<{
    type: 'ebool' | 'euint8' | 'euint16' | 'euint32' | 'euint64' | 'euint128' | 'euint256' | 'eaddress'
    value: boolean | number | bigint | string
  }>
}

type EncryptReturnType = {
  handles: string[]
  inputProof: string
}
```

