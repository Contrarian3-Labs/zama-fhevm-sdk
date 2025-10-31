---
description: Decrypt FHEVM ciphertext handles using EIP-712 signature authorization.
---

# decrypt()

Decrypts FHEVM ciphertext handles to plaintext values using EIP-712 signature authorization. Handles signature caching, validation, and batch decryption following Wagmi's error handling pattern.

## Import Path

```typescript
import { decrypt } from '@fhevm-sdk/actions'
```

## Type Signature

```typescript
async function decrypt<TConfig extends FhevmConfig>(
  config: TConfig,
  parameters: DecryptParameters
): Promise<DecryptReturnType>
```

## Parameters

### `config`

FHEVM configuration object from `createFhevmConfig()`.

- **Type:** `FhevmConfig`
- **Required:** Yes

### `parameters`

Decryption parameters object.

**Type:** `DecryptParameters`

**Properties:**

#### `instance` (required)

FHEVM instance for cryptographic operations.

- **Type:** `FhevmInstance`
- **Example:** From `createInstance()`

#### `requests` (required)

Array of {handle, contractAddress} pairs to decrypt.

- **Type:** `readonly DecryptRequest[]`
- **Example:** `[{ handle: '0x1234...', contractAddress: '0xabcd...' }]`

#### `signer` (required)

Ethers JsonRpcSigner for EIP-712 signature.

- **Type:** `JsonRpcSigner`
- **Example:** `await provider.getSigner()`

#### `storage` (required)

Storage backend for signature caching.

- **Type:** `GenericStringStorage`
- **Example:** `config.storage` or `localStorage`

#### `chainId` (optional)

Chain ID for validation.

- **Type:** `number | undefined`
- **Example:** `31337`

## Returns

**Type:** `Promise<Record<string, string | bigint | boolean>>`

Map of handles to decrypted plaintext values:

- **Key:** Handle (hex string)
- **Value:** Decrypted value (bigint for euint*, boolean for ebool, string for eaddress)

## Security Model

### EIP-712 Signature Flow

1. Load cached signature from storage OR prompt user to sign EIP-712 message
2. Validate signature hasn't expired (default: 7 days)
3. Validate signature covers all requested contract addresses
4. Call FHEVM userDecrypt with signature proof

### Signature Caching

Signatures are cached per (userAddress, contractAddresses) combination to avoid repeated wallet prompts.

**Cache key format:** `fhevm-sig-${userAddress}-${sortedAddresses}`

**Validity:** 7 days (configurable in signature creation)

### Handle Validation

Handles are validated before decryption:

- Must be hex string starting with `0x`
- Expected length: 66 characters (0x + 64 hex chars)
- Must contain only valid hex characters [0-9a-fA-F]

## Examples

### Basic Usage (Single Handle)

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, decrypt } from '@fhevm-sdk/actions'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

const instance = await createInstance(config, {
  provider: window.ethereum
})

const signer = await provider.getSigner()

const decrypted = await decrypt(config, {
  instance,                           // FHEVM instance with decryption keys
  requests: [
    {
      handle: '0x1234567890abcdef...',     // Encrypted value handle from contract
      contractAddress: '0xContractAddress...'  // Contract that holds the encrypted value
    }
  ],
  signer,                             // User's wallet signer for EIP-712 signature
  storage: config.storage             // Storage for caching the signature (7 days)
})

console.log(decrypted['0x1234...']) // 42n (bigint) or true (boolean)
```

### Batch Decryption (Multiple Handles)

```typescript
const decrypted = await decrypt(config, {
  instance,
  requests: [
    { handle: '0xaaa...', contractAddress: '0xContract1...' },
    { handle: '0xbbb...', contractAddress: '0xContract1...' },
    { handle: '0xccc...', contractAddress: '0xContract2...' }
  ],
  signer,
  storage: config.storage
})

// User signs ONCE for both contracts (signature cached for 7 days)
console.log(decrypted['0xaaa...']) // 100n
console.log(decrypted['0xbbb...']) // 200n
console.log(decrypted['0xccc...']) // true
```

### Error Handling (Wagmi Pattern)

```typescript
try {
  const decrypted = await decrypt(config, {
    instance,
    requests: [{ handle: '0x...', contractAddress: '0x...' }],
    signer,
    storage: config.storage
  })
} catch (error) {
  // Config state already updated with error
  // Original error is thrown (no wrapping)
  
  if (error.message.includes('SIGNATURE_EXPIRED')) {
    // Clear cache and retry
    localStorage.removeItem('fhevm.decryption-signature')
    console.log('Signature expired, please retry')
  } else if (error.message.includes('SIGNATURE_MISMATCH')) {
    // Clear cache and retry with new signature
    console.log('Contract addresses changed, requesting new signature')
  } else if (error.message.includes('Invalid handle')) {
    console.error('Handle format validation failed')
  } else {
    console.error('Decryption failed:', error)
  }
}

// Check config state for reactive updates
const state = config.getState()
if (state.error) {
  console.error('Error in state:', state.error)
}
```

### With React Hook

```typescript
import { useFhevm } from '@fhevm-sdk/react'
import { decrypt } from '@fhevm-sdk/actions'
import { useEthersSigner } from './hooks/useEthersSigner'

