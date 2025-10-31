---
description: Encrypt values for FHEVM smart contract input using homomorphic encryption.
---

# encrypt()

Encrypts plaintext values into FHEVM ciphertext handles with zero-knowledge proof. This action follows Wagmi's action pattern and provides type-safe encryption for all FHEVM encrypted types.

## Import Path

```typescript
import { encrypt } from '@fhevm-sdk/actions'
```

## Type Signature

```typescript
async function encrypt<TConfig extends FhevmConfig>(
  config: TConfig,
  parameters: EncryptParameters
): Promise<EncryptResult>
```

## Parameters

### `config`

FHEVM configuration object from `createFhevmConfig()`.

- **Type:** `FhevmConfig`
- **Required:** Yes

### `parameters`

Encryption parameters object.

**Type:** `EncryptParameters`

**Properties:**

#### `instance` (required)

FHEVM instance for cryptographic operations.

- **Type:** `FhevmInstance`
- **Example:** From `createInstance()`

#### `contractAddress` (required)

Target contract address for encryption context.

- **Type:** `` `0x${string}` ``
- **Example:** `'0x1234567890abcdef...'`

#### `userAddress` (required)

User's Ethereum address (encryption is user-specific).

- **Type:** `` `0x${string}` ``
- **Example:** `await signer.getAddress()`

#### `values` (required)

Array of {type, value} pairs to encrypt.

- **Type:** `Array<{ type: EncryptionType; value: any }>`
- **Example:** `[{ type: 'euint8', value: 42 }]`

## Returns

**Type:** `Promise<EncryptResult>`

Encryption result object with:

- `handles: Uint8Array[]` - One encrypted handle per value
- `inputProof: Uint8Array` - Zero-knowledge proof for verification

## FHEVM Type System

Supported encryption types:

| Type | Builder Method | Value Type | Range |
|------|----------------|------------|-------|
| `ebool` | `addBool` | boolean | true/false |
| `euint8` | `add8` | number | 0-255 |
| `euint16` | `add16` | number | 0-65535 |
| `euint32` | `add32` | number | 0-4294967295 |
| `euint64` | `add64` | bigint | 0-2^64-1 |
| `euint128` | `add128` | bigint | 0-2^128-1 |
| `euint256` | `add256` | bigint | 0-2^256-1 |
| `eaddress` | `addAddress` | string | Ethereum address |

## Examples

### Basic Usage (Single Value)

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, encrypt } from '@fhevm-sdk/actions'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

const instance = await createInstance(config, {
  provider: window.ethereum
})

const encrypted = await encrypt(config, {
  instance,                              // FHEVM instance with encryption keys
  contractAddress: '0xYourContract...',  // Contract that will receive the encrypted value
  userAddress: await signer.getAddress(), // User who is allowed to submit this value
  values: [
    { type: 'euint8', value: 42 }        // Value to encrypt (type + plaintext)
  ]
})

console.log(encrypted.handles[0]) // Uint8Array (encrypted handle)
console.log(encrypted.inputProof) // Uint8Array (ZK proof)
```

### Batch Encryption (Multiple Values)

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

// All values encrypted in single proof
console.log(encrypted.handles.length) // 4
```

### With Contract Call (Using Helper)

```typescript
import { encrypt, buildParamsFromAbi } from '@fhevm-sdk/actions'

// Encrypt value
const encrypted = await encrypt(config, {
  instance,
  contractAddress: contract.address,
  userAddress: await signer.getAddress(),
  values: [{ type: 'euint8', value: 42 }]
})

// Convert to contract parameters
const params = buildParamsFromAbi(
  encrypted,
  contractAbi,
  'setValue' // Function name
)

// Call contract
await contract.setValue(...params)
```

### Type-Safe with TypeScript

```typescript
// Function that only accepts euint8 values
async function encryptCounter(value: number): Promise<EncryptResult> {
  if (value < 0 || value > 255) {
    throw new Error('euint8 must be 0-255')
  }

  return encrypt(config, {
    instance,
    contractAddress: counterContract.address,
    userAddress: await signer.getAddress(),
    values: [{ type: 'euint8', value }]
  })
}

const result = await encryptCounter(42)
```

### Error Handling

```typescript
try {
  const encrypted = await encrypt(config, {
    instance,
    contractAddress: '0xContract...',
    userAddress: '0xUser...',
    values: [
      { type: 'euint8', value: 42 }
    ]
  })
} catch (error) {
  if (error.message.includes('Invalid encryption method')) {
    console.error('SDK version mismatch')
  } else if (error.message.includes('Failed to encrypt')) {
    console.error('Invalid value for type:', error.cause)
  } else {
    console.error('Encryption failed:', error)
  }
}
```

### With React Hook

