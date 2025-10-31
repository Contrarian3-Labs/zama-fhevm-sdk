---
description: Build a complete encrypted counter app with FHEVM SDK.
---

# Encrypted Counter Example

Learn how to build a fully functional encrypted counter application using FHEVM SDK. This example demonstrates encryption, decryption, contract interaction, and state management.

## Overview

We'll build a counter app where:
- Counter value is encrypted on-chain (invisible to anyone)
- Users can increment by encrypted amounts
- Users can decrypt their counter value (requires signature)
- Works with Hardhat local network

**Technologies:**
- React + TypeScript
- FHEVM SDK
- Ethers.js v6
- Hardhat (local blockchain)

## Smart Contract

First, create the encrypted counter contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Counter - A simple encrypted counter contract
/// @notice Demonstrates basic FHEVM operations with encrypted state
contract FHECounter is SepoliaConfig {
    // Encrypted counter for each user
    mapping(address => euint32) private counters;

    // Event emitted when counter is incremented
    event CounterIncremented(address indexed user);

    /// @notice Increment counter by an encrypted amount
    /// @param inputEuint32 The encrypted input value
    /// @param inputProof Zero-knowledge proof for the encrypted input
    function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        // Convert external encrypted input to internal euint32
        euint32 amount = FHE.fromExternal(inputEuint32, inputProof);

        // Add encrypted amount to user's counter
        counters[msg.sender] = FHE.add(counters[msg.sender], amount);

        // Grant access control permissions
        FHE.allowThis(counters[msg.sender]);  // Contract can read
        FHE.allow(counters[msg.sender], msg.sender);  // User can decrypt

        emit CounterIncremented(msg.sender);
    }

    /// @notice Get the encrypted counter value for the caller
    /// @return The encrypted counter value (euint32)
    function getCounter() external view returns (euint32) {
        return counters[msg.sender];
    }
}
```

## React Component

Create the counter component:

```typescript
// src/components/EncryptedCounter.tsx
import { useState, useEffect } from 'react'
import { useFhevmInstance } from '@fhevm-sdk/react'
import { encrypt, decrypt } from '@fhevm-sdk/actions'
import { createFhevmConfig } from '@fhevm-sdk/core'
import { ethers } from 'ethers'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'

