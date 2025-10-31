---
description: Security best practices for FHEVM applications.
---

# Security Best Practices

Essential security practices for building secure FHEVM applications.

## Signature Management

### 1. Signature Expiry

Always set appropriate signature expiry:

```typescript
// ✅ Good: 7 days (default)
const sig = await getDecryptionSignature(config, {
  instance,
  contractAddresses: ['0x...'],
  signer,
  storage: config.storage
})
// Expires in 7 days

// ❌ Risky: Custom long expiry
// Don't modify signature duration unless necessary
```

### 2. Clear Expired Signatures

```typescript
// Automatically handled by SDK
await decrypt(config, { ... })
// Throws SIGNATURE_EXPIRED if expired

// Manual cleanup
localStorage.removeItem('fhevm.decryption-signature')
```

### 3. Signature Scoping

Never reuse signatures across different contract sets:

```typescript
// ✅ Good: Separate signatures per contract
const sig1 = await getDecryptionSignature(config, {
  instance,
  contractAddresses: ['0xContractA...'],
  signer,
  storage: config.storage
})

const sig2 = await getDecryptionSignature(config, {
  instance,
  contractAddresses: ['0xContractB...'],
  signer,
  storage: config.storage
})

// ❌ Bad: Trying to use sig1 for ContractB
// Will throw SIGNATURE_MISMATCH
```

## Handle Validation

### 1. Format Validation

Always validate handle format before decryption:

```typescript
function isValidHandle(handle: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(handle)
}

// ✅ Good: Validate before decrypt
if (!isValidHandle(handle)) {
  throw new Error('Invalid handle format')
}

const decrypted = await decrypt(config, {
  instance,
  requests: [{ handle, contractAddress }],
  signer,
  storage: config.storage
})
```

### 2. Handle Source Verification

Only decrypt handles from trusted sources:

```typescript
// ✅ Good: From your own contract
const handle = await contract.getEncryptedBalance(userAddress)
const decrypted = await decrypt(config, {
  instance,
  requests: [{ handle, contractAddress: contract.address }],
  signer,
  storage: config.storage
})

// ❌ Risky: From user input
const userProvidedHandle = req.body.handle  // Don't trust!
// Validate contract address ownership first
```

## Value Range Validation

### 1. Pre-Encryption Validation

Validate values before encryption:

```typescript
function validateEuint8(value: number): void {
  if (value < 0 || value > 255) {
    throw new Error('Value out of range for euint8')
  }
}

// ✅ Good: Validate first
validateEuint8(amount)
const encrypted = await encrypt(config, {
  instance,
  contractAddress,
  userAddress,
  values: [{ type: 'euint8', value: amount }]
})

// ❌ Bad: No validation (will fail during encryption)
const encrypted = await encrypt(config, {
  instance,
  contractAddress,
  userAddress,
  values: [{ type: 'euint8', value: 999 }]  // Exceeds range!
})
```

### 2. Type-Safe Functions

```typescript
function encryptBalance(balance: bigint): Promise<EncryptResult> {
  // euint64 max: 2^64-1
  if (balance < 0n || balance >= 2n ** 64n) {
    throw new Error('Balance out of range for euint64')
  }
  
  return encrypt(config, {
    instance,
    contractAddress,
    userAddress,
    values: [{ type: 'euint64', value: balance }]
  })
}
```

## Private Key Security

### 1. Never Log Private Keys

```typescript
// ❌ NEVER do this
console.log('Private key:', sig.privateKey)
console.log('Signature:', sig.signature)

// ✅ Good: Log only non-sensitive data
console.log('Signature valid:', sig.isValid())
console.log('Expires at:', new Date(sig.startTimestamp + sig.durationDays * 86400000))
```

### 2. Secure Storage

```typescript
// ✅ Good: Use secure storage in production
const config = createFhevmConfig({
  chains: [1],  // Mainnet
  storage: createStorage({
    storage: {
      async getItem(key) {
        // Use encrypted storage
        return await secureVault.get(key)
      },
      async setItem(key, value) {
        // Encrypt before storing
        await secureVault.set(key, value)
      },
      async removeItem(key) {
        await secureVault.delete(key)
      }
    }
  })
})
```

## Network Security

### 1. Always Use HTTPS

```typescript
// ✅ Good: HTTPS RPC
const config = createFhevmConfig({
  chains: [11155111],
  mockChains: {
    11155111: 'https://sepolia.infura.io/v3/YOUR_KEY'
  }
})

// ❌ Bad: HTTP (insecure)
const config = createFhevmConfig({
  chains: [11155111],
  mockChains: {
    11155111: 'http://sepolia.infura.io/v3/YOUR_KEY'  // Vulnerable to MITM
  }
})
```

### 2. Validate Chain ID

```typescript
// ✅ Good: Validate chain before operations
async function ensureCorrectChain(expectedChainId: number) {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const network = await provider.getNetwork()
  
  if (Number(network.chainId) !== expectedChainId) {
    throw new Error(`Wrong chain. Expected ${expectedChainId}, got ${network.chainId}`)
  }
}

await ensureCorrectChain(31337)
const instance = await createInstance(config, { provider, chainId: 31337 })
```

