---
description: React hook for managing FHEVM instance lifecycle with reactive state.
---

# useFhevm()

React hook that manages FHEVM instance creation, lifecycle, and state. Handles automatic refresh on provider/chain changes, abort control, and error management.

## Import Path

```typescript
import { useFhevm } from '@fhevm-sdk/react'
```

## Type Signature

```typescript
function useFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | undefined
  chainId: number | undefined
  enabled?: boolean
  initialMockChains?: Readonly<Record<number, string>>
}): {
  instance: FhevmInstance | undefined
  refresh: () => void
  error: Error | undefined
  status: FhevmGoState
}
```

## Parameters

### `provider` (required)

EIP-1193 provider or RPC URL for blockchain connection.

- **Type:** `string | ethers.Eip1193Provider | undefined`
- **Example:** `window.ethereum` (MetaMask)
- **Example:** `'http://localhost:8545'` (Hardhat)
- **Reactive:** Yes - changes trigger instance refresh

### `chainId` (required)

Chain ID to create instance for.

- **Type:** `number | undefined`
- **Example:** `31337` (Hardhat)
- **Example:** `11155111` (Sepolia)
- **Reactive:** Yes - changes trigger instance refresh

### `enabled` (optional)

Whether to enable instance creation.

- **Type:** `boolean`
- **Default:** `true`
- **Use case:** Disable until user connects wallet
- **Example:** `enabled: !!address && !!provider`

### `initialMockChains` (optional)

Mock chains configuration for local development.

- **Type:** `Readonly<Record<number, string>>`
- **Example:** `{ 31337: 'http://localhost:8545' }`
- **Use case:** Override config mock chains per hook

## Returns

### `instance`

FHEVM instance when ready, otherwise undefined.

- **Type:** `FhevmInstance | undefined`
- **When defined:** `status === 'ready'`
- **Usage:** Pass to `encrypt()` and `decrypt()` actions

### `status`

Current instance lifecycle state.

- **Type:** `'idle' | 'loading' | 'ready' | 'error'`
- **States:**
  - `idle` - Provider not available or `enabled=false`
  - `loading` - Creating FHEVM instance
  - `ready` - Instance created successfully
  - `error` - Instance creation failed

### `error`

Error if instance creation failed.

- **Type:** `Error | undefined`
- **When defined:** `status === 'error'`
- **Usage:** Display error message to user

### `refresh`

Function to manually refresh the instance.

- **Type:** `() => void`
- **Use case:** Force instance recreation after error
- **Example:** Retry button after failure

## Examples

### Basic Usage with MetaMask

```typescript
import { useFhevm } from '@fhevm-sdk/react'
import { useAccount } from 'wagmi'

function MyComponent() {
  const { address } = useAccount()

  const { instance, status, error } = useFhevm({
    provider: window.ethereum,
    chainId: 31337,
    enabled: !!address  // Only create when wallet connected
  })

  if (status === 'loading') return <div>Loading FHEVM...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!instance) return <div>Connect wallet to continue</div>

  return <div>FHEVM ready!</div>
}
```

### With Encryption

```typescript
import { useFhevm } from '@fhevm-sdk/react'
import { encrypt } from '@fhevm-sdk/actions'
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }
})

function Counter() {
  const { instance, status } = useFhevm({
    provider: window.ethereum,
    chainId: 31337
  })

  const [value, setValue] = useState(0)

  const handleIncrement = async () => {
    if (!instance) return

    const encrypted = await encrypt(config, {
      instance,
      contractAddress: contract.address,
      userAddress: await signer.getAddress(),
      values: [{ type: 'euint8', value: 1 }]
    })

    // Send encrypted value to contract
    await contract.increment(encrypted.handles[0], encrypted.inputProof)
  }

  return (
    <button onClick={handleIncrement} disabled={status !== 'ready'}>
      Increment
    </button>
  )
}
```

### With Decryption

```typescript
import { useFhevm } from '@fhevm-sdk/react'
import { decrypt } from '@fhevm-sdk/actions'

function BalanceDisplay({ encryptedHandle }: { encryptedHandle: string }) {
  const { instance, status } = useFhevm({
    provider: window.ethereum,
    chainId: 31337
  })

  const [balance, setBalance] = useState<bigint | null>(null)

  const handleDecrypt = async () => {
    if (!instance) return

    const signer = await provider.getSigner()

    const decrypted = await decrypt(config, {
      instance,
      requests: [{ 
        handle: encryptedHandle, 
        contractAddress: contract.address 
      }],
      signer,
      storage: config.storage
    })

    setBalance(decrypted[encryptedHandle] as bigint)
  }

  return (
    <div>
      <button onClick={handleDecrypt} disabled={status !== 'ready'}>
        Decrypt Balance
      </button>
      {balance !== null && <p>Balance: {balance.toString()}</p>}
    </div>
  )
}
```

