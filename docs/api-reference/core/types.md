---
description: TypeScript type definitions for FHEVM SDK.
---

# Types

Complete TypeScript type reference for FHEVM SDK. All types are exported from `@fhevm-sdk/types`.

## Import

```typescript
import type {
  FhevmConfig,
  FhevmInstance,
  EncryptParameters,
  DecryptParameters,
  // ... other types
} from '@fhevm-sdk/types'
```

## Core Types

### FhevmInstance

FHEVM instance for performing encryption and decryption operations.

```typescript
type FhevmInstance = {
  createEncryptedInput: (contractAddress: string, userAddress: string) => RelayerEncryptedInput
  userDecrypt: (
    requests: Array<{handle: string, contractAddress: string}>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, string | bigint | boolean>>
  publicDecrypt: (handles: string[]) => Promise<Record<string, string | bigint | boolean>>
  // ... other internal methods
}
```

**Usage:**
```typescript
const instance = await createInstance(config, {
  provider: window.ethereum,
  chainId: 31337
})
```

### FhevmInstance Config

Configuration for FHEVM instance creation.

```typescript
type FhevmInstanceConfig = {
  provider: Eip1193Provider | string
  chainId?: number
  signal?: AbortSignal
}
```

---

## Configuration Types

### FhevmConfig

Main configuration object for FHEVM SDK.

```typescript
type FhevmConfig = {
  chains: readonly number[]
  mockChains?: Record<number, string> | undefined
  storage?: Storage | undefined
  ssr?: boolean | undefined

  // Zustand store methods
  getState: () => State
  setState: (state: State | ((state: State) => State)) => void
  subscribe: (listener: (state: State) => void) => () => void
  getInstance: (params?: { chainId?: number }) => FhevmInstance | undefined

  // Internal
  _internal: {
    store: any
    ssr: boolean
  }
}
```

**Created with:**
```typescript
const config = createFhevmConfig({
  chains: [31337, 11155111],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: false,
})
```

### CreateFhevmConfigParameters

Parameters for creating FHEVM configuration.

```typescript
type CreateFhevmConfigParameters = {
  chains: readonly number[]                    // Required: List of supported chain IDs
  mockChains?: Record<number, string>          // Optional: Mock chain RPC URLs
  storage?: Storage                            // Optional: Storage adapter
  ssr?: boolean                                // Optional: SSR mode (default: false)
}
```

### State

FHEVM SDK internal state.

```typescript
type State = {
  chainId: number                              // Current chain ID
  status: 'idle' | 'loading' | 'ready' | 'error'  // Current status
  error: Error | undefined                     // Last error
  instance: FhevmInstance | undefined          // Current instance
}
```

### PartializedState

Partial state for updates.

```typescript
type PartializedState = Partial<State>
```

---

## Storage Types

### Storage

Storage abstraction interface.

```typescript
type Storage = {
  getItem<T>(key: string, defaultValue?: T | null): T | null
  setItem<T>(key: string, value: T): void
  removeItem(key: string): void
}
```

### BaseStorage

Base storage interface for platform-specific implementations.

```typescript
type BaseStorage = {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}
```

### CreateStorageParameters

Parameters for creating storage adapters.

```typescript
type CreateStorageParameters = {
  storage: BaseStorage | 'localStorage' | 'indexedDB'
  key?: string                                 // Optional: Storage key prefix
}
```

### StorageItemMap

Type map for storage items.

```typescript
type StorageItemMap = {
  'fhevm.decryption-signature': string
  // Add more storage keys as needed
}
```

---

## Action Types

### CreateInstanceParameters

Parameters for creating FHEVM instance.

```typescript
type CreateInstanceParameters = {
  provider: Eip1193Provider | string           // EIP-1193 provider or RPC URL
  chainId?: number                             // Target chain ID
  signal?: AbortSignal                         // Abort signal for cancellation
}
```

### CreateInstanceReturnType

Return type from `createInstance()`.

```typescript
type CreateInstanceReturnType = FhevmInstance
```

---

### EncryptParameters

Parameters for encrypting values.

