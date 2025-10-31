---
description: Understanding FHEVM SDK configuration and state management.
---

# Configuration

The FHEVM SDK uses a centralized configuration object based on Zustand vanilla store for framework-agnostic state management.

## Creating Configuration

### Basic Configuration

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337, 11155111],  // Hardhat, Sepolia
  mockChains: {
    31337: 'http://localhost:8545'  // Enable mock mode for Hardhat
  }
})
```

### With Custom Storage

```typescript
import { createFhevmConfig, createStorage } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
  storage: createStorage({
    storage: {
      getItem: async (key) => localStorage.getItem(key),
      setItem: async (key, value) => localStorage.setItem(key, value),
      removeItem: async (key) => localStorage.removeItem(key)
    }
  })
})
```

### SSR Mode

```typescript
const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: typeof window === 'undefined',  // Enable SSR mode in Node.js
  storage: typeof window === 'undefined' ? noopStorage() : undefined
})
```

## Configuration Options

### `chains` (required)

Array of supported chain IDs.

```typescript
chains: [31337, 11155111, 1]  // Hardhat, Sepolia, Mainnet
```

### `mockChains` (optional)

Map of chain IDs to RPC URLs for mock mode.

```typescript
mockChains: {
  31337: 'http://localhost:8545',  // Hardhat uses mock FHEVM
  9000: 'http://localhost:9545'    // Custom chain
}
```

Mock chains use `@fhevm/mock-utils` for fast encryption (100x faster) without real cryptography.

### `storage` (optional)

Custom storage implementation for caching decryption signatures.

```typescript
storage: createStorage({
  storage: {
    getItem: async (key) => { /* ... */ },
    setItem: async (key, value) => { /* ... */ },
    removeItem: async (key) => { /* ... */ }
  }
})
```

Default: `localStorage` in browser, noop in Node.js

### `ssr` (optional)

Enable server-side rendering mode.

```typescript
ssr: typeof window === 'undefined'
```

When `true`:
- Disables browser-only features
- Uses noop storage by default
- Only mock chains are supported

## State Management

Configuration uses Zustand vanilla store for reactive state.

### Reading State

```typescript
const state = config.getState()

console.log(state.chainId)    // Current chain ID
console.log(state.instance)   // FHEVM instance
console.log(state.status)     // 'idle' | 'loading' | 'ready' | 'error'
console.log(state.error)      // Error object if failed
```

### Updating State

```typescript
config.setState({
  chainId: 31337,
  status: 'loading'
})
```

State updates automatically trigger subscriptions.

### Subscribing to Changes

```typescript
const unsubscribe = config.subscribe((state) => {
  console.log('State changed:', state)
  
  if (state.status === 'ready') {
    console.log('Instance ready:', state.instance)
  }
  
  if (state.error) {
    console.error('Error occurred:', state.error)
  }
})

// Unsubscribe when done
unsubscribe()
```

## State Lifecycle

```
┌─────┐
│ idle │  Initial state
└──┬──┘
   │ createInstance() called
   ↓
┌──────────┐
│ loading  │  Creating FHEVM instance
└────┬─────┘
     │
     ├─ Success ─→ ┌───────┐
     │             │ ready │  Instance available
     │             └───────┘
     │
     └─ Error ───→ ┌───────┐
                   │ error │  Error stored
                   └───────┘
```

## Multi-Chain Support

Configuration supports multiple chains simultaneously:

```typescript
const config = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: {
    31337: 'http://localhost:8545'  // Mock
    // 11155111 uses production FHEVM
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
```

Each chain's instance is cached separately.

## Type Safety

Configuration is fully typed with TypeScript:

```typescript
import type { FhevmConfig } from '@fhevm-sdk/core'

function useMyConfig(config: FhevmConfig) {
  const state = config.getState()
  // state is fully typed
  // state.instance: FhevmInstance | null
  // state.status: 'idle' | 'loading' | 'ready' | 'error'
}
```

## Best Practices

### 1. Create Once, Reuse Everywhere

```typescript
// config.ts
export const fhevmConfig = createFhevmConfig({ ... })

// App.tsx
import { fhevmConfig } from './config'
const instance = await createInstance(fhevmConfig, { ... })
```

### 2. Use Environment Variables

```typescript
const config = createFhevmConfig({
  chains: [Number(process.env.CHAIN_ID)],
  mockChains: process.env.NODE_ENV === 'development' ? {
    [Number(process.env.CHAIN_ID)]: process.env.RPC_URL
  } : {}
})
```

### 3. Handle SSR Correctly

```typescript
const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: typeof window === 'undefined',
  storage: typeof window === 'undefined' ? noopStorage() : undefined
})
```

### 4. Subscribe in React/Vue

```typescript
// React
useEffect(() => {
  return config.subscribe((state) => {
    // Handle state changes
  })
}, [])

// Vue
onMounted(() => {
  const unsubscribe = config.subscribe((state) => {
    // Handle state changes
  })
  onUnmounted(() => unsubscribe())
})
```

## Where to go next

🟨 Go to [**createFhevmConfig() API**](../api-reference/core/createFhevmConfig.md) for complete API documentation.

🟨 Go to [**Storage**](storage.md) to learn about signature caching.

🟨 Go to [**FHEVM Instance**](fhevm-instance.md) to understand instance management.

🟨 Go to [**Architecture Overview**](../getting-started/architecture-overview.md) to see how configuration fits in the SDK.
