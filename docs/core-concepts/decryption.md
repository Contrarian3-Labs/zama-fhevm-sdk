---
description: Understanding FHEVM decryption and EIP-712 signatures.
---

# Decryption

FHEVM decryption allows authorized users to decrypt encrypted handles stored on-chain using EIP-712 signatures for authorization.

## How Decryption Works

```
Encrypted Handle on-chain (0x1234...abcd)
    ↓
User requests decryption
    ↓
Generate/Load EIP-712 Signature (cached 7 days)
    ↓
User signs with wallet
    ↓
SDK decrypts using signature
    ↓
Plaintext Value (42)
```

## Basic Decryption

```typescript
import { decrypt } from '@fhevm-sdk/actions'
import { ethers } from 'ethers'

const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()

const decrypted = await decrypt(config, {
  instance,
  requests: [{
    handle: '0x1234567890abcdef...',  // Encrypted handle from contract
    contractAddress: '0xYourContract...'
  }],
  signer,
  storage: config.storage
})

console.log(decrypted['0x1234...'])  // 42n (bigint) or true (boolean)
```

## EIP-712 Signatures

Decryption requires an EIP-712 signature for authorization.

### Signature Structure

```typescript
{
  domain: {
    name: 'FHEVM Decryption Authorization',
    version: '1',
    chainId: 31337
  },
  types: {
    DecryptionRequest: [
      { name: 'publicKey', type: 'bytes' },
      { name: 'contractAddresses', type: 'address[]' },
      { name: 'userAddress', type: 'address' },
      { name: 'startTimestamp', type: 'uint256' },
      { name: 'duration', type: 'uint256' }
    ]
  },
  message: {
    publicKey: '0x...',
    contractAddresses: ['0xContract1...', '0xContract2...'],
    userAddress: '0xUser...',
    startTimestamp: 1234567890,
    duration: 604800  // 7 days in seconds
  }
}
```

### Signature Caching

Signatures are cached in storage to avoid repeated wallet prompts:

```typescript
// First decryption: User signs
const decrypted1 = await decrypt(config, { ... })
// → Wallet popup: "Sign message"

// Second decryption (within 7 days): Uses cached signature
const decrypted2 = await decrypt(config, { ... })
// → No wallet popup!
```

**Cache key format:** `fhevm-sig-${userAddress}-${sortedContractAddresses}`

**Validity:** 7 days (configurable)

## Batch Decryption

Decrypt multiple handles in one call:

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

// User signs ONCE for both contracts
console.log(decrypted['0xaaa...'])  // 100n
console.log(decrypted['0xbbb...'])  // 200n
console.log(decrypted['0xccc...'])  // true
```

**Benefits:**
- Single signature for multiple handles
- Single signature for multiple contracts
- Efficient batch processing

## Decryption Types

Decrypted values are returned as their native JavaScript types:

| Encrypted Type | Decrypted Type | Example |
|---------------|----------------|---------|
| `euint8-32` | `bigint` | `42n` |
| `euint64-256` | `bigint` | `999999999n` |
| `ebool` | `boolean` | `true` |
| `eaddress` | `string` | `'0x1234...'` |

### Type Conversion

```typescript
// euint8 → number
const value = decrypted[handle]
if (typeof value === 'bigint') {
  const num = Number(value)  // 42
}

// euint64 → string (for display)
const balance = decrypted[handle]
const formatted = balance.toString()  // "1000000000000000000"

// With ethers
const formatted = ethers.formatEther(balance)  // "1.0"
```

## Signature Management

### Pre-warming Signatures

Request signature before user needs it:

```typescript
import { getDecryptionSignature } from '@fhevm-sdk/actions'

// On page load
useEffect(() => {
  getDecryptionSignature(config, {
    instance,
    contractAddresses: ['0xContract...'],
    signer,
    storage: config.storage
  })
}, [])

// Later decryption uses cached signature (no popup)
```

### Checking Signature Validity

```typescript
const sig = await getDecryptionSignature(config, {
  instance,
  contractAddresses: ['0xContract...'],
  signer,
  storage: config.storage
})

if (sig && sig.isValid()) {
  console.log('Signature valid until:', 
    new Date(sig.startTimestamp + sig.durationDays * 86400000))
} else {
  console.log('Need new signature')
}
```

### Manual Signature Clearing

```typescript
// Clear expired or invalid signature
localStorage.removeItem('fhevm.decryption-signature')