```typescript
type EncryptParameters = {
  instance: FhevmInstance                      // FHEVM instance
  contractAddress: `0x${string}`               // Target contract address
  userAddress: `0x${string}`                   // User's Ethereum address
  values: Array<{
    type: EncryptionType                       // FHEVM type
    value: any                                 // Value to encrypt
  }>
}
```

### EncryptionType

Union type of all supported FHEVM encrypted types.

```typescript
type EncryptionType =
  | 'ebool'      // Encrypted boolean
  | 'euint8'     // Encrypted uint8 (0-255)
  | 'euint16'    // Encrypted uint16 (0-65535)
  | 'euint32'    // Encrypted uint32 (0-4294967295)
  | 'euint64'    // Encrypted uint64
  | 'euint128'   // Encrypted uint128
  | 'euint256'   // Encrypted uint256
  | 'eaddress'   // Encrypted Ethereum address
```

### EncryptResult

Result from encryption operations.

```typescript
type EncryptResult = {
  handles: Uint8Array[]                        // Encrypted handles (one per value)
  inputProof: Uint8Array                       // Zero-knowledge proof
}
```

### EncryptReturnType

Return type from `encrypt()` (alias for EncryptResult).

```typescript
type EncryptReturnType = EncryptResult
```

---

### DecryptRequest

Single decryption request.

```typescript
type DecryptRequest = {
  handle: string                               // Encrypted handle (0x-prefixed)
  contractAddress: `0x${string}`               // Contract address
}
```

### DecryptParameters

Parameters for decrypting values.

```typescript
type DecryptParameters = {
  instance: FhevmInstance                      // FHEVM instance
  requests: readonly DecryptRequest[]          // Array of decryption requests
  signer: JsonRpcSigner                        // Ethers signer for EIP-712
  storage: GenericStringStorage                // Storage for signature caching
  chainId?: number                             // Optional chain ID
}
```

### DecryptReturnType

Return type from `decrypt()`.

```typescript
type DecryptReturnType = Record<string, string | bigint | boolean>
```

Maps handles to decrypted values:
- `ebool` → `boolean`
- `euint8-256` → `bigint`
- `eaddress` → `string`

---

### PublicDecryptParameters

Parameters for public decryption.

```typescript
type PublicDecryptParameters = {
  instance: FhevmInstance                      // FHEVM instance
  handles: readonly string[]                   // Handles to decrypt
  chainId?: number                             // Optional chain ID
}
```

### PublicDecryptReturnType

Return type from `publicDecrypt()`.

```typescript
type PublicDecryptReturnType = Record<string, string | bigint | boolean>
```

---

## Utility Types

### `Compute<T>`

Type helper for expanding types in IDE tooltips.

```typescript
type Compute<T> = { [K in keyof T]: T[K] } & unknown
```

**Usage:**
```typescript
type Expanded = Compute<ComplexType>  // Shows full type definition
```

### `ExactPartial<T>`

Partial type that doesn't allow extra properties.

```typescript
type ExactPartial<T> = {
  [K in keyof T]?: T[K]
}
```

### `LooseOmit<T, K>`

Loose omit that allows omitting non-existent keys.

```typescript
type LooseOmit<T, K extends string> = Pick<
  T,
  Exclude<keyof T, K>
>
```

### `OneOf<T, U>`

Type for one of two mutually exclusive types.

```typescript
type OneOf<T, U> =
  | (T & { [K in Exclude<keyof U, keyof T>]?: never })
  | (U & { [K in Exclude<keyof T, keyof U>]?: never })
```

### `RemoveUndefined<T>`

Removes undefined from union type.

```typescript
type RemoveUndefined<T> = T extends undefined ? never : T
```

---

## React Hook Types

### UseConfigParameters

Parameters for `useConfig()` hook.

```typescript
type UseConfigParameters = {
  config?: FhevmConfig | undefined
}
```

### UseConfigReturnType

Return type from `useConfig()` hook.

```typescript
type UseConfigReturnType = FhevmConfig
```

---

### UseFhevmInstanceParameters

Parameters for `useFhevmInstance()` hook.

