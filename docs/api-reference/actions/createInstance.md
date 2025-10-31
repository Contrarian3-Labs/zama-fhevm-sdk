---
description: Initialize FHEVM instance for encryption and decryption operations.
---

# createInstance()

Creates an FHEVM instance for a specific chain. The instance is required for all encryption and decryption operations. Instances are automatically cached per chain ID to avoid expensive re-initialization.

## Import Path

```typescript
import { createInstance } from '@fhevm-sdk/actions'
```

## Type Signature

```typescript
async function createInstance<TConfig extends FhevmConfig>(
  config: TConfig,
  parameters: CreateInstanceParameters
): Promise<FhevmInstance>
```

## Parameters

### `config`

FHEVM configuration object from `createFhevmConfig()`.

- **Type:** `FhevmConfig`
- **Required:** Yes

### `parameters`

Instance creation parameters.

**Type:** `CreateInstanceParameters`

**Properties:**

#### `provider` (required)

EIP-1193 provider or RPC URL for blockchain connection.

- **Type:** `Eip1193Provider | string`
- **Example:** `window.ethereum` (MetaMask)
- **Example:** `'http://localhost:8545'` (Hardhat)

#### `chainId` (optional)

Chain ID to create instance for. If omitted, uses current chain from provider.

- **Type:** `number`
- **Example:** `31337` (Hardhat)
- **Example:** `11155111` (Sepolia)
- **Default:** Detected from provider

#### `signal` (optional)

AbortSignal for cancelling instance creation.

- **Type:** `AbortSignal`
- **Example:** `new AbortController().signal`

## Returns

**Type:** `Promise<FhevmInstance>`

FHEVM instance object with methods:

- `getPublicKey()` - Get FHEVM public key
- `createEncryptedInput()` - Create encrypted input builder
- `userDecrypt()` - Decrypt encrypted values with signature

## Mock vs Production Chains

### Mock Chains (Local Development)

When a chain ID is in `config.mockChains`, a **mock instance** is created:

**Benefits:**
- 100x faster encryption/decryption
- No real cryptographic operations
- Works in Node.js (no browser required)
- Perfect for testing and development

**Configuration:**
```typescript
const config = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: 'http://localhost:8545' // Mock chain
  }
})

const instance = await createInstance(config, {
  provider: 'http://localhost:8545',
  chainId: 31337
})
// Uses @fhevm/mock-utils (fast, no real crypto)
```

### Production Chains (Real Networks)

For chains NOT in `mockChains`, a **production instance** is created:

**Features:**
- Real FHEVM cryptographic operations
- Fetches public keys from blockchain
- Browser only (requires `window.relayerSDK`)
- Suitable for testnets and mainnet

**Configuration:**
```typescript
const config = createFhevmConfig({
  chains: [11155111], // Sepolia testnet
  mockChains: {} // Not a mock chain
})

const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 11155111
})
// Uses @zama-fhe/relayer-sdk (real crypto)
```

## Instance Caching

Instances are automatically cached per chain ID:

```typescript
const config = createFhevmConfig({ chains: [31337] })

// First call: Creates instance (~2-3 seconds)
const instance1 = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

// Second call: Returns cached instance (<10ms)
const instance2 = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

console.log(instance1 === instance2) // true (same object)
```

**Cache key:** Chain ID

**Benefits:**
- Avoid expensive re-initialization
- Consistent instance across components
- Automatic cache invalidation on error

## Examples

### Basic Usage (Browser)

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance } from '@fhevm-sdk/actions'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

console.log('Instance ready:', instance)
```

### With Chain Detection

```typescript
// Auto-detect current chain
const instance = await createInstance(config, {
  provider: window.ethereum
  // chainId omitted, will be detected
})
```

### With Abort Signal

```typescript
const controller = new AbortController()

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000)

try {
  const instance = await createInstance(config, {
    provider: window.ethereum,
    chainId: 31337,
    signal: controller.signal
  })
} catch (error) {
  if (error.name === 'FhevmAbortError') {
    console.log('Instance creation cancelled')
  }
}
```

### Multi-Chain Support

```typescript
const config = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

