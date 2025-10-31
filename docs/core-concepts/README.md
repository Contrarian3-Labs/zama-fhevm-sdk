---
description: Core concepts and architecture of FHEVM SDK.
---

# Core Concepts

Understanding the foundational concepts behind FHEVM SDK's architecture and design.

## Architecture Overview

FHEVM SDK follows a **three-layer architecture** inspired by Wagmi:

```
┌─────────────────────────────────────────┐
│   Framework Adapters (React, Vue)      │  ← Hooks/Composables
├─────────────────────────────────────────┤
│   Actions (encrypt, decrypt, instance)  │  ← Framework-agnostic
├─────────────────────────────────────────┤
│   Core (Zustand store, config)          │  ← State management
└─────────────────────────────────────────┘
```

### Layer 1: Core

Framework-agnostic foundation built on Zustand vanilla store.

- **Config creation** (`createFhevmConfig`)
- **State management** (Zustand store)
- **Storage abstraction** (localStorage, IndexedDB, custom)
- **Type definitions** (FHEVM types, config types)

**Key principle:** Zero framework dependencies

### Layer 2: Actions

Pure functions following Wagmi's `(config, params) => Promise<Result>` pattern.

- **Instance creation** (`createInstance`)
- **Encryption** (`encrypt`, `encryptWith`)
- **Decryption** (`decrypt`, `getDecryptionSignature`)

**Key principle:** Framework-agnostic business logic

### Layer 3: Framework Adapters

Thin wrappers that adapt actions to framework-specific patterns.

- **React:** `useFhevm()` hook
- **Vue:** `useFhevm()` composable (same API, reactive refs)

**Key principle:** Framework concerns (state, lifecycle) only

## Key Concepts

### FHEVM Instance

The FHEVM instance is your gateway to encrypted computation:

```typescript
const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

// Instance provides:
instance.getPublicKey()              // FHEVM public key
instance.createEncryptedInput(...)    // Encryption builder
instance.userDecrypt(...)            // Decryption with signature
```

**Caching:** Instances are automatically cached per chain ID for performance.

### Mock vs Production Chains

#### Mock Chains (Development)

```typescript
const config = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: 'http://localhost:8545'  // Mock mode
  }
})
```

- Uses `@fhevm/mock-utils`
- 100x faster (no real crypto)
- Works in Node.js
- Perfect for testing

#### Production Chains (Testnets, Mainnet)

```typescript
const config = createFhevmConfig({
  chains: [11155111],  // Sepolia
  mockChains: {}       // Not a mock chain
})
```

- Uses `@zama-fhe/relayer-sdk`
- Real FHEVM cryptographic operations
- Browser only
- Fetches public keys from blockchain

### Configuration

Config is the central state manager:

```typescript
const config = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: { 31337: 'http://localhost:8545' },
  storage: createStorage({ /* ... */ }),
  ssr: false
})

// Access state
config.getState()  // { chainId, instance, status, error }

// Subscribe to changes
config.subscribe((state) => {
  console.log('State changed:', state)
})
```

### Storage Abstraction

Storage is used for caching decryption signatures:

```typescript
// Default: localStorage
const config = createFhevmConfig({ chains: [31337] })

// Custom storage
import { createStorage } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  storage: createStorage({
    storage: {
      getItem: async (key) => { /* ... */ },
      setItem: async (key, value) => { /* ... */ },
      removeItem: async (key) => { /* ... */ }
    }
  })
})
```

**Built-in serialization:** Handles BigInt, Uint8Array automatically.

### Encryption Types

FHEVM supports multiple encrypted types:

| Type | Range | Use Case |
|------|-------|----------|
| `ebool` | true/false | Encrypted boolean |
| `euint8` | 0-255 | Small counters, flags |
| `euint16` | 0-65535 | Medium values |
| `euint32` | 0-4B | Large values |
| `euint64` | 0-2^64-1 | Very large values |
| `euint128` | 0-2^128-1 | Huge values |
| `euint256` | 0-2^256-1 | Unlimited range |
| `eaddress` | Ethereum address | Encrypted addresses |

### EIP-712 Signatures

Decryption requires EIP-712 signature authorization:

```typescript
const decrypted = await decrypt(config, {
  instance,
  requests: [{ handle: '0x...', contractAddress: '0x...' }],
  signer,  // Signs EIP-712 message
  storage  // Caches signature for 7 days
})
```

**Caching:** Signatures are cached to avoid repeated wallet prompts.

**Validity:** 7 days by default.

**Scope:** Per (userAddress, contractAddresses) combination.

## Design Patterns

### Actions Pattern

All business logic follows Wagmi's action pattern:

```typescript
async function action<TConfig extends FhevmConfig>(
  config: TConfig,
  parameters: Parameters
): Promise<ReturnType>
```

**Benefits:**
- Framework-agnostic
- Easy to test
- Composable
- Type-safe

### Error Handling

Follows Wagmi's error pattern:

```typescript
try {
  const result = await action(config, params)
} catch (error) {
  // Config state updated with error
  // Original error re-thrown (no wrapping)
  console.error(error)
}

// Reactive state access
const state = config.getState()
if (state.error) {
  // Handle error in UI
}
```

### State Management

Built on Zustand vanilla store:

```typescript
const config = createFhevmConfig({ chains: [31337] })

// Read state
const state = config.getState()

// Update state
config.setState({ chainId: 31337, status: 'loading' })

// Subscribe
const unsubscribe = config.subscribe((state) => {
  console.log('New state:', state)
})
```

**Why Zustand:**
- Framework-agnostic
- Lightweight (1KB)
- TypeScript-first
- Simple API

## Where to go next

::: tip
**Ready to dive deeper?** Explore each core concept to master FHEVM SDK.
:::

### Core Concepts

🟨 [**Configuration**](configuration.md) - Set up and manage your FHEVM config

🟨 [**FHEVM Instance**](fhevm-instance.md) - Understand instance creation and caching

🟨 [**Encryption**](encryption.md) - Learn how encryption works

🟨 [**Decryption**](decryption.md) - Master decryption and signatures

🟨 [**Storage**](storage.md) - Manage persistent state

### Practical Guides

🟨 [**Quick Start**](../getting-started/quick-start-react.md) - Hands-on tutorial

🟨 [**Examples**](../examples/README.md) - Complete working examples

🟨 [**API Reference**](../api-reference/README.md) - Detailed API documentation
