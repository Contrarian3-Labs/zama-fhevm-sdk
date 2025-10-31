---
description: Structured learning paths for mastering FHEVM SDK at your own pace.
---

# Learning Path

Choose your learning path based on your experience level and goals.

---

## Path 1: Complete Beginner

**For:** Developers new to FHEVM and encrypted computation  
**Time:** ~2 hours  
**Goal:** Build your first encrypted dApp

### Step 1: Understand the Basics (15 min)

1. **Read:** [What is FHEVM?](README.md#what-is-fhevm)
   - Understand encrypted computation
   - Learn about use cases
   - See why privacy matters

2. **Read:** [Why FHEVM SDK?](README.md#why-fhevm-sdk)
   - Framework-agnostic design
   - Wagmi-inspired architecture
   - Multi-framework support

### Step 2: Set Up Your Environment (20 min)

3. **Follow:** [Installation Guide](getting-started/installation.md)
   - Install dependencies
   - Configure TypeScript
   - Verify installation

4. **Choose your framework:**
   - [Quick Start - React](getting-started/quick-start-react.md) ← Recommended
   - [Quick Start - Vue](getting-started/quick-start-vue.md)
   - [Quick Start - Vanilla JS](getting-started/quick-start-vanilla.md)

### Step 3: Build Your First App (45 min)

5. **Follow the Quick Start guide** for your chosen framework
   - Create FHEVM configuration
   - Set up provider
   - Encrypt your first value
   - Decrypt and display result

6. **Experiment:**
   - Change the encrypted value
   - Try different encryption types (euint8, euint32, ebool)
   - Add more buttons and interactions

### Step 4: Understand What You Built (30 min)

7. **Read:** [Architecture Overview](getting-started/architecture-overview.md)
   - Three-layer architecture
   - How components interact
   - State management flow

8. **Read:** [Core Concepts - FHEVM Instance](core-concepts/fhevm-instance.md)
   - What is an instance?
   - Instance caching
   - Mock vs production chains

### Step 5: Build Something Real (30 min)

9. **Follow:** [Encrypted Counter Example](examples/encrypted-counter.md)
   - Complete working example
   - Smart contract integration
   - Error handling
   - Best practices

::: tip
**🎉 Congratulations!** You've completed the beginner path. You can now build basic encrypted dApps with FHEVM SDK.
:::

**Next:** Move to [Path 2: Intermediate Developer](#path-2-intermediate-developer)

---

## Path 2: Intermediate Developer

**For:** Developers comfortable with basics, want to build production apps  
**Time:** ~4 hours  
**Goal:** Master encryption/decryption and build complex dApps

### Prerequisites

- Completed Path 1 OR
- Familiar with React/Vue and Web3 development
- Basic understanding of FHEVM concepts

### Step 1: Deep Dive into Core Concepts (60 min)

1. **Read:** [Configuration](core-concepts/configuration.md)
   - Config creation and management
   - Storage abstraction
   - SSR support

2. **Read:** [Encryption](core-concepts/encryption.md)
   - How encryption works
   - Binding to contracts/users
   - Input proofs
   - All encryption types

3. **Read:** [Decryption](core-concepts/decryption.md)
   - EIP-712 signatures
   - Signature caching
   - Batch decryption
   - Public vs private decryption

4. **Read:** [Storage](core-concepts/storage.md)
   - Storage adapters
   - Custom storage
   - Persistence strategies

### Step 2: Master the API (90 min)

5. **Study:** [Core API](api-reference/core/README.md)
   - [`createFhevmConfig()`](api-reference/core/createFhevmConfig.md)
   - [`createStorage()`](api-reference/core/createStorage.md)
   - [`hydrate()`](api-reference/core/hydrate.md)

6. **Study:** [Actions API](api-reference/actions/README.md)
   - [`createInstance()`](api-reference/actions/createInstance.md)
   - [`encrypt()`](api-reference/actions/encrypt.md)
   - [`decrypt()`](api-reference/actions/decrypt.md)
   - [`getDecryptionSignature()`](api-reference/actions/getDecryptionSignature.md)

7. **Study your framework:**
   - **React:** [React API Reference](api-reference/react/README.md)
   - **Vue:** [Vue API Reference](api-reference/vue/README.md)

### Step 3: Build a Complex Example (90 min)

8. **Follow:** [Encrypted ERC20 Example](examples/encrypted-erc20.md)
   - Private token balances
   - Encrypted transfers
   - Access control
   - Event handling

9. **Extend the example:**
   - Add allowances
   - Implement batch transfers
   - Add transfer history
   - Create admin functions

### Step 4: Production Readiness (60 min)

10. **Read:** [Security Best Practices](guides/security-best-practices.md)
    - Key management
    - Signature verification
    - Contract security
    - Frontend security

11. **Read:** [Testing Guide](guides/testing.md)
    - Unit testing
    - Integration testing
    - Mock chains
    - Test patterns

12. **Read:** [Debugging Guide](guides/debugging.md)
    - Common issues
    - Debugging tools
    - Performance optimization

::: tip
**🎉 Excellent!** You can now build production-ready encrypted dApps with confidence.
:::

**Next:** Move to [Path 3: Advanced Developer](#path-3-advanced-developer)

---

## Path 3: Advanced Developer

**For:** Experienced developers building complex systems  
**Time:** ~3 hours  
**Goal:** Master advanced patterns and customization

### Prerequisites

- Completed Path 2 OR
- Extensive Web3 development experience
- Built at least one FHEVM dApp

### Step 1: Advanced Patterns (60 min)

1. **Study:** Custom storage implementation
   - IndexedDB for large data
   - Redis for server-side
   - Encrypted storage
   - Cross-tab synchronization

2. **Study:** Performance optimization
   - Instance pre-warming
   - Signature pre-fetching
   - Batch operations
   - Caching strategies

3. **Study:** Multi-chain architecture
   - Chain switching
   - Cross-chain state
   - Fallback strategies
   - Network detection

### Step 2: Framework Integration (60 min)

4. **Integrate with:**
   - Wagmi/Viem for wallet management
   - TanStack Query for data fetching
   - Zustand/Pinia for state management
   - Rainbow Kit for UI components

5. **SSR/SSG patterns:**
   - Next.js App Router
   - Next.js Pages Router
   - Nuxt 3
   - Hydration strategies

### Step 3: Custom Solutions (60 min)

6. **Build:** Custom framework adapter
   - Svelte adapter
   - Solid.js adapter
   - Angular adapter
   - Framework-agnostic patterns

7. **Build:** Advanced features
   - Signature rotation
   - Multi-sig decryption
   - Delegated decryption
   - Encrypted events

### Step 4: Deployment & Monitoring (60 min)

8. **Read:** [Deployment Guide](guides/deployment.md)
   - Production configuration
   - Environment variables
   - CDN optimization
   - Error tracking

9. **Implement:** Monitoring & analytics
   - Encryption success rates
   - Decryption latency
   - Error tracking
   - User analytics

10. **Implement:** CI/CD pipeline
    - Automated testing
    - Deployment automation
    - Version management
    - Rollback strategies

::: tip
**🎉 Amazing!** You're now an FHEVM SDK expert. Consider contributing to the project!
:::

---

## Path 4: Quick Reference

**For:** Experienced developers who need quick answers  
**Time:** As needed  
**Goal:** Find specific information fast

### Common Tasks

#### Encrypt a Value
```typescript
const encrypted = await encrypt(config, {
  instance,
  contractAddress: '0x...',
  userAddress: '0x...',
  values: [{ type: 'euint8', value: 42 }]
})
```
📖 [Full Guide](api-reference/actions/encrypt.md)

#### Decrypt a Handle
```typescript
const results = await decrypt(config, {
  instance,
  signer,
  requests: [{ handle: '0x...', type: 'euint8', contractAddress: '0x...', userAddress: '0x...' }]
})
```
📖 [Full Guide](api-reference/actions/decrypt.md)

#### Create Instance
```typescript
const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})
```
📖 [Full Guide](api-reference/actions/createInstance.md)

#### Configure Mock Chain
```typescript
const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }
})
```
📖 [Full Guide](core-concepts/configuration.md)

### Quick Links

- **API Reference:** [All APIs](api-reference/README.md)
- **Examples:** [All Examples](examples/README.md)
- **Troubleshooting:** [Common Errors](troubleshooting/common-errors.md)
- **Community:** [Discord](https://discord.com/invite/zama)

---

## Learning Path Comparison

| Path | Level | Time | Outcome |
|------|-------|------|---------|
| **Path 1** | Beginner | 2h | Build first encrypted dApp |
| **Path 2** | Intermediate | 4h | Production-ready apps |
| **Path 3** | Advanced | 3h | Expert-level customization |
| **Path 4** | Reference | As needed | Quick answers |

---

## Learning Tips

### 1. Learn by Doing

Don't just read - code along with every example. Modify the code, break things, fix them. That's how you learn best.

### 2. Use Mock Chains

Start with mock chains for instant feedback. Switch to real chains when deploying.

```typescript
mockChains: { 31337: 'http://localhost:8545' } // 100x faster!
```

### 3. Read Error Messages

FHEVM SDK provides detailed error messages. Read them carefully - they often contain the solution.

### 4. Check the Examples

Stuck? Check the [examples](examples/README.md). They demonstrate real-world patterns.

### 5. Ask for Help

Join our [Discord](https://discord.com/invite/zama) community. We're here to help!

---

## Certification (Coming Soon)

Complete all paths and build a project to earn your FHEVM SDK Developer certification!

---

## Track Your Progress

Use this checklist to track your learning:

### Path 1: Complete Beginner
- [ ] Read FHEVM basics
- [ ] Install dependencies
- [ ] Complete Quick Start
- [ ] Understand architecture
- [ ] Build encrypted counter

### Path 2: Intermediate Developer
- [ ] Master core concepts
- [ ] Study all APIs
- [ ] Build encrypted ERC20
- [ ] Read security guide
- [ ] Implement testing

### Path 3: Advanced Developer
- [ ] Custom storage implementation
- [ ] Framework integration
- [ ] Build custom adapter
- [ ] Deploy to production
- [ ] Set up monitoring

---

## Contribute

Found this helpful? Consider:
- Star the [GitHub repo](https://github.com/zama-ai/fhevm-react-template)
- Improve the docs
- Help others in Discord
- Report bugs
- Suggest features

---

**Ready to start?** Choose your path above and begin your FHEVM journey!

