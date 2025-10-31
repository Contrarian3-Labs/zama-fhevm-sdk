---
description: Understanding storage abstraction for signature caching.
---

# Storage

FHEVM SDK uses a storage abstraction to cache decryption signatures, enabling flexible storage backends across different environments.

## Why Storage?

Decryption signatures are cached to avoid repeated wallet prompts:

```typescript
// First decryption: User signs
await decrypt(config, { ... })
// → Wallet popup: "Sign message"
// → Signature saved to storage

// Second decryption (within 7 days): Uses cached signature
await decrypt(config, { ... })
// → No wallet popup!
// → Signature loaded from storage
```

## Default Storage

### Browser (localStorage)

```typescript
const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }
  // storage: Uses localStorage by default
})
```

**Storage keys:**
- `fhevm-sig-${userAddress}-${contractAddresses}` - Decryption signatures

### Node.js (Noop Storage)

```typescript
const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: true  // Automatically uses noop storage
})
```

Noop storage discards all data (no persistence).

## Custom Storage

Create custom storage for different backends:

### IndexedDB

```typescript
import { createStorage } from '@fhevm-sdk/core'

const indexedDBStorage = createStorage({
  storage: {
    async getItem(key) {
      const db = await openDB('fhevm-storage', 1)
      return await db.get('signatures', key)
    },
    async setItem(key, value) {
      const db = await openDB('fhevm-storage', 1)
      await db.put('signatures', value, key)
    },
    async removeItem(key) {
      const db = await openDB('fhevm-storage', 1)
      await db.delete('signatures', key)
    }
  }
})

const config = createFhevmConfig({
  chains: [31337],
  storage: indexedDBStorage
})
```

### Redis (Server-side)

```typescript
import { createStorage } from '@fhevm-sdk/core'
import Redis from 'ioredis'

const redis = new Redis()

const redisStorage = createStorage({
  storage: {
    async getItem(key) {
      return await redis.get(`fhevm:${key}`)
    },
    async setItem(key, value) {
      await redis.set(`fhevm:${key}`, value, 'EX', 604800)  // 7 days
    },
    async removeItem(key) {
      await redis.del(`fhevm:${key}`)
    }
  }
})

const config = createFhevmConfig({
  chains: [31337],
  storage: redisStorage
})
```

### Session Storage

```typescript
const sessionStorage = createStorage({
  storage: {
    async getItem(key) {
      return window.sessionStorage.getItem(key)
    },
    async setItem(key, value) {
      window.sessionStorage.setItem(key, value)
    },
    async removeItem(key) {
      window.sessionStorage.removeItem(key)
    }
  }
})
```

### Memory Storage (Testing)

```typescript
const memoryStore = new Map<string, string>()

const memoryStorage = createStorage({
  storage: {
    async getItem(key) {
      return memoryStore.get(key) || null
    },
    async setItem(key, value) {
      memoryStore.set(key, value)
    },
    async removeItem(key) {
      memoryStore.delete(key)
    }
  }
})
```

## Storage Interface

All storage implementations must implement this interface:

```typescript
interface GenericStringStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}
```

## Built-in Serialization

Storage automatically handles complex types:

```typescript
// BigInt serialization
const signature = {
  startTimestamp: 1234567890n,  // BigInt
  durationDays: 7
}

// Automatically serialized to JSON-compatible format
await storage.setItem('key', JSON.stringify(signature))

// Automatically deserialized back to BigInt
const loaded = JSON.parse(await storage.getItem('key'))
// BigInt values are restored
```

**Supported types:**
- `string`
- `number`
- `boolean`
- `BigInt` (automatically converted)
- `Uint8Array` (automatically converted)
- Plain objects
- Arrays

## SSR Considerations

### Next.js (SSR)

```typescript
import { createFhevmConfig, createStorage, noopStorage } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: typeof window === 'undefined',
  storage: typeof window === 'undefined' 
    ? noopStorage()  // Server-side: noop
    : undefined      // Client-side: localStorage
})
```

### Nuxt (SSR)

```typescript
const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: import.meta.server,
  storage: import.meta.server ? noopStorage() : undefined
})
```

## Storage Operations

### Manual Access

