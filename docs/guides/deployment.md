---
description: Deploying FHEVM applications to production.
---

# Deployment

Guide for deploying FHEVM applications to production environments.

## Environment Configuration

### Production Config

```typescript
// config/production.ts
import { createFhevmConfig } from '@fhevm-sdk/core'

export const fhevmConfig = createFhevmConfig({
  chains: [1, 11155111],  // Mainnet, Sepolia
  mockChains: {},  // No mock chains in production
  storage: createStorage({
    storage: {
      async getItem(key) {
        // Use secure backend storage
        return await api.get(`/storage/${key}`)
      },
      async setItem(key, value) {
        await api.post(`/storage/${key}`, { value })
      },
      async removeItem(key) {
        await api.delete(`/storage/${key}`)
      }
    }
  })
})
```

### Environment Variables

```bash
# .env.production
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

```typescript
// Usage
const config = createFhevmConfig({
  chains: [Number(process.env.NEXT_PUBLIC_CHAIN_ID)],
  mockChains: {}
})
```

## Build Optimization

### Next.js

```typescript
// next.config.js
module.exports = {
  webpack: (config) => {
    // Optimize bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      '@fhevm-sdk/core': require.resolve('@fhevm-sdk/core'),
      '@fhevm-sdk/actions': require.resolve('@fhevm-sdk/actions'),
      '@fhevm-sdk/react': require.resolve('@fhevm-sdk/react')
    }
    return config
  }
}
```

### Vite

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'fhevm-sdk': [
            '@fhevm-sdk/core',
            '@fhevm-sdk/actions',
            '@fhevm-sdk/react'
          ]
        }
      }
    }
  }
})
```

## Security Headers

### Next.js

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' https://*.infura.io"
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ]
  }
}
```

## Performance Monitoring

### Sentry Integration

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.message?.includes('privateKey')) {
      return null
    }
    return event
  }
})

// Track FHEVM operations
try {
  const encrypted = await encrypt(config, { ... })
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      operation: 'encryption',
      chainId: config.getState().chainId
    }
  })
  throw error
}
```

## Deployment Checklist

- [ ] Remove mock chains from config
- [ ] Use production RPC URLs (HTTPS)
- [ ] Configure secure storage backend
- [ ] Enable HTTPS only
- [ ] Set up CSP headers
- [ ] Configure CORS correctly
- [ ] Remove console.logs
- [ ] Enable error monitoring
- [ ] Test signature expiry
- [ ] Verify contract addresses
- [ ] Test on production network
- [ ] Set up rate limiting
- [ ] Configure CDN
- [ ] Enable compression
- [ ] Test mobile browsers
- [ ] Set up analytics

## Where to go next

🟨 Go to [**Security Best Practices**](security-best-practices.md) to ensure your production deployment is secure.

🟨 Go to [**Testing Guide**](testing.md) to validate your application before deployment.

🟨 Go to [**Debugging**](debugging.md) to troubleshoot production issues.
