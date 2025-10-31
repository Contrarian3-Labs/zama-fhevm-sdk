import { describe, it, expect, vi, beforeEach } from 'vitest'
import { decrypt, getDecryptionSignature } from '../../src/actions/decrypt.js'
import { createFhevmConfig } from '../../src/createConfig.js'
import { FhevmDecryptionSignature } from '../../src/FhevmDecryptionSignature.js'
import type { FhevmInstance } from '../../src/fhevmTypes.js'
import type { GenericStringStorage } from '../../src/storage/GenericStringStorage.js'
import type { JsonRpcSigner } from 'ethers'

describe('actions/decrypt', () => {
  let config: ReturnType<typeof createFhevmConfig>
  let mockInstance: FhevmInstance
  let mockSigner: JsonRpcSigner
  let mockStorage: GenericStringStorage
  let mockSignature: FhevmDecryptionSignature

  beforeEach(() => {
    config = createFhevmConfig({
      chains: [31337],
    })

    mockInstance = {
      userDecrypt: vi.fn().mockResolvedValue({
        '0x0000000000000000000000000000000000000000000000000000000000000001': 42n,
        '0x0000000000000000000000000000000000000000000000000000000000000002': true,
      }),
      createEncryptedInput: vi.fn(),
    } as unknown as FhevmInstance

    mockSigner = {
      getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    } as unknown as JsonRpcSigner

    mockStorage = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      removeItem: vi.fn().mockResolvedValue(undefined),
    }

    mockSignature = {
      privateKey: 'private-key',
      publicKey: 'public-key',
      signature: 'signature',
      contractAddresses: ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`], // Full address
      userAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      startTimestamp: Math.floor(Date.now() / 1000),
      durationDays: 365,
      isValid: vi.fn().mockReturnValue(true),
    } as unknown as FhevmDecryptionSignature

    // Mock FhevmDecryptionSignature.loadOrSign
    vi.spyOn(FhevmDecryptionSignature, 'loadOrSign').mockResolvedValue(mockSignature)
  })

  describe('Basic Decryption', () => {
    it('should decrypt single handle', async () => {
      const result = await decrypt(config, {
        instance: mockInstance,
        requests: [
          {
            handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
            contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
        ],
        signer: mockSigner,
        storage: mockStorage,
      })

      expect(FhevmDecryptionSignature.loadOrSign).toHaveBeenCalled()
      expect(mockInstance.userDecrypt).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should decrypt multiple handles', async () => {
      const result = await decrypt(config, {
        instance: mockInstance,
        requests: [
          {
            handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
            contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
          {
            handle: '0x0000000000000000000000000000000000000000000000000000000000000002',
            contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
        ],
        signer: mockSigner,
        storage: mockStorage,
      })

      expect(mockInstance.userDecrypt).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should return empty object for empty requests', async () => {
      const result = await decrypt(config, {
        instance: mockInstance,
        requests: [],
        signer: mockSigner,
        storage: mockStorage,
      })

      expect(result).toEqual({})
      expect(mockInstance.userDecrypt).not.toHaveBeenCalled()
    })

    it('should handle decryption results correctly', async () => {
      mockInstance.userDecrypt = vi.fn().mockResolvedValue({
        '0x0000000000000000000000000000000000000000000000000000000000000001': 42n,
        '0x0000000000000000000000000000000000000000000000000000000000000002': true,
        '0x0000000000000000000000000000000000000000000000000000000000000003': 'value',
      })

      const result = await decrypt(config, {
        instance: mockInstance,
        requests: [
          {
            handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
            contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
        ],
        signer: mockSigner,
        storage: mockStorage,
      })

      expect(result['0x0000000000000000000000000000000000000000000000000000000000000001']).toBe(42n)
      expect(result['0x0000000000000000000000000000000000000000000000000000000000000002']).toBe(true)
      expect(result['0x0000000000000000000000000000000000000000000000000000000000000003']).toBe('value')
    })
  })

  describe('Signature Management', () => {
    it('should load or create signature', async () => {
      await decrypt(config, {
        instance: mockInstance,
        requests: [
          {
            handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
            contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
        ],
        signer: mockSigner,
        storage: mockStorage,
      })

      expect(FhevmDecryptionSignature.loadOrSign).toHaveBeenCalledWith(
        mockInstance,
        ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'],
        mockSigner,
        mockStorage
      )
    })

    it('should throw error if signature creation fails', async () => {
      vi.spyOn(FhevmDecryptionSignature, 'loadOrSign').mockResolvedValue(null)

      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      ).rejects.toThrow('SIGNATURE_ERROR')
    })

    it('should throw error if signature is expired', async () => {
      const expiredSignature = {
        ...mockSignature,
        isValid: vi.fn().mockReturnValue(false),
      }
      vi.spyOn(FhevmDecryptionSignature, 'loadOrSign').mockResolvedValue(
        expiredSignature as unknown as FhevmDecryptionSignature
      )

      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      ).rejects.toThrow('SIGNATURE_EXPIRED')
    })

    it('should throw error if signature does not cover all contracts', async () => {
      const partialSignature = {
        ...mockSignature,
        contractAddresses: ['0x1111' as `0x${string}`], // Different address
      }
      vi.spyOn(FhevmDecryptionSignature, 'loadOrSign').mockResolvedValue(
        partialSignature as unknown as FhevmDecryptionSignature
      )

      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      ).rejects.toThrow('SIGNATURE_MISMATCH')
    })

    it('should handle multiple unique contract addresses', async () => {
      const multiSignature = {
        ...mockSignature,
        contractAddresses: [
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`,
          '0x1111111111111111111111111111111111111111' as `0x${string}`,
        ],
      }
      vi.spyOn(FhevmDecryptionSignature, 'loadOrSign').mockResolvedValue(
        multiSignature as unknown as FhevmDecryptionSignature
      )

      await decrypt(config, {
        instance: mockInstance,
        requests: [
          {
            handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
            contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
          {
            handle: '0x0000000000000000000000000000000000000000000000000000000000000002',
            contractAddress: '0x1111111111111111111111111111111111111111',
          },
        ],
        signer: mockSigner,
        storage: mockStorage,
      })

      expect(FhevmDecryptionSignature.loadOrSign).toHaveBeenCalledWith(
        mockInstance,
        ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', '0x1111111111111111111111111111111111111111'],
        mockSigner,
        mockStorage
      )
    })
  })

  describe('Handle Validation', () => {
    it('should throw error for empty handle', async () => {
      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      ).rejects.toThrow('Invalid handle: must be a non-empty string')
    })

    it('should throw error for non-string handle', async () => {
      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: null as any,
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      ).rejects.toThrow('Invalid handle: must be a non-empty string')
    })

    it('should throw error for handle without 0x prefix', async () => {
      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '1234567890123456789012345678901234567890123456789012345678901234',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      ).rejects.toThrow('must start with 0x')
    })

    it('should throw error for invalid hex characters', async () => {
      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      ).rejects.toThrow('must be valid hex string')
    })

    it('should warn for handle with unexpected length', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await decrypt(config, {
        instance: mockInstance,
        requests: [
          {
            handle: '0x1234', // Too short
            contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
        ],
        signer: mockSigner,
        storage: mockStorage,
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unexpected length')
      )

      consoleWarnSpy.mockRestore()
    })

    it('should accept valid 66-character handle', async () => {
      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      ).resolves.toBeDefined()
    })
  })

  describe('Decryption Call', () => {
    it('should call userDecrypt with correct parameters', async () => {
      await decrypt(config, {
        instance: mockInstance,
        requests: [
          {
            handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
            contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
        ],
        signer: mockSigner,
        storage: mockStorage,
      })

      expect(mockInstance.userDecrypt).toHaveBeenCalledWith(
        [
          {
            handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
            contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
        ],
        mockSignature.privateKey,
        mockSignature.publicKey,
        mockSignature.signature,
        mockSignature.contractAddresses,
        mockSignature.userAddress,
        mockSignature.startTimestamp,
        mockSignature.durationDays
      )
    })

    it('should propagate decryption errors without wrapping (Wagmi pattern)', async () => {
      const decryptError = new Error('Decryption failed')
      mockInstance.userDecrypt = vi.fn().mockRejectedValue(decryptError)

      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      ).rejects.toThrow('Decryption failed')  // Original error, no wrapping
    })

    it('should update state to error on decryption failure', async () => {
      mockInstance.userDecrypt = vi.fn().mockRejectedValue(
        new Error('Decryption failed')
      )

      try {
        await decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      } catch (error) {
        // Error should be in state
        expect(config.state.status).toBe('error')
        expect(config.state.error).toBeDefined()
      }
    })
  })

  describe('ChainId Parameter', () => {
    it('should accept optional chainId parameter', async () => {
      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
          chainId: 31337,
        })
      ).resolves.toBeDefined()
    })

    it('should work without chainId parameter', async () => {
      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      ).resolves.toBeDefined()
    })
  })

  describe('Error Recovery', () => {
    it('should propagate all errors without wrapping (Wagmi pattern)', async () => {
      const loadError = new Error('Unknown error')
      vi.spyOn(FhevmDecryptionSignature, 'loadOrSign').mockRejectedValue(loadError)

      await expect(
        decrypt(config, {
          instance: mockInstance,
          requests: [
            {
              handle: '0x0000000000000000000000000000000000000000000000000000000000000001',
              contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            },
          ],
          signer: mockSigner,
          storage: mockStorage,
        })
      ).rejects.toThrow('Unknown error')  // Original error
    })
  })
})

