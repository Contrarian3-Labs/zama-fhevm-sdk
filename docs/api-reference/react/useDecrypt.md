---
description: React hook for decrypting FHEVM ciphertext handles with state management.
---

# useDecrypt()

React hook that wraps the `decrypt` action to provide decryption functionality with built-in loading, error, and data state management. Handles EIP-712 signature management automatically.

## Import

```typescript
import { useDecrypt } from '@fhevm-sdk/react'
```

## Usage

```typescript
import { useFhevmInstance, useDecrypt, useConfig } from '@fhevm-sdk/react'
import { BrowserProvider } from 'ethers'

function Component() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { decrypt, data, isLoading, error } = useDecrypt()
  const config = useConfig()

  const handleDecrypt = async () => {
    if (!instance) return

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    const decrypted = await decrypt({
      instance,
      requests: [
        { handle: '0x...', contractAddress: '0xContract...' },
      ],
      signer,
      storage: config.storage,
    })

    console.log('Decrypted values:', decrypted)
  }

  return (
    <button onClick={handleDecrypt} disabled={isLoading}>
      {isLoading ? 'Decrypting...' : 'Decrypt'}
    </button>
  )
}
```

## Parameters

```typescript
type UseDecryptParameters = {
  config?: FhevmConfig | undefined    // Optional custom config
}
```

### config

- **Type:** `FhevmConfig | undefined`
- **Required:** No
- **Default:** Uses config from `FhevmProvider`

Optional custom FHEVM configuration. If not provided, uses the config from `FhevmProvider`.

## Return Type

```typescript
type UseDecryptReturnType = {
  decrypt: (parameters: DecryptParameters) => Promise<DecryptReturnType>
  data: DecryptReturnType | undefined        // Last successful decryption result
  isLoading: boolean                         // True while decrypting
  isError: boolean                           // True if last decryption failed
  error: Error | undefined                   // Error from last failed decryption
  reset: () => void                          // Reset state to initial
}
```

### decrypt()

Async function to decrypt FHEVM ciphertext handles.

**Parameters:**
```typescript
{
  instance: FhevmInstance                           // FHEVM instance
  requests: readonly DecryptRequest[]               // Handles to decrypt
  signer: JsonRpcSigner                             // Ethers signer for EIP-712
  storage: GenericStringStorage                     // Storage for signature caching
  chainId?: number | undefined                      // Optional chain ID
}
```

**DecryptRequest:**
```typescript
{
  handle: string                                    // Encrypted handle (0x-prefixed)
  contractAddress: `0x${string}`                    // Contract address
}
```

**Returns:** `Promise<DecryptReturnType>`
```typescript
Record<string, string | bigint | boolean>          // Map of handle → decrypted value
```

### data

- **Type:** `DecryptReturnType | undefined`

Record mapping handles to their decrypted values. Values can be `bigint` (for euint types), `boolean` (for ebool), or `string` (for eaddress).

### isLoading

- **Type:** `boolean`

`true` while decryption is in progress, `false` otherwise.

### isError

- **Type:** `boolean`

`true` if the last decryption attempt failed, `false` otherwise.

### error

- **Type:** `Error | undefined`

Error object from the last failed decryption attempt, or `undefined` if no error.

### reset()

- **Type:** `() => void`

Resets all state to initial values (clears data, error, loading states).

## Examples

### Basic Decryption

```typescript
function DecryptValue() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { decrypt, data, isLoading } = useDecrypt()
  const config = useConfig()

  const handleDecrypt = async () => {
    if (!instance) return

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    const result = await decrypt({
      instance,
      requests: [
        { handle: '0x1234...', contractAddress: contract.address }
      ],
      signer,
      storage: config.storage,
    })

    console.log('Decrypted value:', result['0x1234...'])
  }

  return (
    <button onClick={handleDecrypt} disabled={isLoading}>
      {isLoading ? 'Decrypting...' : 'Decrypt'}
    </button>
  )
}
```

### With Loading States