```typescript
import { useFhevm } from '@fhevm-sdk/react'
import { encrypt } from '@fhevm-sdk/actions'

function MyComponent() {
  const { instance, status } = useFhevm({
    provider: window.ethereum,
    chainId: 31337,
    enabled: true
  })

  const handleEncrypt = async () => {
    if (!instance) return

    const encrypted = await encrypt(config, {
      instance,
      contractAddress: '0xContract...',
      userAddress: await signer.getAddress(),
      values: [{ type: 'euint8', value: 42 }]
    })

    // Use encrypted.handles and encrypted.inputProof
  }

  return (
    <button onClick={handleEncrypt} disabled={status !== 'ready'}>
      Encrypt Value
    </button>
  )
}
```

### With External ABI Types

The SDK automatically handles Solidity ABI types with `external` prefix:

```typescript
// Contract ABI uses "externalEuint32"
const encrypted = await encrypt(config, {
  instance,
  contractAddress: '0xContract...',
  userAddress: '0xUser...',
  values: [
    { type: 'externalEuint32', value: 1000 }  // Normalized to euint32
  ]
})
```

## Helper Functions

### getEncryptionMethod()

Maps FHEVM types to builder method names.

```typescript
import { getEncryptionMethod } from '@fhevm-sdk/actions'

const method = getEncryptionMethod('euint8') // 'add8'
const method2 = getEncryptionMethod('ebool') // 'addBool'
```

### toHex()

Converts Uint8Array or string to 0x-prefixed hex.

```typescript
import { toHex } from '@fhevm-sdk/actions'

toHex(new Uint8Array([1, 2, 3])) // '0x010203'
toHex('abcd') // '0xabcd'
toHex('0xabcd') // '0xabcd'
```

### buildParamsFromAbi()

Converts EncryptResult to contract call parameters based on ABI.

```typescript
import { buildParamsFromAbi } from '@fhevm-sdk/actions'

const params = buildParamsFromAbi(
  encrypted,
  contractAbi,
  'functionName'
)

await contract.functionName(...params)
```

**Parameter conversion:**
- `bytes`/`bytes32` → hex string (via toHex)
- `uint256` → BigInt (Uint8Array → hex → BigInt)
- `address`/`string` → string
- `bool` → boolean

## Advanced: Custom Builder (encryptWith)

For fine-grained control, use `encryptWith()` with custom builder function:

```typescript
import { encryptWith } from '@fhevm-sdk/actions'

const encrypted = await encryptWith(config, {
  instance,
  contractAddress: '0xContract...',
  userAddress: '0xUser...',
  buildFn: (builder) => {
    builder.add8(42)
    builder.addBool(true)
    if (includeBonus) {
      builder.add32(bonusValue)
    }
  }
})
```

**When to use encryptWith:**
- Need conditional encryption logic
- Want direct builder method access
- Integrating with existing builder-based code

**Most users should use encrypt()** for type-safe declarative API.

## Throws

### Invalid Encryption Method

**Error:** `Invalid encryption method: ${method} for type: ${type}`

**Cause:** SDK version mismatch or unsupported type

**Solution:** Check FHEVM SDK version and use supported types

### Failed to Encrypt Value

**Error:** `Failed to encrypt value of type ${type}: ${message}`

**Cause:** Invalid value for the specified type (e.g., value out of range)

**Solution:** Validate value matches type constraints (see type table)

## Notes

::: info
**Batch Encryption:** Encrypting multiple values in a single call generates one shared proof, which is more efficient than multiple encrypt() calls.
:::

::: warning
**Value Ranges:** Ensure values fit within type constraints. For example, euint8 only accepts 0-255. Values outside the range will cause encryption to fail.
:::

::: tip
**Type Safety:** TypeScript will enforce type constraints at compile time. Use the EncryptionType union for maximum type safety.
:::

## See Also

- [`decrypt()`](decrypt.md) - Decrypt handles to plaintext
- [`createInstance()`](createInstance.md) - Create FHEVM instance
- [`buildParamsFromAbi()`](#buildparamsfromabi) - Convert to contract params
- [Core Concepts: Encryption](../../core-concepts/encryption.md)
- [Getting Started](../../getting-started/quick-start-react.md)

## Type Definitions

```typescript
type EncryptParameters = {
  instance: FhevmInstance
  contractAddress: `0x${string}`
  userAddress: `0x${string}`
  values: Array<{ type: EncryptionType; value: any }>
}

type EncryptionType =
  | 'ebool'
  | 'euint8'
  | 'euint16'
  | 'euint32'
  | 'euint64'
  | 'euint128'
  | 'euint256'
  | 'eaddress'

type EncryptResult = {
  handles: Uint8Array[]
  inputProof: Uint8Array
}

type EncryptReturnType = EncryptResult
```
