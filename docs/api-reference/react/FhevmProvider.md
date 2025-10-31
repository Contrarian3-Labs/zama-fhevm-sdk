---
description: React Context Provider for FHEVM configuration.
---

# FhevmProvider

React Context Provider that makes FHEVM configuration available to all child components. Wraps your app to provide config access throughout the component tree.

## Import

```typescript
import { FhevmProvider } from '@fhevm-sdk/react'
```

## Usage

```typescript
import { createFhevmConfig, FhevmProvider } from '@fhevm-sdk/react'

const fhevmConfig = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
})

function App() {
  return (
    <FhevmProvider config={fhevmConfig}>
      <YourApp />
    </FhevmProvider>
  )
}
```

## Parameters

```typescript
type FhevmProviderProps = {
  config: FhevmConfig                 // FHEVM configuration object
  initialState?: State | undefined    // Initial state for SSR hydration
  autoConnect?: boolean | undefined   // Auto-connect on mount (default: false)
}
```

### config

- **Type:** `FhevmConfig`
- **Required:** Yes

FHEVM configuration object created with `createFhevmConfig()`.

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: { 31337: 'http://localhost:8545' },
})

<FhevmProvider config={config}>
  <App />
</FhevmProvider>
```

### initialState

- **Type:** `State | undefined`
- **Required:** No

Initial state for SSR hydration. Used to restore FHEVM state on the client after server-side rendering.

```typescript
<FhevmProvider
  config={config}
  initialState={serverState}
>
  <App />
</FhevmProvider>
```

### autoConnect

- **Type:** `boolean | undefined`
- **Default:** `false`

Whether to automatically connect/create instances on mount. Generally not recommended; use manual instance creation with `useFhevmInstance()` instead.

## Examples

### Basic Setup (Create React App / Vite)

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createFhevmConfig, FhevmProvider } from '@fhevm-sdk/react'
import App from './App'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FhevmProvider config={config}>
      <App />
    </FhevmProvider>
  </React.StrictMode>,
)
```

### Next.js App Router

```typescript
// app/providers.tsx
'use client'

import { FhevmProvider } from '@fhevm-sdk/react'
import { fhevmConfig } from './fhevm.config'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FhevmProvider config={fhevmConfig}>
      {children}
    </FhevmProvider>
  )
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### With SSR (Server-Side Rendering)

```typescript
// server.tsx (SSR environment)
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: true, // Enable SSR mode
})

// Serialize state for client
const serverState = config.getState()

// client.tsx (Browser environment)
<FhevmProvider
  config={config}
  initialState={serverState}
>
  <App />
</FhevmProvider>
```

### Multiple Providers (Not Recommended)

You can nest providers, but generally one provider at the root is sufficient:

```typescript
// ⚠️ Usually not needed
<FhevmProvider config={mainConfig}>
  <MainApp />
  <FhevmProvider config={altConfig}>
    <AltApp />
  </FhevmProvider>
</FhevmProvider>
```

## Accessing Config in Components

Use `useConfig()` hook to access the config:

```typescript
import { useConfig } from '@fhevm-sdk/react'

function MyComponent() {
  const config = useConfig()

  // Access state
  const state = config.getState()

  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = config.subscribe((state) => {
      console.log('State changed:', state)
    })
    return unsubscribe
  }, [config])

  return null
}
```

## Error Handling

### Missing Provider

If a component uses FHEVM hooks without a provider, you'll get an error:

```typescript
// ❌ Error: FhevmProvider not found
function BadComponent() {
  const { instance } = useFhevmInstance({ ... })
}

// ✅ Good: Wrapped with provider
<FhevmProvider config={config}>
  <GoodComponent />
</FhevmProvider>
```

### Invalid Config

```typescript
try {
  const config = createFhevmConfig({
    chains: [], // ❌ Empty chains
  })
} catch (error) {
  console.error('Invalid config:', error)
}
```

## Best Practices

### 1. Single Provider at Root

```typescript
// ✅ Good: One provider at app root
<FhevmProvider config={config}>
  <App />
</FhevmProvider>
```

### 2. Create Config Outside Components

```typescript
// ✅ Good: Config created once
const config = createFhevmConfig({ ... })

function App() {
  return <FhevmProvider config={config}>...</FhevmProvider>
}

// ❌ Bad: Config recreated on every render
function BadApp() {
  const config = createFhevmConfig({ ... }) // Recreated!
  return <FhevmProvider config={config}>...</FhevmProvider>
}
```

### 3. Use with TypeScript

```typescript
import type { FhevmConfig } from '@fhevm-sdk/core'

const config: FhevmConfig = createFhevmConfig({
  chains: [31337],
})

<FhevmProvider config={config}>
  <App />
</FhevmProvider>
```

## SSR Hydration Flow

```
Server:
  1. Create config with ssr: true
  2. Render app with FhevmProvider
  3. Serialize state: config.getState()
  4. Send HTML + serialized state to client

Client:
  1. Create same config
  2. Pass initialState to FhevmProvider
  3. Provider hydrates state automatically
  4. App continues with restored state
```

## Comparison with Wagmi

| Feature | Wagmi | FHEVM SDK |
|---------|-------|-----------|
| Provider Component | `WagmiProvider` | `FhevmProvider` |
| Config Creation | `createConfig()` | `createFhevmConfig()` |
| Context API | ✅ Yes | ✅ Yes |
| SSR Hydration | ✅ Yes | ✅ Yes |
| Auto-Connect | ✅ Optional | ✅ Optional |

## Where to go next

🟨 Go to [**createFhevmConfig()**](../core/createFhevmConfig.md) to configure the provider.

🟨 Go to [**useFhevmInstance()**](useFhevmInstance.md) to use FHEVM in components.

🟨 Go to [**hydrate()**](../core/hydrate.md) for SSR hydration details.
