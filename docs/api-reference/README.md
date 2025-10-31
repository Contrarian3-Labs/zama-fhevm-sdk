---
description: Complete API reference for FHEVM SDK exports.
---

# API Reference

The FHEVM SDK provides a comprehensive API organized into subpath exports for optimal tree-shaking.

## Package Exports

```typescript
// Core configuration and state
import { createFhevmConfig, createStorage } from '@fhevm-sdk/core'

// Framework-agnostic actions
import { createInstance, encrypt, decrypt } from '@fhevm-sdk/actions'

// Types only
import type { FhevmConfig, FhevmInstance } from '@fhevm-sdk/types'

// React adapter
import { FhevmProvider, useFhevmInstance } from '@fhevm-sdk/react'
```

## API Sections

### [Core](core/README.md)

Configuration and state management:
- [`createFhevmConfig()`](core/createFhevmConfig.md) - Create FHEVM configuration
- [`createStorage()`](core/createStorage.md) - Create storage adapter
- [`hydrate()`](core/hydrate.md) - Hydrate SSR state

### [Actions](actions/README.md)

Framework-agnostic business logic:
- [`createInstance()`](actions/createInstance.md) - Initialize FHEVM instance
- [`encrypt()`](actions/encrypt.md) - Encrypt values
- [`decrypt()`](actions/decrypt.md) - Decrypt handles
- [`publicDecrypt()`](actions/publicDecrypt.md) - Public decryption

### [React](react/README.md)

React hooks and components:
- [`<FhevmProvider>`](react/FhevmProvider.md) - Context provider
- [`useFhevmInstance()`](react/useFhevmInstance.md) - Get FHEVM instance
- [`useEncrypt()`](react/useEncrypt.md) - Encryption hook
- [`useDecrypt()`](react/useDecrypt.md) - Decryption hook
- [`usePublicDecrypt()`](react/usePublicDecrypt.md) - Public decryption hook

## Quick Links

- [Getting Started](../getting-started/installation.md)
- [Core Concepts](../core-concepts/README.md)
- [Examples](../examples/README.md)
- [Troubleshooting](../troubleshooting/common-errors.md)
