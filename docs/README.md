---
description: Framework-agnostic SDK for building confidential dApps with FHEVM. Supports React, Vue, and vanilla JavaScript.
---

# Welcome to FHEVM SDK

The **FHEVM SDK** is a universal, framework-agnostic library for building confidential decentralized applications using Fully Homomorphic Encryption (FHE). Inspired by Wagmi's proven architecture, it provides a clean, type-safe API that works seamlessly across React, Vue, and vanilla JavaScript.

## What is FHEVM?

FHEVM (Fully Homomorphic Encryption Virtual Machine) enables developers to build smart contracts that can perform computations on encrypted data without ever decrypting it. This unlocks powerful use cases like:

- **Confidential Voting** - Vote without revealing your choice
- **Private Auctions** - Sealed-bid auctions with on-chain settlement
- **Encrypted Tokens** - ERC20 tokens with hidden balances
- **Hidden Information Games** - Card games, strategy games with private state
- **Private Medical Records** - Healthcare data with on-chain verification

## Why FHEVM SDK?

### Framework-Agnostic Core

Built with a three-layer architecture that separates business logic from UI frameworks:

```
Core (Zustand + Pure Actions)
    ↓
React Hooks / Vue Composables / Vanilla JS
    ↓
Your Application
```

### Wagmi-Inspired Design

If you've used Wagmi, you'll feel right at home:
- Config-based initialization
- Action pattern for core operations
- Framework adapters as thin wrappers
- Type-safe with TypeScript

### Multi-Framework Support

::: code-group
```typescript [React]
import { FhevmProvider, useFhevmInstance, useEncrypt } from '@fhevm-sdk/react'

function App() {
  return (
    <FhevmProvider config={config}>
      <YourApp />
    </FhevmProvider>
  )
}

function YourComponent() {
  const { instance } = useFhevmInstance()
  const { encrypt } = useEncrypt()

  const handleEncrypt = async () => {
    const encrypted = await encrypt({
      instance,
      contractAddress: '0x...',
      userAddress: '0x...',
      values: [{ type: 'euint8', value: 42 }]
    })
  }

  return <button onClick={handleEncrypt}>Encrypt</button>
}
```

```typescript [Vue]
import { createFhevmPlugin, useFhevmInstance, useEncrypt } from '@fhevm-sdk/vue'

// main.ts
app.use(createFhevmPlugin(config))

// YourComponent.vue
<script setup>
import { useFhevmInstance, useEncrypt } from '@fhevm-sdk/vue'

const { instance } = useFhevmInstance()
const { encrypt } = useEncrypt()

const handleEncrypt = async () => {
  const encrypted = await encrypt({
    instance,
    contractAddress: '0x...',
    userAddress: '0x...',
    values: [{ type: 'euint8', value: 42 }]
  })
}
</script>

<template>
  <button @click="handleEncrypt">Encrypt</button>
</template>
```

```typescript [Vanilla JS]
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, encrypt } from '@fhevm-sdk/actions'

// Create config
const config = createFhevmConfig({
  chains: [31337]
})

// Create instance
const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

// Encrypt value
const encrypted = await encrypt(config, {
  instance,
  contractAddress: '0x...',
  userAddress: '0x...',
  values: [{ type: 'euint8', value: 42 }]
})
```
:::

### Production-Ready Features

- **Instance Caching** - Reuse FHEVM instances across your app
- **Signature Management** - Automatic caching with 7-day validity
- **Storage Abstraction** - localStorage, IndexedDB, or custom storage
- **SSR Support** - Works with Next.js and Nuxt
- **TypeScript First** - Fully typed with excellent IDE support
- **Zero Framework Dependencies** - Core has no React/Vue dependencies

## Where to go next

::: info
**New to FHEVM?** We recommend starting with the [Quick Start guide](getting-started/quick-start-react.md) to get hands-on experience, then explore the [Learning Path](LEARNING_PATH.md) for structured learning.
:::

### Get Started

- 🟨 [**Quick Start (React)**](getting-started/quick-start-react.md) - Build your first encrypted dApp with React
- 🟨 [**Quick Start (Vue)**](getting-started/quick-start-vue.md) - Build your first encrypted dApp with Vue
- 🟨 [**Quick Start (Vanilla JS)**](getting-started/quick-start-vanilla.md) - Use core actions directly