// Contract ABI
const COUNTER_ABI = [
  {
    "inputs": [
      {"internalType": "externalEuint32", "name": "inputEuint32", "type": "bytes32"},
      {"internalType": "bytes", "name": "inputProof", "type": "bytes"}
    ],
    "name": "increment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCounter",
    "outputs": [{"internalType": "euint32", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

// TODO: Replace with your deployed contract address after running deployment
const CONTRACT_ADDRESS = '0x...' as `0x${string}`

// Create FHEVM config
const config = createFhevmConfig({
  chains: [31337],
  mockChains: {
    31337: 'http://localhost:8545'
  }
})

export function EncryptedCounter() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  // FHEVM instance
  const { instance, isLoading, isError, error } = useFhevmInstance({
    provider: window.ethereum,
    chainId: 31337,
    enabled: !!address
  })

  const status = isLoading ? 'loading' : isError ? 'error' : instance ? 'ready' : 'idle'

  // State
  const [incrementAmount, setIncrementAmount] = useState('1')
  const [decryptedValue, setDecryptedValue] = useState<number | null>(null)
  const [isIncrementing, setIsIncrementing] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)

  // Contract instance
  const [contract, setContract] = useState<ethers.Contract | null>(null)

  // Initialize contract
  useEffect(() => {
    if (walletClient && address) {
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      provider.getSigner().then(signer => {
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          COUNTER_ABI,
          signer
        )
        setContract(contractInstance)
      })
    }
  }, [walletClient, address])

  // Increment counter
  const handleIncrement = async () => {
    if (!instance || !contract || !address) return

    try {
      setIsIncrementing(true)

      const amount = parseInt(incrementAmount)
      if (isNaN(amount) || amount < 1) {
        alert('Please enter a valid positive number')
        return
      }

      // 🔐 Encryption Process:
      // Values are encrypted locally and bound to a specific contract/user pair.
      // This grants the bound contract FHE permissions to receive and process the encrypted value,
      // but only when it is sent by the bound user.
      const encrypted = await encrypt(config, {
        instance,
        contractAddress: CONTRACT_ADDRESS as `0x${string}`,
        userAddress: address,
        values: [{ type: 'euint32', value: amount }]
      })

      console.log('Encrypted amount:', encrypted)

      // Call contract with encrypted handle and proof
      // Zama FHEVM requires both the encrypted handle and a zero-knowledge proof
      const tx = await contract.increment(encrypted.handles[0], encrypted.inputProof)
      console.log('Transaction sent:', tx.hash)

      // Wait for confirmation
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)

      alert(`Counter incremented by ${amount}!`)
    } catch (err) {
      console.error('Increment failed:', err)
      alert('Increment failed: ' + (err as Error).message)
    } finally {
      setIsIncrementing(false)
    }
  }

  // Decrypt counter
  const handleDecrypt = async () => {
    if (!instance || !contract || !address) return

    try {
      setIsDecrypting(true)

      // Get encrypted counter handle from contract
      const encryptedHandle = await contract.getCounter()
      console.log('Encrypted handle:', encryptedHandle)

      // Convert the euint32 to a hex string handle for decryption
      // The handle is the on-chain reference to the encrypted value
      const handle = '0x' + encryptedHandle.toString(16).padStart(64, '0')

      // Get signer for EIP-712 signature
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()

      // Decrypt the counter value
      // This requires user to sign an EIP-712 message (cached for 7 days)
      const decrypted = await decrypt(config, {
        instance,
        requests: [{
          handle,
          contractAddress: CONTRACT_ADDRESS as `0x${string}`
        }],
        signer: signer as any,
        storage: config.storage
      })

      const value = decrypted[handle]
      console.log('Decrypted value:', value)

      if (typeof value === 'bigint') {
        setDecryptedValue(Number(value))
      } else if (typeof value === 'number') {
        setDecryptedValue(value)
      } else {
        console.error('Unexpected decrypted type:', typeof value)
      }
    } catch (err) {
      console.error('Decryption failed:', err)
      alert('Decryption failed: ' + (err as Error).message)
    } finally {
      setIsDecrypting(false)
    }
  }

  // Render loading states
  if (status === 'loading') {
    return (
      <div className="card">
        <h2>Encrypted Counter</h2>
        <p>Loading FHEVM instance...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h2>Encrypted Counter</h2>
        <p className="error">Error: {error.message}</p>
      </div>
    )
  }

  if (!address) {
    return (
      <div className="card">
        <h2>Encrypted Counter</h2>
        <p>Please connect your wallet to continue</p>
      </div>
    )
  }

  if (status !== 'ready') {
    return (
      <div className="card">
        <h2>Encrypted Counter</h2>
        <p>FHEVM instance not ready</p>
      </div>
    )
  }

  // Main UI
  return (
    <div className="card">
      <h2>Encrypted Counter</h2>
      
      <div className="section">
        <h3>Increment Counter</h3>
        <div className="input-group">
          <input
            type="number"
            min="1"
            value={incrementAmount}
            onChange={(e) => setIncrementAmount(e.target.value)}
            placeholder="Amount to add"
            disabled={isIncrementing}
          />
          <button 
            onClick={handleIncrement}
            disabled={isIncrementing || status !== 'ready'}
          >
            {isIncrementing ? 'Incrementing...' : 'Increment'}
          </button>
        </div>
        <p className="hint">
          This encrypts your value and adds it to the on-chain counter
        </p>
      </div>

      <div className="section">
        <h3>View Counter</h3>
        <button 
          onClick={handleDecrypt}
          disabled={isDecrypting || status !== 'ready'}
        >
          {isDecrypting ? 'Decrypting...' : 'Decrypt Counter'}
        </button>
        {decryptedValue !== null && (
          <div className="result">
            <p>Current Counter Value: <strong>{decryptedValue}</strong></p>
          </div>
        )}
        <p className="hint">
          This requires an EIP-712 signature to decrypt your counter value
        </p>
      </div>
    </div>
  )
}
```

## Styling

Add CSS for the component:

```css
/* src/components/EncryptedCounter.css */
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

