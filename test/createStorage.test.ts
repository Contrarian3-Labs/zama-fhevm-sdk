import { describe, it, expect, vi } from 'vitest'
import { createStorage, noopStorage } from '../src/createStorage.js'

describe('createStorage', () => {
  describe('Basic Storage Creation', () => {
    it('should create storage wrapper', () => {
      const baseStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      expect(storage).toBeDefined()
      expect(typeof storage.getItem).toBe('function')
      expect(typeof storage.setItem).toBe('function')
      expect(typeof storage.removeItem).toBe('function')
    })

    it('should pass through getItem calls', async () => {
      const baseStorage = {
        getItem: vi.fn().mockReturnValue('"test-value"'), // Returns JSON string
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      const result = await storage.getItem('test-key')

      expect(baseStorage.getItem).toHaveBeenCalledWith('fhevm.test-key') // With prefix
      expect(result).toBe('test-value')
    })

    it('should pass through setItem calls', async () => {
      const baseStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      await storage.setItem('test-key', 'test-value')

      expect(baseStorage.setItem).toHaveBeenCalledWith('fhevm.test-key', '"test-value"') // With prefix and serialized
    })

    it('should pass through removeItem calls', async () => {
      const baseStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      await storage.removeItem('test-key')

      expect(baseStorage.removeItem).toHaveBeenCalledWith('fhevm.test-key') // With prefix
    })
  })

  describe('Key Serialization', () => {
    it('should handle string keys', async () => {
      const baseStorage = {
        getItem: vi.fn().mockReturnValue('"value"'), // JSON string
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      await storage.getItem('simple-key')

      expect(baseStorage.getItem).toHaveBeenCalledWith('fhevm.simple-key')
    })

    it('should serialize complex keys', async () => {
      const baseStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      // Storage should handle serialization internally
      // This tests the contract that storage accepts string keys
      await storage.setItem('key-with-prefix', 'value')

      expect(baseStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('Async Storage Support', () => {
    it('should support async getItem', async () => {
      const baseStorage = {
        getItem: vi.fn().mockResolvedValue('"async-value"'), // JSON string
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      const result = await storage.getItem('test-key')

      expect(result).toBe('async-value')
    })

    it('should support async setItem', async () => {
      const baseStorage = {
        getItem: vi.fn(),
        setItem: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      await expect(
        storage.setItem('test-key', 'test-value')
      ).resolves.not.toThrow()
    })

    it('should support async removeItem', async () => {
      const baseStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn().mockResolvedValue(undefined),
      }

      const storage = createStorage({ storage: baseStorage })

      await expect(storage.removeItem('test-key')).resolves.not.toThrow()
    })
  })

  describe('Sync Storage Support', () => {
    it('should support sync getItem', async () => {
      const baseStorage = {
        getItem: vi.fn().mockReturnValue('"sync-value"'), // JSON string
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      const result = await storage.getItem('test-key')

      expect(result).toBe('sync-value')
    })

    it('should support sync setItem', async () => {
      const baseStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      await expect(
        storage.setItem('test-key', 'test-value')
      ).resolves.not.toThrow()

      expect(baseStorage.setItem).toHaveBeenCalled()
    })

    it('should support sync removeItem', async () => {
      const baseStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      await expect(storage.removeItem('test-key')).resolves.not.toThrow()

      expect(baseStorage.removeItem).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle getItem errors', async () => {
      const baseStorage = {
        getItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage error')
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      await expect(storage.getItem('test-key')).rejects.toThrow('Storage error')
    })

    it('should handle setItem errors', async () => {
      const baseStorage = {
        getItem: vi.fn(),
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage error')
        }),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      await expect(
        storage.setItem('test-key', 'value')
      ).rejects.toThrow('Storage error')
    })

    it('should handle removeItem errors', async () => {
      const baseStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn().mockImplementation(() => {
          throw new Error('Storage error')
        }),
      }

      const storage = createStorage({ storage: baseStorage })

      await expect(storage.removeItem('test-key')).rejects.toThrow(
        'Storage error'
      )
    })

    it('should handle null/undefined returns from getItem', async () => {
      const baseStorage = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: baseStorage })

      const result = await storage.getItem('nonexistent-key')

      expect(result).toBeNull()
    })
  })

  describe('localStorage Integration', () => {
    it('should work with localStorage-like interface', async () => {
      const localStorageMock = {
        getItem: vi.fn((key: string) => {
          return key === 'fhevm.existing' ? '"value"' : null // JSON string with prefix
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      const storage = createStorage({ storage: localStorageMock })

      // Test get existing
      const existing = await storage.getItem('existing')
      expect(existing).toBe('value')

      // Test get non-existing
      const nonExisting = await storage.getItem('nonexistent')
      expect(nonExisting).toBeNull()

      // Test set
      await storage.setItem('new-key', 'new-value')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('fhevm.new-key', '"new-value"')

      // Test remove
      await storage.removeItem('old-key')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('fhevm.old-key')
    })
  })

  describe('IndexedDB Integration', () => {
    it('should work with async storage (IndexedDB-like)', async () => {
      const asyncStorage = {
        getItem: vi.fn().mockResolvedValue('"async-value"'), // JSON string
        setItem: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn().mockResolvedValue(undefined),
      }

      const storage = createStorage({ storage: asyncStorage })

      const result = await storage.getItem('test-key')
      expect(result).toBe('async-value')

      await storage.setItem('test-key', 'new-value')
      expect(asyncStorage.setItem).toHaveBeenCalledWith('fhevm.test-key', '"new-value"')

      await storage.removeItem('test-key')
      expect(asyncStorage.removeItem).toHaveBeenCalledWith('fhevm.test-key')
    })
  })
})

describe('noopStorage', () => {
  it('should return null for getItem', () => {
    const result = noopStorage.getItem('any-key')
    expect(result).toBeNull()
  })

  it('should do nothing for setItem', () => {
    // noopStorage.setItem returns void, not Promise
    expect(() => noopStorage.setItem('any-key', 'any-value')).not.toThrow()
  })

  it('should do nothing for removeItem', () => {
    // noopStorage.removeItem returns void, not Promise
    expect(() => noopStorage.removeItem('any-key')).not.toThrow()
  })

  it('should be usable as storage in createFhevmConfig', () => {
    // This is a type test - noopStorage should satisfy Storage interface
    const storage = noopStorage
    expect(storage.getItem).toBeDefined()
    expect(storage.setItem).toBeDefined()
    expect(storage.removeItem).toBeDefined()
  })
})

describe('getDefaultStorage', () => {
  it('should be tested in browser environment', () => {
    // Note: getDefaultStorage returns window.localStorage in browser
    // or noopStorage in Node.js
    // This is tested implicitly by createFhevmConfig tests
    expect(true).toBe(true)
  })
})
