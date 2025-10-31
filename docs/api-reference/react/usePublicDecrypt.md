---
description: React hook for decrypting publicly marked FHEVM handles without user signature.
---

# usePublicDecrypt()

React hook that wraps the `publicDecrypt` action to provide public decryption functionality with built-in loading, error, and data state management. **No EIP-712 signature required** - handles must be marked as publicly decryptable in the smart contract.

## Import

```typescript
import { usePublicDecrypt } from '@fhevm-sdk/react'
```

## Usage

```typescript
import { useFhevmInstance, usePublicDecrypt } from '@fhevm-sdk/react'

function LeaderboardComponent() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { publicDecrypt, data, isLoading } = usePublicDecrypt()

  const fetchLeaderboard = async () => {
    if (!instance) return

    // Get handles from contract (must be marked as publicly decryptable)
    const topScore1 = await contract.topScore1()
    const topScore2 = await contract.topScore2()

    // Decrypt publicly - NO signature prompt
    const decrypted = await publicDecrypt({
      instance,
      handles: [topScore1, topScore2],
    })

    console.log('Top scores:', Object.values(decrypted))
  }

  return (
    <button onClick={fetchLeaderboard} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Fetch Leaderboard'}
    </button>
  )
}
```

## Parameters

```typescript
type UsePublicDecryptParameters = {
  config?: FhevmConfig | undefined    // Optional custom config
}
```

### config

- **Type:** `FhevmConfig | undefined`
- **Required:** No
- **Default:** Uses config from `FhevmProvider`

Optional custom FHEVM configuration. If not provided, uses the config from `FhevmProvider`.

## Return Type

```typescript
type UsePublicDecryptReturnType = {
  publicDecrypt: (parameters: PublicDecryptParameters) => Promise<PublicDecryptReturnType>
  data: PublicDecryptReturnType | undefined      // Last successful decryption result
  isLoading: boolean                             // True while decrypting
  isError: boolean                               // True if last decryption failed
  error: Error | undefined                       // Error from last failed decryption
  reset: () => void                              // Reset state to initial
}
```

### publicDecrypt()

Async function to decrypt publicly marked FHEVM ciphertext handles.

**Parameters:**
```typescript
{
  instance: FhevmInstance                        // FHEVM instance
  handles: readonly string[]                     // Handles to decrypt
  chainId?: number | undefined                   // Optional chain ID
}
```

**Returns:** `Promise<PublicDecryptReturnType>`
```typescript
Record<string, string | bigint | boolean>        // Map of handle → decrypted value
```

### data

- **Type:** `PublicDecryptReturnType | undefined`

Record mapping handles to their decrypted values. Values can be `bigint` (for euint types), `boolean` (for ebool), or `string` (for eaddress).

### isLoading

- **Type:** `boolean`

`true` while decryption is in progress, `false` otherwise.

### isError

- **Type:** `boolean`

`true` if the last decryption attempt failed, `false` otherwise.

### error

- **Type:** `Error | undefined`

Error object from the last failed decryption attempt, or `undefined` if no error.

### reset()

- **Type:** `() => void`

Resets all state to initial values (clears data, error, loading states).

## Key Differences from useDecrypt()

| Feature | usePublicDecrypt() | useDecrypt() |
|---------|-------------------|--------------|
| EIP-712 Signature | ❌ Not required | ✅ Required |
| Signer Parameter | ❌ Not needed | ✅ Required |
| Storage Parameter | ❌ Not needed | ✅ Required |
| Contract Requirement | Must call `makePubliclyDecryptable()` | No special requirement |
| Data Visibility | ⚠️ PUBLIC (anyone can decrypt) | ✅ PRIVATE (user-specific) |
| Use Case | Public data (leaderboards, results) | Private data (balances, votes) |

## Examples

### Basic Public Leaderboard

