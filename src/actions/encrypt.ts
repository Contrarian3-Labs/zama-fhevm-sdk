/**
 * @fileoverview FHEVM encryption action following Wagmi's action pattern.
 *
 * Provides framework-agnostic encryption of values for FHEVM smart contracts.
 * Extracted from React hook (useFHEEncryption.ts:72-101) to separate business logic from UI concerns.
 *
 * **Architecture:**
 * ```
 * encrypt(config, params)
 * ├── Create RelayerEncryptedInput builder
 * ├── Add values by type (ebool, euint8-256, eaddress)
 * └── Call input.encrypt() → {handles, inputProof}
 * ```
 *
 * **FHEVM Type System:**
 * - ebool: Encrypted boolean
 * - euint8, euint16, euint32, euint64, euint128, euint256: Encrypted unsigned integers
 * - eaddress: Encrypted Ethereum address
 *
 * Each type maps to a specific RelayerEncryptedInput method (e.g., euint8 → add8).
 *
 * **Helper Functions:**
 * - getEncryptionMethod: Maps FHEVM types to builder methods
 * - toHex: Converts Uint8Array/string to 0x-prefixed hex
 * - buildParamsFromAbi: Converts EncryptResult to contract call parameters
 *
 * @module actions/encrypt
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/actions Wagmi actions pattern}
 */

import type { FhevmConfig } from '../createConfig.js'
import type { FhevmInstance } from '../fhevmTypes.js'
import type { RelayerEncryptedInput } from '@zama-fhe/relayer-sdk/web'

/////////////////////////////////////////////////////////////////////////////////////////////////
// Types
/////////////////////////////////////////////////////////////////////////////////////////////////

export type EncryptParameters = {
  instance: FhevmInstance
  contractAddress: `0x${string}`
  userAddress: `0x${string}`
  values: Array<{ type: EncryptionType; value: any }>
}

export type EncryptionType =
  | 'ebool'
  | 'euint8'
  | 'euint16'
  | 'euint32'
  | 'euint64'
  | 'euint128'
  | 'euint256'
  | 'eaddress'

export type EncryptResult = {
  handles: Uint8Array[]
  inputProof: Uint8Array
}

export type EncryptReturnType = EncryptResult

/////////////////////////////////////////////////////////////////////////////////////////////////
// Helper Functions
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Maps FHEVM encrypted types to RelayerEncryptedInput builder methods.
 *
 * This mapping is defined by the FHEVM relayer SDK and must match exactly.
 *
 * **Type Mapping Table:**
 * | FHEVM Type | Builder Method | Value Type |
 * |------------|----------------|------------|
 * | ebool      | addBool        | boolean    |
 * | euint8     | add8           | number     |
 * | euint16    | add16          | number     |
 * | euint32    | add32          | number     |
 * | euint64    | add64          | bigint     |
 * | euint128   | add128         | bigint     |
 * | euint256   | add256         | bigint     |
 * | eaddress   | addAddress     | string     |
 *
 * **Handles ABI Type Prefixes:**
 * Automatically strips Solidity ABI prefixes like 'external' (e.g., 'externalEuint32' → 'euint32')
 * This ensures compatibility with contract ABIs that use external type markers.
 *
 * @param type - FHEVM encrypted type (e.g., 'euint8', 'externalEuint32', 'ebool')
 * @returns RelayerEncryptedInput method name as const string
 *
 * @throws {Error} If type is unknown or unsupported
 *
 * @example
 * const method = getEncryptionMethod('euint8') // 'add8'
 * input[method](42) // Calls input.add8(42)
 *
 * @example
 * // Handles Solidity ABI external types
 * const method = getEncryptionMethod('externalEuint32') // 'add32'
 * input[method](100) // Calls input.add32(100)
 */
