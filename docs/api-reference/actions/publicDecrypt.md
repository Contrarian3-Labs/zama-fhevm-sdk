---
description: Decrypt publicly marked FHEVM ciphertext handles without user authorization.
---

# publicDecrypt()

Decrypts publicly marked FHEVM ciphertext handles without requiring an EIP-712 signature. Handles must be marked as publicly decryptable via `FHE.makePubliclyDecryptable()` in the smart contract.

## Import

```typescript
import { publicDecrypt } from '@fhevm-sdk/actions'
```

## Usage

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, publicDecrypt } from '@fhevm-sdk/actions'

const config = createFhevmConfig({ chains: [31337] })
const instance = await createInstance(config, { provider })

// Get handle from contract (must be marked as publicly decryptable)
const handle = await contract.publicScore()

const decrypted = await publicDecrypt(config, {
  instance,
  handles: [handle],
})

console.log(decrypted[handle]) // 42n - NO signature prompt!
```

## Parameters

```typescript
type PublicDecryptParameters = {
  instance: FhevmInstance              // FHEVM instance for cryptographic operations
  handles: readonly string[]           // Array of handle strings to decrypt
  chainId?: number | undefined         // Optional chain ID for validation
}
```

### instance

- **Type:** `FhevmInstance`
- **Required:** Yes

The FHEVM instance returned from `createInstance()`.

### handles

- **Type:** `readonly string[]`
- **Required:** Yes

Array of encrypted handle strings to decrypt. Handles must be marked as publicly decryptable in the smart contract using `FHE.makePubliclyDecryptable()`.

**Handle format validation:**
- Must start with `0x`
- Must contain only hex characters `[0-9a-fA-F]`
- Expected length: 66 characters (0x + 64 hex chars)

### chainId

- **Type:** `number | undefined`
- **Required:** No

Optional chain ID for validation. If provided, ensures the operation is performed on the correct chain.

## Return Type

```typescript
type PublicDecryptReturnType = Record<string, string | bigint | boolean>
```

Returns a record mapping each handle to its decrypted value:
- `ebool` → `boolean`
- `euint8-256` → `bigint`
- `eaddress` → `string` (Ethereum address)

## Examples

### Basic Public Decryption

```typescript
const config = createFhevmConfig({ chains: [31337] })
const instance = await createInstance(config, { provider })

// Get public handle from contract
const handle = await contract.publicScore()

const decrypted = await publicDecrypt(config, {
  instance,
  handles: [handle],
})

console.log('Public score:', decrypted[handle]) // 100n
```

### Batch Public Decryption (Leaderboard)

```typescript
// Get multiple public handles
const handles = [
  await contract.topScore1(),
  await contract.topScore2(),
  await contract.topScore3(),
]

const decrypted = await publicDecrypt(config, {
  instance,
  handles,
})

// NO signature prompt - data is public
console.log('Top scores:', Object.values(decrypted)) // [100n, 95n, 90n]
```

### Mixed Types

```typescript
const decrypted = await publicDecrypt(config, {
  instance,
  handles: [
    '0xaaa...', // ebool → true
    '0xbbb...', // euint32 → 242n
    '0xccc...', // eaddress → '0xfC4382C084...'
  ],
})
```

### Complete Example: Set and Decrypt Public Score

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, encrypt, publicDecrypt } from '@fhevm-sdk/actions'
import { ethers } from 'ethers'

const config = createFhevmConfig({ chains: [31337] })
const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()
const address = await signer.getAddress()

// Create FHEVM instance
const instance = await createInstance(config, { provider: window.ethereum })

// Step 1: Encrypt the score value
const encrypted = await encrypt(config, {
  instance,
  contractAddress: leaderboardAddress,
  userAddress: address,
  values: [{ type: 'euint32', value: 100 }]
})

// Step 2: Submit encrypted score to contract (requires both handle and proof)
const tx = await contract.setTopScore(
  encrypted.handles[0],
  encrypted.inputProof
)
await tx.wait()

// Step 3: Read the public handle
const encryptedHandle = await contract.getTopScore()
const handle = '0x' + encryptedHandle.toString(16).padStart(64, '0')

// Step 4: Decrypt WITHOUT signature (because it's marked as publicly decryptable)
const decrypted = await publicDecrypt(config, {
  instance,
  handles: [handle]
})

console.log('Public top score:', decrypted[handle]) // 100n
```

