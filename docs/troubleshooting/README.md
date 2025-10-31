---
description: Troubleshooting guide for common FHEVM SDK issues.
---

# Troubleshooting

Quick solutions for common issues when using FHEVM SDK.

## Quick Diagnostic

```typescript
// Run this to check your setup
console.log('Environment:', {
  browser: typeof window !== 'undefined',
  provider: !!window?.ethereum,
  chainId: await window?.ethereum?.request({ method: 'eth_chainId' }),
  fhevmVersion: require('@fhevm-sdk/core/package.json').version
})
```

## Common Issues

### 1. Provider Not Found

**Error:** `Provider not found` or `window.ethereum is undefined`

**Solutions:**
- Install MetaMask browser extension
- Connect wallet: Click "Connect Wallet" button
- Check provider availability:
```typescript
if (!window.ethereum) {
  alert('Please install MetaMask')
}
```

### 2. Instance Creation Failed

**Error:** `PUBLIC_KEY_FETCH_FAILED` or instance status is `'error'`

**Solutions:**
- Ensure Hardhat is running: `npx hardhat node`
- Verify chain ID matches config
- Check RPC connection:
```typescript
const provider = new ethers.JsonRpcProvider('http://localhost:8545')
await provider.getBlockNumber()  // Should not throw
```

### 3. Signature Expired

**Error:** `SIGNATURE_EXPIRED: Decryption signature has expired`

**Solution:**
```typescript
// Clear cached signature
localStorage.removeItem('fhevm.decryption-signature')

// Retry decryption (will prompt for new signature)
await decrypt(config, { ... })
```

### 4. Wrong Network

**Error:** `Please switch to Hardhat network`

**Solution:**
```typescript
// Prompt user to switch network
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x7A69' }]  // 31337 in hex
})
```

### 5. Type Errors (TypeScript)

**Error:** `Module not found` or type errors

**Solutions:**
- Check `tsconfig.json`:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "esModuleInterop": true
  }
}
```
- Restart TypeScript server: `Cmd+Shift+P` → "Restart TS Server"

### 6. SSR Hydration Mismatch

**Error:** Hydration mismatch in Next.js

**Solution:**
```typescript
'use client'  // Add to component

// Or check if mounted
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null
```

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `PROVIDER_NOT_CONNECTED` | Wallet not connected | Connect MetaMask |
| `CHAIN_NOT_SUPPORTED` | Chain not in config | Add to `config.chains` |
| `PUBLIC_KEY_FETCH_FAILED` | RPC error | Check network connection |
| `SSR_NOT_SUPPORTED` | Production chain in SSR | Use mock chains only |
| `SIGNATURE_ERROR` | Failed to create signature | User must approve signature |
| `SIGNATURE_EXPIRED` | Cached signature expired | Clear storage and retry |
| `SIGNATURE_MISMATCH` | Wrong contract addresses | Clear signature |

## Debugging Steps

1. **Check provider:**
```typescript
console.log('Provider:', window.ethereum)
```

2. **Check instance:**
```typescript
const { instance, status, error } = useFhevm({ ... })
console.log({ instance, status, error })
```

3. **Check chain:**
```typescript
const chainId = await window.ethereum.request({ method: 'eth_chainId' })
console.log('Current chain:', parseInt(chainId, 16))
```

4. **Check storage:**
```typescript
Object.keys(localStorage)
  .filter(k => k.startsWith('fhevm-'))
  .forEach(k => console.log(k, localStorage.getItem(k)))
```

## Getting Help

If you're still stuck:

1. Check [Common Errors](common-errors.md) page
2. Search [GitHub Issues](https://github.com/zama-ai/fhevm-react-template/issues)
3. Ask on [Discord](https://discord.com/invite/zama)
4. Post on [Community Forum](https://community.zama.ai)

When asking for help, include:
- SDK version
- Browser and version
- Network (Hardhat/Sepolia/etc.)
- Full error message
- Minimal reproduction code

## See Also

- [Common Errors](common-errors.md)
- [Debugging Guide](../guides/debugging.md)
- [Security Best Practices](../guides/security-best-practices.md)
