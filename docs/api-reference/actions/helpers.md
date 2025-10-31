---
description: Helper functions for encryption type mapping and ABI parameter conversion.
---

# Helper Functions

Utility functions for working with FHEVM encryption results and contract ABIs.

## Import

```typescript
import {
  getEncryptionMethod,
  toHex,
  buildParamsFromAbi
} from '@fhevm-sdk/actions'
```

## getEncryptionMethod()

Maps FHEVM encrypted types to `RelayerEncryptedInput` builder methods.

### Usage

```typescript
const method = getEncryptionMethod('euint8')
console.log(method) // 'add8'

// Use with builder
const input = instance.createEncryptedInput(contractAddress, userAddress)
input[method](42) // Calls input.add8(42)
```

### Parameters

```typescript
function getEncryptionMethod(type: string): string
```

- **type**: FHEVM encrypted type (e.g., `'euint8'`, `'ebool'`, `'eaddress'`)

### Return Value

Returns the corresponding builder method name as a const string.

### Type Mapping Table

| FHEVM Type | Builder Method | Value Type |
|------------|----------------|------------|
| `ebool` | `addBool` | `boolean` |
| `euint8` | `add8` | `number` (0-255) |
| `euint16` | `add16` | `number` (0-65535) |
| `euint32` | `add32` | `number` (0-4294967295) |
| `euint64` | `add64` | `bigint` |
| `euint128` | `add128` | `bigint` |
| `euint256` | `add256` | `bigint` |
| `eaddress` | `addAddress` | `string` (Ethereum address) |

### ABI Prefix Handling

Automatically strips Solidity ABI prefixes like `'external'`:

```typescript
getEncryptionMethod('externalEuint32') // 'add32'
getEncryptionMethod('euint32')         // 'add32' (same result)
```

This ensures compatibility with contract ABIs that use external type markers.

### Errors

Throws `Error` if the type is unknown or unsupported:

```typescript
try {
  getEncryptionMethod('invalidType')
} catch (error) {
  console.error(error.message)
  // "Unknown encryption type: invalidType..."
}
```

---

## toHex()

Converts `Uint8Array` or string to `0x`-prefixed hex string for contract calls.

### Usage

```typescript
// From Uint8Array
toHex(new Uint8Array([1, 2, 3])) // '0x010203'

// From string
toHex('abcd')   // '0xabcd'
toHex('0xabcd') // '0xabcd' (unchanged)
```

### Parameters

```typescript
function toHex(value: Uint8Array | string): `0x${string}`
```

- **value**: `Uint8Array` from encryption result OR hex string (with or without `0x` prefix)

### Return Value

Returns `0x`-prefixed hex string compatible with ethers.js contract calls.

### Examples

```typescript
// Convert encryption result to hex
const encrypted = await encrypt(config, { ... })
const handleHex = toHex(encrypted.handles[0])
const proofHex = toHex(encrypted.inputProof)

// Call contract with hex strings
await contract.setValue(handleHex, proofHex)
```

```typescript
// Ensure hex prefix
const address = toHex(userAddress) // Ensures 0x prefix
```

---

## buildParamsFromAbi()

Builds contract function parameters from encryption result and ABI definition. Converts `EncryptResult` (Uint8Array handles/proof) to properly typed parameters for ethers.js contract calls.

### Usage

```typescript
const encrypted = await encrypt(config, {
  instance,
  contractAddress: contract.address,
  userAddress,
  values: [{ type: 'euint8', value: 42 }]
})

// Convert to contract parameters
const params = buildParamsFromAbi(encrypted, contractAbi, 'setValue')
// Returns: ['0x1234...', '0xabcd...']

// Call contract
await contract.setValue(...params)
```

### Parameters

```typescript
function buildParamsFromAbi(
  enc: EncryptResult,
  abi: any[],
  functionName: string
): any[]
```

