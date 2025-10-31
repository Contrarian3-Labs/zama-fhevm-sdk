---
layout: home

hero:
  name: "FHEVM SDK"
  text: "Build Confidential dApps"
  tagline: Framework-agnostic SDK for building confidential decentralized applications with Fully Homomorphic Encryption
  image:
    src: /fhevm-logo.png
    alt: FHEVM SDK
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/zama-ai/fhevm-react-template
    - theme: alt
      text: API Reference
      link: /api-reference/core/createFhevmConfig

features:
  - icon: 🔐
    title: End-to-End Encrypted
    details: Perform computations on encrypted data without ever decrypting it. Build truly confidential dApps with FHEVM.

  - icon: ⚡
    title: Framework-Agnostic
    details: Use with React, Vue, or vanilla JavaScript. Built with a three-layer architecture that separates business logic from UI frameworks.

  - icon: 🎯
    title: Wagmi-Inspired Design
    details: Config-based initialization, action pattern for core operations, and type-safe APIs. If you've used Wagmi, you'll feel right at home.

  - icon: 🔧
    title: Developer-Friendly
    details: Built-in state management with Zustand, automatic caching, and comprehensive TypeScript support.

  - icon: 📦
    title: Production-Ready
    details: Battle-tested architecture with mock chains for fast local development and real FHEVM chains for production.

  - icon: 📚
    title: Comprehensive Docs
    details: Complete API reference, interactive examples, and step-by-step guides to get you started quickly.
---

## Quick Example

::: code-group

```typescript [React]
import { FhevmProvider, useFhevmInstance, useEncrypt } from '@fhevm-sdk/react'
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }
})

function App() {
  return (
    <FhevmProvider config={config}>
      <Counter />
    </FhevmProvider>
  )
}

function Counter() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { encrypt } = useEncrypt()

  const handleEncrypt = async () => {
    const result = await encrypt({
      instance,
      contractAddress: '0x...',
      userAddress: '0x...',
      values: [{ type: 'euint8', value: 42 }]
    })
    console.log('Encrypted:', result.handles[0])
  }

  return <button onClick={handleEncrypt}>Encrypt Value</button>
}
```

```typescript [Vue]
import { createApp } from 'vue'
import { createFhevmPlugin } from '@fhevm-sdk/vue'
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }
})

const app = createApp(App)
app.use(createFhevmPlugin(config))
app.mount('#app')
```

```typescript [Vanilla JS]
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, encrypt } from '@fhevm-sdk/actions'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }
})

const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

const result = await encrypt(config, {
  instance,
  contractAddress: '0x...',
  userAddress: '0x...',
  values: [{ type: 'euint8', value: 42 }]
})

console.log('Encrypted:', result.handles[0])
```

:::

## Use Cases

Build confidential applications that were impossible before:

- **🗳️ Confidential Voting** - Vote without revealing your choice until results are public
- **💰 Private Auctions** - Sealed-bid auctions with on-chain settlement
- **🔐 Encrypted Tokens** - ERC20 tokens with hidden balances
- **🎮 Hidden Information Games** - Card games, strategy games with private state
- **🏥 Private Medical Records** - Healthcare data with on-chain verification

## Architecture

```
┌─────────────────────────────────────────┐
│         Your Application                 │
│   (React / Vue / Vanilla JS)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    Framework Adapters                    │
│  (@fhevm-sdk/react, @fhevm-sdk/vue)     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Actions Layer                    │
│   (@fhevm-sdk/actions)                  │
│  encrypt(), decrypt(), createInstance()  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Core Layer                      │
│     (@fhevm-sdk/core)                   │
│  Zustand Store + Configuration           │
└──────────────────────────────────────────┘
```

## Why Choose FHEVM SDK?

✅ **Type-Safe** - Full TypeScript support with comprehensive type definitions

✅ **Fast Development** - Mock chains enable instant encryption without crypto operations

✅ **Production-Ready** - Seamless transition from mock to real FHEVM chains

✅ **Familiar Patterns** - Wagmi-inspired API that feels natural for Web3 developers

✅ **Well-Documented** - Complete API reference, examples, and guides

✅ **Open Source** - MIT licensed, community-driven development

---

**Ready to build confidential dApps?** Start with the [Installation Guide](/getting-started/installation) or explore [Examples](/examples/).
