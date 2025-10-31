---
description: Build your first encrypted dApp with React in under 5 minutes.
---

# Quick Start (React)

This guide will help you build a simple encrypted counter application with React and FHEVM SDK in under 5 minutes.

## Prerequisites

- Node.js 20 or higher
- A React project (Create React App, Vite, or Next.js)
- Basic knowledge of React hooks
- MetaMask or another Web3 wallet

::: info
**Don't have a React project yet?** Create one with Vite:
```bash
npm create vite@latest my-fhevm-app -- --template react-ts
cd my-fhevm-app
npm install
```
:::

::: warning
**Important:** You'll need a deployed FHEVM smart contract to interact with. See the [deployment guide](../guides/deployment.md) or use the example contract from [fhevm-hardhat-template](https://github.com/zama-ai/fhevm-hardhat-template).
:::

## Step 1: Install Dependencies

Install the FHEVM SDK and required peer dependencies:

```bash
npm install @fhevm-sdk ethers@^6.13.4
```

## Step 2: Create FHEVM Configuration

Create a file `src/fhevm.config.ts` to configure the SDK:

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

export const fhevmConfig = createFhevmConfig({
  // Supported chain IDs
  chains: [
    31337,    // Hardhat local
    11155111  // Sepolia testnet
  ],

  // Mock chains for faster local development
  mockChains: {
    31337: 'http://localhost:8545'
  },

  // Enable SSR support (for Next.js)
  ssr: typeof window === 'undefined'
})
```

::: info
**Mock Chains**: Using mock chains enables faster encryption/decryption during local development without real cryptographic operations.
:::

## Step 3: Wrap Your App with FhevmProvider

Wrap your application with `FhevmProvider` to make the FHEVM config available to all components.

### For Create React App or Vite

Update your `src/main.tsx` or `src/index.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { FhevmProvider } from '@fhevm-sdk/react'
import { fhevmConfig } from './fhevm.config'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FhevmProvider config={fhevmConfig}>
      <App />
    </FhevmProvider>
  </React.StrictMode>,
)
```

### For Next.js App Router

Create `app/providers.tsx`:

```typescript
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

Then wrap your app in `app/layout.tsx`:

```typescript
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

## Step 4: Create an Encrypted Counter Component

Create `src/components/EncryptedCounter.tsx`:

```typescript
import { useState, useEffect, useMemo } from 'react'
import { useFhevmInstance, useEncrypt, useDecrypt } from '@fhevm-sdk/react'
import { BrowserProvider } from 'ethers'

export function EncryptedCounter() {
  const [count, setCount] = useState<number | null>(null)
  const [encryptedHandle, setEncryptedHandle] = useState<string>('')

  // Get wallet provider (example uses window.ethereum)
  const provider = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    return (window as any).ethereum
  }, [])

  // Get connected wallet address (you would typically get this from wagmi or similar)
  const [address, setAddress] = useState<string>('')

  useEffect(() => {
    if (provider) {
      provider.request({ method: 'eth_requestAccounts' })
        .then((accounts: string[]) => setAddress(accounts[0]))
    }
  }, [provider])

  // Create FHEVM instance
  const { instance, status, error } = useFhevmInstance({
    provider,
    enabled: !!provider && !!address
  })

  // Get encrypt function
  const { encrypt } = useEncrypt()

  // Get decrypt function
  const { decrypt } = useDecrypt()

  // Handle increment
  const handleIncrement = async () => {
    if (!instance || !address) return

    try {
      // 🔐 Encryption Process:
      // Values are encrypted locally and bound to a specific contract/user pair.
      // This grants the bound contract FHE permissions to receive and process the encrypted value,
      // but only when it is sent by the bound user.
      const encrypted = await encrypt({
        instance,
        contractAddress: '0x...' as `0x${string}`, // TODO: Replace with your deployed contract address
        userAddress: address as `0x${string}`,
        values: [{ type: 'euint8', value: 1 }]
      })

      console.log('Encrypted increment:', encrypted)

      // Here you would call your smart contract with encrypted.handles and encrypted.inputProof
      // For example:
      // await contract.increment(encrypted.handles[0], encrypted.inputProof)

    } catch (err) {
      console.error('Encryption failed:', err)
    }
  }

  // Handle decrypt
  const handleDecrypt = async () => {
    if (!instance || !address || !encryptedHandle) return

    try {
      const ethersProvider = new BrowserProvider(provider)
      const signer = await ethersProvider.getSigner()

      // Call decrypt from hook (config already injected by useDecrypt)
      const results = await decrypt({
        instance,
        requests: [{
          handle: encryptedHandle,
          contractAddress: '0x...' as `0x${string}` // TODO: Replace with your deployed contract address
        }],
        signer,
        storage: config.storage
      })

      // Decrypt returns a record mapping handle to value
      const decryptedValue = results[encryptedHandle]
      setCount(Number(decryptedValue))

    } catch (err) {
      console.error('Decryption failed:', err)
    }
  }

  // UI
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Encrypted Counter</h2>

      {/* Status */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          FHEVM Status: <span className="font-semibold">{status}</span>
        </p>
        {error && (
          <p className="text-sm text-red-600">Error: {error.message}</p>
        )}
      </div>

      {/* Count display */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p className="text-lg">
          Count: {count !== null ? count : 'Not decrypted yet'}
        </p>
        {encryptedHandle && (
          <p className="text-xs text-gray-500 mt-2 truncate">
            Handle: {encryptedHandle}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          onClick={handleIncrement}
          disabled={status !== 'ready'}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Increment (Encrypted)
        </button>

        <button
          onClick={handleDecrypt}
          disabled={status !== 'ready' || !encryptedHandle}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Decrypt Count
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded text-sm">
        <p className="font-semibold mb-2">How it works:</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-700">
          <li>Click "Increment" to encrypt the value and send to contract</li>
          <li>The contract performs FHE addition on encrypted data</li>
          <li>Click "Decrypt" to reveal the current count</li>
        </ol>
      </div>
    </div>
  )
}
```

## Step 5: Use the Component

Add the component to your `src/App.tsx`:

```typescript
import { EncryptedCounter } from './components/EncryptedCounter'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <EncryptedCounter />
    </div>
  )
}

