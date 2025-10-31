---
description: Create framework-agnostic FHEVM configuration with Zustand state management and instance caching.
---

# createFhevmConfig()

Creates the core FHEVM configuration object with Zustand-based state management. This is the entry point for the FHEVM SDK, following Wagmi's `createConfig` pattern exactly.

## Import Path

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
```

## Type Signature

```typescript
function createFhevmConfig<
  const chains extends readonly [number, ...number[]]
>(
  parameters: CreateFhevmConfigParameters<chains>
): FhevmConfig<chains>
```

## Parameters

### `parameters`

Configuration parameters object.

**Type:** `CreateFhevmConfigParameters<chains>`

**Properties:**

#### `chains` (required)

Array of supported chain IDs. Must contain at least one chain.

- **Type:** `readonly [number, ...number[]]`
- **Example:** `[31337]` (Hardhat local)
- **Example:** `[31337, 11155111]` (Hardhat + Sepolia)

#### `mockChains` (optional)

Map of chain ID to RPC URL for mock/local chains. Mock chains enable faster encryption/decryption without real cryptographic operations, ideal for local development.

- **Type:** `Record<number, string>`
- **Example:** `{ 31337: 'http://localhost:8545' }`
- **Default:** `{}`

::: info
**Mock Chains**: When a chain ID is in `mockChains`, the SDK uses `@fhevm/mock-utils` for instant encryption/decryption. This is 100x faster than real FHEVM operations and perfect for local testing.
:::

#### `storage` (optional)

Storage backend for state persistence. By default, uses localStorage in browsers and noop storage in SSR environments.

- **Type:** `Storage | null`
- **Default:** `createStorage({ storage: getDefaultStorage() })`
- **Example:** `null` (disable persistence)
- **Example:** `createStorage({ storage: localStorage })`
- **Example:** `createStorage({ storage: customAdapter })`

See: [`createStorage()`](createStorage.md)

#### `ssr` (optional)

Enable server-side rendering mode. When `true`, skips hydration and disables persistence.

- **Type:** `boolean`
- **Default:** `false`
- **Recommended:** `typeof window === 'undefined'` (auto-detect)

#### `autoConnect` (optional)

Automatically create FHEVM instance when provider is available.

- **Type:** `boolean`
- **Default:** `true`

## Returns

**Type:** `FhevmConfig<chains>`

A configuration object with the following properties and methods:

### Properties

- `chains`: Array of supported chain IDs
- `mockChains`: Mock chain configuration
- `storage`: Storage adapter
- `ssr`: SSR mode flag
- `autoConnect`: Auto-connect flag

### Methods

#### `getState()`

Returns current state snapshot.

**Returns:** `State`

```typescript
const state = config.getState()
// { chainId, instance, status, error }
```

#### `setState(partialState)`

Updates state (immutable). Triggers subscriptions.

**Parameters:**
- `partialState`: `Partial<State>`

```typescript
config.setState({ chainId: 31337 })
```

#### `subscribe(selector?, listener)`

Subscribes to state changes. Returns unsubscribe function.

**Parameters:**
- `selector`: `(state: State) => Selected` (optional)
- `listener`: `(selected: Selected, prev: Selected) => void`

**Returns:** `() => void` (unsubscribe function)

```typescript
// Subscribe to all changes
const unsubscribe = config.subscribe((state) => {
  console.log('State:', state)
})

// Subscribe to specific field
const unsubscribe = config.subscribe(
  (state) => state.status,
  (status) => console.log('Status:', status)
)

// Later: unsubscribe()
```

#### `getInstance(chainId?)`

Gets cached FHEVM instance for a chain ID.

**Parameters:**
- `chainId`: `number` (optional, uses current chainId if omitted)

**Returns:** `FhevmInstance | undefined`

```typescript
const instance = config.getInstance(31337)
```

## Examples

### Basic Usage

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

// Access state
console.log(config.getState())

// Subscribe to changes
config.subscribe((state) => {
  console.log('New state:', state)
})
```

### Multi-Chain Configuration

```typescript
const config = createFhevmConfig({
  chains: [31337, 11155111], // Hardhat + Sepolia
  mockChains: {
    31337: 'http://localhost:8545' // Only Hardhat is mock
  }
})

// Hardhat uses mock (fast)
// Sepolia uses real FHEVM (slower but production-ready)
```