```typescript
const config = createFhevmConfig({ ... })

// Get value
const signature = await config.storage.getItem('fhevm-sig-0x...')
console.log(signature)

// Set value
await config.storage.setItem('fhevm-sig-0x...', JSON.stringify({
  publicKey: '0x...',
  signature: '0x...',
  startTimestamp: Date.now()
}))

// Remove value
await config.storage.removeItem('fhevm-sig-0x...')
```

### Clear All Signatures

```typescript
// Browser localStorage
Object.keys(localStorage)
  .filter(key => key.startsWith('fhevm-sig-'))
  .forEach(key => localStorage.removeItem(key))

// Custom storage (implement yourself)
async function clearAllSignatures() {
  // Implementation depends on backend
}
```

## Noop Storage

Noop storage provides a no-operation implementation:

```typescript
import { noopStorage } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  storage: noopStorage()
})
```

**Behavior:**
- `getItem()` always returns `null`
- `setItem()` does nothing
- `removeItem()` does nothing

**Use cases:**
- SSR environments
- Testing without persistence
- Temporary sessions

## Storage Best Practices

### 1. Use Appropriate Backend

```typescript
// ✅ Browser: localStorage
const browserConfig = createFhevmConfig({ 
  chains: [31337]
  // Uses localStorage by default
})

// ✅ Server: Redis/Database
const serverConfig = createFhevmConfig({
  chains: [31337],
  storage: redisStorage
})

// ✅ Testing: Memory
const testConfig = createFhevmConfig({
  chains: [31337],
  storage: memoryStorage
})
```

### 2. Handle Storage Errors

```typescript
const storage = createStorage({
  storage: {
    async getItem(key) {
      try {
        return await backendGetItem(key)
      } catch (error) {
        console.error('Storage getItem failed:', error)
        return null  // Fallback to null
      }
    },
    async setItem(key, value) {
      try {
        await backendSetItem(key, value)
      } catch (error) {
        console.error('Storage setItem failed:', error)
        // Don't throw - allow operation to continue
      }
    },
    async removeItem(key) {
      try {
        await backendRemoveItem(key)
      } catch (error) {
        console.error('Storage removeItem failed:', error)
      }
    }
  }
})
```

### 3. Implement Expiry

```typescript
const storageWithExpiry = createStorage({
  storage: {
    async getItem(key) {
      const item = localStorage.getItem(key)
      if (!item) return null

      const { value, expiry } = JSON.parse(item)
      if (Date.now() > expiry) {
        localStorage.removeItem(key)
        return null
      }

      return value
    },
    async setItem(key, value) {
      const item = {
        value,
        expiry: Date.now() + 7 * 24 * 60 * 60 * 1000  // 7 days
      }
      localStorage.setItem(key, JSON.stringify(item))
    },
    async removeItem(key) {
      localStorage.removeItem(key)
    }
  }
})
```

### 4. Namespace Keys

```typescript
const storage = createStorage({
  storage: {
    async getItem(key) {
      return await backend.get(`myapp:fhevm:${key}`)
    },
    async setItem(key, value) {
      await backend.set(`myapp:fhevm:${key}`, value)
    },
    async removeItem(key) {
      await backend.del(`myapp:fhevm:${key}`)
    }
  }
})
```

## Testing Storage

### Mock Storage

```typescript
const mockStorage = createStorage({
  storage: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {})
  }
})

const config = createFhevmConfig({
  chains: [31337],
  storage: mockStorage
})

// Test
await decrypt(config, { ... })
expect(mockStorage.storage.setItem).toHaveBeenCalled()
```

### Spy on Storage

```typescript
const originalSetItem = localStorage.setItem
const setItemSpy = vi.spyOn(localStorage, 'setItem')

await decrypt(config, { ... })

expect(setItemSpy).toHaveBeenCalledWith(
  expect.stringContaining('fhevm-sig-'),
  expect.any(String)
)

setItemSpy.mockRestore()
```

## Where to go next

🟨 Go to [**createStorage() API**](../api-reference/core/createStorage.md) for complete storage API reference.

🟨 Go to [**Configuration**](configuration.md) to integrate storage with config.

🟨 Go to [**Decryption**](decryption.md) to understand how signatures are cached.

🟨 Go to [**Testing Guide**](../guides/testing.md) for testing with different storage backends.
