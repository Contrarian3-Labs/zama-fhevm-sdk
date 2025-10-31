import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  encrypt,
  encryptWith,
  getEncryptionMethod,
  toHex,
  buildParamsFromAbi,
  type EncryptionType,
} from '../../src/actions/encrypt.js'
import { createFhevmConfig } from '../../src/createConfig.js'
import type { FhevmInstance } from '../../src/fhevmTypes.js'
import type { RelayerEncryptedInput } from '@zama-fhe/relayer-sdk/web'

describe('actions/encrypt', () => {
  describe('getEncryptionMethod', () => {
    it('should map ebool to addBool', () => {
      expect(getEncryptionMethod('ebool')).toBe('addBool')
    })

    it('should map euint8 to add8', () => {
      expect(getEncryptionMethod('euint8')).toBe('add8')
    })

    it('should map euint16 to add16', () => {
      expect(getEncryptionMethod('euint16')).toBe('add16')
    })

    it('should map euint32 to add32', () => {
      expect(getEncryptionMethod('euint32')).toBe('add32')
    })

    it('should map euint64 to add64', () => {
      expect(getEncryptionMethod('euint64')).toBe('add64')
    })

    it('should map euint128 to add128', () => {
      expect(getEncryptionMethod('euint128')).toBe('add128')
    })

    it('should map euint256 to add256', () => {
      expect(getEncryptionMethod('euint256')).toBe('add256')
    })

    it('should map eaddress to addAddress', () => {
      expect(getEncryptionMethod('eaddress')).toBe('addAddress')
    })

    it('should throw error for unknown types', () => {
      expect(() => getEncryptionMethod('unknown' as EncryptionType)).toThrow(
        'Unknown encryption type: "unknown"'
      )
    })

    it('should handle external prefix (externalEuint32)', () => {
      expect(getEncryptionMethod('externalEuint32')).toBe('add32')
    })

    it('should handle external prefix case-insensitively', () => {
      expect(getEncryptionMethod('externalEuint64')).toBe('add64')
      expect(getEncryptionMethod('externalEbool')).toBe('addBool')
    })
  })

  describe('toHex', () => {
    it('should convert Uint8Array to hex string', () => {
      const arr = new Uint8Array([0, 1, 2, 255])
      const hex = toHex(arr)

      expect(hex).toBe('0x000102ff')
      expect(hex.startsWith('0x')).toBe(true)
    })

    it('should add 0x prefix to non-prefixed string', () => {
      const result = toHex('abcdef')
      expect(result).toBe('0xabcdef')
    })

    it('should keep 0x prefix on prefixed string', () => {
      const result = toHex('0xabcdef')
      expect(result).toBe('0xabcdef')
    })

    it('should handle empty Uint8Array', () => {
      const arr = new Uint8Array([])
      const hex = toHex(arr)
      expect(hex).toBe('0x')
    })

    it('should handle empty string', () => {
      const result = toHex('')
      expect(result).toBe('0x')
    })
  })

  describe('buildParamsFromAbi', () => {
    it('should build params for bytes32 and bytes types', () => {
      const encResult = {
        handles: [new Uint8Array([1, 2, 3, 4])],
        inputProof: new Uint8Array([5, 6, 7, 8]),
      }

      const abi = [
        {
          type: 'function',
          name: 'testFunc',
          inputs: [
            { type: 'bytes32', name: 'handle' },
            { type: 'bytes', name: 'proof' },
          ],
        },
      ]

      const params = buildParamsFromAbi(encResult, abi, 'testFunc')

      expect(params).toHaveLength(2)
      expect(params[0]).toBe('0x01020304')
      expect(params[1]).toBe('0x05060708')
    })

    it('should throw error if function not found in ABI', () => {
      const encResult = {
        handles: [new Uint8Array([1, 2, 3, 4])],
        inputProof: new Uint8Array([5, 6, 7, 8]),
      }

      const abi = [
        {
          type: 'function',
          name: 'otherFunc',
          inputs: [],
        },
      ]

      expect(() => {
        buildParamsFromAbi(encResult, abi, 'testFunc')
      }).toThrow('Function ABI not found for testFunc')
    })

    it('should handle uint256 type', () => {
      const encResult = {
        handles: [new Uint8Array([1, 2, 3, 4])],
        inputProof: new Uint8Array([5, 6, 7, 8]),
      }

      const abi = [
        {
          type: 'function',
          name: 'testFunc',
          inputs: [{ type: 'uint256', name: 'value' }],
        },
      ]

      const params = buildParamsFromAbi(encResult, abi, 'testFunc')

      // Note: This test validates the function doesn't throw
      // The actual BigInt conversion might need mocking
      expect(params).toHaveLength(1)
    })

    it('should handle bool type', () => {
      const encResult = {
        handles: [new Uint8Array([1])],
        inputProof: new Uint8Array([0]),
      }

      const abi = [
        {
          type: 'function',
          name: 'testFunc',
          inputs: [{ type: 'bool', name: 'flag' }],
        },
      ]

      const params = buildParamsFromAbi(encResult, abi, 'testFunc')

      expect(params).toHaveLength(1)
      expect(typeof params[0]).toBe('boolean')
    })

    it('should warn and convert unknown types to hex', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const encResult = {
        handles: [new Uint8Array([1, 2, 3, 4])],
        inputProof: new Uint8Array([5, 6, 7, 8]),
      }

      const abi = [
        {
          type: 'function',
          name: 'testFunc',
          inputs: [{ type: 'unknownType', name: 'value' }],
        },
      ]

      const params = buildParamsFromAbi(encResult, abi, 'testFunc')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown ABI param type')
      )
      expect(params[0]).toMatch(/^0x/)

      consoleWarnSpy.mockRestore()
    })
  })

  describe('encrypt', () => {
    let mockInstance: FhevmInstance
    let mockInput: RelayerEncryptedInput
    let config: ReturnType<typeof createFhevmConfig>

    beforeEach(() => {
      mockInput = {
        addBool: vi.fn().mockReturnThis(),
        add8: vi.fn().mockReturnThis(),
        add16: vi.fn().mockReturnThis(),
        add32: vi.fn().mockReturnThis(),
        add64: vi.fn().mockReturnThis(),
        add128: vi.fn().mockReturnThis(),
        add256: vi.fn().mockReturnThis(),
        addAddress: vi.fn().mockReturnThis(),
        encrypt: vi.fn().mockResolvedValue({
          handles: [new Uint8Array([1, 2, 3, 4])],
          inputProof: new Uint8Array([5, 6, 7, 8]),
        }),
      } as unknown as RelayerEncryptedInput

      mockInstance = {
        createEncryptedInput: vi.fn().mockReturnValue(mockInput),
        userDecrypt: vi.fn(),
      } as unknown as FhevmInstance

      config = createFhevmConfig({
        chains: [31337],
      })
    })

    it('should encrypt single ebool value', async () => {
      const result = await encrypt(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        values: [{ type: 'ebool', value: true }],
      })

      expect(mockInstance.createEncryptedInput).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321'
      )
      expect(mockInput.addBool).toHaveBeenCalledWith(true)
      expect(mockInput.encrypt).toHaveBeenCalled()
      expect(result.handles).toBeDefined()
      expect(result.inputProof).toBeDefined()
    })

    it('should encrypt single euint8 value', async () => {
      const result = await encrypt(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        values: [{ type: 'euint8', value: 42 }],
      })

      expect(mockInput.add8).toHaveBeenCalledWith(42)
      expect(result).toBeDefined()
    })

    it('should encrypt single euint16 value', async () => {
      await encrypt(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        values: [{ type: 'euint16', value: 1000 }],
      })

      expect(mockInput.add16).toHaveBeenCalledWith(1000)
    })

    it('should encrypt single euint32 value', async () => {
      await encrypt(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        values: [{ type: 'euint32', value: 100000 }],
      })

      expect(mockInput.add32).toHaveBeenCalledWith(100000)
    })

    it('should encrypt single euint64 value', async () => {
      await encrypt(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        values: [{ type: 'euint64', value: 1000000n }],
      })

      expect(mockInput.add64).toHaveBeenCalledWith(1000000n)
    })

    it('should encrypt single euint128 value', async () => {
      await encrypt(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        values: [{ type: 'euint128', value: 1000000000n }],
      })

      expect(mockInput.add128).toHaveBeenCalledWith(1000000000n)
    })

    it('should encrypt single euint256 value', async () => {
      await encrypt(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        values: [{ type: 'euint256', value: 1000000000000n }],
      })

      expect(mockInput.add256).toHaveBeenCalledWith(1000000000000n)
    })

    it('should encrypt single eaddress value', async () => {
      await encrypt(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        values: [{ type: 'eaddress', value: '0xabcdef' }],
      })

      expect(mockInput.addAddress).toHaveBeenCalledWith('0xabcdef')
    })

    it('should encrypt multiple values', async () => {
      await encrypt(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        values: [
          { type: 'ebool', value: true },
          { type: 'euint8', value: 42 },
          { type: 'euint32', value: 1000 },
        ],
      })

      expect(mockInput.addBool).toHaveBeenCalledWith(true)
      expect(mockInput.add8).toHaveBeenCalledWith(42)
      expect(mockInput.add32).toHaveBeenCalledWith(1000)
      expect(mockInput.encrypt).toHaveBeenCalledTimes(1)
    })

    it('should throw error if encryption method does not exist', async () => {
      const invalidInput = {
        encrypt: vi.fn(),
        // Missing addBool method
      } as unknown as RelayerEncryptedInput

      const invalidInstance = {
        createEncryptedInput: vi.fn().mockReturnValue(invalidInput),
      } as unknown as FhevmInstance

      await expect(
        encrypt(config, {
          instance: invalidInstance,
          contractAddress: '0x1234567890123456789012345678901234567890',
          userAddress: '0x0987654321098765432109876543210987654321',
          values: [{ type: 'ebool', value: true }],
        })
      ).rejects.toThrow('Invalid encryption method')
    })

    it('should wrap encryption errors with context', async () => {
      const errorInput = {
        addBool: vi.fn().mockImplementation(() => {
          throw new Error('Encryption failed')
        }),
        encrypt: vi.fn(),
      } as unknown as RelayerEncryptedInput

      const errorInstance = {
        createEncryptedInput: vi.fn().mockReturnValue(errorInput),
      } as unknown as FhevmInstance

      await expect(
        encrypt(config, {
          instance: errorInstance,
          contractAddress: '0x1234567890123456789012345678901234567890',
          userAddress: '0x0987654321098765432109876543210987654321',
          values: [{ type: 'ebool', value: true }],
        })
      ).rejects.toThrow('Failed to encrypt value of type ebool')
    })

    it('should handle empty values array', async () => {
      const result = await encrypt(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        values: [],
      })

      expect(mockInput.encrypt).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('encryptWith', () => {
    let mockInstance: FhevmInstance
    let mockInput: RelayerEncryptedInput
    let config: ReturnType<typeof createFhevmConfig>

    beforeEach(() => {
      mockInput = {
        addBool: vi.fn().mockReturnThis(),
        add8: vi.fn().mockReturnThis(),
        add64: vi.fn().mockReturnThis(),
        encrypt: vi.fn().mockResolvedValue({
          handles: [new Uint8Array([1, 2, 3, 4])],
          inputProof: new Uint8Array([5, 6, 7, 8]),
        }),
      } as unknown as RelayerEncryptedInput

      mockInstance = {
        createEncryptedInput: vi.fn().mockReturnValue(mockInput),
      } as unknown as FhevmInstance

      config = createFhevmConfig({
        chains: [31337],
      })
    })

    it('should encrypt with custom builder function', async () => {
      const result = await encryptWith(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        buildFn: (builder) => {
          builder.add8(42)
          builder.addBool(true)
        },
      })

      expect(mockInput.add8).toHaveBeenCalledWith(42)
      expect(mockInput.addBool).toHaveBeenCalledWith(true)
      expect(mockInput.encrypt).toHaveBeenCalled()
      expect(result.handles).toBeDefined()
      expect(result.inputProof).toBeDefined()
    })

    it('should pass builder instance to buildFn', async () => {
      const buildFn = vi.fn()

      await encryptWith(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        buildFn,
      })

      expect(buildFn).toHaveBeenCalledWith(mockInput)
    })

    it('should handle complex encryption logic', async () => {
      await encryptWith(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        buildFn: (builder) => {
          // Conditional encryption
          const value = 100
          if (value > 50) {
            builder.add64(BigInt(value))
          } else {
            builder.add8(value)
          }
        },
      })

      expect(mockInput.add64).toHaveBeenCalledWith(BigInt(100))
      expect(mockInput.add8).not.toHaveBeenCalled()
    })

    it('should allow chainable builder pattern', async () => {
      await encryptWith(config, {
        instance: mockInstance,
        contractAddress: '0x1234567890123456789012345678901234567890',
        userAddress: '0x0987654321098765432109876543210987654321',
        buildFn: (builder) => {
          builder
            .add8(1)
            .add8(2)
            .add8(3)
        },
      })

      expect(mockInput.add8).toHaveBeenCalledTimes(3)
      expect(mockInput.add8).toHaveBeenNthCalledWith(1, 1)
      expect(mockInput.add8).toHaveBeenNthCalledWith(2, 2)
      expect(mockInput.add8).toHaveBeenNthCalledWith(3, 3)
    })
  })
})
