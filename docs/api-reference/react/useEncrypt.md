---
description: React hook for encrypting values for FHEVM contracts with state management.
---

# useEncrypt()

React hook that wraps the `encrypt` action to provide encryption functionality with built-in loading, error, and data state management.

## Import

```typescript
import { useEncrypt } from '@fhevm-sdk/react'
```

## Usage

```typescript
import { useFhevmInstance, useEncrypt } from '@fhevm-sdk/react'

function Component() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { encrypt, data, isLoading, error } = useEncrypt()

  const handleEncrypt = async () => {
    if (!instance) return

    const encrypted = await encrypt({
      instance,
      contractAddress: '0xYourContract...',
      userAddress: await signer.getAddress(),
      values: [
        { type: 'euint8', value: 42 },
        { type: 'ebool', value: true },
      ],
    })

    console.log('Encrypted:', encrypted)
  }

  return (
    <button onClick={handleEncrypt} disabled={isLoading}>
      {isLoading ? 'Encrypting...' : 'Encrypt'}
    </button>
  )
}
```

## Parameters

```typescript
type UseEncryptParameters = {
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
type UseEncryptReturnType = {
  encrypt: (parameters: EncryptParameters) => Promise<EncryptReturnType>
  data: EncryptReturnType | undefined        // Last successful encryption result
  isLoading: boolean                         // True while encrypting
  isError: boolean                           // True if last encryption failed
  error: Error | undefined                   // Error from last failed encryption
  reset: () => void                          // Reset state to initial
}
```

### encrypt()

Async function to encrypt values for FHEVM contracts.

**Parameters:**
```typescript
{
  instance: FhevmInstance                      // FHEVM instance
  contractAddress: `0x${string}`               // Target contract address
  userAddress: `0x${string}`                   // User's address
  values: Array<{ type: EncryptionType; value: any }>  // Values to encrypt
}
```

**Returns:** `Promise<EncryptReturnType>`
```typescript
{
  handles: Uint8Array[]    // Encrypted handles (one per value)
  inputProof: Uint8Array   // Zero-knowledge proof
}
```

### data

- **Type:** `EncryptReturnType | undefined`

The result from the last successful encryption. Contains `handles` and `inputProof`.

### isLoading

- **Type:** `boolean`

`true` while encryption is in progress, `false` otherwise.

### isError

- **Type:** `boolean`

`true` if the last encryption attempt failed, `false` otherwise.

### error

- **Type:** `Error | undefined`

Error object from the last failed encryption attempt, or `undefined` if no error.

### reset()

- **Type:** `() => void`

Resets all state to initial values (clears data, error, loading states).

## Examples

### Basic Encryption

```typescript
function EncryptValue() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { encrypt, data, isLoading } = useEncrypt()

  const handleEncrypt = async () => {
    if (!instance) return

    try {
      const result = await encrypt({
        instance,
        contractAddress: contract.address,
        userAddress: await signer.getAddress(),
        values: [{ type: 'euint32', value: 1000 }]
      })

      console.log('Encrypted handle:', result.handles[0])
      console.log('Input proof:', result.inputProof)
    } catch (err) {
      console.error('Encryption failed:', err)
    }
  }

  return (
    <button onClick={handleEncrypt} disabled={isLoading}>
      {isLoading ? 'Encrypting...' : 'Encrypt'}
    </button>
  )
}
```

### With Loading States

```typescript
function EncryptWithLoading() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { encrypt, data, isLoading, isError, error } = useEncrypt()

  const handleEncrypt = async () => {
    if (!instance) return

    await encrypt({
      instance,
      contractAddress: '0xContract...',
      userAddress: '0xUser...',
      values: [{ type: 'euint8', value: 42 }]
    })
  }

  if (isLoading) return <div>Encrypting...</div>
  if (isError) return <div>Error: {error?.message}</div>
  if (data) return <div>Encrypted successfully!</div>

  return <button onClick={handleEncrypt}>Encrypt</button>
}
```

### Multiple Values

```typescript
function EncryptMultiple() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { encrypt, data } = useEncrypt()

  const handleEncryptBatch = async () => {
    if (!instance) return

    // 🔐 Encryption Process:
    // Encrypt multiple values in a single operation
    const result = await encrypt({
      instance,
      contractAddress: contract.address,
      userAddress: await signer.getAddress(),
      values: [
        { type: 'euint32', value: 100 },
        { type: 'euint32', value: 200 },
        { type: 'ebool', value: true },
      ]
    })

    console.log('Encrypted 3 values:', result.handles.length) // 3
  }

  return <button onClick={handleEncryptBatch}>Encrypt Batch</button>
}
```

### With Contract Call