```typescript
function DecryptWithLoading() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { decrypt, data, isLoading, isError, error } = useDecrypt()
  const config = useConfig()

  const handleDecrypt = async () => {
    if (!instance) return

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    await decrypt({
      instance,
      requests: [{ handle: '0x...', contractAddress: '0x...' }],
      signer,
      storage: config.storage,
    })
  }

  if (isLoading) return <div>Decrypting...</div>
  if (isError) return <div>Error: {error?.message}</div>
  if (data) return <div>Decrypted: {JSON.stringify(data, null, 2)}</div>

  return <button onClick={handleDecrypt}>Decrypt</button>
}
```

### Batch Decryption

```typescript
function DecryptBatch() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { decrypt, data } = useDecrypt()
  const config = useConfig()

  const handleDecryptBatch = async () => {
    if (!instance) return

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    const result = await decrypt({
      instance,
      requests: [
        { handle: '0xaaa...', contractAddress: contract.address },
        { handle: '0xbbb...', contractAddress: contract.address },
        { handle: '0xccc...', contractAddress: contract.address },
      ],
      signer,
      storage: config.storage,
    })

    console.log('Decrypted 3 values:', Object.values(result))
  }

  return <button onClick={handleDecryptBatch}>Decrypt Batch</button>
}
```

### Display Decrypted Value

```typescript
function DisplayDecrypted() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { decrypt, data, isLoading } = useDecrypt()
  const config = useConfig()
  const [handle, setHandle] = useState<string>('')

  const handleDecrypt = async () => {
    if (!instance || !handle) return

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    await decrypt({
      instance,
      requests: [{ handle, contractAddress: contract.address }],
      signer,
      storage: config.storage,
    })
  }

  return (
    <div>
      <input
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder="Enter encrypted handle"
      />
      <button onClick={handleDecrypt} disabled={isLoading}>
        Decrypt
      </button>
      {data && (
        <div>
          Decrypted value: {String(data[handle])}
        </div>
      )}
    </div>
  )
}
```

### EIP-712 Signature Handling

```typescript
function DecryptWithSignature() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { decrypt, isLoading } = useDecrypt()
  const config = useConfig()

  const handleDecrypt = async () => {
    if (!instance) return

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    // First decryption: User signs EIP-712 message
    const result1 = await decrypt({
      instance,
      requests: [{ handle: '0xaaa...', contractAddress: contract.address }],
      signer,
      storage: config.storage, // Signature cached here
    })

    // Second decryption: Uses cached signature (no wallet prompt)
    const result2 = await decrypt({
      instance,
      requests: [{ handle: '0xbbb...', contractAddress: contract.address }],
      signer,
      storage: config.storage, // Signature retrieved from cache
    })

    console.log('Both decrypted without second signature prompt')
  }

  return <button onClick={handleDecrypt}>Decrypt (with caching)</button>
}
```

### Error Handling

```typescript
function DecryptWithErrorHandling() {
  const { decrypt, isError, error } = useDecrypt()
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const config = useConfig()

  const handleDecrypt = async () => {
    if (!instance) {
      console.error('FHEVM instance not ready')
      return
    }

    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      await decrypt({
        instance,
        requests: [{ handle: '0x...', contractAddress: '0x...' }],
        signer,
        storage: config.storage,
      })
    } catch (err) {
      // Error is automatically captured in state
      if (err.message.includes('SIGNATURE_EXPIRED')) {
        console.error('Signature expired, retry to sign again')
      } else if (err.message.includes('User rejected')) {
        console.error('User declined signature')
      } else if (err.message.includes('Invalid handle')) {
        console.error('Handle format is invalid')
      }
    }
  }

  return (
    <div>
      <button onClick={handleDecrypt}>Decrypt</button>
      {isError && (
        <div className="error">
          Decryption failed: {error?.message}
        </div>
      )}
    </div>
  )
}
```

### With Reset

```typescript
function DecryptWithReset() {
  const { decrypt, data, isLoading, error, reset } = useDecrypt()
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const config = useConfig()

  const handleDecrypt = async () => {
    if (!instance) return

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    await decrypt({
      instance,
      requests: [{ handle: '0x...', contractAddress: '0x...' }],
      signer,
      storage: config.storage,
    })
  }

  const handleReset = () => {
    reset() // Clear all state
  }

  return (
    <div>
      <button onClick={handleDecrypt} disabled={isLoading}>
        Decrypt
      </button>
      <button onClick={handleReset}>Reset</button>
      {data && <div>Last result: {JSON.stringify(data)}</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  )
}
```