### SSR Configuration (Next.js, Nuxt)

```typescript
import { createFhevmConfig, noopStorage } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [11155111],
  ssr: typeof window === 'undefined',
  storage: typeof window === 'undefined'
    ? noopStorage()
    : undefined // Use default (localStorage)
})
```

### Custom Storage

```typescript
import { createFhevmConfig, createStorage } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  storage: createStorage({
    storage: {
      getItem: async (key) => {
        // Custom get logic (e.g., Redis, SQLite)
        return await db.get(key)
      },
      setItem: async (key, value) => {
        await db.set(key, value)
      },
      removeItem: async (key) => {
        await db.delete(key)
      }
    }
  })
})
```

### Disable Persistence

```typescript
const config = createFhevmConfig({
  chains: [31337],
  storage: null // No persistence
})
```

### State Subscriptions

```typescript
// Subscribe to status changes
const unsubscribe = config.subscribe(
  (state) => state.status,
  (status, prevStatus) => {
    console.log(`Status changed: ${prevStatus} → ${status}`)

    if (status === 'ready') {
      console.log('FHEVM instance is ready!')
    }
  }
)

// Subscribe to instance changes
config.subscribe(
  (state) => state.instance,
  (instance) => {
    if (instance) {
      console.log('Instance created:', instance)
    }
  }
)

// Subscribe to errors
config.subscribe(
  (state) => state.error,
  (error) => {
    if (error) {
      console.error('FHEVM error:', error)
    }
  }
)
```

### With React

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { FhevmProvider } from '@fhevm-sdk/react'

const config = createFhevmConfig({
  chains: [31337]
})

function App() {
  return (
    <FhevmProvider config={config}>
      <YourApp />
    </FhevmProvider>
  )
}
```

### With Vue

```typescript
import { createApp } from 'vue'
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createFhevmPlugin } from '@fhevm-sdk/vue'

const config = createFhevmConfig({
  chains: [31337]
})

const app = createApp(App)
app.use(createFhevmPlugin(config))
app.mount('#app')
```

## State Lifecycle

```
1. createFhevmConfig() → Initial state (idle)
   {
     chainId: undefined,
     instance: null,
     status: 'idle',
     error: null
   }

2. createInstance() called → State updates (loading)
   {
     chainId: 31337,
     instance: null,
     status: 'loading',
     error: null
   }

3. Instance created → State updates (ready)
   {
     chainId: 31337,
     instance: FhevmInstance,
     status: 'ready',
     error: null
   }

4. Error occurs → State updates (error)
   {
     chainId: 31337,
     instance: null,
     status: 'error',
     error: Error
   }
```

## Throws

Does not throw. Errors are captured in state and accessible via `config.getState().error`.

## Notes

::: warning
**Single Config Instance**: Create one config instance per application. Creating multiple configs can lead to inconsistent state.
:::

::: info
**Instance Caching**: FHEVM instances are cached per chain ID. The first `createInstance()` call for a chain takes ~2-3 seconds (fetches public keys, loads WASM). Subsequent calls return the cached instance in <10ms.
:::

## See Also

- [`createInstance()`](../actions/createInstance.md) - Create FHEVM instance after config setup
- [`createStorage()`](createStorage.md) - Create custom storage adapter
- [`FhevmProvider`](../react/FhevmProvider.md) - React provider component
- [`createFhevmPlugin()`](../vue/createFhevmPlugin.md) - Vue plugin
- [Core Concepts: Configuration](../../core-concepts/configuration.md)
- [Architecture Overview](../../getting-started/architecture-overview.md)

## Type Definitions

```typescript
type CreateFhevmConfigParameters<
  chains extends readonly [number, ...number[]]
> = {
  chains: chains
  mockChains?: Record<number, string>
  storage?: Storage | null
  ssr?: boolean
  autoConnect?: boolean
}

type FhevmConfig<chains extends readonly [number, ...number[]]> = {
  // Properties
  chains: chains
  mockChains: Record<number, string>
  storage: Storage | null
  ssr: boolean
  autoConnect: boolean

  // Methods
  getState: () => State
  setState: (partialState: Partial<State>) => void
  subscribe: (listener: (state: State) => void) => () => void
  getInstance: (chainId?: number) => FhevmInstance | undefined
}

type State = {
  chainId: number | undefined
  instance: FhevmInstance | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: Error | null
}
```
