---
description: Understanding FHEVM encryption and encrypted types.
---

# Encryption

FHEVM encryption allows you to encrypt plaintext values into ciphertext that can be processed on-chain while remaining confidential.

## How Encryption Works

```
Plaintext Value (42)
    ↓
FHEVM Encryption (using public key)
    ↓
Encrypted Handle (0x1234...abcd)  +  Zero-Knowledge Proof
    ↓
Send to Smart Contract
    ↓
Contract performs FHE operations (still encrypted)
    ↓
Result remains encrypted on-chain
```

## Encrypted Types

FHEVM supports multiple encrypted types:

| Type | Plaintext Type | Range | Use Case |
|------|---------------|-------|----------|
| `ebool` | boolean | true/false | Encrypted flags, conditions |
| `euint8` | number | 0-255 | Small counters, enums |
| `euint16` | number | 0-65,535 | Medium values, IDs |
| `euint32` | number | 0-4,294,967,295 | Large values, amounts |
| `euint64` | bigint | 0-2^64-1 | Very large amounts |
| `euint128` | bigint | 0-2^128-1 | Huge values, balances |
| `euint256` | bigint | 0-2^256-1 | Unlimited range |
| `eaddress` | string | Ethereum address | Encrypted addresses |

## Basic Encryption

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, encrypt } from '@fhevm-sdk/actions'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }
})

const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

// Encrypt a single value
const encrypted = await encrypt(config, {
  instance,
  contractAddress: '0xYourContract...',
  userAddress: '0xYourAddress...',
  values: [
    { type: 'euint8', value: 42 }
  ]
})

// Result
console.log(encrypted.handles[0])   // Uint8Array (encrypted handle)
console.log(encrypted.inputProof)   // Uint8Array (ZK proof)
```

## Batch Encryption

Encrypt multiple values in one operation:

```typescript
const encrypted = await encrypt(config, {
  instance,
  contractAddress: '0xContract...',
  userAddress: '0xUser...',
  values: [
    { type: 'euint32', value: 1000 },
    { type: 'ebool', value: true },
    { type: 'euint64', value: 999999999n },
    { type: 'eaddress', value: '0xRecipient...' }
  ]
})

// All values encrypted with shared proof
console.log(encrypted.handles.length)  // 4 handles
console.log(encrypted.inputProof)      // Single proof for all
```

**Benefits:**
- More efficient than individual encryptions
- Single proof for multiple values
- Atomic operation

## Encryption Builder Pattern

For more control, use the builder directly:

```typescript
const input = instance.createEncryptedInput(
  contractAddress,
  userAddress
)

// Add values
input.add8(42)           // euint8
input.add16(1000)        // euint16
input.add32(100000)      // euint32
input.add64(999999n)     // euint64
input.addBool(true)      // ebool
input.addAddress('0x...')  // eaddress

// Encrypt
const { handles, inputProof } = await input.encrypt()
```

## Using with Smart Contracts

### Send Encrypted Value

```typescript
import { ethers } from 'ethers'

// Encrypt value
const encrypted = await encrypt(config, {
  instance,
  contractAddress: contract.address,
  userAddress: await signer.getAddress(),
  values: [{ type: 'euint8', value: 42 }]
})

// Call contract
await contract.setValue(
  encrypted.handles[0],    // Encrypted handle
  encrypted.inputProof     // ZK proof
)
```

### Using Helper Function

```typescript
import { buildParamsFromAbi } from '@fhevm-sdk/actions'

// Encrypt
const encrypted = await encrypt(config, { ... })

// Convert to contract parameters based on ABI
const params = buildParamsFromAbi(
  encrypted,
  contractAbi,
  'setValue'  // Function name
)

// Call with correct types
await contract.setValue(...params)
```

## Type Conversion

### For Contract ABIs

```typescript
// Contract function signature:
// function setValue(bytes32 handle, bytes proof)

const params = buildParamsFromAbi(encrypted, abi, 'setValue')
// Returns: ['0x1234...', '0xabcd...']

// Contract function signature:
// function setValue(uint256 handle, bytes proof)

const params = buildParamsFromAbi(encrypted, abi, 'setValue')
// Returns: [12345678901234567890n, '0xabcd...']
```

## Encryption Performance

### Mock Mode (Development)

```typescript
mockChains: { 31337: 'http://localhost:8545' }
```

- Speed: ~10-50ms per encryption
- Cryptography: Simulated (no real FHE)
- Use for: Unit tests, development

### Production Mode (Testnets/Mainnet)

```typescript
chains: [11155111]  // Not in mockChains
```

- Speed: ~2-5 seconds per encryption
- Cryptography: Real FHEVM operations
- Use for: Integration tests, production

## Security Considerations

### 1. Value Ranges

Ensure values fit within type constraints:

```typescript
// ✅ Good
{ type: 'euint8', value: 255 }  // Max value for euint8

// ❌ Bad (will fail)
{ type: 'euint8', value: 256 }  // Exceeds euint8 range
```

### 2. User-Specific Encryption

Encryption is user-specific - each user gets different ciphertext for the same value:

```typescript
// Alice encrypts 42
const aliceEncrypted = await encrypt(config, {
  instance,
  contractAddress: '0x...',
  userAddress: '0xAlice...',
  values: [{ type: 'euint8', value: 42 }]
})

// Bob encrypts 42 (different result!)
const bobEncrypted = await encrypt(config, {
  instance,
  contractAddress: '0x...',
  userAddress: '0xBob...',
  values: [{ type: 'euint8', value: 42 }]
})

// aliceEncrypted.handles[0] !== bobEncrypted.handles[0]
```

### 3. Zero-Knowledge Proofs

The `inputProof` is a zero-knowledge proof that:
- Encryption is valid
- Value is correctly formatted
- No tampering occurred

Smart contracts verify this proof before accepting encrypted inputs.

## Common Patterns

### Conditional Encryption

```typescript
const values = [
  { type: 'euint32', value: baseAmount }
]

if (includeBonus) {
  values.push({ type: 'euint32', value: bonusAmount })
}

const encrypted = await encrypt(config, {
  instance,
  contractAddress,
  userAddress,
  values
})
```

### Array of Values

```typescript
const amounts = [100, 200, 300, 400, 500]

const encrypted = await encrypt(config, {
  instance,
  contractAddress,
  userAddress,
  values: amounts.map(amt => ({ 
    type: 'euint32', 
    value: amt 
  }))
})
```

### Dynamic Types

```typescript
function encryptValue(type: EncryptionType, value: any) {
  return encrypt(config, {
    instance,
    contractAddress,
    userAddress,
    values: [{ type, value }]
  })
}

const encrypted8 = await encryptValue('euint8', 42)
const encrypted32 = await encryptValue('euint32', 1000000)
```

## Error Handling

```typescript
try {
  const encrypted = await encrypt(config, { ... })
} catch (error) {
  if (error.message.includes('Invalid encryption method')) {
    // Type not supported or SDK version mismatch
  } else if (error.message.includes('Failed to encrypt')) {
    // Value invalid for type (e.g., out of range)
  } else if (error.message.includes('Instance not ready')) {
    // Wait for instance creation
  }
}
```

## Where to go next

🟨 Go to [**encrypt() API**](../api-reference/actions/encrypt.md) for complete encryption API reference.

🟨 Go to [**Decryption**](decryption.md) to learn how to decrypt encrypted values.

🟨 Go to [**FHEVM Instance**](fhevm-instance.md) to understand instance creation.

🟨 Go to [**Encrypted Counter Example**](../examples/encrypted-counter.md) to see encryption in action.