export const getEncryptionMethod = (type: string) => {
  // Normalize: strip 'external' prefix if present (Solidity ABI compatibility)
  // Also lowercase the result to handle "externalEuint32" → "euint32"
  const normalized = type.replace(/^external/i, '').toLowerCase() as EncryptionType

  switch (normalized) {
    case 'ebool':
      return 'addBool' as const
    case 'euint8':
      return 'add8' as const
    case 'euint16':
      return 'add16' as const
    case 'euint32':
      return 'add32' as const
    case 'euint64':
      return 'add64' as const
    case 'euint128':
      return 'add128' as const
    case 'euint256':
      return 'add256' as const
    case 'eaddress':
      return 'addAddress' as const
    default:
      throw new Error(
        `Unknown encryption type: "${type}" (normalized: "${normalized}"). ` +
        `Supported types: ebool, euint8, euint16, euint32, euint64, euint128, euint256, eaddress ` +
        `(with optional 'external' prefix for ABI compatibility)`
      )
  }
}

/**
 * Converts Uint8Array or string to 0x-prefixed hex string for contract calls.
 *
 * This is a critical utility for ABI parameter encoding, as Solidity expects
 * bytes/bytes32 parameters in hex format.
 *
 * @param value - Uint8Array from encryption result OR hex string (with or without 0x prefix)
 * @returns 0x-prefixed hex string compatible with ethers.js contract calls
 *
 * @example
 * toHex(new Uint8Array([1, 2, 3])) // '0x010203'
 * toHex('abcd') // '0xabcd'
 * toHex('0xabcd') // '0xabcd' (unchanged)
 */
export const toHex = (value: Uint8Array | string): `0x${string}` => {
  if (typeof value === 'string') {
    return (value.startsWith('0x') ? value : `0x${value}`) as `0x${string}`
  }
  // value is Uint8Array
  return ('0x' + Buffer.from(value).toString('hex')) as `0x${string}`
}

/**
 * Builds contract function parameters from encryption result and ABI definition.
 *
 * Converts EncryptResult (Uint8Array handles/proof) to properly typed parameters
 * for ethers.js contract calls, based on function ABI.
 *
 * **Parameter Mapping:**
 * - Index 0: First encrypted handle (usually the encrypted value)
 * - Index 1+: Input proof (cryptographic proof for verification)
 *
 * **Type Conversion:**
 * - bytes/bytes32: Uint8Array → hex string (via toHex)
 * - uint256: Uint8Array → hex string → BigInt (two-step conversion required)
 * - address/string: Pass through as string
 * - bool: Convert to boolean
 *
 * **WHY uint256 needs two-step conversion:**
 * BigInt() cannot directly parse Uint8Array. Must convert to hex string first:
 * - ❌ BigInt(Uint8Array([1,2,3])) → SyntaxError: Cannot convert 1,2,3 to BigInt
 * - ✅ BigInt(toHex(Uint8Array([1,2,3]))) → BigInt('0x010203') → 66051n
 *
 * @param enc - Encryption result from encrypt() or encryptWith()
 * @param abi - Contract ABI array (standard ethers.js format)
 * @param functionName - Target function name in ABI
 * @returns Array of properly typed parameters for contract call
 *
 * @throws {Error} If function not found in ABI
 *
 * @example
 * // Contract function: setValue(bytes32 handle, bytes proof)
 * const params = buildParamsFromAbi(encryptResult, contractAbi, 'setValue')
 * // Returns: ['0x1234...', '0xabcd...']
 * await contract.setValue(...params)
 *
 * @example
 * // Contract function: setEncrypted(uint256 handle, bytes proof)
 * const params = buildParamsFromAbi(encryptResult, abi, 'setEncrypted')
 * // Returns: [12345678901234567890n, '0xabcd...']
 *
 * @see {@link toHex} for hex conversion logic
 */