- **enc**: Encryption result from `encrypt()` or `encryptWith()`
- **abi**: Contract ABI array (standard ethers.js format)
- **functionName**: Target function name in ABI

### Return Value

Returns array of properly typed parameters for contract call.

### Parameter Mapping

- **Index 0**: First encrypted handle (usually the encrypted value)
- **Index 1+**: Input proof (cryptographic proof for verification)

### Type Conversion

| ABI Parameter Type | Conversion |
|-------------------|------------|
| `bytes` / `bytes32` | `Uint8Array → hex string` (via `toHex`) |
| `uint256` | `Uint8Array → hex string → BigInt` (two-step) |
| `address` / `string` | Pass through as string |
| `bool` | Convert to boolean |

### Why uint256 Needs Two-Step Conversion

`BigInt()` cannot directly parse `Uint8Array`. Must convert to hex string first:

```typescript
// ❌ Wrong: BigInt cannot parse Uint8Array
BigInt(Uint8Array([1,2,3])) // SyntaxError

// ✅ Correct: Convert to hex first
BigInt(toHex(Uint8Array([1,2,3]))) // BigInt('0x010203') → 66051n
```

### Examples

#### bytes32 Parameter

```javascript
// Contract function: setValue(bytes32 handle, bytes proof)
```

```typescript
const params = buildParamsFromAbi(encryptResult, contractAbi, 'setValue')
// Returns: ['0x1234...', '0xabcd...']

await contract.setValue(...params)
```

#### uint256 Parameter

```javascript
// Contract function: setEncrypted(uint256 handle, bytes proof)
```

```typescript
const params = buildParamsFromAbi(encryptResult, abi, 'setEncrypted')
// Returns: [12345678901234567890n, '0xabcd...']

await contract.setEncrypted(...params)
```

#### Multiple Handles

```typescript
const encrypted = await encrypt(config, {
  instance,
  contractAddress,
  userAddress,
  values: [
    { type: 'euint8', value: 42 },
    { type: 'ebool', value: true },
  ]
})

// For functions with multiple encrypted inputs
const params = buildParamsFromAbi(encrypted, abi, 'setMultiple')
// Returns all handles + proof
```

### Errors

Throws `Error` if function not found in ABI:

```typescript
try {
  buildParamsFromAbi(encrypted, abi, 'nonExistentFunction')
} catch (error) {
  console.error(error.message)
  // "Function ABI not found for nonExistentFunction"
}
```

### Warnings

For unknown ABI parameter types, logs warning and falls back to hex:

```typescript
// Unknown type in ABI
console.warn('Unknown ABI param type customType; passing as hex')
```

## Complete Example

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import {
  createInstance,
  encrypt,
  buildParamsFromAbi,
  toHex,
  getEncryptionMethod
} from '@fhevm-sdk/actions'

// Create config and instance
const config = createFhevmConfig({ chains: [31337] })
const instance = await createInstance(config, { provider })

// Encrypt values
const encrypted = await encrypt(config, {
  instance,
  contractAddress: contract.address,
  userAddress: await signer.getAddress(),
  values: [{ type: 'euint8', value: 42 }]
})

// Option 1: Use buildParamsFromAbi (recommended)
const params = buildParamsFromAbi(encrypted, contractAbi, 'setValue')
await contract.setValue(...params)

// Option 2: Manual conversion with toHex
const handleHex = toHex(encrypted.handles[0])
const proofHex = toHex(encrypted.inputProof)
await contract.setValue(handleHex, proofHex)

// Option 3: Check encryption method
const method = getEncryptionMethod('euint8')
console.log(`Used method: ${method}`) // 'add8'
```

## Where to go next

🟨 Go to [**encrypt()**](encrypt.md) to use these helpers with encryption.

🟨 Go to [**Actions API**](README.md) for all available actions.

🟨 Go to [**Encryption Guide**](../../core-concepts/encryption.md) for encryption concepts.
