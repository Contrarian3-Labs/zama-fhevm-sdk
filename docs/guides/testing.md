---
description: Testing FHEVM applications with mock chains and real cryptography.
---

# Testing Guide

Learn how to test FHEVM applications effectively using mock chains for fast development and production chains for integration testing.

## Overview

FHEVM SDK provides two testing modes:

| Mode | Speed | Crypto | Environment | Use Case |
|------|-------|--------|-------------|----------|
| **Mock** | Fast (100x) | Simulated | Node.js + Browser | Unit tests, CI/CD |
| **Production** | Slow | Real FHEVM | Browser only | Integration tests |

## Mock Mode Testing

Mock mode uses `@fhevm/mock-utils` for instant encryption/decryption without real cryptography.

### Setup

```typescript
// test/setup.ts
import { createFhevmConfig } from '@fhevm-sdk/core'

export const testConfig = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: 'http://localhost:8545'  // Mock mode enabled
  }
})
```

### Unit Test Example

```typescript
// test/encryption.test.ts
import { expect } from 'chai'
import { createInstance, encrypt, decrypt } from '@fhevm-sdk/actions'
import { testConfig } from './setup'

describe('FHEVM Encryption', () => {
  let instance: any

  before(async () => {
    instance = await createInstance(testConfig, {
      provider: 'http://localhost:8545',
      chainId: 31337
    })
  })

  it('should encrypt and decrypt values', async () => {
    // Encrypt
    const encrypted = await encrypt(testConfig, {
      instance,
      contractAddress: '0x1234567890123456789012345678901234567890',
      userAddress: '0x0987654321098765432109876543210987654321',
      values: [
        { type: 'euint8', value: 42 },
        { type: 'ebool', value: true }
      ]
    })

    expect(encrypted.handles).to.have.length(2)
    expect(encrypted.inputProof).to.be.instanceOf(Uint8Array)

    // In mock mode, values are encrypted but simplified
    console.log('Encrypted handles:', encrypted.handles)
  })

  it('should handle all FHEVM types', async () => {
    const encrypted = await encrypt(testConfig, {
      instance,
      contractAddress: '0x1234567890123456789012345678901234567890',
      userAddress: '0x0987654321098765432109876543210987654321',
      values: [
        { type: 'ebool', value: true },
        { type: 'euint8', value: 255 },
        { type: 'euint16', value: 65535 },
        { type: 'euint32', value: 4294967295 },
        { type: 'euint64', value: 18446744073709551615n },
        { type: 'eaddress', value: '0x1111111111111111111111111111111111111111' }
      ]
    })

    expect(encrypted.handles).to.have.length(6)
  })

  it('should reject invalid types', async () => {
    await expect(
      encrypt(testConfig, {
        instance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        values: [{ type: 'invalid' as any, value: 42 }]
      })
    ).to.be.rejected
  })
})
```

### Contract Integration Test

```typescript
// test/EncryptedCounter.test.ts
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { createInstance, encrypt } from '@fhevm-sdk/actions'
import { testConfig } from './setup'

describe('EncryptedCounter', () => {
  let counter: any
  let instance: any
  let owner: any

  beforeEach(async () => {
    // Deploy contract
    const Counter = await ethers.getContractFactory('EncryptedCounter')
    counter = await Counter.deploy()
    ;[owner] = await ethers.getSigners()

    // Create FHEVM instance
    instance = await createInstance(testConfig, {
      provider: 'http://localhost:8545',
      chainId: 31337
    })
  })

  it('should increment counter with encrypted value', async () => {
    // Encrypt increment amount
    const encrypted = await encrypt(testConfig, {
      instance,
      contractAddress: counter.address,
      userAddress: owner.address,
      values: [{ type: 'euint32', value: 5 }]
    })

    // Call increment
    const tx = await counter.increment(encrypted.handles[0])
    await tx.wait()

    // Verify event emitted
    const events = await counter.queryFilter(
      counter.filters.CounterIncremented()
    )
    expect(events).to.have.length(1)
    expect(events[0].args.user).to.equal(owner.address)
  })

  it('should handle multiple increments', async () => {
    const amounts = [1, 2, 3, 4, 5]

    for (const amount of amounts) {
      const encrypted = await encrypt(testConfig, {
        instance,
        contractAddress: counter.address,
        userAddress: owner.address,
        values: [{ type: 'euint32', value: amount }]
      })

      await counter.increment(encrypted.handles[0])
    }

    // Verify all events
    const events = await counter.queryFilter(
      counter.filters.CounterIncremented()
    )
    expect(events).to.have.length(5)
  })
})
```

## React Component Testing

### Setup with Testing Library

```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

```typescript
// test/EncryptedCounter.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { EncryptedCounter } from '../src/components/EncryptedCounter'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x1234...' }),
  useWalletClient: () => ({ data: mockWalletClient }),
  usePublicClient: () => mockPublicClient
}))

// Mock FHEVM SDK
vi.mock('@fhevm-sdk/react', () => ({
  useFhevm: () => ({
    instance: mockInstance,
    status: 'ready',
    error: null,
    refresh: vi.fn()
  })
}))

test('renders counter component', () => {
  render(<EncryptedCounter />)
  expect(screen.getByText('Encrypted Counter')).toBeInTheDocument()
})

