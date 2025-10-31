---
description: Get or create an EIP-712 decryption signature without performing decryption.
---

# getDecryptionSignature()

Gets an existing cached signature or creates a new EIP-712 decryption signature without performing actual decryption. Useful for pre-warming signature cache or manually managing signature lifecycle.

**Most users should use [`decrypt()`](decrypt.md)** which handles signatures automatically.

## Import

```typescript
import { getDecryptionSignature } from '@fhevm-sdk/actions'
```

## Usage

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, getDecryptionSignature } from '@fhevm-sdk/actions'
import { BrowserProvider } from 'ethers'

const config = createFhevmConfig({ chains: [31337] })
const instance = await createInstance(config, { provider })

const ethersProvider = new BrowserProvider(window.ethereum)
const signer = await ethersProvider.getSigner()

const signature = await getDecryptionSignature(config, {
  instance,
  contractAddresses: ['0xMyContract...'],
  signer,
  storage: config.storage,
})

console.log(signature.isValid()) // true
```

## Parameters

```typescript
type GetDecryptionSignatureParameters = {
  instance: FhevmInstance                    // FHEVM instance for signature generation
  contractAddresses: readonly `0x${string}`[] // Contract addresses to authorize
  signer: JsonRpcSigner                      // Ethers JsonRpcSigner for EIP-712 signing
  storage: GenericStringStorage              // Storage backend for caching
}
```

### instance

- **Type:** `FhevmInstance`
- **Required:** Yes

The FHEVM instance returned from `createInstance()`.

### contractAddresses

- **Type:** `readonly `0x${string}`[]`
- **Required:** Yes

Array of contract addresses that the signature will authorize for decryption. All addresses must start with `0x`.

### signer

- **Type:** `JsonRpcSigner` (from ethers.js)
- **Required:** Yes

Ethers signer for creating EIP-712 typed data signature.

### storage

- **Type:** `GenericStringStorage`
- **Required:** Yes

Storage backend for caching the signature (typically `config.storage`).

## Return Type

```typescript
type FhevmDecryptionSignature = {
  publicKey: string                         // Ephemeral public key for decryption
  privateKey: string                        // Ephemeral private key for decryption
  signature: string                         // EIP-712 signature (with 0x prefix)
  contractAddresses: `0x${string}`[]        // Authorized contract addresses
  userAddress: `0x${string}`                // User's Ethereum address
  startTimestamp: number                    // Signature start time (Unix timestamp)
  durationDays: number                      // Signature validity duration (default: 7 days)

  isValid(): boolean                        // Check if signature is still valid
}
```

Returns `FhevmDecryptionSignature` object or `null` if signature creation failed.

## Use Cases

### 1. Pre-warm Signature Cache

Request signature on page load to reduce latency when user needs decryption:

```typescript
useEffect(() => {
  // Pre-fetch signature when component mounts
  getDecryptionSignature(config, {
    instance,
    contractAddresses: ['0xMyContract...'],
    signer,
    storage: config.storage,
  })
}, [])

// Later decryption will use cached signature (no wallet prompt)
```

### 2. Check Signature Existence

Check if a valid signature exists without triggering wallet prompt:

```typescript
const signature = await getDecryptionSignature(config, {
  instance,
  contractAddresses: ['0xContract...'],
  signer,
  storage: config.storage,
})

if (!signature || !signature.isValid()) {
  console.log('Need to request new signature')
  // Show UI to prompt user
} else {
  console.log('Valid signature cached until:',
    new Date(signature.startTimestamp + signature.durationDays * 86400000))
}
```

### 3. Manually Refresh Expired Signature

Force signature refresh by clearing cache first:

```typescript
// Clear expired signature
await config.storage.removeItem('fhevm-sig-...')

// Request new signature
const signature = await getDecryptionSignature(config, {
  instance,
  contractAddresses: ['0xContract...'],
  signer,
  storage: config.storage,
})
```

### 4. Multi-Contract Authorization

Create signature that covers multiple contracts:

```typescript
const signature = await getDecryptionSignature(config, {
  instance,
  contractAddresses: [
    '0xContractA...',
    '0xContractB...',
    '0xContractC...',
  ],
  signer,
  storage: config.storage,
})

// This signature can be used to decrypt from all three contracts
```

## Signature Caching

Signatures are cached per `(userAddress, contractAddresses)` combination:

**Cache key format:** `fhevm-sig-${userAddress}-${sortedContractAddresses}`

**Validity:** 7 days by default

**Storage location:** Configured storage backend (default: localStorage)

## Signature Validation

Check if a signature is still valid:

```typescript
const signature = await getDecryptionSignature(config, { ... })

if (signature) {
  if (signature.isValid()) {
    console.log('Signature is valid')
    console.log('Expires:', new Date(signature.startTimestamp + signature.durationDays * 86400000))
  } else {
    console.log('Signature has expired')
  }
}
```

## Error Handling

```typescript
try {
  const signature = await getDecryptionSignature(config, {
    instance,
    contractAddresses: ['0xContract...'],
    signer,
    storage: config.storage,
  })

  if (!signature) {
    console.error('Failed to create signature (user rejected?)')
  }
} catch (error) {
  if (error.code === 4001) {
    console.error('User rejected signature in wallet')
  } else {
    console.error('Signature creation failed:', error)
  }
}
```

## Common Errors

### User Rejected Signature

The user declined to sign the EIP-712 message in their wallet.

**Error code:** `4001`

**Fix:** Explain to user why signature is needed for decryption.

### Signature Expired

The cached signature has passed its 7-day validity period.

**Fix:** Clear the expired signature from storage and request a new one:
```typescript
localStorage.removeItem('fhevm.decryption-signature')
```

### Storage Error

Failed to save signature to storage backend.

**Fix:** Check storage implementation and permissions (localStorage quota, IndexedDB permissions).

## Comparison with decrypt()

| Feature | getDecryptionSignature() | decrypt() |
|---------|-------------------------|-----------|
| Gets Signature | ✅ Yes | ✅ Yes (automatically) |
| Performs Decryption | ❌ No | ✅ Yes |
| Use Case | Pre-warming, manual management | Actual decryption |
| Typical Usage | Advanced scenarios | Standard decryption |

## Best Practices

### 1. Pre-warm on Page Load

```typescript
// ✅ Good: Request signature early
useEffect(() => {
  if (instance && signer) {
    getDecryptionSignature(config, {
      instance,
      contractAddresses: knownContracts,
      signer,
      storage: config.storage,
    })
  }
}, [instance, signer])
```

### 2. Handle Wallet Rejection Gracefully

```typescript
// ✅ Good: Handle user rejection
const signature = await getDecryptionSignature(config, { ... })
if (!signature) {
  showToast('Signature required for decryption')
  return
}
```

### 3. Check Validity Before Use

```typescript
// ✅ Good: Validate before use
if (signature && signature.isValid()) {
  // Use signature
} else {
  // Request new signature
}
```

## Where to go next

🟨 Go to [**decrypt()**](decrypt.md) for full decryption workflow.

🟨 Go to [**Storage**](../../core-concepts/storage.md) to understand signature caching.

🟨 Go to [**Decryption Guide**](../../core-concepts/decryption.md) for decryption concepts.
