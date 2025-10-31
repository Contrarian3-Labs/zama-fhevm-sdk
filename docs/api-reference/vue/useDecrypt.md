---
description: Vue composable for decrypting FHEVM encrypted handles.
---

# useDecrypt()

Vue composable that provides a `decrypt` function for decrypting encrypted handles from FHEVM smart contracts. Handles EIP-712 signature management and caching automatically.

## Import Path

```typescript
import { useDecrypt } from '@fhevm-sdk/vue'
```

## Type Signature

```typescript
function useDecrypt(): UseDecryptReturnType
```

## Parameters

None. The composable uses the FHEVM config from the plugin context.

## Returns

**Type:** `UseDecryptReturnType`

An object containing:

### `decrypt`

Async function to decrypt encrypted handles.

- **Type:** `(params: DecryptParameters) => Promise<Record<string, bigint | boolean | string>>`
- **Parameters:** See [decrypt() action](../actions/decrypt.md) for details
- **Returns:** Object mapping handles to decrypted values

## Examples

### Basic Usage

```html
<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance, useDecrypt } from '@fhevm-sdk/vue'
import { BrowserProvider } from 'ethers'

const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { decrypt } = useDecrypt()

const decryptedValue = ref<number>()

const handleDecrypt = async (handle: string) => {
  if (!instance.value) return
  
  const provider = new BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  const results = await decrypt({
    instance: instance.value,
    signer,
    requests: [{
      handle,
      type: 'euint32',
      contractAddress: '0x...' as `0x${string}`,
      userAddress: '0x...' as `0x${string}`
    }]
  })
  
  decryptedValue.value = Number(results[handle])
}
</script>

<template>
  <div>
    <button @click="handleDecrypt('0xabc...')">Decrypt</button>
    <p v-if="decryptedValue">Value: {{ decryptedValue }}</p>
  </div>
</template>
```

### With Loading State

```html
<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance, useDecrypt } from '@fhevm-sdk/vue'
import { BrowserProvider } from 'ethers'

const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { decrypt } = useDecrypt()

const isDecrypting = ref(false)
const decryptedValue = ref<number>()
const error = ref<string>()

const safeDecrypt = async (handle: string) => {
  if (!instance.value) return
  
  try {
    isDecrypting.value = true
    error.value = undefined
    
    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    
    const results = await decrypt({
      instance: instance.value,
      signer,
      requests: [{
        handle,
        type: 'euint32',
        contractAddress: '0x...' as `0x${string}`,
        userAddress: await signer.getAddress() as `0x${string}`
      }]
    })
    
    decryptedValue.value = Number(results[handle])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Decryption failed'
    console.error('Decryption error:', err)
  } finally {
    isDecrypting.value = false
  }
}
</script>

<template>
  <div>
    <button @click="safeDecrypt('0xabc...')" :disabled="isDecrypting">
      {{ isDecrypting ? 'Decrypting...' : 'Decrypt Value' }}
    </button>
    
    <div v-if="isDecrypting" class="spinner">
      Decrypting...
    </div>
    
    <p v-else-if="error" class="error">{{ error }}</p>
    
    <p v-else-if="decryptedValue !== undefined">
      Decrypted Value: {{ decryptedValue }}
    </p>
  </div>
</template>
```

### Batch Decryption

```html
<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance, useDecrypt } from '@fhevm-sdk/vue'
import { BrowserProvider } from 'ethers'

const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { decrypt } = useDecrypt()

const CONTRACT_ADDRESS = '0x...' as `0x${string}`

const decryptMultiple = async (handles: string[]) => {
  if (!instance.value) return
  
  const provider = new BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const userAddress = await signer.getAddress() as `0x${string}`
  
  // Decrypt multiple handles at once
  const results = await decrypt({
    instance: instance.value,
    signer,
    requests: handles.map(handle => ({
      handle,
      type: 'euint32',
      contractAddress: CONTRACT_ADDRESS,
      userAddress
    }))
  })
  
  // Access results by handle
  handles.forEach(handle => {
    console.log(`Handle ${handle}:`, results[handle])
  })
  
  return results
}
</script>

<template>
  <button @click="decryptMultiple(['0xabc...', '0xdef...'])">
    Decrypt Batch
  </button>
</template>
```

### With Contract Integration

```html
<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance, useDecrypt } from '@fhevm-sdk/vue'
import { useContractRead } from '@wagmi/vue'
import { BrowserProvider } from 'ethers'

const CONTRACT_ADDRESS = '0x...' as `0x${string}`

const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { decrypt } = useDecrypt()

// Read encrypted handle from contract
const { data: encryptedHandle } = useContractRead({
  address: CONTRACT_ADDRESS,
  abi: [/* your ABI */],
  functionName: 'getEncryptedBalance'
})

const balance = ref<number>()

const decryptBalance = async () => {
  if (!instance.value || !encryptedHandle.value) return
  
  const provider = new BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  const results = await decrypt({
    instance: instance.value,
    signer,
    requests: [{
      handle: encryptedHandle.value,
      type: 'euint32',
      contractAddress: CONTRACT_ADDRESS,
      userAddress: await signer.getAddress() as `0x${string}`
    }]
  })
  
  balance.value = Number(results[encryptedHandle.value])
}
</script>

<template>
  <div>
    <button @click="decryptBalance">View Balance</button>
    <p v-if="balance !== undefined">Balance: {{ balance }}</p>
  </div>
</template>
```