function MyComponent() {
  const { instance, status } = useFhevm({
    provider: window.ethereum,
    chainId: 31337
  })
  
  const signer = useEthersSigner()
  const [decryptedValue, setDecryptedValue] = useState(null)

  const handleDecrypt = async (handle: string) => {
    if (!instance || !signer) return

    try {
      const decrypted = await decrypt(config, {
        instance,
        requests: [{ handle, contractAddress: '0xContract...' }],
        signer,
        storage: config.storage
      })

      setDecryptedValue(decrypted[handle])
    } catch (error) {
      console.error('Decryption failed:', error)
    }
  }

  return (
    <button onClick={() => handleDecrypt('0x...')} disabled={status !== 'ready'}>
      Decrypt Value
    </button>
  )
}
```

### Signature Pre-warming

Pre-fetch signature before user needs decryption to reduce latency:

```typescript
import { getDecryptionSignature } from '@fhevm-sdk/actions'

// On component mount
useEffect(() => {
  if (instance && signer) {
    getDecryptionSignature(config, {
      instance,
      contractAddresses: ['0xMyContract...'],
      signer,
      storage: config.storage
    })
  }
}, [instance, signer])
```

### Manual Signature Management

```typescript
import { getDecryptionSignature } from '@fhevm-sdk/actions'

// Check if signature exists without triggering wallet
const sig = await getDecryptionSignature(config, {
  instance,
  contractAddresses: ['0xContract...'],
  signer,
  storage: config.storage
})

if (!sig || !sig.isValid()) {
  console.log('Need to request new signature')
  // Clear expired signature
  localStorage.removeItem('fhevm.decryption-signature')
}
```

### Type-Safe Decryption

```typescript
// Type the decrypted value based on expected type
async function decryptCounter(handle: string): Promise<number> {
  const decrypted = await decrypt(config, {
    instance,
    requests: [{ handle, contractAddress: counterContract.address }],
    signer,
    storage: config.storage
  })

  const value = decrypted[handle]
  
  // euint8 decrypts to bigint, convert to number
  if (typeof value === 'bigint') {
    return Number(value)
  }
  
  throw new Error('Expected bigint, got ' + typeof value)
}

const count = await decryptCounter('0x...')
console.log(count) // 42 (number)
```

## Helper Functions

### getDecryptionSignature()

Get or create an EIP-712 decryption signature without performing decryption.

```typescript
import { getDecryptionSignature } from '@fhevm-sdk/actions'

const sig = await getDecryptionSignature(config, {
  instance,
  contractAddresses: ['0xContract1...', '0xContract2...'],
  signer,
  storage: config.storage
})

if (sig && sig.isValid()) {
  console.log('Signature valid until:', new Date(sig.startTimestamp + sig.durationDays * 86400000))
}
```

**Returns:** `Promise<FhevmDecryptionSignature | null>`

**Use cases:**
- Pre-fetch signature before user needs decryption
- Check if signature exists in cache
- Manually refresh expired signature

## Throws

### SIGNATURE_ERROR

**Error:** `SIGNATURE_ERROR: Failed to create or load decryption signature`

**Cause:** User rejected signature or signing failed

**Solution:** Prompt user to sign EIP-712 message

### SIGNATURE_EXPIRED

**Error:** `SIGNATURE_EXPIRED: Decryption signature has expired`

**Cause:** Cached signature validity period (7 days) has passed

**Solution:** Clear storage and request new signature
```typescript
localStorage.removeItem('fhevm.decryption-signature')
```

### SIGNATURE_MISMATCH

**Error:** `SIGNATURE_MISMATCH: Cached signature does not cover all requested contracts`

**Cause:** Requesting decryption from different contract than cached signature

**Solution:** Clear storage and request new signature for new contract set

### Invalid Handle

**Error:** `Invalid handle format: ${handle} (must start with 0x)`

**Cause:** Handle validation failed (not hex, wrong length, invalid characters)

**Solution:** Validate handle format before calling decrypt
```typescript
const isValid = /^0x[a-fA-F0-9]{64}$/.test(handle)
```

## Notes

::: info
**Signature Caching:** Signatures are cached for 7 days by default. This reduces wallet prompts and improves UX. Cached signatures are stored in config.storage (default: localStorage).
:::

::: warning
**Handle Format:** Handles must be exactly 66 characters (0x + 64 hex chars). If you get length warnings, check your contract's encrypted handle format.
:::

::: tip
**Batch Efficiency:** Decrypting multiple handles in one call shares the signature validation overhead. Always batch when possible.
:::

::: info
**Wagmi Pattern:** This action follows Wagmi's error handling pattern - updates config state AND re-throws original error. This enables both reactive UI updates and immediate error handling.
:::

## State Updates

`decrypt()` updates config state on error:

```typescript
// Before error
config.getState()
// { status: 'ready', error: null, ... }

// After error
config.getState()
// { status: 'error', error: Error, ... }
```

This enables reactive UI updates in React/Vue hooks.

## See Also

- [`encrypt()`](encrypt.md) - Encrypt values to handles
- [`getDecryptionSignature()`](#getdecryptionsignature) - Manage signatures manually
- [`createInstance()`](createInstance.md) - Create FHEVM instance
- [Core Concepts: Decryption](../../core-concepts/decryption.md)
- [Troubleshooting: Signature Errors](../../troubleshooting/common-errors.md#signature-expired)
- [Getting Started](../../getting-started/quick-start-react.md)

## Type Definitions

```typescript
type DecryptRequest = {
  handle: string
  contractAddress: `0x${string}`
}

type DecryptParameters = {
  instance: FhevmInstance
  requests: readonly DecryptRequest[]
  signer: JsonRpcSigner
  storage: GenericStringStorage
  chainId?: number | undefined
}

type DecryptReturnType = Record<string, string | bigint | boolean>

class FhevmDecryptionSignature {
  publicKey: string
  privateKey: string
  signature: string
  contractAddresses: `0x${string}`[]
  userAddress: string
  startTimestamp: number
  durationDays: number
  
  isValid(): boolean
  static loadOrSign(...): Promise<FhevmDecryptionSignature | null>
}
```
