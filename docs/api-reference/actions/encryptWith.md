---
description: Advanced encryption with custom builder function for fine-grained control.
---

# encryptWith()

Advanced encryption function that provides direct access to the `RelayerEncryptedInput` builder for custom encryption logic. Most users should use [`encrypt()`](encrypt.md) which provides a simpler declarative API.

## Import

```typescript
import { encryptWith } from '@fhevm-sdk/actions'
```

## Usage

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, encryptWith } from '@fhevm-sdk/actions'

const config = createFhevmConfig({ chains: [31337] })
const instance = await createInstance(config, { provider })

const encrypted = await encryptWith(config, {
  instance,
  contractAddress: '0xContract...',
  userAddress: '0xUser...',
  buildFn: (builder) => {
    builder.add8(42)
    builder.addBool(true)
    builder.add64(1000000n)
  }
})
```

## Parameters

```typescript
type EncryptWithParameters = {
  instance: FhevmInstance                                    // FHEVM instance
  contractAddress: `0x${string}`                             // Target contract address
  userAddress: `0x${string}`                                 // User's Ethereum address
  buildFn: (builder: RelayerEncryptedInput) => void          // Custom builder function
}
```

### instance

- **Type:** `FhevmInstance`
- **Required:** Yes

The FHEVM instance returned from `createInstance()`.

### contractAddress

- **Type:** `` `0x${string}` ``
- **Required:** Yes

The contract address that will receive the encrypted value. Must start with `0x`.

### userAddress

- **Type:** `` `0x${string}` ``
- **Required:** Yes

The user's Ethereum address submitting the value. Must start with `0x`.

### buildFn

- **Type:** `(builder: RelayerEncryptedInput) => void`
- **Required:** Yes

Custom function that receives the `RelayerEncryptedInput` builder and calls its methods directly.

**Available builder methods:**
- `builder.addBool(value: boolean)` - Add encrypted boolean
- `builder.add8(value: number)` - Add encrypted uint8 (0-255)
- `builder.add16(value: number)` - Add encrypted uint16 (0-65535)
- `builder.add32(value: number)` - Add encrypted uint32 (0-4294967295)
- `builder.add64(value: bigint)` - Add encrypted uint64
- `builder.add128(value: bigint)` - Add encrypted uint128
- `builder.add256(value: bigint)` - Add encrypted uint256
- `builder.addAddress(value: string)` - Add encrypted Ethereum address

## Return Type

```typescript
type EncryptReturnType = {
  handles: Uint8Array[]    // Array of encrypted handles (one per value)
  inputProof: Uint8Array   // Zero-knowledge proof for verification
}
```

## When to Use encryptWith()

### Use encryptWith() for:

- ✅ Conditional encryption logic (if/else, loops)
- ✅ Direct builder method access
- ✅ Integrating with existing builder-based code
- ✅ Fine-grained control over encryption process

### Use encrypt() instead for:

- ✅ Simple, declarative encryption
- ✅ Type-safe API with validation
- ✅ Most common use cases
- ✅ Better error messages

## Examples

### Basic Custom Builder

```typescript
const encrypted = await encryptWith(config, {
  instance,
  contractAddress: '0xContract...',
  userAddress: '0xUser...',
  buildFn: (builder) => {
    builder.add8(42)
    builder.addBool(true)
    builder.add64(999999n)
  }
})

console.log(encrypted.handles.length) // 3 handles
console.log(encrypted.inputProof)     // ZK proof
```

### Conditional Encryption

```typescript
const includeBonus = true

const encrypted = await encryptWith(config, {
  instance,
  contractAddress,
  userAddress,
  buildFn: (builder) => {
    builder.add32(baseValue)

    // Conditionally add bonus value
    if (includeBonus) {
      builder.add32(bonusValue)
    }
  }
})
```

### Loop-Based Encryption

```typescript
const amounts = [100, 200, 300, 400, 500]

const encrypted = await encryptWith(config, {
  instance,
  contractAddress,
  userAddress,
  buildFn: (builder) => {
    for (const amount of amounts) {
      builder.add32(amount)
    }
  }
})

console.log(encrypted.handles.length) // 5 handles
```

### Mixed Types

```typescript
const encrypted = await encryptWith(config, {
  instance,
  contractAddress,
  userAddress,
  buildFn: (builder) => {
    builder.add32(1000)                    // Amount
    builder.addBool(true)                  // Active flag
    builder.addAddress('0xRecipient...')   // Recipient address
    builder.add64(9999999999n)             // Large value
  }
})
```

### Using with Smart Contract

```typescript
// Encrypt values
const encrypted = await encryptWith(config, {
  instance,
  contractAddress: contract.address,
  userAddress: await signer.getAddress(),
  buildFn: (builder) => {
    builder.add8(42)
  }
})

// Call contract
await contract.setValue(
  encrypted.handles[0],
  encrypted.inputProof
)
```

## Error Handling

```typescript
try {
  const encrypted = await encryptWith(config, {
    instance,
    contractAddress,
    userAddress,
    buildFn: (builder) => {
      builder.add8(42)
    }
  })
} catch (error) {
  console.error('Encryption failed:', error)
}
```

## Comparison with encrypt()

| Feature | encrypt() | encryptWith() |
|---------|-----------|---------------|
| API Style | Declarative | Imperative |
| Type Safety | ✅ Full validation | ⚠️ Manual validation |
| Conditional Logic | ❌ Not supported | ✅ Full support |
| Error Messages | ✅ Detailed | ⚠️ Generic |
| Use Case | Simple encryption | Advanced control |
| Recommended | ✅ Yes (most users) | ⚠️ Advanced users only |

## Common Errors

### "Invalid encryption method"

The builder method doesn't exist or SDK version mismatch.

**Fix:** Ensure you're calling valid builder methods (add8, add16, add32, add64, add128, add256, addBool, addAddress).

### "Failed to encrypt value"

Value is out of range for the specified type.

**Fix:** Ensure values fit within type constraints:
- `add8`: 0-255
- `add16`: 0-65535
- `add32`: 0-4294967295
- `add64/128/256`: Use `bigint` for large values

## Where to go next

🟨 Go to [**encrypt()**](encrypt.md) for the simpler declarative API.

🟨 Go to [**Actions API**](README.md) for all available actions.

🟨 Go to [**Encryption Guide**](../../core-concepts/encryption.md) to understand encryption concepts.