```typescript
function Leaderboard() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { publicDecrypt, data, isLoading } = usePublicDecrypt()

  const fetchLeaderboard = async () => {
    if (!instance) return

    const handles = [
      await contract.topScore1(),
      await contract.topScore2(),
      await contract.topScore3(),
    ]

    // NO signature prompt - data is public
    await publicDecrypt({
      instance,
      handles,
    })
  }

  return (
    <div>
      <button onClick={fetchLeaderboard} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch Leaderboard'}
      </button>
      {data && (
        <ul>
          {Object.values(data).map((score, i) => (
            <li key={i}>#{i + 1}: {score.toString()}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### Auction Results (Public After Close)

```typescript
function AuctionResults() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { publicDecrypt, data, isLoading } = usePublicDecrypt()

  useEffect(() => {
    async function revealWinner() {
      if (!instance) return

      const winningBidHandle = await auctionContract.winningBid()

      // Bid becomes public after auction ends
      // Contract calls makePubliclyDecryptable() when auction closes
      await publicDecrypt({
        instance,
        handles: [winningBidHandle],
      })
    }

    revealWinner()
  }, [instance])

  if (isLoading) return <div>Loading winner...</div>
  if (!data) return <div>No results yet</div>

  const winningBid = Object.values(data)[0]
  return <div>Winning Bid: {winningBid.toString()} ETH</div>
}
```

### Vote Tally (Aggregated Results)

```typescript
function VoteTally() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { publicDecrypt, data } = usePublicDecrypt()

  const fetchResults = async () => {
    if (!instance) return

    // Contract reveals totals (not individual votes)
    const handles = [
      await votingContract.totalYesVotes(),
      await votingContract.totalNoVotes(),
    ]

    await publicDecrypt({
      instance,
      handles,
    })
  }

  return (
    <div>
      <button onClick={fetchResults}>Reveal Results</button>
      {data && (
        <div>
          <p>Yes: {Object.values(data)[0]?.toString()}</p>
          <p>No: {Object.values(data)[1]?.toString()}</p>
        </div>
      )}
    </div>
  )
}
```

### With Loading States

```typescript
function PublicValue() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { publicDecrypt, data, isLoading, isError, error } = usePublicDecrypt()

  const handleFetch = async () => {
    if (!instance) return

    const handle = await contract.publicValue()

    await publicDecrypt({
      instance,
      handles: [handle],
    })
  }

  if (isLoading) return <div>Decrypting...</div>
  if (isError) return <div>Error: {error?.message}</div>
  if (data) return <div>Value: {Object.values(data)[0]?.toString()}</div>

  return <button onClick={handleFetch}>Fetch Public Value</button>
}
```

### Mixed Types

```typescript
function PublicGameState() {
  const { instance } = useFhevmInstance({ provider: window.ethereum })
  const { publicDecrypt, data } = usePublicDecrypt()

  const fetchGameState = async () => {
    if (!instance) return

    const handles = [
      await gameContract.publicScore(),      // euint32
      await gameContract.publicIsActive(),   // ebool
      await gameContract.publicWinner(),     // eaddress
    ]

    const decrypted = await publicDecrypt({
      instance,
      handles,
    })

    // Access by handle
    const score = decrypted[handles[0]]      // bigint
    const active = decrypted[handles[1]]     // boolean
    const winner = decrypted[handles[2]]     // string (address)
  }

  return <button onClick={fetchGameState}>Fetch Game State</button>
}
```

### With Reset

```typescript
function PublicDataWithReset() {
  const { publicDecrypt, data, isLoading, error, reset } = usePublicDecrypt()
  const { instance } = useFhevmInstance({ provider: window.ethereum })

  const handleFetch = async () => {
    if (!instance) return

    await publicDecrypt({
      instance,
      handles: [await contract.publicHandle()],
    })
  }

  const handleReset = () => {
    reset() // Clear all state
  }

  return (
    <div>
      <button onClick={handleFetch} disabled={isLoading}>
        Fetch
      </button>
      <button onClick={handleReset}>Reset</button>
      {data && <div>Result: {JSON.stringify(data)}</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  )
}
```

### Error Handling

```typescript
function PublicDecryptWithErrorHandling() {
  const { publicDecrypt, isError, error } = usePublicDecrypt()
  const { instance } = useFhevmInstance({ provider: window.ethereum })

  const handleDecrypt = async () => {
    if (!instance) {
      console.error('Instance not ready')
      return
    }

    try {
      const handle = await contract.publicHandle()

      await publicDecrypt({
        instance,
        handles: [handle],
      })
    } catch (err) {
      // Error is automatically captured in state
      if (err.message.includes('not publicly decryptable')) {
        console.error('Contract forgot to call makePubliclyDecryptable()')
      } else if (err.message.includes('Invalid handle')) {
        console.error('Handle format is invalid')
      }
    }
  }

  return (
    <div>
      <button onClick={handleDecrypt}>Decrypt Public Value</button>
      {isError && (
        <div className="error">
          Decryption failed: {error?.message}
        </div>
      )}
    </div>
  )
}
```

## Smart Contract Setup

### Solidity Example

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract PublicLeaderboard is SepoliaConfig {
  euint32 public topScore1;
  euint32 public topScore2;

  /// @notice Update top score with encrypted input
  /// @param inputEuint32 The encrypted score value
  /// @param inputProof Zero-knowledge proof for the encrypted input
  function updateTopScore(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    // Convert external encrypted input to internal euint32
    euint32 newScore = FHE.fromExternal(inputEuint32, inputProof);

    topScore1 = newScore;

    // Grant access control permissions
    FHE.allowThis(topScore1);
    FHE.allow(topScore1, msg.sender);

    // CRITICAL: Mark as publicly decryptable
    FHE.makePubliclyDecryptable(topScore1);
  }

  function getTopScore() external view returns (euint32) {
    return topScore1;
  }
}
```

### Key Points:
- ✅ Call `FHE.makePubliclyDecryptable(handle)` to mark value as public
- ✅ Only call for data that should be visible to everyone
- ✅ Call BEFORE users attempt to decrypt
- ❌ Don't call for private user data (balances, individual votes)

## State Management

The hook manages three distinct states:

| State | `isLoading` | `isError` | `data` | `error` |
|-------|-------------|-----------|--------|---------|
| Initial | `false` | `false` | `undefined` | `undefined` |
| Loading | `true` | `false` | previous value | `undefined` |
| Success | `false` | `false` | `DecryptResult` | `undefined` |
| Error | `false` | `true` | `undefined` | `Error` |

## When to Use

### Use usePublicDecrypt() for:
- ✅ Public leaderboards (game scores, rankings)
- ✅ Public auction results (after auction closes)
- ✅ Aggregated statistics (total supply, vote counts)
- ✅ Public announcements (winners, results)
- ✅ Any data that should be transparent after computation

### Use useDecrypt() instead for:
- ❌ User account balances
- ❌ Individual votes in private voting
- ❌ Personal health records
- ❌ Private messages
- ❌ Any user-specific private data

## Best Practices

### 1. Check Instance Availability

```typescript
// ✅ Good: Check instance before calling
const handleDecrypt = async () => {
  if (!instance) {
    console.error('Instance not ready')
    return
  }

  await publicDecrypt({ instance, handles })
}
```

### 2. Handle Loading States

```typescript
// ✅ Good: Disable button while loading
<button onClick={handleDecrypt} disabled={isLoading || !instance}>
  {isLoading ? 'Decrypting...' : 'Decrypt'}
</button>
```

### 3. Understand Public Nature

```typescript
// ✅ Good: Only decrypt truly public data
const publicHandles = [
  await contract.publicScore(),      // OK - public by design
]

// ❌ Bad: Don't use for private data
const privateHandles = [
  await contract.userBalance(),      // WRONG - use useDecrypt()
]
```

### 4. Verify Contract Implementation

```solidity
// ✅ Good: Contract accepts encrypted input and marks value as public
function setPublicScore(externalEuint32 inputEuint32, bytes calldata inputProof) external {
  euint32 score = FHE.fromExternal(inputEuint32, inputProof);
  publicScore = score;
  FHE.allowThis(publicScore);
  FHE.allow(publicScore, msg.sender);
  FHE.makePubliclyDecryptable(publicScore); // ← Required
}

// ❌ Bad: Forgot to call makePubliclyDecryptable
function setPublicScore(externalEuint32 inputEuint32, bytes calldata inputProof) external {
  euint32 score = FHE.fromExternal(inputEuint32, inputProof);
  publicScore = score;
  FHE.allowThis(publicScore);
  // Missing makePubliclyDecryptable() - decrypt will fail!
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

**Fix:** Wait for `useFhevmInstance` to return a valid instance.

## Comparison with Direct Action Call

| Feature | usePublicDecrypt() Hook | publicDecrypt() Action |
|---------|------------------------|------------------------|
| State Management | ✅ Built-in (loading, error, data) | ❌ Manual |
| React Integration | ✅ Hooks API | ⚠️ Needs wrapper |
| Loading State | ✅ Automatic | ❌ Manual tracking |
| Error Handling | ✅ Automatic state | ⚠️ Try-catch only |
| Reset Functionality | ✅ Built-in | ❌ N/A |
| Use Case | React components | Vanilla JS, testing |

## Where to go next

🟨 Go to [**publicDecrypt()**](../actions/publicDecrypt.md) for the underlying action.

🟨 Go to [**useDecrypt()**](useDecrypt.md) for private decryption with signature.

🟨 Go to [**useFhevmInstance()**](useFhevmInstance.md) to create FHEVM instances.

🟨 Go to [**React API**](README.md) for all available React hooks.
