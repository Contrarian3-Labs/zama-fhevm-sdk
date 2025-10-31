---
description: Complete examples demonstrating FHEVM SDK usage in real applications.
---

# Examples

Learn by example with these complete, runnable demonstrations of FHEVM SDK features.

## Available Examples

### [Encrypted Counter](encrypted-counter.md)

A simple encrypted counter that demonstrates:
- Basic encryption and decryption workflow
- State management with encrypted values
- EIP-712 signature handling
- React integration patterns

**Difficulty:** Beginner
**Topics:** Encryption, Decryption, React Hooks

::: tip More Examples Coming Soon
Additional examples including encrypted ERC20 tokens, private voting, and confidential auctions will be added once the SDK reaches stable release.
:::

---

## Running the Examples

All examples are fully functional and can be run locally:

### Prerequisites

- Node.js 20 or higher
- MetaMask or another Web3 wallet
- Local FHEVM node (for development)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/zama-ai/fhevm-react-template
   cd fhevm-react-template
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local FHEVM node (if using mock chains):**
   ```bash
   npm run fhevm:start
   ```

4. **Run the example:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Example Structure

Each example follows this structure:

```
example-name/
├── README.md              # Example documentation
├── components/            # React components
├── contracts/             # Solidity smart contracts
├── hooks/                 # Custom React hooks
└── utils/                 # Helper functions
```

## Learning Path

We recommend following this order:

1. **Start with [Encrypted Counter](encrypted-counter.md)**
   - Understand basic encryption/decryption
   - Learn React hook usage
   - Get familiar with FHEVM instance management

2. **More examples coming soon**
   - Encrypted ERC20 tokens
   - Private voting systems
   - Confidential auctions

## Key Concepts Demonstrated

### Encryption

```typescript
// Encrypt a value for a contract
const encrypted = await encrypt(config, {
  instance,
  contractAddress: contract.address,
  userAddress: await signer.getAddress(),
  values: [{ type: 'euint8', value: 42 }]
})
```

All examples show how to:
- Create FHEVM instances
- Encrypt values with proper binding
- Handle encryption errors
- Pass encrypted data to contracts

### Decryption

```typescript
// Decrypt an encrypted handle
const decrypted = await decrypt(config, {
  instance,
  requests: [{
    handle: encryptedHandle,
    contractAddress: contract.address
  }],
  signer,
  storage: config.storage
})
```

All examples demonstrate:
- EIP-712 signature management
- Signature caching
- Batch decryption
- Error handling

### React Integration

```typescript
function Component() {
  // Get FHEVM instance
  const { instance, isLoading, error } = useFhevmInstance({
    provider: window.ethereum,
    chainId: 31337,
  })

  // Use encrypt/decrypt actions
  const encrypted = await encrypt(config, { ... })
  const decrypted = await decrypt(config, { ... })
}
```

All examples show:
- Hook usage patterns
- State management
- Loading/error states
- Component lifecycle handling

## Common Patterns

### Pattern 1: Pre-warm Signature

```typescript
useEffect(() => {
  if (instance && signer) {
    // Pre-fetch decryption signature
    getDecryptionSignature(config, {
      instance,
      contractAddresses: [contract.address],
      signer,
      storage: config.storage,
    })
  }
}, [instance, signer])
```

### Pattern 2: Batch Operations

```typescript
// Encrypt multiple values
const encrypted = await encrypt(config, {
  instance,
  contractAddress,
  userAddress,
  values: [
    { type: 'euint32', value: 100 },
    { type: 'euint32', value: 200 },
  ]
})

// Decrypt multiple handles
const decrypted = await decrypt(config, {
  instance,
  requests: [
    { handle: handle1, contractAddress },
    { handle: handle2, contractAddress },
  ],
  signer,
  storage: config.storage
})
```

### Pattern 3: Error Handling

```typescript
try {
  const encrypted = await encrypt(config, { ... })
} catch (error) {
  if (error.message.includes('Instance not ready')) {
    console.log('Wait for instance creation')
  } else if (error.message.includes('PROVIDER_NOT_CONNECTED')) {
    console.log('Connect wallet first')
  } else {
    console.error('Encryption failed:', error)
  }
}
```

## Testing Examples

Each example includes tests:

```bash
# Run tests for all examples
npm test

# Run tests for specific example
npm test -- encrypted-counter
```

## Deployment

Examples can be deployed to testnets or mainnet:

1. **Update configuration:**
   ```typescript
   const config = createFhevmConfig({
     chains: [11155111], // Sepolia
     mockChains: {}, // No mock chains
   })
   ```

2. **Deploy contracts:**
   ```bash
   npm run deploy:sepolia
   ```

3. **Update contract addresses in example**

4. **Build and deploy frontend:**
   ```bash
   npm run build
   npm run deploy
   ```

## Troubleshooting

### "FHEVM instance not found"

Make sure you've wrapped your app with `FhevmProvider` and created an instance with `useFhevmInstance()`.

### "Signature expired"

Decryption signatures expire after 7 days. Clear localStorage and retry:
```javascript
localStorage.clear()
```

### "Provider not connected"

Ensure MetaMask is installed and connected. Check `window.ethereum` is available.

## Need More Examples?

Check out the complete FHEVM React template:
- [GitHub Repository](https://github.com/zama-ai/fhevm-react-template)
- [Live Demo](https://fhevm-react-template.vercel.app)

## Contributing

Want to add your own example? See our [Contributing Guide](../CONTRIBUTING.md).

## Where to go next

🟨 Go to [**Encrypted Counter**](encrypted-counter.md) to start with a simple example.

🟨 Go to [**API Reference**](../api-reference/README.md) to explore all available APIs.

🟨 Go to [**Core Concepts**](../core-concepts/README.md) to understand FHEVM fundamentals.