### Smart Contract Setup (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract PublicLeaderboard is SepoliaConfig {
  euint32 public topScore;

  /// @notice Set the top score with encrypted input
  /// @param inputEuint32 The encrypted score value
  /// @param inputProof Zero-knowledge proof for the encrypted input
  function setTopScore(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    // Convert external encrypted input to internal euint32
    euint32 score = FHE.fromExternal(inputEuint32, inputProof);

    topScore = score;

    // Grant access control permissions
    FHE.allowThis(topScore);  // Contract can read
    FHE.allow(topScore, msg.sender);  // Submitter can decrypt

    // Mark as publicly decryptable (CRITICAL for publicDecrypt to work)
    FHE.makePubliclyDecryptable(topScore);
  }

  function getTopScore() external view returns (euint32) {
    return topScore;
  }
}
```

## Key Differences from decrypt()

| Feature | publicDecrypt() | decrypt() |
|---------|----------------|-----------|
| EIP-712 Signature | ❌ Not required | ✅ Required |
| Signer Parameter | ❌ Not needed | ✅ Required |
| Storage/Caching | ❌ Not needed | ✅ Required |
| Contract Requirement | Must call `makePubliclyDecryptable()` | No special requirement |
| Data Visibility | ⚠️ PUBLIC (anyone can decrypt) | ✅ PRIVATE (user-specific) |

## When to Use

### Use publicDecrypt() for:

- ✅ Public leaderboards (game scores, rankings)
- ✅ Public auction results (after auction closes)
- ✅ Aggregated statistics (total supply, vote counts)
- ✅ Any data that should be transparent after computation

### Use decrypt() instead for:

- ❌ User account balances
- ❌ Individual votes in private voting
- ❌ Personal health records
- ❌ Private messages

## Security Model

- **NO user authentication required** - No wallet prompt
- **Handles must be marked on-chain** - Contract must call `makePubliclyDecryptable()`
- **Gateway validates permissions** - Backend verifies handle is publicly accessible
- **Decrypted values are PUBLIC** - Visible to everyone

## Error Handling

```typescript
try {
  const decrypted = await publicDecrypt(config, { instance, handles })
} catch (error) {
  // Config state is updated with error
  // Original error is re-thrown

  if (error.message.includes('not publicly decryptable')) {
    console.error('Contract forgot to call makePubliclyDecryptable()')
  } else if (error.message.includes('Invalid handle')) {
    console.error('Handle format validation failed')
  }
}

// Also accessible via config state
const state = config.getState()
if (state.error) {
  console.error('Error in state:', state.error)
}
```

## Common Errors

### "Handle not publicly decryptable"

The smart contract did not call `FHE.makePubliclyDecryptable()` on the handle.

**Fix:**
```solidity
// In your Solidity contract
function setValue(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(inputEuint32, inputProof);

    // CRITICAL: Mark as publicly decryptable
    FHE.makePubliclyDecryptable(value); // Add this line
}
```

### "Invalid handle format"

Handle validation failed (not starting with 0x, invalid hex characters, wrong length).

**Fix:** Ensure you're passing the correct handle string from the contract.

### "FHEVM instance not ready"

The FHEVM instance hasn't been created yet.

**Fix:** Wait for `createInstance()` to complete before calling `publicDecrypt()`.

## Where to go next

🟨 Go to [**decrypt()**](decrypt.md) for user-authorized private decryption.

🟨 Go to [**Actions API**](README.md) for all available actions.

🟨 Go to [**Examples**](../../examples/encrypted-counter.md) to see decryption in action.
