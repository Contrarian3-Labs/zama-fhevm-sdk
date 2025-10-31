---
description: Common errors and solutions for FHEVM SDK.
---

# Common Errors

Common errors when using FHEVM SDK and how to fix them.

## Installation Errors

### Module Not Found

**Error:** `Cannot find module '@fhevm-sdk/core'`

**Solutions:**
1. Check `tsconfig.json` has `"moduleResolution": "bundler"`
2. Restart TypeScript server
3. Reinstall: `rm -rf node_modules && npm install`

### Peer Dependency Warnings

**Solution:** Create `.npmrc`:
```ini
strict-peer-dependencies=false
```

## Runtime Errors

### Provider Not Found

**Error:** `Provider not found`

**Solutions:**
1. Install MetaMask
2. Connect wallet: `await window.ethereum.request({ method: 'eth_requestAccounts' })`
3. Enable conditionally: `enabled: !!provider && !!address`

### Instance Creation Failed

**Solutions:**
1. Check Hardhat is running: `npx hardhat node`
2. Verify chain ID matches config
3. Check error: `const { error } = useFhevmInstance(...)`

### Signature Expired

**Solution:** Clear storage:
```typescript
localStorage.removeItem('fhevm.decryption-signature')
```

### User Rejected Signature

**Solution:** Handle rejection:
```typescript
try {
  await decrypt({ ... })
} catch (error) {
  if (error.code === 4001) {
    alert('Signature rejected')
  }
}
```

## Encryption Errors

### Invalid Handle Format

**Solution:** Validate handle:
```typescript
const isValid = /^0x[a-fA-F0-9]+$/.test(handle)
```

### Type Mismatch

**Solution:** Use matching types:
```typescript
// Encrypt as euint8
const encrypted = await encrypt({ values: [{ type: 'euint8', value: 42 }] })

// Decrypt as euint8 (must match!)
const results = await decrypt({ requests: [{ type: 'euint8', ... }] })
```

### Value Out of Range

**Solution:** Use appropriate type:
- euint8: 0-255
- euint16: 0-65535
- euint32: 0-4294967295

## React Errors

### Context Not Found

**Error:** `useFhevmInstance must be used within FhevmProvider`

**Solution:** Wrap app:
```typescript
<FhevmProvider config={config}>
  <App />
</FhevmProvider>
```

### SSR Hydration Mismatch

**Solution:** Use client-only:
```typescript
'use client'
// or
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null
```

## Vue Errors

### Plugin Not Registered

**Solution:** Register plugin:
```typescript
app.use(createFhevmPlugin(config))
```

## Performance Issues

### Slow Operations

**Solutions:**
1. Use mock chains: `mockChains: { 31337: 'http://localhost:8545' }`
2. Batch operations (encrypt multiple values at once)
3. Instance is cached automatically

## Getting Help

- [Discord](https://discord.com/invite/zama)
- [GitHub Issues](https://github.com/zama-ai/fhevm-react-template/issues)
- [Community Forum](https://community.zama.ai)

## See Also

- [Installation Guide](../getting-started/installation.md)
- [Quick Start](../getting-started/quick-start-react.md)