### Learn More

- 🟨 [**Learning Path**](LEARNING_PATH.md) - Structured learning from beginner to expert
- 🟨 [**Architecture Overview**](getting-started/architecture-overview.md) - Understand the SDK design
- 🟨 [**Core Concepts**](core-concepts/README.md) - Deep dive into FHEVM concepts

### Reference

- 🟨 [**API Reference**](api-reference/README.md) - Explore all available functions and hooks
- 🟨 [**Examples**](examples/README.md) - Complete working examples
- 🟨 [**Troubleshooting**](troubleshooting/README.md) - Solutions to common problems


## Features at a Glance

| Feature | Description |
|---------|-------------|
| **Framework Support** | React 18/19, Vue 3, Vanilla JS, Node.js |
| **Encryption Types** | ebool, euint8-256, eaddress |
| **Signature Caching** | 7-day validity with configurable storage |
| **Instance Management** | Automatic caching per chain ID |
| **SSR Compatible** | Next.js App Router, Pages Router, Nuxt 3 |
| **Storage Options** | localStorage, IndexedDB, custom adapters |
| **TypeScript** | Full type safety and inference |
| **Bundle Size** | Core: ~15KB gzipped, React: +2KB, Vue: +2KB |
| **Dependencies** | Minimal: Zustand (core), idb (storage) |

## Architecture Highlights

The SDK follows a **three-layer architecture** inspired by Wagmi:

```
┌─────────────────────────────────────────────┐
│  Framework Adapters (React/Vue/Vanilla)     │
│  - Thin wrappers around core actions        │
│  - Context/Plugin for config injection      │
│  - Hooks/Composables for reactive state     │
├─────────────────────────────────────────────┤
│  Core Actions (Framework-Agnostic)          │
│  - createInstance, encrypt, decrypt         │
│  - Pure functions: (config, params) => T    │
│  - Business logic isolated from UI          │
├─────────────────────────────────────────────┤
│  Core State (Zustand Vanilla Store)         │
│  - FhevmConfig with Zustand state           │
│  - Instance cache Map<chainId, instance>    │
│  - Persistence with Storage abstraction     │
└─────────────────────────────────────────────┘
```

**Benefits:**
- Framework adapters are <50 lines each
- Core actions are testable in isolation
- State management is framework-agnostic
- Easy to add new framework adapters

## Package Exports

The SDK uses **subpath exports** for optimal tree-shaking:

```typescript
// Core configuration and state
import { createFhevmConfig, createStorage } from '@fhevm-sdk/core'

// Framework-agnostic actions
import { createInstance, encrypt, decrypt } from '@fhevm-sdk/actions'

// Types only
import type { FhevmConfig, FhevmInstance } from '@fhevm-sdk/types'

// React adapter
import { FhevmProvider, useFhevmInstance } from '@fhevm-sdk/react'

// Vue adapter
import { createFhevmPlugin, useFhevmInstance } from '@fhevm-sdk/vue'

// Default export (includes React for compatibility)
import { createFhevmConfig, useFhevmInstance } from '@fhevm-sdk'
```

## Help & Community

- **Documentation**: [https://docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **Discord**: [https://discord.com/invite/zama](https://discord.com/invite/zama)
- **Community Forum**: [https://community.zama.ai](https://community.zama.ai)
- **GitHub Issues**: [Report bugs and request features](https://github.com/zama-ai/fhevm-react-template/issues)
- **Contact**: [hello@zama.ai](mailto:hello@zama.ai)

::: warning
**Testnet Only**: The Zama Protocol Testnet is not audited and is not intended for production use. Do not publish any critical or sensitive data.
:::

## License

This SDK is licensed under the **BSD-3-Clause-Clear** license.

## Acknowledgments

Built by the FHEVM community with inspiration from:
- **Wagmi** - For the excellent config-based architecture pattern
- **Zama** - For the FHEVM protocol and cryptographic primitives
- **TanStack Query** - For state management patterns
- **Zustand** - For minimal, scalable state management

---

**Ready to build confidential dApps?** Start with the [Quick Start guide](getting-started/quick-start-react.md).