### Error Handling with Retry

```typescript
function RobustFhevmComponent() {
  const { instance, status, error, refresh } = useFhevm({
    provider: window.ethereum,
    chainId: 31337
  })

  if (status === 'loading') {
    return <div>Loading FHEVM instance...</div>
  }

  if (status === 'error') {
    return (
      <div>
        <p>Failed to create FHEVM instance: {error?.message}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    )
  }

  if (status === 'idle') {
    return <div>Connect your wallet to continue</div>
  }

  return <div>Instance ready: {instance ? 'Yes' : 'No'}</div>
}
```

### Conditional Enabling

```typescript
import { useAccount, useChainId } from 'wagmi'

function ConditionalFhevm() {
  const { address } = useAccount()
  const chainId = useChainId()

  const { instance, status } = useFhevm({
    provider: window.ethereum,
    chainId,
    enabled: !!address && chainId === 31337  // Only on Hardhat
  })

  return (
    <div>
      Status: {status}
      {status === 'ready' && <p>FHEVM ready on Hardhat!</p>}
    </div>
  )
}
```

### With Mock Chains Override

```typescript
function DevComponent() {
  const { instance } = useFhevm({
    provider: 'http://localhost:8545',
    chainId: 31337,
    initialMockChains: {
      31337: 'http://localhost:8545'  // Override for this component
    }
  })

  // Instance uses mock mode (fast, no real crypto)
}
```

### Status-Based UI

```typescript
function StatusDrivenUI() {
  const { instance, status, error } = useFhevm({
    provider: window.ethereum,
    chainId: 31337
  })

  return (
    <div>
      {status === 'idle' && <p>Waiting for wallet connection...</p>}
      {status === 'loading' && <Spinner />}
      {status === 'ready' && <EncryptionForm instance={instance!} />}
      {status === 'error' && <ErrorAlert error={error!} />}
    </div>
  )
}
```

### With Wagmi Integration

```typescript
import { useAccount, useChainId, usePublicClient } from 'wagmi'
import { useFhevm } from '@fhevm-sdk/react'

function WagmiIntegration() {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  const { instance, status } = useFhevm({
    provider: publicClient?.transport.url || window.ethereum,
    chainId,
    enabled: !!address
  })

  return <div>Status: {status}</div>
}
```

## Lifecycle

### Status Flow

```
┌─────┐
│ idle │ ← enabled=false or provider=undefined
└──┬──┘
   │ enabled=true && provider defined
   ↓
┌─────────┐
│ loading │ ← Creating instance
└────┬────┘
     │
     ├─ Success ──→ ┌───────┐
     │              │ ready │
     │              └───┬───┘
     │                  │
     └─ Error ─────→ ┌───────┐
                     │ error │
                     └───────┘
```

### Reactive Refresh

Hook automatically refreshes instance when:
- `provider` changes (e.g., user switches wallet)
- `chainId` changes (e.g., user switches network)
- `enabled` changes from false → true
- `refresh()` is called manually

### Abort Control

Hook uses AbortController to cancel in-flight instance creation:
- When component unmounts
- When parameters change before completion
- When `enabled` becomes false
- When `refresh()` is called

This prevents memory leaks and stale state updates.

## Notes

::: info
**Automatic Caching:** FHEVM instances are cached per chain ID. If you create multiple components with `useFhevm()` for the same chain, they share the same instance (no redundant creation).
:::

::: warning
**Provider Must Be Defined:** If `provider` is `undefined`, status will be `idle`. This is common during SSR or before wallet connection. Use `enabled` to control when instance creation should start.
:::

::: tip
**Actions Pattern:** Use this hook ONLY for instance management. For encryption/decryption, use the `encrypt()` and `decrypt()` actions from `@fhevm-sdk/actions`. This keeps business logic separate from React concerns.
:::

## Internal Implementation

The hook uses these React hooks internally:
- `useState` - For instance, status, error state
- `useEffect` - For reactive refresh on parameter changes
- `useRef` - For AbortController and parameter tracking
- `useCallback` - For stable `refresh()` function

## See Also

- [`encrypt()`](../actions/encrypt.md) - Encrypt values with instance
- [`decrypt()`](../actions/decrypt.md) - Decrypt handles with instance
- [`createInstance()`](../actions/createInstance.md) - Underlying action
- [Getting Started - React](../../getting-started/quick-start-react.md)
- [React API Overview](README.md)

## Type Definitions

```typescript
type FhevmGoState = 'idle' | 'loading' | 'ready' | 'error'

function useFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | undefined
  chainId: number | undefined
  enabled?: boolean
  initialMockChains?: Readonly<Record<number, string>>
}): {
  instance: FhevmInstance | undefined
  refresh: () => void
  error: Error | undefined
  status: FhevmGoState
}
```
