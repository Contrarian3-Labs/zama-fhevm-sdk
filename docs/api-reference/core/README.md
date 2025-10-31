---
description: Core configuration and state management exports.
---

# Core API

The core module provides framework-agnostic configuration and state management using Zustand vanilla store, following Wagmi's proven architecture pattern.

## Import Path

```typescript
import { createFhevmConfig, createStorage, hydrate } from '@fhevm-sdk/core'
```

## Exports

### Configuration

- [`createFhevmConfig()`](createFhevmConfig.md) - Create FHEVM configuration with Zustand state management
- [`createStorage()`](createStorage.md) - Create storage adapter for state persistence
- [`hydrate()`](hydrate.md) - Hydrate SSR state on client

### State Types

- [`FhevmConfig`](types.md#fhevmconfig) - Configuration object type
- [`State`](types.md#state) - Current state shape
- [`CreateFhevmConfigParameters`](types.md#createfhevmconfigparameters) - Config parameters type

## Quick Example

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

// Create config
const config = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

// Access state
const state = config.getState()
console.log(state) // { chainId, instance, status, error }

// Subscribe to changes
const unsubscribe = config.subscribe((state) => {
  console.log('State updated:', state)
})

// Update state (done automatically by actions)
config.setState({ chainId: 31337 })
```

## Key Concepts

### Zustand Vanilla Store

The config is a Zustand vanilla store, which means:
- **Framework-agnostic**: Works without React/Vue
- **Subscribable**: Components can subscribe to state changes
- **Immutable updates**: State updates create new objects
- **Middleware support**: Supports persistence, devtools, etc.

### Instance Caching

FHEVM instances are cached per chain ID to avoid expensive re-initialization:

```typescript
Map<chainId, FhevmInstance>
```

Benefits:
- First `createInstance()` call: ~2-3 seconds (fetches keys, loads WASM)
- Subsequent calls: <10ms (returns cached instance)

### State Persistence

By default, config state is persisted to localStorage:

```typescript
const config = createFhevmConfig({
  chains: [31337],
  storage: createStorage({ storage: localStorage }) // Default
})
```

Disable persistence for SSR:

```typescript
const config = createFhevmConfig({
  chains: [31337],
  ssr: true,
  storage: null // No persistence
})
```

## State Shape

```typescript
interface State {
  chainId: number | undefined
  instance: FhevmInstance | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: Error | null
}
```

## Related

- [Core Concepts: Configuration](../../core-concepts/configuration.md)
- [Actions API](../actions/README.md)
- [Architecture Overview](../../getting-started/architecture-overview.md)