```typescript
type UseFhevmInstanceParameters = {
  provider: Eip1193Provider | string | undefined
  chainId?: number | undefined
  enabled?: boolean
  config?: FhevmConfig | undefined
}
```

### UseFhevmInstanceReturnType

Return type from `useFhevmInstance()` hook.

```typescript
type UseFhevmInstanceReturnType = {
  instance: FhevmInstance | undefined
  isLoading: boolean
  isError: boolean
  error: Error | undefined
  refresh: () => void
}
```

---

### UseEncryptParameters

Parameters for `useEncrypt()` hook.

```typescript
type UseEncryptParameters = {
  config?: FhevmConfig | undefined
}
```

### UseEncryptReturnType

Return type from `useEncrypt()` hook.

```typescript
type UseEncryptReturnType = {
  encrypt: (parameters: EncryptParameters) => Promise<EncryptReturnType>
  data: EncryptReturnType | undefined
  isLoading: boolean
  isError: boolean
  error: Error | undefined
  reset: () => void
}
```

---

### UseDecryptParameters

Parameters for `useDecrypt()` hook.

```typescript
type UseDecryptParameters = {
  config?: FhevmConfig | undefined
}
```

### UseDecryptReturnType

Return type from `useDecrypt()` hook.

```typescript
type UseDecryptReturnType = {
  decrypt: (parameters: DecryptParameters) => Promise<DecryptReturnType>
  data: DecryptReturnType | undefined
  isLoading: boolean
  isError: boolean
  error: Error | undefined
  reset: () => void
}
```

---

### UsePublicDecryptParameters

Parameters for `usePublicDecrypt()` hook.

```typescript
type UsePublicDecryptParameters = {
  config?: FhevmConfig | undefined
}
```

### UsePublicDecryptReturnType

Return type from `usePublicDecrypt()` hook.

```typescript
type UsePublicDecryptReturnType = {
  publicDecrypt: (parameters: PublicDecryptParameters) => Promise<PublicDecryptReturnType>
  data: PublicDecryptReturnType | undefined
  isLoading: boolean
  isError: boolean
  error: Error | undefined
  reset: () => void
}
```

---

## Error Types

### FhevmError

Base error class for FHEVM SDK errors.

```typescript
class FhevmError extends Error {
  name: 'FhevmError'
  message: string
}
```

### FhevmAbortError

Error thrown when operations are aborted.

```typescript
class FhevmAbortError extends Error {
  name: 'FhevmAbortError'
  message: 'Operation aborted'
}
```

---

## Usage Examples

### Type-Safe Configuration

```typescript
import type { CreateFhevmConfigParameters } from '@fhevm-sdk/types'

const params: CreateFhevmConfigParameters = {
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' },
  ssr: false,
}

const config = createFhevmConfig(params)
```

### Type-Safe Encryption

```typescript
import type { EncryptParameters, EncryptReturnType } from '@fhevm-sdk/types'

const encryptParams: EncryptParameters = {
  instance,
  contractAddress: '0x...',
  userAddress: '0x...',
  values: [{ type: 'euint8', value: 42 }]
}

const result: EncryptReturnType = await encrypt(config, encryptParams)
```

### Type-Safe Decryption

```typescript
import type { DecryptParameters, DecryptReturnType } from '@fhevm-sdk/types'

const decryptParams: DecryptParameters = {
  instance,
  requests: [{ handle: '0x...', contractAddress: '0x...' }],
  signer,
  storage: config.storage,
}

const result: DecryptReturnType = await decrypt(config, decryptParams)
```

### Type Guards

```typescript
import type { FhevmInstance } from '@fhevm-sdk/types'

function isFhevmInstance(value: unknown): value is FhevmInstance {
  return (
    typeof value === 'object' &&
    value !== null &&
    'createEncryptedInput' in value &&
    'userDecrypt' in value
  )
}
```

---

## Where to go next

🟨 Go to [**createFhevmConfig()**](createFhevmConfig.md) to use configuration types.

🟨 Go to [**Actions API**](../actions/README.md) to use action types.

🟨 Go to [**React API**](../react/README.md) to use React hook types.