### Different Data Types

```html
<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance, useDecrypt } from '@fhevm-sdk/vue'
import { BrowserProvider } from 'ethers'

const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { decrypt } = useDecrypt()

const decryptDifferentTypes = async () => {
  if (!instance.value) return
  
  const provider = new BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const userAddress = await signer.getAddress() as `0x${string}`
  const contractAddress = '0x...' as `0x${string}`
  
  const results = await decrypt({
    instance: instance.value,
    signer,
    requests: [
      {
        handle: '0xabc...',
        type: 'euint32',
        contractAddress,
        userAddress
      },
      {
        handle: '0xdef...',
        type: 'ebool',
        contractAddress,
        userAddress
      },
      {
        handle: '0xghi...',
        type: 'eaddress',
        contractAddress,
        userAddress
      }
    ]
  })
  
  const amount = Number(results['0xabc...']) // bigint -> number
  const isActive = results['0xdef...'] as boolean
  const address = results['0xghi...'] as string
  
  console.log({ amount, isActive, address })
}
</script>

<template>
  <button @click="decryptDifferentTypes">Decrypt All Types</button>
</template>
```

### Pre-warm Signature (Optimization)

```html
<script setup lang="ts">
import { watch } from 'vue'
import { useFhevmInstance, useDecrypt } from '@fhevm-sdk/vue'
import { useAccount } from '@wagmi/vue'
import { BrowserProvider } from 'ethers'
import { getDecryptionSignature } from '@fhevm-sdk/actions'
import { useConfig } from '@fhevm-sdk/vue'

const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337
})

const { address } = useAccount()
const config = useConfig()

// Pre-fetch signature when instance is ready
watch([instance, address], async ([inst, addr]) => {
  if (!inst || !addr) return
  
  try {
    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    
    // Pre-warm signature cache
    await getDecryptionSignature(config, {
      instance: inst,
      contractAddresses: ['0x...'] as `0x${string}`[],
      signer,
      storage: config.storage
    })
    
    console.log('Signature cached - future decryptions will be faster')
  } catch (error) {
    console.error('Failed to pre-warm signature:', error)
  }
})

const { decrypt } = useDecrypt()
</script>

<template>
  <div>
    <!-- Decryption will now be instant (no signature prompt) -->
  </div>
</template>
```

## Decryption Types

The `type` parameter must match the encrypted type:

| Type | Decrypted As | TypeScript Type |
|------|--------------|-----------------|
| `ebool` | Boolean | `boolean` |
| `euint8` | Number | `bigint` |
| `euint16` | Number | `bigint` |
| `euint32` | Number | `bigint` |
| `euint64` | BigInt | `bigint` |
| `euint128` | BigInt | `bigint` |
| `euint256` | BigInt | `bigint` |
| `eaddress` | Address | `string` |

## EIP-712 Signature

The first time you decrypt for a contract, you'll be prompted to sign an EIP-712 message:

- **Purpose:** Authorizes decryption for specific contracts
- **Validity:** 7 days by default
- **Caching:** Stored in localStorage (configurable)
- **Scope:** Per (userAddress, contractAddresses) combination

## Notes

::: info
**Signature Caching:** After the first signature, subsequent decryptions are instant for 7 days. No repeated wallet prompts!
:::

::: warning
**Type Matching:** The `type` parameter must exactly match the encrypted type. Mismatches will cause decryption to fail.
:::

::: tip
**Batch Decryption:** Decrypting multiple handles at once is more efficient and only requires one signature.
:::

## Troubleshooting

### "Signature expired"

Signatures expire after 7 days. Clear localStorage and try again:
```javascript
localStorage.removeItem('fhevm.decryption-signature')
```

### "User rejected signature"

User must approve the EIP-712 signature to decrypt. Handle rejection gracefully:
```typescript
try {
  await decrypt({ ... })
} catch (error) {
  if (error.code === 4001) {
    console.log('User rejected signature')
  }
}
```

### "Invalid handle format"

Ensure the handle is a valid hex string starting with `0x`.

## See Also

- [`useEncrypt()`](useEncrypt.md) - Encrypt values
- [`useFhevmInstance()`](useFhevmInstance.md) - Create FHEVM instance
- [`decrypt()` action](../actions/decrypt.md) - Core decryption function
- [Core Concepts: Decryption](../../core-concepts/decryption.md)

## Type Definitions

```typescript
type UseDecryptReturnType = {
  decrypt: (params: DecryptParameters) => Promise<Record<string, bigint | boolean | string>>
}

type DecryptParameters = {
  instance: FhevmInstance
  signer: Signer
  requests: Array<{
    handle: string
    type: 'ebool' | 'euint8' | 'euint16' | 'euint32' | 'euint64' | 'euint128' | 'euint256' | 'eaddress'
    contractAddress: `0x${string}`
    userAddress: `0x${string}`
  }>
  storage?: Storage | null
}
```