## State Management

The hook manages three distinct states:

| State | `isLoading` | `isError` | `data` | `error` |
|-------|-------------|-----------|--------|---------|
| Initial | `false` | `false` | `undefined` | `undefined` |
| Loading | `true` | `false` | previous value | `undefined` |
| Success | `false` | `false` | `DecryptResult` | `undefined` |
| Error | `false` | `true` | `undefined` | `Error` |

## EIP-712 Signature Caching

The hook automatically uses signature caching:

1. **First decryption**: User signs EIP-712 message in wallet
2. **Signature cached**: Stored in `config.storage` (default: localStorage)
3. **Subsequent decryptions**: Signature retrieved from cache (no wallet prompt)
4. **Expiration**: Signatures expire after 7 days

**Cache key format:** `fhevm-sig-${userAddress}-${sortedContractAddresses}`

## Best Practices

### 1. Check Instance and Signer

```typescript
// ✅ Good: Check all requirements before decrypting
const handleDecrypt = async () => {
  if (!instance) {
    console.error('Instance not ready')
    return
  }

  try {
    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    await decrypt({ instance, signer, ... })
  } catch (err) {
    console.error('Failed to get signer:', err)
  }
}
```

### 2. Handle Loading States

```typescript
// ✅ Good: Disable button and show loading indicator
<button onClick={handleDecrypt} disabled={isLoading || !instance}>
  {isLoading ? 'Decrypting...' : 'Decrypt'}
</button>
```

### 3. Use Batch Decryption

```typescript
// ✅ Good: Decrypt multiple handles in one call
await decrypt({
  requests: [
    { handle: handle1, contractAddress },
    { handle: handle2, contractAddress },
    { handle: handle3, contractAddress },
  ],
  ...
})

// ❌ Bad: Multiple separate calls
await decrypt({ requests: [{ handle: handle1, ... }], ... })
await decrypt({ requests: [{ handle: handle2, ... }], ... })
await decrypt({ requests: [{ handle: handle3, ... }], ... })
```

### 4. Handle Signature Expiration

```typescript
// ✅ Good: Handle expired signatures
try {
  await decrypt({ ... })
} catch (err) {
  if (err.message.includes('SIGNATURE_EXPIRED')) {
    // Clear cache and retry
    localStorage.removeItem('fhevm.decryption-signature')
    await decrypt({ ... }) // User will sign again
  }
}
```

## Common Errors

### "SIGNATURE_EXPIRED"

The cached EIP-712 signature has expired (7 days validity).

**Fix:** Clear localStorage and retry:
```javascript
localStorage.clear()
```

### "User rejected signature"

User declined to sign the EIP-712 message in their wallet.

**Fix:** Explain to user why signature is needed for decryption.

### "Invalid handle"

Handle format validation failed (not hex, wrong length, etc.).

**Fix:** Ensure handle is 0x-prefixed hex string, typically 66 characters.

### "SIGNATURE_MISMATCH"

Cached signature doesn't cover the requested contract addresses.

**Fix:** Clear signature cache and retry to create new signature.

## Comparison with Direct Action Call

| Feature | useDecrypt() Hook | decrypt() Action |
|---------|------------------|------------------|
| State Management | ✅ Built-in (loading, error, data) | ❌ Manual |
| React Integration | ✅ Hooks API | ⚠️ Needs wrapper |
| Loading State | ✅ Automatic | ❌ Manual tracking |
| Error Handling | ✅ Automatic state | ⚠️ Try-catch only |
| Reset Functionality | ✅ Built-in | ❌ N/A |
| Signature Caching | ✅ Automatic (via action) | ✅ Automatic |
| Use Case | React components | Vanilla JS, testing |

## Where to go next

🟨 Go to [**decrypt()**](../actions/decrypt.md) for the underlying action.

🟨 Go to [**useEncrypt()**](useEncrypt.md) to encrypt values.

🟨 Go to [**getDecryptionSignature()**](../actions/getDecryptionSignature.md) for manual signature management.

🟨 Go to [**React API**](README.md) for all available React hooks.
