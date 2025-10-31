import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hydrate } from '../src/hydrate.js'
import { createFhevmConfig } from '../src/createConfig.js'
import { createStorage } from '../src/createStorage.js'

describe('hydrate', () => {
  describe('Basic Hydration', () => {
    it('should return onMount callback', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const { onMount } = hydrate(config, {})

      expect(typeof onMount).toBe('function')
    })

    it('should accept initialState parameter', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const initialState = {
        chainId: 31337,
        status: 'idle' as const,
        instance: null,
        error: null,
      }

      const { onMount } = hydrate(config, { initialState })

      expect(typeof onMount).toBe('function')
    })

    it('should accept autoConnect parameter', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const { onMount } = hydrate(config, { autoConnect: true })

      expect(typeof onMount).toBe('function')
    })

    it('should handle empty parameters', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const { onMount } = hydrate(config, {})

      expect(typeof onMount).toBe('function')
    })
  })

  describe('State Hydration', () => {
    it('should hydrate initialState to config', () => {
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

      // Mock hasHydrated to return false (not yet hydrated)
      vi.spyOn(config._internal.store.persist, 'hasHydrated').mockReturnValue(false)

      const initialState = {
        chainId: 1337,
        status: 'idle' as const,
        instance: null,
        error: null,
      }

      hydrate(config, { initialState })

      expect(config.state.chainId).toBe(1337)
    })

    it('should not hydrate if already hydrated', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      // Mock hasHydrated to return true (already hydrated)
      vi.spyOn(config._internal.store.persist, 'hasHydrated').mockReturnValue(true)

      const initialState = {
        chainId: 31337,
        status: 'loading' as const,
        instance: null,
        error: null,
      }

      hydrate(config, { initialState })

      // State should not change since already hydrated
      expect(config.state.status).toBe('idle') // Initial state, not 'loading'
    })

    it('should validate chainId from initialState', () => {
      const storage = createStorage({
        storage: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [31337],
        storage,
      })

      // Mock hasHydrated to return false
      vi.spyOn(config._internal.store.persist, 'hasHydrated').mockReturnValue(false)

      const initialState = {
        chainId: 9999, // Invalid chain
        status: 'idle' as const,
        instance: null,
        error: null,
      }

      hydrate(config, { initialState })

      // Should fall back to first configured chain
      expect(config.state.chainId).toBe(31337)
    })

    it('should accept valid chainId from initialState', () => {
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

      // Mock hasHydrated to return false
      vi.spyOn(config._internal.store.persist, 'hasHydrated').mockReturnValue(false)

      const initialState = {
        chainId: 1337, // Valid chain
        status: 'idle' as const,
        instance: null,
        error: null,
      }

      hydrate(config, { initialState })

      expect(config.state.chainId).toBe(1337)
    })

    it('should accept chainId from mockChains', () => {
      const storage = createStorage({
        storage: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [11155111],
        mockChains: { 31337: 'http://localhost:8545' },
        storage,
      })

      // Mock hasHydrated to return false
      vi.spyOn(config._internal.store.persist, 'hasHydrated').mockReturnValue(false)

      const initialState = {
        chainId: 31337, // From mockChains
        status: 'idle' as const,
        instance: null,
        error: null,
      }

      hydrate(config, { initialState })

      expect(config.state.chainId).toBe(31337)
    })
  })

  describe('AutoConnect', () => {
    it('should set status to loading if autoConnect is true', () => {
      const storage = createStorage({
        storage: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [31337],
        storage,
      })

      // Mock hasHydrated to return false
      vi.spyOn(config._internal.store.persist, 'hasHydrated').mockReturnValue(false)

      const initialState = {
        chainId: 31337,
        status: 'idle' as const,
        instance: null,
        error: null,
      }

      hydrate(config, { initialState, autoConnect: true })

      expect(config.state.status).toBe('loading')
    })

    it('should keep status as idle if autoConnect is false', () => {
      const storage = createStorage({
        storage: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [31337],
        storage,
      })

      // Mock hasHydrated to return false
      vi.spyOn(config._internal.store.persist, 'hasHydrated').mockReturnValue(false)

      const initialState = {
        chainId: 31337,
        status: 'idle' as const,
        instance: null,
        error: null,
      }

      hydrate(config, { initialState, autoConnect: false })

      expect(config.state.status).toBe('idle')
    })

    it('should keep status as idle if autoConnect is not provided', () => {
      const storage = createStorage({
        storage: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [31337],
        storage,
      })

      // Mock hasHydrated to return false
      vi.spyOn(config._internal.store.persist, 'hasHydrated').mockReturnValue(false)

      const initialState = {
        chainId: 31337,
        status: 'idle' as const,
        instance: null,
        error: null,
      }

      hydrate(config, { initialState })

      expect(config.state.status).toBe('idle')
    })
  })

  describe('onMount Callback', () => {
    it('should be async function', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const { onMount } = hydrate(config, {})

      expect(onMount.constructor.name).toBe('AsyncFunction')
    })

    it('should rehydrate persisted state in SSR mode', async () => {
      const storage = createStorage({
        storage: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [31337],
        ssr: true,
        storage,
      })

      const rehydrateSpy = vi.spyOn(config._internal.store.persist, 'rehydrate')
        .mockResolvedValue(undefined)

      const { onMount } = hydrate(config, {})

      await onMount()

      expect(rehydrateSpy).toHaveBeenCalled()
    })

    it('should not rehydrate if not in SSR mode', async () => {
      const storage = createStorage({
        storage: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [31337],
        ssr: false,
        storage,
      })

      const rehydrateSpy = vi.spyOn(config._internal.store.persist, 'rehydrate')
        .mockResolvedValue(undefined)

      const { onMount } = hydrate(config, {})

      await onMount()

      expect(rehydrateSpy).not.toHaveBeenCalled()
    })

    it('should not log anything in onMount (auto-connect handled by framework adapters)', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const config = createFhevmConfig({
        chains: [31337],
        autoConnect: true,
      })

      const { onMount } = hydrate(config, { autoConnect: true })

      await onMount()

      // Auto-connect is handled by framework adapters (React/Vue), not core
      // So no console.log should be called
      expect(consoleLogSpy).not.toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })

    it('should not log auto-connect if autoConnect is false', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const config = createFhevmConfig({
        chains: [31337],
        autoConnect: false,
      })

      const { onMount } = hydrate(config, { autoConnect: false })

      await onMount()

      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Auto-connect')
      )

      consoleLogSpy.mockRestore()
    })

    it('should handle onMount being called multiple times', async () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const { onMount } = hydrate(config, {})

      await onMount()
      await onMount()
      await onMount()

      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('SSR Integration', () => {
    it('should work with SSR config', () => {
      const config = createFhevmConfig({
        chains: [31337],
        ssr: true,
      })

      const { onMount } = hydrate(config, {})

      expect(config._internal.ssr).toBe(true)
      expect(typeof onMount).toBe('function')
    })

    it('should work without SSR', () => {
      const config = createFhevmConfig({
        chains: [31337],
        ssr: false,
      })

      const { onMount } = hydrate(config, {})

      expect(config._internal.ssr).toBe(false)
      expect(typeof onMount).toBe('function')
    })

    it('should handle initialState in SSR mode', () => {
      const storage = createStorage({
        storage: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [31337],
        ssr: true,
        storage,
      })

      // Mock hasHydrated to return false
      vi.spyOn(config._internal.store.persist, 'hasHydrated').mockReturnValue(false)

      const initialState = {
        chainId: 31337,
        status: 'idle' as const,
        instance: null,
        error: null,
      }

      hydrate(config, { initialState })

      expect(config.state.chainId).toBe(31337)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing storage', () => {
      const config = createFhevmConfig({
        chains: [31337],
        storage: null,
      })

      // This should not throw even without storage
      const { onMount } = hydrate(config, {})

      expect(typeof onMount).toBe('function')
    })

    it('should handle initialState with error', () => {
      const storage = createStorage({
        storage: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
      })

      const config = createFhevmConfig({
        chains: [31337],
        storage,
      })

      // Mock hasHydrated to return false
      vi.spyOn(config._internal.store.persist, 'hasHydrated').mockReturnValue(false)

      const error = new Error('Test error')
      const initialState = {
        chainId: 31337,
        status: 'error' as const,
        instance: null,
        error,
      }

      hydrate(config, { initialState })

      expect(config.state.error).toBe(error)
      expect(config.state.status).toBe('idle') // Auto-connect not enabled
    })

    it('should handle undefined initialState', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const { onMount } = hydrate(config, { initialState: undefined })

      expect(typeof onMount).toBe('function')
    })
  })

  describe('Type Safety', () => {
    it('should accept valid HydrateParameters', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      const params = {
        initialState: {
          chainId: 31337,
          status: 'idle' as const,
          instance: null,
          error: null,
        },
        autoConnect: true,
      }

      const { onMount } = hydrate(config, params)

      expect(typeof onMount).toBe('function')
    })

    it('should accept partial HydrateParameters', () => {
      const config = createFhevmConfig({
        chains: [31337],
      })

      // Only initialState
      hydrate(config, {
        initialState: {
          chainId: 31337,
          status: 'idle' as const,
          instance: null,
          error: null,
        },
      })

      // Only autoConnect
      hydrate(config, { autoConnect: true })

      // Neither
      hydrate(config, {})

      expect(true).toBe(true)
    })
  })
})
