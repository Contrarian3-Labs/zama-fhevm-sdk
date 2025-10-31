---
description: Create storage adapter for state persistence with automatic key prefixing and FHEVM-aware serialization.
---

# createStorage()

Creates a storage abstraction with automatic key prefixing and custom serialization for FHEVM types (BigInt, Uint8Array).

## Import Path

```typescript
import { createStorage } from '@fhevm-sdk/core'
```

## Type Signature

```typescript
function createStorage(
  parameters: CreateStorageParameters
): Storage
```

## Parameters

### `parameters`

Storage configuration object.

**Properties:**

#### `storage` (optional)

Base storage implementation.

- **Type:** `BaseStorage | undefined`
- **Default:** `getDefaultStorage()` (auto-detect)
- **Options:** `localStorage`, `sessionStorage`, IndexedDB, custom

#### `key` (optional)

Prefix for all storage keys.

- **Type:** `string`
- **Default:** `'fhevm'`

## Examples

### Default Storage

```typescript
const storage = createStorage({
  storage: localStorage
})
```

### Custom Storage

```typescript
const storage = createStorage({
  storage: {
    async getItem(key) {
      return await customDB.get(key)
    },
    async setItem(key, value) {
      await customDB.set(key, value)
    },
    async removeItem(key) {
      await customDB.delete(key)
    }
  }
})
```

## See Also

- [`createFhevmConfig()`](createFhevmConfig.md)
- [Storage Guide](../../guides/choosing-storage.md)
