import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  publicDecrypt,
  type PublicDecryptParameters,
} from '../../src/actions/publicDecrypt.js'
import { createFhevmConfig } from '../../src/createConfig.js'
import type { FhevmInstance } from '../../src/fhevmTypes.js'

describe('actions/publicDecrypt', () => {
  let config: ReturnType<typeof createFhevmConfig>
  let mockInstance: FhevmInstance

  beforeEach(() => {
    config = createFhevmConfig({
      chains: [31337],
      mockChains: { 31337: 'http://localhost:8545' },
    })

    // Mock FhevmInstance with publicDecrypt method
    mockInstance = {
      publicDecrypt: vi.fn(),
      createEncryptedInput: vi.fn(),
      userDecrypt: vi.fn(),
      generateKeypair: vi.fn(),
      createEIP712: vi.fn(),
      getPublicKey: vi.fn(),
      getPublicParams: vi.fn(),
    } as any
  })

  describe('Basic Functionality', () => {
    it('should decrypt single publicly marked handle', async () => {
      const handle = '0x0000000000000000000000000000000000000000000000000000000000000001'
      const expectedResult = { [handle]: 42n }

      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue(expectedResult)

      const result = await publicDecrypt(config, {
        instance: mockInstance,
        handles: [handle],
      })

      expect(mockInstance.publicDecrypt).toHaveBeenCalledWith([handle])
      expect(result).toEqual(expectedResult)
    })

    it('should decrypt multiple handles (batch decryption)', async () => {
      const handles = [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000000000000000000000000000003',
      ]
      const expectedResult = {
        [handles[0]]: 100n,
        [handles[1]]: 95n,
        [handles[2]]: 90n,
      }

      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue(expectedResult)

      const result = await publicDecrypt(config, {
        instance: mockInstance,
        handles,
      })

      expect(mockInstance.publicDecrypt).toHaveBeenCalledWith(handles)
      expect(result).toEqual(expectedResult)
    })

    it('should handle empty handles array', async () => {
      const result = await publicDecrypt(config, {
        instance: mockInstance,
        handles: [],
      })

      expect(mockInstance.publicDecrypt).not.toHaveBeenCalled()
      expect(result).toEqual({})
    })
  })

  describe('Mixed Types Support', () => {
    it('should handle bool values', async () => {
      const handle = '0x0000000000000000000000000000000000000000000000000000000000000001'
      const expectedResult = { [handle]: true }

      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue(expectedResult)

      const result = await publicDecrypt(config, {
        instance: mockInstance,
        handles: [handle],
      })

      expect(result[handle]).toBe(true)
      expect(typeof result[handle]).toBe('boolean')
    })

    it('should handle bigint values (uint types)', async () => {
      const handle = '0x0000000000000000000000000000000000000000000000000000000000000002'
      const expectedResult = { [handle]: 242n }

      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue(expectedResult)

      const result = await publicDecrypt(config, {
        instance: mockInstance,
        handles: [handle],
      })

      expect(result[handle]).toBe(242n)
      expect(typeof result[handle]).toBe('bigint')
    })

    it('should handle address values (string)', async () => {
      const handle = '0x0000000000000000000000000000000000000000000000000000000000000003'
      const address = '0xfC4382C084fCA3f4fB07c3BCDA906C01797595a8'
      const expectedResult = { [handle]: address }

      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue(expectedResult)

      const result = await publicDecrypt(config, {
        instance: mockInstance,
        handles: [handle],
      })

      expect(result[handle]).toBe(address)
      expect(typeof result[handle]).toBe('string')
    })

    it('should handle mixed types in single call', async () => {
      const handles = [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000000000000000000000000000003',
      ]
      const expectedResult = {
        [handles[0]]: true,                                     // ebool
        [handles[1]]: 242n,                                     // euint32
        [handles[2]]: '0xfC4382C084fCA3f4fB07c3BCDA906C01797595a8', // eaddress
      }

      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue(expectedResult)

      const result = await publicDecrypt(config, {
        instance: mockInstance,
        handles,
      })

      expect(result[handles[0]]).toBe(true)
      expect(result[handles[1]]).toBe(242n)
      expect(result[handles[2]]).toBe('0xfC4382C084fCA3f4fB07c3BCDA906C01797595a8')
    })
  })

  describe('Handle Validation', () => {
    it('should reject non-string handle', async () => {
      await expect(
        publicDecrypt(config, {
          instance: mockInstance,
          handles: [123 as any],
        })
      ).rejects.toThrow('Invalid handle: must be a non-empty string')
    })

    it('should reject empty string handle', async () => {
      await expect(
        publicDecrypt(config, {
          instance: mockInstance,
          handles: [''],
        })
      ).rejects.toThrow('Invalid handle: must be a non-empty string')
    })

    it('should reject handle not starting with 0x', async () => {
      await expect(
        publicDecrypt(config, {
          instance: mockInstance,
          handles: ['1234567890123456789012345678901234567890123456789012345678901234'],
        })
      ).rejects.toThrow('Invalid handle format: 1234567890123456789012345678901234567890123456789012345678901234 (must start with 0x)')
    })

    it('should reject handle with invalid hex characters', async () => {
      await expect(
        publicDecrypt(config, {
          instance: mockInstance,
          handles: ['0xGGGG000000000000000000000000000000000000000000000000000000000001'],
        })
      ).rejects.toThrow('Invalid handle format:')
    })

    it('should warn on unexpected handle length', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const shortHandle = '0x1234'

      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue({ [shortHandle]: 42n })

      await publicDecrypt(config, {
        instance: mockInstance,
        handles: [shortHandle],
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('has unexpected length 6, expected 66')
      )

      consoleSpy.mockRestore()
    })

    it('should accept valid 66-character handle', async () => {
      const validHandle = '0x0000000000000000000000000000000000000000000000000000000000000001'

      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue({ [validHandle]: 42n })

      const result = await publicDecrypt(config, {
        instance: mockInstance,
        handles: [validHandle],
      })

      expect(result).toEqual({ [validHandle]: 42n })
    })
  })

  describe('Error Handling', () => {
    it('should update config state on error', async () => {
      const error = new Error('Handle not publicly decryptable')
      vi.mocked(mockInstance.publicDecrypt).mockRejectedValue(error)

      await expect(
        publicDecrypt(config, {
          instance: mockInstance,
          handles: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
        })
      ).rejects.toThrow('Handle not publicly decryptable')

      expect(config.state.status).toBe('error')
      expect(config.state.error).toEqual(error)
    })

    it('should re-throw original error (no wrapping)', async () => {
      const originalError = new Error('Network failure')
      vi.mocked(mockInstance.publicDecrypt).mockRejectedValue(originalError)

      try {
        await publicDecrypt(config, {
          instance: mockInstance,
          handles: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
        })
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBe(originalError) // Same instance, not wrapped
        expect((error as Error).message).toBe('Network failure')
      }
    })

    it('should propagate gateway validation errors', async () => {
      const error = new Error('makePubliclyDecryptable not called for handle')
      vi.mocked(mockInstance.publicDecrypt).mockRejectedValue(error)

      await expect(
        publicDecrypt(config, {
          instance: mockInstance,
          handles: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
        })
      ).rejects.toThrow('makePubliclyDecryptable not called')
    })
  })

  describe('No Signature Required', () => {
    it('should NOT call any signature-related methods', async () => {
      const handle = '0x0000000000000000000000000000000000000000000000000000000000000001'
      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue({ [handle]: 42n })

      await publicDecrypt(config, {
        instance: mockInstance,
        handles: [handle],
      })

      // Verify NO signature methods were called
      expect(mockInstance.generateKeypair).not.toHaveBeenCalled()
      expect(mockInstance.createEIP712).not.toHaveBeenCalled()
    })

    it('should work without signer parameter', async () => {
      const handle = '0x0000000000000000000000000000000000000000000000000000000000000001'
      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue({ [handle]: 42n })

      const params: PublicDecryptParameters = {
        instance: mockInstance,
        handles: [handle],
        // NO signer parameter - this should compile and work
      }

      const result = await publicDecrypt(config, params)

      expect(result).toEqual({ [handle]: 42n })
    })

    it('should work without storage parameter', async () => {
      const handle = '0x0000000000000000000000000000000000000000000000000000000000000001'
      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue({ [handle]: 42n })

      const params: PublicDecryptParameters = {
        instance: mockInstance,
        handles: [handle],
        // NO storage parameter - this should compile and work
      }

      const result = await publicDecrypt(config, params)

      expect(result).toEqual({ [handle]: 42n })
    })
  })

  describe('Performance and Optimization', () => {
    it('should batch decrypt efficiently (single call for multiple handles)', async () => {
      const handles = Array.from({ length: 100 }, (_, i) =>
        `0x${i.toString(16).padStart(64, '0')}`
      )
      const expectedResult = Object.fromEntries(
        handles.map((h, i) => [h, BigInt(i)])
      )

      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue(expectedResult)

      await publicDecrypt(config, {
        instance: mockInstance,
        handles,
      })

      // Should make only ONE call, not 100 calls
      expect(mockInstance.publicDecrypt).toHaveBeenCalledTimes(1)
      expect(mockInstance.publicDecrypt).toHaveBeenCalledWith(handles)
    })
  })

  describe('Type Safety', () => {
    it('should have correct TypeScript types', () => {
      type ReturnType = Awaited<ReturnType<typeof publicDecrypt>>
      const test: ReturnType = {} as Record<string, string | bigint | boolean>
      expect(test).toBeDefined()
    })

    it('should accept readonly handles array', async () => {
      const handles: readonly string[] = [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      ] as const

      vi.mocked(mockInstance.publicDecrypt).mockResolvedValue({ [handles[0]]: 42n })

      const result = await publicDecrypt(config, {
        instance: mockInstance,
        handles,
      })

      expect(result).toEqual({ [handles[0]]: 42n })
    })
  })
})