## Frontend Security

### 1. Input Sanitization

```typescript
// ✅ Good: Sanitize user input
function sanitizeAmount(input: string): number {
  const amount = Number(input)
  
  if (isNaN(amount) || amount < 0) {
    throw new Error('Invalid amount')
  }
  
  if (amount > Number.MAX_SAFE_INTEGER) {
    throw new Error('Amount too large')
  }
  
  return amount
}

const amount = sanitizeAmount(userInput)
const encrypted = await encrypt(config, {
  instance,
  contractAddress,
  userAddress,
  values: [{ type: 'euint32', value: amount }]
})
```

### 2. XSS Prevention

```typescript
// ✅ Good: Use React/Vue auto-escaping
<div>Balance: {decryptedBalance}</div>

// ❌ Bad: dangerouslySetInnerHTML with user data
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // XSS risk!
```

### 3. CSRF Protection

```typescript
// ✅ Good: Verify origin in server actions
export async function decryptServerSide(handle: string) {
  const origin = headers().get('origin')
  
  if (origin !== process.env.ALLOWED_ORIGIN) {
    throw new Error('Invalid origin')
  }
  
  // Proceed with decryption
}
```

## Smart Contract Integration

### 1. Verify Contract Address

```typescript
// ✅ Good: Hardcode trusted contract addresses
const TRUSTED_CONTRACTS = {
  counter: '0x1234...',
  token: '0x5678...'
} as const

async function encryptForContract(
  contractKey: keyof typeof TRUSTED_CONTRACTS,
  value: number
) {
  const contractAddress = TRUSTED_CONTRACTS[contractKey]
  
  return encrypt(config, {
    instance,
    contractAddress,
    userAddress,
    values: [{ type: 'euint32', value }]
  })
}

// ❌ Bad: Accept contract address from user
async function encryptForContract(
  contractAddress: string,  // User-controlled!
  value: number
) {
  // No validation - security risk
}
```

### 2. Event Verification

```typescript
// ✅ Good: Verify event source
const filter = contract.filters.CounterIncremented(userAddress)
const events = await contract.queryFilter(filter)

for (const event of events) {
  // Verify event is from correct contract
  if (event.address.toLowerCase() !== contract.address.toLowerCase()) {
    console.warn('Event from unexpected contract!')
    continue
  }
  
  // Process event
}
```

## Error Handling

### 1. Don't Expose Sensitive Errors

```typescript
// ✅ Good: Generic error messages to user
try {
  const decrypted = await decrypt(config, { ... })
} catch (error) {
  // Log detailed error for debugging
  console.error('[INTERNAL]', error)
  
  // Show generic message to user
  alert('Decryption failed. Please try again.')
}

// ❌ Bad: Expose internal details
try {
  const decrypted = await decrypt(config, { ... })
} catch (error) {
  alert(error.message)  // May contain sensitive info
}
```

### 2. Graceful Degradation

```typescript
// ✅ Good: Fallback behavior
const { instance, status, error } = useFhevm({ provider, chainId })

if (status === 'error') {
  return (
    <div>
      <p>Unable to load FHEVM. Using fallback mode.</p>
      <button onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  )
}
```

## Production Checklist

Before deploying to production:

- [ ] Remove all `console.log` with sensitive data
- [ ] Use HTTPS for all RPC connections
- [ ] Validate all user inputs
- [ ] Implement signature expiry checks
- [ ] Use secure storage for signatures
- [ ] Verify contract addresses
- [ ] Add rate limiting for API endpoints
- [ ] Implement error monitoring
- [ ] Test with production FHEVM (not mock)
- [ ] Review all error messages for sensitive info
- [ ] Enable CSP headers
- [ ] Implement CORS correctly
- [ ] Add transaction confirmation UIs
- [ ] Test signature expiry handling
- [ ] Verify chain ID before operations

## Security Audit Checklist

For security audits:

**Encryption:**
- [ ] Value ranges validated before encryption
- [ ] Correct types used for each value
- [ ] No sensitive data logged

**Decryption:**
- [ ] Handle format validated
- [ ] Signature expiry checked
- [ ] Signature scope verified
- [ ] Only trusted contract addresses

**Storage:**
- [ ] Signatures encrypted at rest (if applicable)
- [ ] Storage access logged (production)
- [ ] Automatic expiry implemented

**Frontend:**
- [ ] XSS prevention in place
- [ ] CSRF tokens used
- [ ] Input sanitization everywhere
- [ ] No dangerouslySetInnerHTML with user data

**Backend:**
- [ ] Origin verification
- [ ] Rate limiting
- [ ] Request validation
- [ ] Error handling without leaks

## Where to go next

🟨 Go to [**Testing Guide**](testing.md) to write secure tests for your FHEVM application.

🟨 Go to [**Debugging**](debugging.md) to investigate security issues.

🟨 Go to [**Deployment**](deployment.md) to deploy your application securely to production.

🟨 Go to [**Troubleshooting**](../troubleshooting/README.md) for common security-related issues.
