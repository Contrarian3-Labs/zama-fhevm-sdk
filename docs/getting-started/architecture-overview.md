---
description: Understand the three-layer architecture of the FHEVM SDK inspired by Wagmi.
---

# Architecture Overview

The FHEVM SDK follows a **three-layer architecture** inspired by [Wagmi](https://wagmi.sh), separating business logic from UI frameworks for maximum flexibility and testability.

## Three-Layer Design

```
┌─────────────────────────────────────────────┐
│  Layer 3: Framework Adapters                │
│  React Hooks / Vue Composables / Vanilla    │
│  - Thin wrappers around core actions        │
│  - Context/Plugin for config injection      │
│  - Framework-specific reactivity            │
├─────────────────────────────────────────────┤
│  Layer 2: Core Actions                      │
│  Framework-Agnostic Business Logic          │
│  - createInstance, encrypt, decrypt         │
│  - Pure functions: (config, params) => T    │
│  - No UI framework dependencies             │
├─────────────────────────────────────────────┤
│  Layer 1: Core State Management             │
│  Zustand Vanilla Store                      │
│  - FhevmConfig with Zustand state           │
│  - Instance cache: Map<chainId, instance>   │
│  - Storage abstraction (localStorage/IDB)   │
└─────────────────────────────────────────────┘
```

## Layer 1: Core State (Zustand)

The foundation is a **Zustand vanilla store** that manages FHEVM configuration and state.

**Key features:**
- Framework-agnostic state container
- Instance caching per chain ID
- Persistence with storage abstraction
- SSR support

**Example:**

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

// Access state directly
config.getState() // { chainId, instance, status, error }

// Subscribe to changes
config.subscribe((state) => {
  console.log('State updated:', state)
})
```

See: [createFhevmConfig() API Reference](../api-reference/core/createFhevmConfig.md)

## Layer 2: Core Actions (Framework-Agnostic)

Pure functions that perform FHEVM operations without depending on any UI framework.

**Action Pattern:**

```typescript
function actionName<TConfig extends FhevmConfig>(
  config: TConfig,
  parameters: ActionParameters
): Promise<ReturnType>
```

**Available Actions:**

- `createInstance` - Initialize FHEVM instance
- `encrypt` - Encrypt values for contracts
- `decrypt` - Decrypt encrypted handles
- `publicDecrypt` - Decrypt public values

**Example:**

```typescript
import { createInstance, encrypt } from '@fhevm-sdk/actions'

// Create instance
const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

// Encrypt value
const encrypted = await encrypt(config, {
  instance,
  contractAddress: '0x...',
  userAddress: '0x...',
  values: [{ type: 'euint8', value: 42 }]
})
```

**Benefits:**
- Testable in isolation (no React/Vue needed)
- Reusable across frameworks
- Type-safe with TypeScript
- Easy to mock for testing

See: [Actions API Reference](../api-reference/actions/README.md)

## Layer 3: Framework Adapters

Thin wrappers that provide framework-specific ergonomics.

### React Adapter

Uses Context API and hooks:

```typescript
import { FhevmProvider, useFhevmInstance, useEncrypt } from '@fhevm-sdk/react'

// Wrap app
<FhevmProvider config={config}>
  <App />
</FhevmProvider>

// Use in components
function Component() {
  const { instance } = useFhevmInstance()
  const { encrypt } = useEncrypt()
  
  // instance and encrypt are reactive
}
```

**Hook implementation (<50 lines):**

```typescript
import { useConfig } from './useConfig'
import { encrypt as encryptAction } from '@fhevm-sdk/actions'

export function useEncrypt() {
  const config = useConfig()
  
  const encrypt = useCallback(
    (parameters) => encryptAction(config, parameters),
    [config]
  )
  
  return { encrypt }
}
```

See: [React API Reference](../api-reference/react/README.md)

### Vanilla JS

Direct usage of core and actions:

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, encrypt } from '@fhevm-sdk/actions'

const config = createFhevmConfig({ chains: [31337] })
const instance = await createInstance(config, { ... })
const encrypted = await encrypt(config, { ... })
```

See: [Quick Start (Vanilla)](quick-start-vanilla.md)

## Benefits of This Architecture

### For Developers

- **Learn once, use everywhere**: Same concepts across React, Vue, vanilla
- **Easy testing**: Test business logic without mounting components
- **Type safety**: Full TypeScript support with inference
- **Small bundle**: Only import what you need

### For Maintainers

- **DRY**: Business logic written once, wrapped for each framework
- **Easy to add frameworks**: New adapters are <200 lines
- **Testable**: Core logic tested independently
- **Flexible**: Easy to swap state management or add features

## Package Exports (Subpath Exports)

The SDK uses **subpath exports** for optimal tree-shaking:

```typescript
// Core (config and state management)
import { createFhevmConfig } from '@fhevm-sdk/core'

// Actions (pure functions)
import { createInstance, encrypt, decrypt } from '@fhevm-sdk/actions'

// Types only
import type { FhevmConfig, FhevmInstance } from '@fhevm-sdk/types'

// React adapter
import { FhevmProvider, useFhevmInstance } from '@fhevm-sdk/react'

// Default (includes React for backward compatibility)
import { createFhevmConfig, useFhevmInstance } from '@fhevm-sdk'
```

**Bundle sizes:**
- Core: ~15KB gzipped
- React adapter: +2KB
- Vue adapter: +2KB

## Comparison with Wagmi

The FHEVM SDK closely follows Wagmi's architecture:

| Concept | Wagmi | FHEVM SDK |
|---------|-------|-----------|
| Config | `createConfig()` | `createFhevmConfig()` |
| State | Zustand vanilla | Zustand vanilla |
| Actions | `getAccount()`, `switchChain()` | `createInstance()`, `encrypt()` |
| React | `WagmiProvider`, `useAccount()` | `FhevmProvider`, `useFhevmInstance()` |

**Why follow Wagmi?**

- **Proven architecture**: Used by thousands of Web3 apps
- **Familiar patterns**: Developers know how to use it
- **Best practices**: Separation of concerns, testability, type safety
- **Framework-agnostic**: Works with any UI framework

## State Flow

```
User Action (UI)
    ↓
Hook/Composable
    ↓
Core Action (business logic)
    ↓
Update Zustand Store
    ↓
Notify Subscribers
    ↓
Re-render Components
```

## Instance Caching

FHEVM instances are expensive to create (requires fetching public keys and initializing crypto). The SDK caches instances per chain ID:

```typescript
// Cache structure
Map<chainId, FhevmInstance>

// First call: Creates instance
await createInstance(config, { chainId: 31337 })

// Second call: Returns cached instance
await createInstance(config, { chainId: 31337 }) // Fast!

// Different chain: Creates new instance
await createInstance(config, { chainId: 11155111 })
```

See: [FHEVM Instance](../core-concepts/fhevm-instance.md)

## Storage Abstraction

Decryption signatures are cached using a **storage abstraction**:

```typescript
// Default: localStorage
const config = createFhevmConfig({
  chains: [31337],
  storage: getDefaultStorage() // Uses localStorage
})

// IndexedDB (for larger data)
import { createStorage } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  storage: createStorage({
    storage: window.indexedDB ? 'indexedDB' : 'localStorage'
  })
})

// Custom storage (e.g., Redis, SQLite)
const customStorage = {
  getItem: async (key) => { /* ... */ },
  setItem: async (key, value) => { /* ... */ },
  removeItem: async (key) => { /* ... */ }
}

const config = createFhevmConfig({
  storage: createStorage({ storage: customStorage })
})
```

See: [Storage](../core-concepts/storage.md)

## SSR Support

The SDK supports server-side rendering:

```typescript
// Next.js App Router
const config = createFhevmConfig({
  chains: [31337],
  ssr: typeof window === 'undefined',
  storage: typeof window === 'undefined'
    ? noopStorage()
    : getDefaultStorage()
})
```

See: [Configuration](../core-concepts/configuration.md#ssr-configuration)

## Summary

The FHEVM SDK's three-layer architecture provides:

1. **Core State (Zustand)** - Framework-agnostic state management
2. **Core Actions** - Pure business logic functions
3. **Framework Adapters** - Thin React/Vue/vanilla wrappers

This design ensures:
- Framework flexibility
- Testability
- Type safety
- Small bundle size
- Easy maintenance

**Next:** [Quick Start (React)](quick-start-react.md) or [API Reference](../api-reference/README.md)