export const buildParamsFromAbi = (
  enc: EncryptResult,
  abi: any[],
  functionName: string
): any[] => {
  const fn = abi.find((item: any) => item.type === 'function' && item.name === functionName)
  if (!fn) throw new Error(`Function ABI not found for ${functionName}`)

  return fn.inputs.map((input: any, index: number) => {
    const raw = index === 0 ? enc.handles[0] : enc.inputProof
    switch (input.type) {
      case 'bytes32':
      case 'bytes':
        return toHex(raw)
      case 'uint256':
        // Must convert Uint8Array to hex first, then to BigInt
        // BigInt() cannot parse Uint8Array directly
        return BigInt(toHex(raw))
      case 'address':
      case 'string':
        return raw as unknown as string
      case 'bool':
        return Boolean(raw)
      default:
        console.warn(`Unknown ABI param type ${input.type}; passing as hex`)
        return toHex(raw)
    }
  })
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Main Action
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Encrypts values for FHEVM smart contract input using homomorphic encryption.
 *
 * This is the main encryption action, following Wagmi's action pattern (config, params) => Promise<Result>.
 * Takes plaintext values and produces encrypted handles + cryptographic proof for contract verification.
 *
 * **What gets encrypted:**
 * - Plaintext values (numbers, booleans, addresses)
 * - Converted to ciphertext handles (Uint8Array)
 * - Accompanied by zero-knowledge proof (inputProof)
 *
 * **Result structure:**
 * ```typescript
 * {
 *   handles: Uint8Array[],  // One handle per encrypted value
 *   inputProof: Uint8Array   // ZK proof for verification
 * }
 * ```
 *
 * **Type-safe encryption:**
 * Each FHEVM type maps to a specific builder method:
 * - ebool → addBool(boolean)
 * - euint8-32 → add8-32(number)
 * - euint64-256 → add64-256(bigint)
 * - eaddress → addAddress(string)
 *
 * @template config - FHEVM configuration type
 *
 * @param config - FHEVM configuration object from createFhevmConfig()
 * @param parameters - Encryption parameters
 * @param parameters.instance - FhevmInstance for cryptographic operations
 * @param parameters.contractAddress - Target contract address (used for encryption context)
 * @param parameters.userAddress - User's Ethereum address (encryption is user-specific)
 * @param parameters.values - Array of {type, value} pairs to encrypt
 *
 * @returns Promise<EncryptResult> with handles[] and inputProof
 *
 * @throws {Error} If encryption method doesn't exist (SDK version mismatch)
 * @throws {Error} If value encryption fails (invalid value for type)
 *
 * @example
 * // Basic usage: Encrypt single value
 * const config = createFhevmConfig({ chains: [31337] })
 * const instance = await createInstance(config, { provider })
 *
 * const encrypted = await encrypt(config, {
 *   instance,
 *   contractAddress: '0xYourContract...',
 *   userAddress: await signer.getAddress(),
 *   values: [
 *     { type: 'euint8', value: 42 }
 *   ]
 * })
 *
 * @example
 * // Encrypt multiple values (batch encryption)
 * const encrypted = await encrypt(config, {
 *   instance,
 *   contractAddress: '0xContract...',
 *   userAddress: userAddr,
 *   values: [
 *     { type: 'euint32', value: 1000 },
 *     { type: 'ebool', value: true },
 *     { type: 'euint64', value: 999999999n },
 *     { type: 'eaddress', value: '0xRecipient...' }
 *   ]
 * })
 * // All values encrypted in single proof
 *
 * @example
 * // Use with contract call (via buildParamsFromAbi)
 * const encrypted = await encrypt(config, {
 *   instance,
 *   contractAddress: contract.address,
 *   userAddress,
 *   values: [{ type: 'euint8', value: 42 }]
 * })
 *
 * const params = buildParamsFromAbi(encrypted, contractAbi, 'setValue')
 * await contract.setValue(...params)
 *
 * @see {@link encryptWith} for custom builder function approach
 * @see {@link buildParamsFromAbi} for converting result to contract parameters
 * @see {@link getEncryptionMethod} for type-to-method mapping
 */
export async function encrypt<config extends FhevmConfig>(
  config: config,
  parameters: EncryptParameters,
): Promise<EncryptReturnType> {
  const { instance, contractAddress, userAddress, values } = parameters

  // Create encrypted input
  const input = instance.createEncryptedInput(
    contractAddress,
    userAddress
  ) as RelayerEncryptedInput

  // Add all values to the input
  for (const { type, value } of values) {
    const method = getEncryptionMethod(type)

    // Validate method exists on input builder
    if (typeof (input as any)[method] !== 'function') {
      throw new Error(
        `Invalid encryption method: ${method} for type: ${type}. ` +
        `This may indicate a version mismatch with the FHEVM SDK.`
      )
    }

    // Call the appropriate method on the input builder with error handling
    try {
      ;(input as any)[method](value)
    } catch (error) {
      throw new Error(
        `Failed to encrypt value of type ${type}: ${(error as Error).message}`,
        { cause: error }
      )
    }
  }

  // Encrypt and return
  const encrypted = await input.encrypt()
  return encrypted
}

/**
 * Advanced encryption with custom builder function for fine-grained control.
 *
 * Provides direct access to RelayerEncryptedInput builder for advanced use cases
 * where the declarative encrypt() API is too restrictive.
 *
 * **When to use this:**
 * - Need conditional encryption logic
 * - Want to call builder methods directly
 * - Integrating with existing builder-based code
 * - Need full control over builder method calls
 *
 * **Most users should use encrypt()** which provides type-safe declarative API.
 *
 * @template config - FHEVM configuration type
 *
 * @param config - FHEVM configuration object from createFhevmConfig()
 * @param parameters - Encryption parameters with custom builder
 * @param parameters.instance - FhevmInstance for cryptographic operations
 * @param parameters.contractAddress - Target contract address
 * @param parameters.userAddress - User's Ethereum address
 * @param parameters.buildFn - Custom function that receives builder and calls its methods
 *
 * @returns Promise<EncryptResult> with handles[] and inputProof
 *
 * @throws {Error} Propagates errors from buildFn or encryption process
 *
 * @example
 * // Custom builder logic
 * const encrypted = await encryptWith(config, {
 *   instance,
 *   contractAddress: '0xContract...',
 *   userAddress: '0xUser...',
 *   buildFn: (builder) => {
 *     builder.add8(42)
 *     builder.addBool(true)
 *     builder.add64(1000000n)
 *   }
 * })
 *
 * @example
 * // Conditional encryption
 * const encrypted = await encryptWith(config, {
 *   instance,
 *   contractAddress,
 *   userAddress,
 *   buildFn: (builder) => {
 *     builder.add32(baseValue)
 *     if (includeBonus) {
 *       builder.add32(bonusValue)
 *     }
 *   }
 * })
 *
 * @example
 * // Direct builder method access
 * const encrypted = await encryptWith(config, {
 *   instance,
 *   contractAddress,
 *   userAddress,
 *   buildFn: (builder) => {
 *     // Call any RelayerEncryptedInput method
 *     builder.add8(255)
 *     builder.addAddress('0xRecipient...')
 *   }
 * })
 *
 * @see {@link encrypt} for declarative type-safe API (recommended for most users)
 * @see {@link RelayerEncryptedInput} for available builder methods
 */
export async function encryptWith<config extends FhevmConfig>(
  config: config,
  parameters: {
    instance: FhevmInstance
    contractAddress: `0x${string}`
    userAddress: `0x${string}`
    buildFn: (builder: RelayerEncryptedInput) => void
  },
): Promise<EncryptReturnType> {
  const { instance, contractAddress, userAddress, buildFn } = parameters

  const input = instance.createEncryptedInput(
    contractAddress,
    userAddress
  ) as RelayerEncryptedInput

  buildFn(input)

  const encrypted = await input.encrypt()
  return encrypted
}
