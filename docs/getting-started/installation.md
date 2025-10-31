---
description: Install the FHEVM SDK and start building confidential dApps in minutes.
---

# Installation

## Quick Install

Choose your framework and install with a single command:

::: code-group
```bash [React]
npm install @fhevm-sdk ethers@^6.13.4
```

```bash [Vue]
npm install @fhevm-sdk ethers@^6.13.4 vue@^3.0.0
```

```bash [Vanilla JS]
npm install @fhevm-sdk ethers@^6.13.4
```
:::

::: warning Important
**ethers v6 is required.** The SDK does not support ethers v5. If you're upgrading from v5, see the [ethers migration guide](https://docs.ethers.org/v6/migrating/).
:::

## Alternative Package Managers

::: code-group
```bash [pnpm]
pnpm add @fhevm-sdk ethers@^6.13.4
```

```bash [yarn]
yarn add @fhevm-sdk ethers@^6.13.4
```

```bash [bun]
bun add @fhevm-sdk ethers@^6.13.4
```
:::

## What Gets Installed?

The FHEVM SDK requires:

- **`@fhevm-sdk`** - The core SDK with subpath exports for `@fhevm-sdk/core`, `@fhevm-sdk/actions`, `@fhevm-sdk/react`, and `@fhevm-sdk/vue`
- **`ethers@^6.13.4`** - For Ethereum provider interactions and EIP-712 signatures

If you're using React or Vue, your framework is likely already installed. If not, npm/pnpm will prompt you to install peer dependencies automatically.

<details>
<summary>📦 Understanding Dependencies (click to expand)</summary>

### Core Dependencies

#### ethers v6 (Required)

The SDK uses ethers v6 for:
- Ethereum provider interactions
- EIP-712 signature generation (for decryption)
- Contract ABI encoding/decoding

**Why v6?** ethers v6 provides better TypeScript support and modern async patterns that the SDK relies on.

#### React 18+ (React users only)

React 18 or 19 is required for `@fhevm-sdk/react` hooks. Both versions are fully supported.

Modern package managers (npm 7+, pnpm) will auto-install this as a peer dependency if missing.

#### Vue 3+ (Vue users only)

Vue 3 with Composition API is required for `@fhevm-sdk/vue` composables.

Modern package managers will auto-install this as a peer dependency if missing.

### Optional Dependencies

#### @fhevm/mock-utils (Local development)

For faster local development with Hardhat or Ganache:

```bash
npm install @fhevm/mock-utils@^0.1.0
```

Mock chains enable instant encryption without real cryptographic operations, making local testing 100x faster.

</details>

## Version Compatibility

| FHEVM SDK | React | Vue | ethers | Node.js |
|-----------|-------|-----|--------|---------|
| 0.1.x     | 18, 19 | 3.x | 6.13+ | 20+ |

::: info Node.js Requirement
**Node.js 20 or higher** is required due to modern JavaScript features used in the SDK.
:::

## TypeScript Configuration

The SDK is written in TypeScript and includes full type definitions. For the best experience, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

::: warning Module Resolution
Use `"moduleResolution": "bundler"` (recommended) or `"node16"` to properly resolve subpath exports like `@fhevm-sdk/core` and `@fhevm-sdk/react`.
:::

## Verify Installation

After installation, verify that the SDK is correctly installed:

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337]
})

console.log('FHEVM SDK installed successfully!')
```

If this code runs without errors, your installation is complete.

## Troubleshooting

### Peer Dependency Warnings

Modern package managers (npm 7+, pnpm) automatically handle peer dependencies. If you see warnings:

```bash
npm ls ethers react vue
```

This will show you the installed versions and any conflicts.

### Module Not Found Errors

If you encounter "Module not found" errors:

1. **Check TypeScript config**: Ensure `moduleResolution` is set to `"bundler"` or `"node16"`
2. **Restart TypeScript server**: In VS Code, run "TypeScript: Restart TS Server"
3. **Clear cache**: Delete `node_modules` and reinstall

```bash
rm -rf node_modules package-lock.json
npm install
```

### React 19 Warnings

Some packages may show warnings about React 19 compatibility. You can safely suppress these by creating a `.npmrc` file:

```ini
# .npmrc
strict-peer-dependencies=false
auto-install-peers=true
```

### ethers v5 Conflicts

If you have ethers v5 installed and need to upgrade:

```bash
# Remove old version
npm uninstall ethers

# Install v6
npm install ethers@^6.13.4
```

Check the [ethers migration guide](https://docs.ethers.org/v6/migrating/) for breaking changes.

## Next Steps

::: tip Installation Complete!
Proceed to the Quick Start guide for your framework:
:::

- [Quick Start (React)](quick-start-react.md) - Build a React app with FHEVM
- [Quick Start (Vue)](quick-start-vue.md) - Build a Vue app with FHEVM
- [Quick Start (Vanilla JS)](quick-start-vanilla.md) - Use core actions directly
- [Architecture Overview](architecture-overview.md) - Understand the SDK design
