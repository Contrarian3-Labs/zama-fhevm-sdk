---
description: Framework-agnostic actions for FHEVM operations.
---

# Actions API

Actions are pure functions that perform FHEVM operations without depending on any UI framework. They follow the pattern `(config, parameters) => Promise<Result>`.

## Import Path

```typescript
import { createInstance, encrypt, decrypt, publicDecrypt } from '@fhevm-sdk/actions'
```

## Available Actions

### Instance Management

- [`createInstance()`](createInstance.md) - Initialize FHEVM instance for a chain

### Encryption

- [`encrypt()`](encrypt.md) - Encrypt values for smart contract calls
- [`encryptWith()`](encryptWith.md) - Advanced encryption with custom builder

### Decryption

- [`decrypt()`](decrypt.md) - Decrypt encrypted handles with EIP-712 signature
- [`getDecryptionSignature()`](getDecryptionSignature.md) - Get or create decryption signature
- [`publicDecrypt()`](publicDecrypt.md) - Decrypt public values (no signature required)

### Helpers

- [`buildParamsFromAbi()`](helpers.md#buildparamsfromabi) - Convert EncryptResult to contract params
- [`toHex()`](helpers.md#tohex) - Convert to hex string
- [`getEncryptionMethod()`](helpers.md#getencryptionmethod) - Map type to builder method

## Action Pattern

All actions follow the same pattern:

```typescript
async function actionName<TConfig extends FhevmConfig>(
  config: TConfig,
  parameters: ActionParameters
): Promise<ReturnType>
```

**Benefits:**
- Pure functions (no side effects)
- Testable without mounting components
- Reusable across React/Vue/vanilla
- Type-safe with TypeScript

## Example Usage

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, encrypt, decrypt } from '@fhevm-sdk/actions'
import { BrowserProvider } from 'ethers'

// Create config
const config = createFhevmConfig({
  chains: [31337]
})

// Create instance
const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

// Encrypt
const encrypted = await encrypt(config, {
  instance,
  contractAddress: '0x...',
  userAddress: '0x...',
  values: [{ type: 'euint8', value: 42 }]
})

// Decrypt
const provider = new BrowserProvider(window.ethereum)
const signer = await provider.getSigner()

const results = await decrypt(config, {
  instance,
  signer,
  requests: [{
    handle: encrypted.handles[0],
    type: 'euint8',
    contractAddress: '0x...',
    userAddress: '0x...'
  }]
})

console.log('Decrypted:', results[0]) // 42n
```

## Error Handling

Actions throw errors instead of returning error objects:

```typescript
try {
  const instance = await createInstance(config, { ... })
} catch (error) {
  if (error instanceof FhevmError) {
    console.error('FHEVM error:', error.message)
  }
}
```

Config state is also updated with error:

```typescript
const state = config.getState()
if (state.error) {
  console.error('Error in state:', state.error)
}
```

## See Also

- [Core API](../core/README.md)
- [Getting Started](../../getting-started/quick-start-react.md)
- [Architecture Overview](../../getting-started/architecture-overview.md)