// Create instance for Hardhat (mock)
const hardhatInstance = await createInstance(config, {
  provider: 'http://localhost:8545',
  chainId: 31337
})

// Create instance for Sepolia (production)
const sepoliaInstance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 11155111
})

// Both instances cached separately
```

### Node.js Usage (Mock Only)

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance } from '@fhevm-sdk/actions'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

// Works in Node.js because it's a mock chain
const instance = await createInstance(config, {
  provider: 'http://localhost:8545',
  chainId: 31337
})

// Can now encrypt/decrypt in Node.js CLI
```

### Error Handling

```typescript
try {
  const instance = await createInstance(config, {
    provider: window.ethereum,
    chainId: 31337
  })
} catch (error) {
  if (error instanceof FhevmError) {
    console.error('FHEVM Error:', error.code, error.message)

    switch (error.code) {
      case 'PROVIDER_NOT_CONNECTED':
        console.log('Connect wallet first')
        break
      case 'CHAIN_NOT_SUPPORTED':
        console.log('Add chain to config')
        break
      case 'PUBLIC_KEY_FETCH_FAILED':
        console.log('RPC error, check network')
        break
    }
  }
}

// Check config state
const state = config.getState()
if (state.error) {
  console.error('Error in state:', state.error)
}
```

### With React Hook

```typescript
import { useFhevmInstance } from '@fhevm-sdk/react'

function MyComponent() {
  const { instance, status, error } = useFhevmInstance({
    provider: window.ethereum,
    enabled: !!window.ethereum
  })

  if (status === 'loading') return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!instance) return null

  return <div>Instance ready!</div>
}
```

## Throws

### `FhevmError`

Thrown for FHEVM-specific errors with error codes:

| Error Code | Cause | Solution |
|------------|-------|----------|
| `PROVIDER_NOT_CONNECTED` | Provider not available | Connect wallet |
| `CHAIN_NOT_SUPPORTED` | Chain not in config | Add to `config.chains` |
| `PUBLIC_KEY_FETCH_FAILED` | RPC error | Check network connection |
| `SSR_NOT_SUPPORTED` | Production chain in SSR | Use mock chains only |

### `FhevmAbortError`

Thrown when operation is cancelled via `AbortSignal`.

## Notes

::: info
**Instance Creation Time:**
- Mock chains: ~100ms (no crypto)
- Production chains: ~2-3 seconds (fetches keys, loads WASM)
:::

::: warning
**SSR Limitation:** Production chains (non-mock) cannot be used in SSR environments because they require `window.relayerSDK`. Use mock chains for SSR/Node.js.
:::

::: tip
**Automatic Caching:** Instances are cached per chain ID. You don't need to manually cache instances - the SDK handles this automatically.
:::

## State Updates

`createInstance()` updates config state:

```typescript
// Before
config.getState()
// { chainId: undefined, instance: null, status: 'idle', error: null }

// During
config.getState()
// { chainId: 31337, instance: null, status: 'loading', error: null }

// After success
config.getState()
// { chainId: 31337, instance: FhevmInstance, status: 'ready', error: null }

// After error
config.getState()
// { chainId: 31337, instance: null, status: 'error', error: Error }
```

## See Also

- [`encrypt()`](encrypt.md) - Encrypt values using instance
- [`decrypt()`](decrypt.md) - Decrypt values using instance
- [`createFhevmConfig()`](../core/createFhevmConfig.md) - Create config
- [Core Concepts: FHEVM Instance](../../core-concepts/fhevm-instance.md)
- [Getting Started](../../getting-started/quick-start-react.md)

## Type Definitions

```typescript
type CreateInstanceParameters = {
  provider: Eip1193Provider | string
  chainId?: number
  signal?: AbortSignal
}

type FhevmInstance = {
  getPublicKey: () => { key: string }
  createEncryptedInput: (
    contractAddress: string,
    userAddress: string
  ) => RelayerEncryptedInput
  userDecrypt: (
    requests: any[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, any>>
}

class FhevmError extends Error {
  code: string
  constructor(code: string, message?: string)
}

class FhevmAbortError extends Error {
  constructor(message?: string)
}
```
