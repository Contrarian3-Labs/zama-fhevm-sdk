---
description: React hook for creating and managing FHEVM instances with state management.
---

# useFhevmInstance()

React hook that wraps the `createInstance` action to manage FHEVM instance creation with React state and lifecycle management.

## Import

```typescript
import { useFhevmInstance } from '@fhevm-sdk/react'
```

## Usage

```typescript
import { useFhevmInstance } from '@fhevm-sdk/react'

function Component() {
  const { instance, isLoading, error } = useFhevmInstance({
    provider: window.ethereum,
    chainId: 31337,
  })

  if (isLoading) return <div>Loading FHEVM...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!instance) return null

  return <div>FHEVM Ready!</div>
}
```

## Parameters

```typescript
type UseFhevmInstanceParameters = {
  provider: Eip1193Provider | string | undefined  // EIP-1193 provider or RPC URL
  chainId?: number | undefined                    // Target chain ID
  enabled?: boolean                               // Enable/disable instance creation
  config?: FhevmConfig | undefined                // Optional custom config
}
```

### provider

- **Type:** `Eip1193Provider | string | undefined`
- **Required:** Yes

EIP-1193 provider (like `window.ethereum`) or HTTP RPC URL string.

**Examples:**
```typescript
// MetaMask
provider: window.ethereum

// HTTP RPC URL
provider: 'http://localhost:8545'

// Undefined (disabled)
provider: undefined
```

### chainId

- **Type:** `number | undefined`
- **Required:** No

Target chain ID for the FHEVM instance.

### enabled

- **Type:** `boolean`
- **Default:** `true`

Control whether instance creation should be active. Useful for conditional initialization.

```typescript
const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337,
  enabled: isWalletConnected, // Only create instance when wallet is connected
})
```

### config

- **Type:** `FhevmConfig | undefined`
- **Required:** No

Optional custom config. If not provided, uses config from `FhevmProvider`.

## Return Type

```typescript
type UseFhevmInstanceReturnType = {
  instance: FhevmInstance | undefined        // FHEVM instance or undefined
  isLoading: boolean                         // Loading state
  isError: boolean                           // Error state
  error: Error | undefined                   // Error object if failed
  refresh: () => void                        // Manually refresh instance
}
```

## Examples

### Basic Usage

```typescript
function MyComponent() {
  const { instance, isLoading, error } = useFhevmInstance({
    provider: window.ethereum,
    chainId: 31337,
  })

  if (isLoading) return <div>Initializing FHEVM...</div>
  if (error) return <div>Failed: {error.message}</div>
  if (!instance) return <div>Connect wallet to continue</div>

  return <div>FHEVM instance ready!</div>
}
```

### With Conditional Enabling

```typescript
function ConditionalFhevm() {
  const [address, setAddress] = useState<string>()

  const { instance, isLoading } = useFhevmInstance({
    provider: window.ethereum,
    chainId: 31337,
    enabled: !!address, // Only create instance when address is available
  })

  return (
    <div>
      <button onClick={connectWallet}>Connect Wallet</button>
      {isLoading && <div>Loading...</div>}
      {instance && <div>Instance ready!</div>}
    </div>
  )
}
```

### With Manual Refresh

```typescript
function RefreshableInstance() {
  const { instance, isLoading, error, refresh } = useFhevmInstance({
    provider: window.ethereum,
    chainId: 31337,
  })

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && (
        <div>
          Error: {error.message}
          <button onClick={refresh}>Retry</button>
        </div>
      )}
      {instance && <div>Instance ready!</div>}
    </div>
  )
}
```

### With Custom Config

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

const customConfig = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
})

function CustomConfigComponent() {
  const { instance } = useFhevmInstance({
    provider: window.ethereum,
    chainId: 31337,
    config: customConfig,
  })

  return <div>{instance ? 'Ready' : 'Loading...'}</div>
}
```

## Loading States

The hook provides three distinct states:

| State | `isLoading` | `isError` | `instance` | `error` |
|-------|-------------|-----------|------------|---------|
| Initial | `false` | `false` | `undefined` | `undefined` |
| Loading | `true` | `false` | `undefined` | `undefined` |
| Success | `false` | `false` | `FhevmInstance` | `undefined` |
| Error | `false` | `true` | `undefined` | `Error` |

## Instance Caching

The hook automatically uses cached instances from the config:

```typescript
// First call: Creates new instance
const { instance: instance1 } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337,
})

// Second call (same chainId): Returns cached instance
const { instance: instance2 } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337,
})

// instance1 === instance2 (same object from cache)
```

## Abort Handling

The hook automatically aborts pending requests on:
- Component unmount
- Provider change
- Chain ID change
- Enabled state change to `false`

This prevents memory leaks and stale state updates.

## Error Handling

```typescript
function ErrorHandling() {
  const { instance, isError, error } = useFhevmInstance({
    provider: window.ethereum,
    chainId: 31337,
  })

  useEffect(() => {
    if (isError && error) {
      if (error.message.includes('PROVIDER_NOT_CONNECTED')) {
        console.log('Connect wallet first')
      } else if (error.message.includes('CHAIN_NOT_SUPPORTED')) {
        console.log('Chain not configured')
      } else if (error.message.includes('PUBLIC_KEY_FETCH_FAILED')) {
        console.log('RPC error, check network')
      }
    }
  }, [isError, error])

  return null
}
```

## Best Practices

### 1. Use with FhevmProvider

```typescript
// ✅ Good: Config provided via context
<FhevmProvider config={config}>
  <Component />
</FhevmProvider>

function Component() {
  const { instance } = useFhevmInstance({
    provider: window.ethereum,
    chainId: 31337,
  })
}
```

### 2. Handle Loading States

```typescript
// ✅ Good: Check all states
if (isLoading) return <Loading />
if (error) return <Error error={error} />
if (!instance) return <Connect />
return <App instance={instance} />
```

### 3. Use Enabled for Conditional Logic

```typescript
// ✅ Good: Controlled initialization
const { instance } = useFhevmInstance({
  provider: window.ethereum,
  chainId: 31337,
  enabled: isWalletConnected && hasPermissions,
})
```

## Where to go next

🟨 Go to [**FhevmProvider**](FhevmProvider.md) to set up the provider.

🟨 Go to [**useEncrypt()**](useEncrypt.md) to use the instance for encryption.

🟨 Go to [**React API**](README.md) for all available React hooks.
