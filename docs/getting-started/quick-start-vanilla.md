---
description: Use FHEVM core actions directly with vanilla JavaScript or Node.js.
---

# Quick Start (Vanilla JS)

Use the FHEVM SDK core actions directly without any UI framework.

::: info
This guide shows how to use core FHEVM actions directly. Perfect for:
- Custom frameworks (Svelte, Solid, etc.)
- Node.js backend applications
- CLI tools and scripts
:::

## Installation

```bash
npm install @fhevm-sdk ethers@^6.13.4
```

## Basic Usage

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, encrypt, decrypt } from '@fhevm-sdk/actions'
import { BrowserProvider } from 'ethers'

// Create config
const config = createFhevmConfig({
  chains: [31337]
})

// Create instance
const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

// 🔐 Encryption Process:
// Values are encrypted locally and bound to a specific contract/user pair.
const encrypted = await encrypt(config, {
  instance,
  contractAddress: '0x...',
  userAddress: '0x...',
  values: [{ type: 'euint8', value: 42 }]
})

// Decrypt
const provider = new BrowserProvider(window.ethereum)
const signer = await provider.getSigner()

const results = await decrypt(config, {
  instance,
  signer,
  requests: [{
    handle: '0x...',
    type: 'euint8',
    contractAddress: '0x...',
    userAddress: '0x...'
  }]
})

console.log('Decrypted value:', results[0])
```

## State Subscriptions

Subscribe to config state changes:

```typescript
const unsubscribe = config.subscribe((state) => {
  console.log('State updated:', state)
  // Update your UI here
})

// Later: unsubscribe()
```

## Next Steps

- [Architecture Overview](architecture-overview.md) - Understand the three-layer design
- [Core Concepts](../core-concepts/README.md) - Deep dive into FHEVM fundamentals
- [Actions API Reference](../api-reference/actions/README.md) - Explore all available actions
- [Core API Reference](../api-reference/core/README.md) - Configuration and state management