export default App
```

## Step 6: Run Your App

Start your development server:

```bash
npm run dev
```

Open your browser and connect your MetaMask wallet. You should see the encrypted counter component!

## Understanding the Code

### FHEVM Instance

```typescript
const { instance, status, error } = useFhevmInstance({
  provider,
  enabled: !!provider && !!address
})
```

- `instance`: The FHEVM instance used for encryption/decryption
- `status`: Current status (`'idle'`, `'loading'`, `'ready'`, `'error'`)
- `error`: Error object if instance creation failed
- `enabled`: Conditionally create the instance

### Encryption

```typescript
const { encrypt } = useEncrypt()

const encrypted = await encrypt({
  instance,
  contractAddress: '0x...',
  userAddress: address,
  values: [{ type: 'euint8', value: 1 }]
})
```

Returns:
- `handles`: Array of encrypted handles to pass to contract
- `inputProof`: Proof to verify encryption

### Decryption

```typescript
const { decrypt } = useDecrypt()

const results = await decrypt({
  instance,
  signer,
  requests: [{
    handle: '0x...',
    type: 'euint8',
    contractAddress: '0x...',
    userAddress: address
  }]
})
```

Returns array of decrypted values (as bigint, boolean, or string depending on type).

::: info
**EIP-712 Signature**: The first time you decrypt, you'll be prompted to sign an EIP-712 message. This signature is cached for 7 days, so you won't be prompted again unless it expires.
:::

## Encryption Types

The SDK supports all FHEVM types:

| Type | Solidity Type | Value Range | JavaScript Type |
|------|---------------|-------------|-----------------|
| `ebool` | `ebool` | true/false | `boolean` |
| `euint8` | `euint8` | 0-255 | `number` |
| `euint16` | `euint16` | 0-65535 | `number` |
| `euint32` | `euint32` | 0-4294967295 | `number` |
| `euint64` | `euint64` | 0-2^64-1 | `number` or `bigint` |
| `euint128` | `euint128` | 0-2^128-1 | `bigint` |
| `euint256` | `euint256` | 0-2^256-1 | `bigint` |
| `eaddress` | `eaddress` | Ethereum address | `string` |

## Next Steps

Congratulations! You've built your first encrypted dApp with React and FHEVM SDK.

**What's next?**

- [Architecture Overview](architecture-overview.md) - Understand how the SDK works
- [API Reference - React](../api-reference/react/README.md) - Explore all React hooks
- [Core Concepts](../core-concepts/README.md) - Deep dive into FHEVM SDK concepts
- [Examples](../examples/encrypted-counter.md) - See more practical examples

## Troubleshooting

### "FHEVM instance not found"

Make sure you've wrapped your app with `FhevmProvider` and the provider is available.

### "Signature expired"

Decryption signatures expire after 7 days. Clear your browser's localStorage and try again:

```javascript
localStorage.clear()
```

### "Provider not connected"

Ensure MetaMask is installed and connected. Check `window.ethereum` is available.

### TypeScript Errors

If you see module resolution errors, ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler" // or "node16"
  }
}
```

::: tip
**Need help?** Join our [Discord community](https://discord.com/invite/zama) or check the [Troubleshooting guide](../../troubleshooting/common-errors.md).
:::

## Complete Example Repository

For a complete working example, see:
- [FHEVM React Template](https://github.com/zama-ai/fhevm-react-template/tree/main/packages/nextjs)
- [Counter Example](../examples/encrypted-counter.md)

---

**Ready to learn more?** Continue to [Quick Start (Vue)](quick-start-vue.md) or [Architecture Overview](architecture-overview.md).
