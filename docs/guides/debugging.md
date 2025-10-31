---
description: Debugging FHEVM applications effectively.
---

# Debugging

Tools and techniques for debugging FHEVM applications.

## State Inspection

### Config State

```typescript
// View current config state
const state = config.getState()
console.log('Chain ID:', state.chainId)
console.log('Instance:', state.instance)
console.log('Status:', state.status)
console.log('Error:', state.error)
```

### Subscribe to Changes

```typescript
const unsubscribe = config.subscribe((state) => {
  console.log('[Config State]', {
    chainId: state.chainId,
    hasInstance: !!state.instance,
    status: state.status,
    error: state.error?.message
  })
})
```

## Encryption Debugging

### Log Encrypted Values

```typescript
const encrypted = await encrypt(config, {
  instance,
  contractAddress,
  userAddress,
  values: [{ type: 'euint8', value: 42 }]
})

console.log('[Encryption]', {
  handlesCount: encrypted.handles.length,
  handles: encrypted.handles.map(h => Buffer.from(h).toString('hex').slice(0, 16) + '...'),
  proofLength: encrypted.inputProof.length,
  proof: Buffer.from(encrypted.inputProof).toString('hex').slice(0, 16) + '...'
})
```

### Verify Types

```typescript
console.log('Handle type:', typeof encrypted.handles[0])  // object (Uint8Array)
console.log('Proof type:', typeof encrypted.inputProof)   // object (Uint8Array)
console.log('Is Uint8Array:', encrypted.handles[0] instanceof Uint8Array)  // true
```

## Decryption Debugging

### Log Signature Info

```typescript
const sig = await getDecryptionSignature(config, {
  instance,
  contractAddresses: ['0x...'],
  signer,
  storage: config.storage
})

console.log('[Signature]', {
  isValid: sig?.isValid(),
  expiresAt: sig ? new Date(sig.startTimestamp + sig.durationDays * 86400000) : null,
  contracts: sig?.contractAddresses
})
```

### Log Decryption Results

```typescript
const decrypted = await decrypt(config, { ... })

for (const [handle, value] of Object.entries(decrypted)) {
  console.log(`[Decrypted] ${handle.slice(0, 10)}...: ${value} (${typeof value})`)
}
```

## Network Debugging

### Check Provider

```typescript
async function debugProvider(provider: any) {
  console.log('[Provider]', {
    type: typeof provider,
    isEip1193: !!(provider as any)?.request,
    isString: typeof provider === 'string'
  })
  
  if (typeof provider === 'object' && provider.request) {
    const chainId = await provider.request({ method: 'eth_chainId' })
    const accounts = await provider.request({ method: 'eth_accounts' })
    console.log('[Provider Info]', {
      chainId: parseInt(chainId, 16),
      accounts
    })
  }
}

await debugProvider(window.ethereum)
```

### Network Requests

```typescript
// Enable verbose logging
const provider = new ethers.BrowserProvider(window.ethereum, {
  batchMaxSize: 1  // Disable batching for clearer logs
})

provider.on('debug', (info) => {
  console.log('[Ethers Debug]', info)
})
```

## React Debugging

### useFhevm Hook

```typescript
function DebugFhevm() {
  const { instance, status, error, refresh } = useFhevm({
    provider: window.ethereum,
    chainId: 31337,
    enabled: true
  })
  
  useEffect(() => {
    console.log('[useFhevm]', {
      hasInstance: !!instance,
      status,
      error: error?.message
    })
  }, [instance, status, error])
  
  return (
    <div>
      <pre>{JSON.stringify({ status, error: error?.message }, null, 2)}</pre>
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}
```

## Browser DevTools

### Chrome DevTools

1. **Network Tab**: Monitor RPC calls
2. **Application Tab → Local Storage**: View cached signatures
3. **Console**: Enable verbose logging

### Storage Inspection

```typescript
// View all FHEVM storage
Object.keys(localStorage)
  .filter(key => key.startsWith('fhevm-'))
  .forEach(key => {
    console.log(key, localStorage.getItem(key))
  })
```

## Common Issues

### Instance Not Creating

```typescript
const { instance, status, error } = useFhevm({ ... })

if (status === 'error') {
  console.error('[Instance Creation Failed]', {
    message: error?.message,
    code: (error as any)?.code,
    stack: error?.stack
  })
  
  // Check provider
  console.log('Provider available:', !!window.ethereum)
  
  // Check chain ID
  const chainId = await window.ethereum?.request({ method: 'eth_chainId' })
  console.log('Current chain:', parseInt(chainId as string, 16))
}
```

### Signature Issues

```typescript
try {
  await decrypt(config, { ... })
} catch (error) {
  if (error.message.includes('SIGNATURE_')) {
    console.error('[Signature Error]', error.message)
    
    // Clear and retry
    localStorage.removeItem('fhevm.decryption-signature')
    console.log('Cleared cached signature. Please retry.')
  }
}
```

## Where to go next

🟨 Go to [**Security Best Practices**](security-best-practices.md) to learn about secure FHEVM application development.

🟨 Go to [**Testing Guide**](testing.md) to write comprehensive tests for your FHEVM application.

🟨 Go to [**Troubleshooting**](../troubleshooting/README.md) for quick solutions to common issues.