test('increments counter when button clicked', async () => {
  const user = userEvent.setup()
  render(<EncryptedCounter />)

  const input = screen.getByPlaceholderText('Amount to add')
  const button = screen.getByText('Increment')

  await user.type(input, '5')
  await user.click(button)

  await waitFor(() => {
    expect(screen.getByText(/incremented/i)).toBeInTheDocument()
  })
})
```

### Mock FHEVM Instance

```typescript
// test/mocks/fhevm.ts
export const mockInstance = {
  getPublicKey: () => ({ key: 'mock-public-key' }),
  createEncryptedInput: (contract: string, user: string) => ({
    add8: vi.fn(),
    add16: vi.fn(),
    add32: vi.fn(),
    addBool: vi.fn(),
    encrypt: async () => ({
      handles: [new Uint8Array([1, 2, 3])],
      inputProof: new Uint8Array([4, 5, 6])
    })
  }),
  userDecrypt: async () => ({
    '0xmockhandle': 42n
  })
}
```

## E2E Testing with Playwright

### Setup

```bash
npm install -D @playwright/test
```

```typescript
// e2e/encrypted-counter.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Encrypted Counter', () => {
  test.beforeEach(async ({ page }) => {
    // Start app and Hardhat
    await page.goto('http://localhost:3000')
    
    // Connect wallet (using metamask test extension)
    await page.click('button:has-text("Connect Wallet")')
    await page.click('button:has-text("MetaMask")')
  })

  test('should increment counter', async ({ page }) => {
    // Enter amount
    await page.fill('input[placeholder="Amount to add"]', '5')
    
    // Click increment
    await page.click('button:has-text("Increment")')
    
    // Wait for MetaMask confirmation
    // (in real E2E, use metamask extension)
    
    // Verify success message
    await expect(page.locator('text=incremented')).toBeVisible()
  })

  test('should decrypt counter value', async ({ page }) => {
    // Click decrypt
    await page.click('button:has-text("Decrypt Counter")')
    
    // Wait for signature request
    // (MetaMask extension handles this)
    
    // Verify decrypted value displayed
    await expect(page.locator('text=Current Counter Value:')).toBeVisible()
  })
})
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start Hardhat
        run: npx hardhat node &
        
      - name: Run tests
        run: npm test
        
      - name: Run E2E tests
        run: npm run test:e2e
```

## Testing Best Practices

### 1. Use Mock Chains for Speed

```typescript
// ✅ Good: Fast mock mode
const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }
})

// ❌ Slow: Real crypto in tests
const config = createFhevmConfig({
  chains: [31337],
  mockChains: {}  // Production mode
})
```

### 2. Test Error Cases

```typescript
it('should handle insufficient balance', async () => {
  const largeAmount = 999999999n

  // Note: Zama FHEVM uses standard Solidity error handling
  await expect(
    contract.transfer(recipient, encryptedAmount)
  ).to.be.reverted  // Generic revert check

  // Or with custom error message if contract uses require() with message
  // await expect(...).to.be.revertedWith('Insufficient balance')
})

it('should handle invalid handles', async () => {
  await expect(
    decrypt(config, {
      instance,
      requests: [{ 
        handle: 'invalid', 
        contractAddress: '0x...' 
      }],
      signer,
      storage: config.storage
    })
  ).to.be.rejected
})
```

### 3. Mock External Dependencies

```typescript
// Mock ethers provider
vi.mock('ethers', () => ({
  BrowserProvider: vi.fn(() => ({
    getSigner: vi.fn(() => mockSigner)
  }))
}))

// Mock wallet
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: testAddress }),
  useWalletClient: () => ({ data: mockWallet })
}))
```

### 4. Test Type Safety

```typescript
it('should enforce type constraints', async () => {
  // euint8 max is 255
  await expect(
    encrypt(config, {
      instance,
      contractAddress: '0x...',
      userAddress: '0x...',
      values: [{ type: 'euint8', value: 256 }]  // Overflow
    })
  ).to.be.rejected
})
```

## Performance Testing

### Measure Encryption Speed

```typescript
it('should encrypt within reasonable time', async () => {
  const start = Date.now()

  await encrypt(config, {
    instance,
    contractAddress: '0x...',
    userAddress: '0x...',
    values: [{ type: 'euint32', value: 42 }]
  })

  const duration = Date.now() - start
  
  // Mock mode should be < 100ms
  expect(duration).to.be.lessThan(100)
})
```

### Batch vs Single Encryption

```typescript
it('should batch encrypt faster than individual', async () => {
  const values = Array(10).fill(0).map((_, i) => ({
    type: 'euint8' as const,
    value: i
  }))

  // Batch
  const batchStart = Date.now()
  await encrypt(config, { instance, contractAddress, userAddress, values })
  const batchTime = Date.now() - batchStart

  // Individual
  const singleStart = Date.now()
  for (const value of values) {
    await encrypt(config, { 
      instance, 
      contractAddress, 
      userAddress, 
      values: [value] 
    })
  }
  const singleTime = Date.now() - singleStart

  expect(batchTime).to.be.lessThan(singleTime / 2)
})
```

## Debugging Tests

### Enable Verbose Logging

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }
})

// Subscribe to state changes
config.subscribe((state) => {
  console.log('[FHEVM State]', state)
})
```

### Inspect Encrypted Values

```typescript
it('should produce valid encrypted handles', async () => {
  const encrypted = await encrypt(config, { ... })

  console.log('Handles:', encrypted.handles.map(h => 
    Buffer.from(h).toString('hex')
  ))
  console.log('Proof:', Buffer.from(encrypted.inputProof).toString('hex'))

  expect(encrypted.handles[0].length).to.be.greaterThan(0)
})
```

## Where to go next

🟨 Go to [**Encrypted Counter Example**](../examples/encrypted-counter.md) to see complete test examples.

🟨 Go to [**Encrypted ERC20 Example**](../examples/encrypted-erc20.md) to learn advanced testing patterns.

🟨 Go to [**Debugging**](debugging.md) to troubleshoot failing tests.

🟨 Go to [**Troubleshooting**](../troubleshooting/README.md) for common testing issues.