describe('getDecryptionSignature', () => {
  let config: ReturnType<typeof createFhevmConfig>
  let mockInstance: FhevmInstance
  let mockSigner: JsonRpcSigner
  let mockStorage: GenericStringStorage

  beforeEach(() => {
    config = createFhevmConfig({
      chains: [31337],
    })

    mockInstance = {
      userDecrypt: vi.fn(),
      createEncryptedInput: vi.fn(),
    } as unknown as FhevmInstance

    mockSigner = {
      getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    } as unknown as JsonRpcSigner

    mockStorage = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      removeItem: vi.fn().mockResolvedValue(undefined),
    }

    vi.spyOn(FhevmDecryptionSignature, 'loadOrSign').mockResolvedValue(
      {} as FhevmDecryptionSignature
    )
  })

  it('should call FhevmDecryptionSignature.loadOrSign', async () => {
    await getDecryptionSignature(config, {
      instance: mockInstance,
      contractAddresses: ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'],
      signer: mockSigner,
      storage: mockStorage,
    })

    expect(FhevmDecryptionSignature.loadOrSign).toHaveBeenCalledWith(
      mockInstance,
      ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'],
      mockSigner,
      mockStorage
    )
  })

  it('should return signature or null', async () => {
    const mockSig = {} as FhevmDecryptionSignature
    vi.spyOn(FhevmDecryptionSignature, 'loadOrSign').mockResolvedValue(mockSig)

    const result = await getDecryptionSignature(config, {
      instance: mockInstance,
      contractAddresses: ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'],
      signer: mockSigner,
      storage: mockStorage,
    })

    expect(result).toBe(mockSig)
  })

  it('should handle null signature', async () => {
    vi.spyOn(FhevmDecryptionSignature, 'loadOrSign').mockResolvedValue(null)

    const result = await getDecryptionSignature(config, {
      instance: mockInstance,
      contractAddresses: ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'],
      signer: mockSigner,
      storage: mockStorage,
    })

    expect(result).toBeNull()
  })
})
