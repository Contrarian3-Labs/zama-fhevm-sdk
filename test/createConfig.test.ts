import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFhevmConfig } from '../src/createConfig.js'
import { createStorage } from '../src/createStorage.js'
import type { FhevmInstance } from '../src/fhevmTypes.js'

describe('createFhevmConfig', () => {
  describe('Basic Configuration', () => {
    it('should create config with single chain', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      expect(config.chains).toEqual([31337])
      expect(config.state.chainId).toBe(31337)
      expect(config.state.status).toBe('idle')
      expect(config.state.instance).toBeNull()
      expect(config.state.error).toBeNull()
    })

    it('should create config with multiple chains', () => {
      const config = createFhevmConfig({
        chains: [31337, 1337, 8009],
      })

      expect(config.chains).toEqual([31337, 1337, 8009])
      expect(config.state.chainId).toBe(31337) // First chain is default
    })

    it('should accept autoConnect option', () => {
      const config = createFhevmConfig({
        chains: [31337],
        autoConnect: false,
      })

      expect(config.autoConnect).toBe(false)
    })

    it('should default autoConnect to true', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      expect(config.autoConnect).toBe(true)
    })

    it('should accept mockChains configuration', () => {
      const mockChains = {
        31337: 'http://localhost:8545',
        1337: 'http://localhost:8546',
      }
      const config = createFhevmConfig({
        chains: [31337, 1337],
        mockChains,
      })

      expect(config.mockChains).toEqual(mockChains)
    })
  })

  describe('Storage Configuration', () => {
    it('should create default storage when not provided', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      expect(config.storage).toBeDefined()
      expect(config.storage).not.toBeNull()
    })

    it('should accept custom storage', () => {
      const customStorage = createStorage({
        storage: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [31337],
        storage: customStorage,
      })

      expect(config.storage).toBe(customStorage)
    })

    it('should accept null storage for no persistence', () => {
      const config = createFhevmConfig({
        chains: [31337],
        storage: null,
      })

      expect(config.storage).toBeNull()
    })
  })

  describe('State Management', () => {
    it('should allow getting current state', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const state = config.state
      expect(state.chainId).toBe(31337)
      expect(state.status).toBe('idle')
      expect(state.instance).toBeNull()
      expect(state.error).toBeNull()
    })

    it('should allow setting state with object', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      config.setState({
        chainId: 31337,
        status: 'loading',
        instance: null,
        error: null,
      })

      expect(config.state.status).toBe('loading')
    })

    it('should allow setting state with function', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      config.setState((prev) => ({
        ...prev,
        status: 'ready',
      }))

      expect(config.state.status).toBe('ready')
    })

    it('should reset corrupt state to initial state', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      // Try to set invalid state
      config.setState({} as any)

      // Should reset to initial state
      expect(config.state.chainId).toBe(31337)
      expect(config.state.status).toBe('idle')
    })

    it('should handle instance in state', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const mockInstance = {
        createEncryptedInput: vi.fn(),
        userDecrypt: vi.fn(),
      } as unknown as FhevmInstance

      config.setState((prev) => ({
        ...prev,
        instance: mockInstance,
        status: 'ready',
      }))

      expect(config.state.instance).toBe(mockInstance)
    })

    it('should handle error in state', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const error = new Error('Test error')

      config.setState((prev) => ({
        ...prev,
        error,
        status: 'error',
      }))

      expect(config.state.error).toBe(error)
      expect(config.state.status).toBe('error')
    })
  })

  describe('State Subscription', () => {
    it('should allow subscribing to state changes', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const listener = vi.fn()
      const unsubscribe = config.subscribe(
        (state) => state.status,
        listener
      )

      config.setState((prev) => ({ ...prev, status: 'loading' }))

      expect(listener).toHaveBeenCalledWith('loading', 'idle')

      unsubscribe()
    })

    it('should allow selective subscription', () => {
      const config = createFhevmConfig({
        chains: [31337, 1337],
      })

      const listener = vi.fn()
      config.subscribe((state) => state.chainId, listener)

      // Change status - listener should not fire
      config.setState((prev) => ({ ...prev, status: 'loading' }))
      expect(listener).not.toHaveBeenCalled()

      // Change chainId - listener should fire (change to different value)
      config.setState((prev) => ({ ...prev, chainId: 1337 }))
      expect(listener).toHaveBeenCalled()
    })

    it('should unsubscribe properly', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const listener = vi.fn()
      const unsubscribe = config.subscribe(
        (state) => state.status,
        listener
      )

      unsubscribe()

      config.setState((prev) => ({ ...prev, status: 'loading' }))
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('Instance Management', () => {
    it('should return null when no instance exists', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const instance = config.getInstance()
      expect(instance).toBeNull()
    })

    it('should store and retrieve instance for default chain', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const mockInstance = {
        createEncryptedInput: vi.fn(),
      } as unknown as FhevmInstance

      // Manually add instance to internal cache
      config._internal.instances.set(31337, mockInstance)

      const retrieved = config.getInstance()
      expect(retrieved).toBe(mockInstance)
    })

    it('should retrieve instance for specific chainId', () => {
      const config = createFhevmConfig({
        chains: [31337, 1337],
      })

      const mockInstance1337 = {
        createEncryptedInput: vi.fn(),
      } as unknown as FhevmInstance

      // Manually add instance for chain 1337
      config._internal.instances.set(1337, mockInstance1337)

      const retrieved = config.getInstance({ chainId: 1337 })
      expect(retrieved).toBe(mockInstance1337)
    })

    it('should return null for chainId without instance', () => {
      const config = createFhevmConfig({
        chains: [31337, 1337],
      })

      const retrieved = config.getInstance({ chainId: 1337 })
      expect(retrieved).toBeNull()
    })
  })

  describe('SSR Support', () => {
    it('should support SSR mode', () => {
      const config = createFhevmConfig({
        chains: [31337],
        ssr: true,
      })

      expect(config._internal.ssr).toBe(true)
    })

    it('should default SSR to false', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      expect(config._internal.ssr).toBe(false)
    })
  })

  describe('Chains Management', () => {
    it('should allow updating chains', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      config._internal.chains.setState([31337, 1337])

      expect(config.chains).toEqual([31337, 1337])
    })

    it('should allow subscribing to chain changes', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const listener = vi.fn()
      const unsubscribe = config._internal.chains.subscribe(listener)

      config._internal.chains.setState([31337, 1337])

      expect(listener).toHaveBeenCalled()

      unsubscribe()
    })

    it('should not update chains when empty array provided', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      config._internal.chains.setState([])

      // Should remain unchanged
      expect(config.chains).toEqual([31337])
    })
  })

  describe('Persistence', () => {
    it('should persist chainId when storage is provided', () => {
      const storage = createStorage({
        storage: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [31337, 1337],
        storage,
      })

      // Change chainId
      config.setState((prev) => ({ ...prev, chainId: 1337 }))

      // Storage should have been called (via zustand persist middleware)
      // Note: This is an integration test with zustand persist
    })

    it('should validate persisted chainId against configured chains', () => {
      // This tests the validatePersistedChainId internal function
      // If persisted chainId is not in chains list, should use default

      const storage = createStorage({
        storage: {
          getItem: vi.fn().mockReturnValue(
            JSON.stringify({
              state: { chainId: 9999 }, // Invalid chain
              version: 1,
            })
          ),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [31337],
        storage,
      })

      // Should use default chain since 9999 is not valid
      expect(config.state.chainId).toBe(31337)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid state updates', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      // Rapid updates should all be applied
      config.setState((prev) => ({ ...prev, status: 'loading' }))
      config.setState((prev) => ({ ...prev, status: 'ready' }))
      config.setState((prev) => ({ ...prev, status: 'error' }))

      expect(config.state.status).toBe('error')
    })

    it('should handle concurrent subscriptions', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const listener1 = vi.fn()
      const listener2 = vi.fn()
      const listener3 = vi.fn()

      config.subscribe((state) => state.status, listener1)
      config.subscribe((state) => state.status, listener2)
      config.subscribe((state) => state.status, listener3)

      config.setState((prev) => ({ ...prev, status: 'loading' }))

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
      expect(listener3).toHaveBeenCalled()
    })
  })
})