.card h2 {
  margin-top: 0;
  color: #333;
}

.section {
  margin: 24px 0;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.section h3 {
  margin-top: 0;
  color: #555;
  font-size: 18px;
}

.input-group {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.input-group input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.input-group input:focus {
  outline: none;
  border-color: #4CAF50;
}

button {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #45a049;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.hint {
  margin: 8px 0 0;
  font-size: 14px;
  color: #666;
}

.result {
  margin: 16px 0;
  padding: 16px;
  background: white;
  border-left: 4px solid #4CAF50;
  border-radius: 4px;
}

.result strong {
  color: #4CAF50;
  font-size: 24px;
}

.error {
  color: #f44336;
  padding: 12px;
  background: #ffebee;
  border-radius: 6px;
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @fhevm-sdk/core @fhevm-sdk/actions @fhevm-sdk/react ethers@6
```

### 2. Deploy Contract

```bash
# Start Hardhat network
npx hardhat node

# In another terminal, deploy contract
npx hardhat run scripts/deploy.ts --network localhost
```

### 3. Update Contract Address

Replace `CONTRACT_ADDRESS` in the component with your deployed contract address.

### 4. Run Application

```bash
npm run dev
```

## How It Works

### Encryption Flow

1. User enters increment amount (e.g., 5)
2. SDK encrypts the value using FHEVM public key
3. Encrypted handle + proof sent to smart contract
4. Contract adds encrypted amount to encrypted counter
5. Counter remains encrypted on-chain

### Decryption Flow

1. User clicks "Decrypt Counter"
2. Contract returns encrypted euint32 handle
3. Frontend converts handle to hex string format
4. User signs EIP-712 message (signature cached for 7 days)
5. SDK decrypts handle using signature and private key
6. Plaintext value displayed to user

## Key Concepts

### Why Encrypted?

The counter value is **never** visible on-chain:
- Blockchain explorers show encrypted bytes
- Other users cannot see your counter
- Only you can decrypt with your signature

### Zero-Knowledge Proofs

When encrypting, the SDK generates a proof that:
- Value is correctly encrypted
- Encryption is valid for this contract
- No cheating or tampering occurred

### Signature Caching

The EIP-712 signature is cached in localStorage:
- Valid for 7 days
- Scoped to (userAddress, contractAddresses)
- Avoids repeated wallet prompts
- Can be manually cleared if needed

## Error Handling

Common errors and solutions:

### "Provider not connected"

**Solution:** Connect MetaMask before using the app

### "Signature rejected"

**Solution:** User must approve EIP-712 signature to decrypt

### "Transaction failed"

**Solution:** Check Hardhat is running and contract is deployed

### "Invalid handle format"

**Solution:** Ensure contract is returning euint32 handle correctly and conversion to hex is working

## Next Steps

Extend this example:

1. **Add Decrement:** Create `decrement()` function
2. **Multiple Counters:** Track different counters per user
3. **Counter History:** Store encrypted increment history
4. **Batch Operations:** Encrypt multiple operations at once
5. **Error Recovery:** Add retry logic and better error messages

## Where to go next

🟨 Go to [**Encryption API**](../api-reference/actions/encrypt.md) for detailed encryption documentation.

🟨 Go to [**Decryption API**](../api-reference/actions/decrypt.md) for detailed decryption documentation.

🟨 Go to [**Core Concepts**](../core-concepts/README.md) to understand FHEVM fundamentals.

🟨 Go to [**Quick Start - React**](../getting-started/quick-start-react.md) to learn the basics.
