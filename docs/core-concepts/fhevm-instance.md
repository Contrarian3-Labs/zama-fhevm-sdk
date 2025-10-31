---
description: Understanding FHEVM instances and their lifecycle.
---

# FHEVM Instance

The FHEVM instance is the core object that provides cryptographic operations for encryption and decryption.

## What is an Instance?

An FHEVMinstance provides three main capabilities:

1. **Get Public Key** - Retrieve FHEVM public key for encryption
2. **Create Encrypted Input** - Build encrypted inputs for smart contracts
3. **User Decrypt** - Decrypt ciphertext with EIP-712 signature

## Creating an Instance

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance } from '@fhevm-sdk/actions'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }
})

const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})
```

## Instance Methods

### getPublicKey()

Returns the FHEVM public key used for encryption.

```typescript
const publicKey = instance.getPublicKey()
console.log(publicKey.key)  // Hex string
```

**Mock chains:** Returns a mock public key  
**Production chains:** Fetches real public key from blockchain

### createEncryptedInput()

Creates a builder for encrypting multiple values.

```typescript
const input = instance.createEncryptedInput(
  '0xContractAddress',  // Contract address
  '0xUserAddress'       // User address
)

// Add values to encrypt
input.add8(42)           // euint8
input.add16(1000)        // euint16
input.add32(100000)      // euint32
input.addBool(true)      // ebool
input.addAddress('0x...')  // eaddress

// Encrypt all values
const { handles, inputProof } = await input.encrypt()
```

### userDecrypt()

Decrypts ciphertext using EIP-712 signature.

```typescript
const decrypted = await instance.userDecrypt(
  [{ handle: '0x...', contractAddress: '0x...' }],  // Requests
  privateKey,        // Ephemeral private key
  publicKey,         // Ephemeral public key
  signature,         // EIP-712 signature (no 0x prefix)
  contractAddresses, // Array of contract addresses
  userAddress,       // User's Ethereum address
  startTimestamp,    // Signature start time
  durationDays       // Signature validity (7 days)
)

console.log(decrypted['0x...'])  // Decrypted value (bigint | boolean | string)
```

## Instance Caching

Instances are automatically cached per chain ID for performance.

```typescript
const config = createFhevmConfig({ chains: [31337] })

// First call: Creates instance (~2-3 seconds)
const instance1 = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

// Second call: Returns cached instance (<10ms)
const instance2 = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})

console.log(instance1 === instance2)  // true (same object)
```

**Cache key:** Chain ID

**Benefits:**
- Avoid expensive re-initialization
- Consistent instance across components
- Automatic cache invalidation on error

## Mock vs Production Instances

### Mock Instance

```typescript
const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }  // Mock mode
})

const instance = await createInstance(config, {
  provider: 'http://localhost:8545',
  chainId: 31337
})
```

**Characteristics:**
- Uses `@fhevm/mock-utils`
- 100x faster encryption/decryption
- No real cryptographic operations
- Works in Node.js (no browser required)
- Perfect for testing and development

### Production Instance

```typescript
const config = createFhevmConfig({
  chains: [11155111],  // Sepolia
  mockChains: {}       // Not a mock chain
})

const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 11155111
})
```

**Characteristics:**
- Uses `@zama-fhe/relayer-sdk`
- Real FHEVM cryptographic operations
- Fetches public keys from blockchain
- Browser only (requires `window.relayerSDK`)
- Suitable for testnets and mainnet

## Instance Lifecycle

```
createInstance() called
    ↓
Check cache
    ├─ Found ──→ Return cached instance
    │
    └─ Not found
        ↓
    Check mock vs production
        ├─ Mock chain ──→ Create mock instance
        │                 └→ Cache and return
        │
        └─ Production ──→ Fetch public key from chain
                          └→ Initialize relayer SDK
                          └→ Cache and return
```

## Error Handling

```typescript
try {
  const instance = await createInstance(config, {
    provider: window.ethereum,
    chainId: 31337
  })
} catch (error) {
  if (error.code === 'PROVIDER_NOT_CONNECTED') {
    console.log('Connect wallet first')
  } else if (error.code === 'CHAIN_NOT_SUPPORTED') {
    console.log('Add chain to config.chains')
  } else if (error.code === 'PUBLIC_KEY_FETCH_FAILED') {
    console.log('RPC error, check network')
  } else if (error.code === 'SSR_NOT_SUPPORTED') {
    console.log('Production chains not supported in SSR')
  }
}
```

## Using Instance with Actions

### Encryption

```typescript
import { encrypt } from '@fhevm-sdk/actions'

const encrypted = await encrypt(config, {
  instance,
  contractAddress: '0x...',
  userAddress: '0x...',
  values: [{ type: 'euint8', value: 42 }]
})
```

### Decryption

```typescript
import { decrypt } from '@fhevm-sdk/actions'

const decrypted = await decrypt(config, {
  instance,
  requests: [{ handle: '0x...', contractAddress: '0x...' }],
  signer: await provider.getSigner(),
  storage: config.storage
})
```

## React Hook

```typescript
import { useFhevm } from '@fhevm-sdk/react'

function MyComponent() {
  const { instance, status } = useFhevm({
    provider: window.ethereum,
    chainId: 31337,
    enabled: true
  })

  // instance is automatically created and cached
  // status: 'idle' | 'loading' | 'ready' | 'error'
}
```

## Best Practices

### 1. Reuse Instances

Don't create multiple instances for the same chain:

```typescript
// ✅ Good: Create once, reuse
const instance = await createInstance(config, { provider, chainId: 31337 })
// All components use same instance

// ❌ Bad: Create repeatedly
useEffect(() => {
  createInstance(config, { provider, chainId: 31337 })
}, [])  // Creates new instance every render
```

### 2. Handle Loading States

```typescript
const { instance, status } = useFhevm({ ... })

if (status === 'loading') {
  return <Loading />
}

if (!instance) {
  return <ConnectWallet />
}

// Safe to use instance here
```

### 3. Use Mock Chains for Development

```typescript
const config = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: process.env.RPC_URL || 'http://localhost:8545'
  }
})
```

### 4. Cache Cleanup

Instances are cached until page refresh. To force re-creation:

```typescript
// Clear instance from cache
delete instanceCache[chainId]

// Create new instance
const instance = await createInstance(config, { provider, chainId })
```

## Where to go next

🟨 Go to [**createInstance() API**](../api-reference/actions/createInstance.md) for complete instance creation documentation.

🟨 Go to [**Configuration**](configuration.md) to learn about config setup.

🟨 Go to [**Encryption**](encryption.md) to use the instance for encryption.

🟨 Go to [**useFhevm() Hook**](../api-reference/react/useFhevm.md) for React integration.