```typescript
function EncryptAndSubmit() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { encrypt, isLoading } = useEncrypt()

  const handleSubmit = async () => {
    if (!instance) return

    // 1. Encrypt value
    const encrypted = await encrypt({
      instance,
      contractAddress: contract.address,
      userAddress: await signer.getAddress(),
      values: [{ type: 'euint8', value: 42 }]
    })

    // 2. Call contract with encrypted data
    const tx = await contract.setValue(
      encrypted.handles[0],
      encrypted.inputProof
    )

    await tx.wait()
    console.log('Transaction confirmed!')
  }

  return (
    <button onClick={handleSubmit} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Submit Encrypted Value'}
    </button>
  )
}
```

### With Reset

```typescript
function EncryptWithReset() {
  const { encrypt, data, isLoading, error, reset } = useEncrypt()
  const { instance } = useFhevmInstance({ provider: window.ethereum })

  const handleEncrypt = async () => {
    if (!instance) return

    await encrypt({
      instance,
      contractAddress: '0xContract...',
      userAddress: '0xUser...',
      values: [{ type: 'euint8', value: 42 }]
    })
  }

  const handleReset = () => {
    reset() // Clear all state
  }

  return (
    <div>
      <button onClick={handleEncrypt} disabled={isLoading}>
        Encrypt
      </button>
      <button onClick={handleReset}>Reset</button>
      {data && <div>Last result: {data.handles.length} handles</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  )
}
```

### Error Handling

```typescript
function EncryptWithErrorHandling() {
  const { encrypt, isError, error } = useEncrypt()
  const { instance } = useFhevmInstance({ provider: window.ethereum })

  const handleEncrypt = async () => {
    if (!instance) {
      console.error('FHEVM instance not ready')
      return
    }

    try {
      await encrypt({
        instance,
        contractAddress: '0xContract...',
        userAddress: '0xUser...',
        values: [{ type: 'euint8', value: 42 }]
      })
    } catch (err) {
      // Error is automatically captured in state
      if (err.message.includes('Instance not ready')) {
        console.error('Wait for instance creation')
      } else if (err.message.includes('PROVIDER_NOT_CONNECTED')) {
        console.error('Connect wallet first')
      }
    }
  }

  return (
    <div>
      <button onClick={handleEncrypt}>Encrypt</button>
      {isError && (
        <div className="error">
          Encryption failed: {error?.message}
        </div>
      )}
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
| Success | `false` | `false` | `EncryptResult` | `undefined` |
| Error | `false` | `true` | `undefined` | `Error` |

## Best Practices

### 1. Check Instance Availability

```typescript
// ✅ Good: Check instance before calling encrypt
const handleEncrypt = async () => {
  if (!instance) {
    console.error('Instance not ready')
    return
  }
  
  await encrypt({ instance, ... })
}
```

### 2. Handle Loading States

```typescript
// ✅ Good: Disable button while loading
<button onClick={handleEncrypt} disabled={isLoading || !instance}>
  {isLoading ? 'Encrypting...' : 'Encrypt'}
</button>
```

### 3. Use Try-Catch for Error Handling

```typescript
// ✅ Good: Handle errors explicitly
try {
  const result = await encrypt({ ... })
  // Success handling
} catch (err) {
  // Error is already in state, additional handling here
  console.error('Custom error handling:', err)
}
```

### 4. Reset State When Needed

```typescript
// ✅ Good: Reset state between operations
useEffect(() => {
  reset() // Clear previous state when component mounts
}, [reset])
```

## Common Errors

### "Instance not ready"

The FHEVM instance hasn't been created yet.

**Fix:** Wait for `useFhevmInstance` to return a valid instance.

### "PROVIDER_NOT_CONNECTED"

Wallet is not connected.

**Fix:** Connect wallet before attempting encryption.

### "Invalid encryption type"

Unsupported FHEVM type specified.

**Fix:** Use valid types: `ebool`, `euint8`, `euint16`, `euint32`, `euint64`, `euint128`, `euint256`, `eaddress`.

## Comparison with Direct Action Call

| Feature | useEncrypt() Hook | encrypt() Action |
|---------|------------------|------------------|
| State Management | ✅ Built-in (loading, error, data) | ❌ Manual |
| React Integration | ✅ Hooks API | ⚠️ Needs wrapper |
| Loading State | ✅ Automatic | ❌ Manual tracking |
| Error Handling | ✅ Automatic state | ⚠️ Try-catch only |
| Reset Functionality | ✅ Built-in | ❌ N/A |
| Use Case | React components | Vanilla JS, testing |

## Where to go next

🟨 Go to [**encrypt()**](../actions/encrypt.md) for the underlying action.

🟨 Go to [**useDecrypt()**](useDecrypt.md) to decrypt encrypted values.

🟨 Go to [**useFhevmInstance()**](useFhevmInstance.md) to create FHEVM instances.

🟨 Go to [**React API**](README.md) for all available React hooks.