// Or clear all FHEVM storage
Object.keys(localStorage)
  .filter(key => key.startsWith('fhevm-'))
  .forEach(key => localStorage.removeItem(key))
```

## Error Handling

### Common Errors

```typescript
try {
  const decrypted = await decrypt(config, { ... })
} catch (error) {
  if (error.message.includes('SIGNATURE_ERROR')) {
    // User rejected signature
    console.log('Please sign the message to decrypt')
    
  } else if (error.message.includes('SIGNATURE_EXPIRED')) {
    // Cached signature expired
    localStorage.removeItem('fhevm.decryption-signature')
    console.log('Signature expired, please retry')
    
  } else if (error.message.includes('SIGNATURE_MISMATCH')) {
    // Signature doesn't cover all requested contracts
    console.log('Requesting decryption from new contract, new signature needed')
    
  } else if (error.message.includes('Invalid handle')) {
    // Handle format validation failed
    console.log('Invalid handle format')
    
  } else if (error.code === 4001) {
    // User rejected in wallet
    console.log('Signature rejected by user')
  }
}
```

### Validation

Handles are validated before decryption:

```typescript
// Valid handle
const handle = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

// ✅ Correct format:
// - Starts with 0x
// - 66 characters total (0x + 64 hex chars)
// - Only hex characters [0-9a-fA-F]

// ❌ Invalid handles:
'1234...'              // Missing 0x prefix
'0xGHIJ...'            // Invalid hex characters
'0x123'                // Too short
```

## React Integration

```typescript
import { useFhevm } from '@fhevm-sdk/react'
import { decrypt } from '@fhevm-sdk/actions'
import { useState } from 'react'

function BalanceDisplay({ encryptedHandle }) {
  const { instance } = useFhevm({ provider: window.ethereum, chainId: 31337 })
  const [balance, setBalance] = useState<bigint | null>(null)

  const handleDecrypt = async () => {
    if (!instance) return
    
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    const decrypted = await decrypt(config, {
      instance,
      requests: [{ 
        handle: encryptedHandle, 
        contractAddress: contract.address 
      }],
      signer,
      storage: config.storage
    })

    setBalance(decrypted[encryptedHandle] as bigint)
  }

  return (
    <div>
      <button onClick={handleDecrypt}>Decrypt Balance</button>
      {balance !== null && <p>Balance: {balance.toString()}</p>}
    </div>
  )
}
```

## Security Considerations

### 1. Signature Scoping

Signatures are scoped to specific contracts:

```typescript
// Signature for Contract A
const sig1 = await getDecryptionSignature(config, {
  instance,
  contractAddresses: ['0xContractA...'],
  signer,
  storage: config.storage
})

// Can decrypt from Contract A
const decrypted = await decrypt(config, {
  instance,
  requests: [{ handle: '0x...', contractAddress: '0xContractA...' }],
  signer,
  storage: config.storage
})  // ✅ Works

// Cannot decrypt from Contract B (different signature needed)
const decrypted2 = await decrypt(config, {
  instance,
  requests: [{ handle: '0x...', contractAddress: '0xContractB...' }],
  signer,
  storage: config.storage
})  // ❌ SIGNATURE_MISMATCH error
```

### 2. Signature Expiry

Signatures expire after 7 days:

```typescript
// Day 1: Sign
const decrypted1 = await decrypt(config, { ... })  // Signs

// Day 3: Cached
const decrypted2 = await decrypt(config, { ... })  // Uses cache

// Day 8: Expired
const decrypted3 = await decrypt(config, { ... })  // SIGNATURE_EXPIRED
```

### 3. User Authorization

Only the user who owns the encrypted data can decrypt:

```typescript
// Alice encrypted value
const encrypted = await encrypt(config, {
  instance,
  contractAddress: '0x...',
  userAddress: '0xAlice...',
  values: [{ type: 'euint8', value: 42 }]
})

// Bob cannot decrypt Alice's value
const decrypted = await decrypt(config, {
  instance,
  requests: [{ handle: encrypted.handles[0], contractAddress: '0x...' }],
  signer: bobSigner,  // Bob's signer
  storage: config.storage
})  // ❌ Decryption fails (not Alice's signature)
```

## Where to go next

🟨 Go to [**decrypt() API**](../api-reference/actions/decrypt.md) for complete decryption API reference.

🟨 Go to [**Encryption**](encryption.md) to learn how to encrypt values first.

🟨 Go to [**Storage**](storage.md) to understand signature caching.

🟨 Go to [**Encrypted Counter Example**](../examples/encrypted-counter.md) to see decryption in action.
