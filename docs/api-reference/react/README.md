---
description: React hooks for FHEVM operations.
---

# React API

The React adapter provides **two patterns** for working with FHEVM:

1. **New Pattern (Recommended)** - Dedicated hooks with built-in state management
2. **Legacy Pattern** - Single hook + direct action calls

Both patterns are fully supported. Choose based on your needs.

## Import Paths

**New Pattern:**
```typescript
import { useFhevmInstance, useEncrypt, useDecrypt } from '@fhevm-sdk/react'
```

**Legacy Pattern:**
```typescript
import { useFhevm } from '@fhevm-sdk/react'
import { encrypt, decrypt } from '@fhevm-sdk/actions'
```

## Available Hooks

### New Pattern (Recommended)

- [`<FhevmProvider>`](FhevmProvider.md) - Context provider for config
- [`useFhevmInstance()`](useFhevmInstance.md) - Create and manage FHEVM instance
- [`useEncrypt()`](useEncrypt.md) - Encrypt values with state management
- [`useDecrypt()`](useDecrypt.md) - Decrypt handles with state management
- [`usePublicDecrypt()`](usePublicDecrypt.md) - Public decryption with state management

### Legacy Pattern

- [`useFhevm()`](useFhevm.md) - Manage FHEVM instance (use with direct action calls)

## Pattern Comparison

| Feature | New Pattern | Legacy Pattern |
|---------|-------------|----------------|
| State Management | ✅ Built-in (loading, error, data) | ⚠️ Manual |
| Setup Complexity | Simple (use hooks directly) | Medium (hooks + actions) |
| Boilerplate | Low | Higher |
| Recommended For | Most React apps | Advanced use cases, custom logic |
| Status | **Recommended** | Supported (backward compatibility) |

## Quick Examples

### Example 1: New Pattern (Recommended)

```typescript
import { useFhevmInstance, useEncrypt, useDecrypt } from '@fhevm-sdk/react'

function Counter() {
  // Create instance
  const { instance, isLoading: instanceLoading } = useFhevmInstance({
    provider: window.ethereum,
    chainId: 31337,
  })

  // Get encryption/decryption functions with state management
  const { encrypt, isLoading: encrypting } = useEncrypt()
  const { decrypt, data: decrypted } = useDecrypt()

  const handleEncrypt = async () => {
    if (!instance) return

    const result = await encrypt({
      instance,
      contractAddress: '0xContract...',
      userAddress: await signer.getAddress(),
      values: [{ type: 'euint8', value: 42 }]
    })

    // Use result.handles and result.inputProof
  }

  const handleDecrypt = async (handle: string) => {
    if (!instance) return

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    await decrypt({
      instance,
      requests: [{ handle, contractAddress: '0xContract...' }],
      signer,
      storage: config.storage
    })

    // Decrypted value available in `decrypted` state
  }

  return (
    <div>
      {instanceLoading && <div>Loading FHEVM...</div>}
      {instance && (
        <>
          <button onClick={handleEncrypt} disabled={encrypting}>
            {encrypting ? 'Encrypting...' : 'Encrypt'}
          </button>
          <button onClick={() => handleDecrypt('0x...')}>
            Decrypt
          </button>
          {decrypted && <div>Result: {JSON.stringify(decrypted)}</div>}
        </>
      )}
    </div>
  )
}
```

**Advantages:**
- Built-in loading/error states
- Less boilerplate
- Automatic state management
- Recommended for most applications

### Example 2: Legacy Pattern

```typescript
import { useFhevm } from '@fhevm-sdk/react'
import { encrypt, decrypt } from '@fhevm-sdk/actions'
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({ chains: [31337] })

function Counter() {
  const { instance, status, error } = useFhevm({
    provider: window.ethereum,
    chainId: 31337,
  })

  const handleEncrypt = async () => {
    if (!instance) return

    // Call action directly
    const encrypted = await encrypt(config, {
      instance,
      contractAddress: '0xContract...',
      userAddress: await signer.getAddress(),
      values: [{ type: 'euint8', value: 42 }]
    })
  }

  if (status === 'loading') return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <button onClick={handleEncrypt} disabled={status !== 'ready'}>
      Encrypt
    </button>
  )
}
```

**Use Cases:**
- Need custom state management logic
- Integrating with existing state (Redux, Zustand, etc.)
- Advanced control flow requirements
- Testing framework-agnostic logic

## Hook State

`useFhevm()` returns:

```typescript
{
  instance: FhevmInstance | undefined  // FHEVM instance when ready
  status: 'idle' | 'loading' | 'ready' | 'error'  // Instance state
  error: Error | undefined  // Error if creation failed
  refresh: () => void  // Manually refresh instance
}
```

## Status Lifecycle

```
idle → User not connected or enabled=false
  ↓
loading → Creating FHEVM instance
  ↓
ready → Instance created successfully
  ↓
error → Instance creation failed
```

## When to Use Each Pattern

### Use New Pattern When:
- ✅ Building a new React application
- ✅ Want built-in loading/error states
- ✅ Prefer minimal boilerplate
- ✅ Don't need custom state management logic
- ✅ Following React best practices

### Use Legacy Pattern When:
- ⚠️ Need full control over state management
- ⚠️ Integrating with Redux, Zustand, or other state libraries
- ⚠️ Testing framework-agnostic code
- ⚠️ Building custom hooks on top of actions
- ⚠️ Migrating from older SDK versions

## Why These Patterns?

**Wagmi-inspired architecture:**
- **React hooks** manage lifecycle and state (what React is good at)
- **Core actions** provide framework-agnostic business logic (reusable in Vue, vanilla JS, tests)

**Benefits:**
- **New Pattern**: Developer-friendly, batteries-included approach
- **Legacy Pattern**: Maximum flexibility and control
- **Both**: Wagmi-like separation of concerns
- **Shared**: Same underlying actions, easy to switch between patterns

## See Also

### New Pattern Hooks
- [`<FhevmProvider>`](FhevmProvider.md) - Context provider
- [`useFhevmInstance()`](useFhevmInstance.md) - Instance management
- [`useEncrypt()`](useEncrypt.md) - Encryption with state
- [`useDecrypt()`](useDecrypt.md) - Decryption with state
- [`usePublicDecrypt()`](usePublicDecrypt.md) - Public decryption

### Legacy Pattern
- [`useFhevm()`](useFhevm.md) - Instance hook (legacy)
- [`encrypt()`](../actions/encrypt.md) - Core encrypt action
- [`decrypt()`](../actions/decrypt.md) - Core decrypt action

### Guides
- [Getting Started - React](../../getting-started/quick-start-react.md) - Quick start guide
- [Actions API](../actions/README.md) - Framework-agnostic actions
