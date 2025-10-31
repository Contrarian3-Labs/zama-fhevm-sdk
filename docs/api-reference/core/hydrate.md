---
description: SSR hydration support for FHEVM config state.
---

# hydrate()

Handles hydration of FHEVM config state for Server-Side Rendering (SSR) environments. Restores client-side state from server-rendered initial state.

## Import

```typescript
import { hydrate } from '@fhevm-sdk/core'
```

## Usage

```typescript
import { createFhevmConfig, hydrate } from '@fhevm-sdk/core'

// Server-side: Create config and get state
const config = createFhevmConfig({ chains: [31337], ssr: true })
const serverState = config.getState()

// Client-side: Hydrate with server state
const { onMount } = hydrate(config, {
  initialState: serverState,
})

// Call onMount in component lifecycle
onMount() // React: useEffect(() => { onMount() }, [])
```

## Parameters

```typescript
type HydrateParameters = {
  initialState?: State | undefined      // Initial state from server
  autoConnect?: boolean | undefined     // Auto-connect on mount (default: false)
}
```

### initialState

- **Type:** `State | undefined`
- **Required:** No

Initial FHEVM state from server-side rendering.

**State structure:**
```typescript
type State = {
  chainId: number
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: Error | undefined
  instance: FhevmInstance | undefined
}
```

### autoConnect

- **Type:** `boolean | undefined`
- **Default:** `false`

Whether to automatically trigger instance creation after hydration. Generally not recommended; use manual creation with `createInstance()` instead.

## Return Type

```typescript
type HydrateReturnType = {
  onMount: () => Promise<void>          // Lifecycle callback for component mount
}
```

### onMount()

Async function to call during component mount lifecycle:
- **React**: `useEffect(() => { onMount() }, [])`
- **Vue**: `onMounted(() => { onMount() })`

Handles:
1. Rehydrating persisted state (if SSR)
2. Auto-connection (if enabled)

## SSR Workflow

### Server-Side

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

// 1. Create config with SSR enabled
const config = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: true, // Enable SSR mode
})

// 2. Optionally create instance on server (for mock chains)
if (config.mockChains[chainId]) {
  await createInstance(config, {
    provider: 'http://localhost:8545',
    chainId: 31337,
  })
}

// 3. Serialize state for client
const initialState = config.getState()

// 4. Pass to HTML template
renderToString(<App initialState={initialState} />)
```

### Client-Side

```typescript
import { createFhevmConfig, hydrate } from '@fhevm-sdk/core'

// 1. Create same config (client-side)
const config = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: false, // Client mode
})

// 2. Hydrate with server state
const { onMount } = hydrate(config, {
  initialState: window.__INITIAL_STATE__,
})

// 3. Call onMount in component
function App() {
  useEffect(() => {
    onMount()
  }, [])

  return <YourApp />
}
```

## Examples

### Next.js App Router

```typescript
// app/fhevm.config.ts
import { createFhevmConfig } from '@fhevm-sdk/core'

export const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: typeof window === 'undefined',
})
```

```typescript
// app/providers.tsx
'use client'

import { FhevmProvider } from '@fhevm-sdk/react'
import { config } from './fhevm.config'

export function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode
  initialState?: any
}) {
  return (
    <FhevmProvider config={config} initialState={initialState}>
      {children}
    </FhevmProvider>
  )
}
```

### Next.js Pages Router

```typescript
// pages/_app.tsx
import { createFhevmConfig, hydrate } from '@fhevm-sdk/core'
import { FhevmProvider } from '@fhevm-sdk/react'

const config = createFhevmConfig({
  chains: [31337],
  ssr: typeof window === 'undefined',
})

function MyApp({ Component, pageProps }) {
  return (
    <FhevmProvider config={config} initialState={pageProps.initialState}>
      <Component {...pageProps} />
    </FhevmProvider>
  )
}

// pages/index.tsx
export async function getServerSideProps() {
  const config = createFhevmConfig({ chains: [31337], ssr: true })

  // Optionally create instance on server
  const initialState = config.getState()

  return {
    props: { initialState },
  }
}
```

### Nuxt (Vue)

```typescript
// plugins/fhevm.ts
import { createFhevmConfig, hydrate } from '@fhevm-sdk/core'

export default defineNuxtPlugin((nuxtApp) => {
  const config = createFhevmConfig({
    chains: [31337],
    mockChains: { 31337: 'http://localhost:8545' },
    ssr: import.meta.server,
  })

  if (import.meta.client) {
    const { onMount } = hydrate(config, {
      initialState: nuxtApp.payload.fhevmState,
    })

    onMounted(() => {
      onMount()
    })
  }

  return {
    provide: {
      fhevmConfig: config,
    },
  }
})
```

### Manual Hydration (Vanilla JS)

```typescript
import { createFhevmConfig, hydrate } from '@fhevm-sdk/core'

// Client-side initialization
const config = createFhevmConfig({
  chains: [31337],
  ssr: false,
})

// Hydrate with server state
const { onMount } = hydrate(config, {
  initialState: window.__FHEVM_STATE__,
})

// Call onMount when ready
await onMount()

// Config is now hydrated and ready
const state = config.getState()
console.log('Hydrated state:', state)
```

## State Validation

`hydrate()` automatically validates the initial state:

```typescript
const { onMount } = hydrate(config, {
  initialState: {
    chainId: 99999, // Not in config.chains
    status: 'idle',
    error: undefined,
    instance: undefined,
  },
})

// After hydration:
const state = config.getState()
console.log(state.chainId) // Falls back to config.chains[0]
```

## AutoConnect Behavior

```typescript
// Without autoConnect (default)
const { onMount } = hydrate(config, {
  initialState,
  autoConnect: false, // Status remains 'idle'
})

// With autoConnect
const { onMount } = hydrate(config, {
  initialState,
  autoConnect: true, // Status set to 'loading'
})

// Note: Framework adapters should handle instance creation manually
// using createInstance() in lifecycle hooks
```

## Storage Considerations

For SSR, use `noopStorage()` on the server:

```typescript
import { createFhevmConfig, noopStorage } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  ssr: typeof window === 'undefined',
  storage: typeof window === 'undefined'
    ? noopStorage() // Server: no persistence
    : undefined,    // Client: default localStorage
})
```

## Best Practices

### 1. Match Server and Client Config

```typescript
// ✅ Good: Same config structure
// server.ts
const serverConfig = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: true,
})

// client.ts
const clientConfig = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: false,
})
```

### 2. Use FhevmProvider for React

```typescript
// ✅ Good: Provider handles hydration automatically
<FhevmProvider config={config} initialState={serverState}>
  <App />
</FhevmProvider>

// ⚠️ Manual: Only if not using React
const { onMount } = hydrate(config, { initialState })
await onMount()
```

### 3. Serialize State Safely

```typescript
// ✅ Good: Safe JSON serialization
const initialState = config.getState()
const serialized = JSON.stringify(initialState)

// ❌ Bad: Includes functions/symbols
const bad = JSON.stringify(config) // Don't serialize entire config
```

## Where to go next

🟨 Go to [**createFhevmConfig()**](createFhevmConfig.md) to configure SSR.

🟨 Go to [**FhevmProvider**](../react/FhevmProvider.md) for React hydration.

🟨 Go to [**Storage**](../../core-concepts/storage.md) for SSR storage patterns.
