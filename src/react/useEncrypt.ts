/**
 * useEncrypt Hook - Encrypt Values for FHEVM
 *
 * React hook that wraps the encrypt action
 * Provides a callback to encrypt values with loading/error states
 *
 * This is a thin wrapper (~15 lines) that calls the core encrypt action
 */

'use client'

import { useCallback, useState } from 'react'
import { encrypt, type EncryptParameters, type EncryptReturnType } from '../actions/encrypt.js'
import type { FhevmConfig } from '../createConfig.js'
import { useConfig } from './useConfig.js'

export type UseEncryptParameters = {
  config?: FhevmConfig | undefined
}

export type UseEncryptReturnType = {
  encrypt: (parameters: Omit<EncryptParameters, 'instance'> & { instance: EncryptParameters['instance'] }) => Promise<EncryptReturnType>
  data: EncryptReturnType | undefined
  isLoading: boolean
  isError: boolean
  error: Error | undefined
  reset: () => void
}

/**
 * Hook for encrypting values for FHEVM contracts
 *
 * @param parameters - Hook configuration
 * @returns Object with encrypt function, data, and state
 *
 * @example
 * ```tsx
 * import { useFhevmInstance, useEncrypt } from '@fhevm-sdk/react'
 *
 * function Component() {
 *   const { instance } = useFhevmInstance({ provider: window.ethereum })
 *   const { encrypt, data, isLoading, error } = useEncrypt()
 *
 *   const handleEncrypt = async () => {
 *     if (!instance) return
 *
 *     const encrypted = await encrypt({
 *       instance,
 *       contractAddress: '0x...',
 *       userAddress: '0x...',
 *       values: [
 *         { type: 'euint8', value: 42 },
 *         { type: 'ebool', value: true },
 *       ],
 *     })
 *
 *     console.log('Encrypted:', encrypted)
 *   }
 *
 *   return (
 *     <button onClick={handleEncrypt} disabled={isLoading}>
 *       {isLoading ? 'Encrypting...' : 'Encrypt'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useEncrypt(
  parameters: UseEncryptParameters = {}
): UseEncryptReturnType {
  const config = useConfig(parameters)

  const [data, setData] = useState<EncryptReturnType | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | undefined>(undefined)

  const encryptFn = useCallback(
    async (params: Omit<EncryptParameters, 'instance'> & { instance: EncryptParameters['instance'] }) => {
      setIsLoading(true)
      setIsError(false)
      setError(undefined)

      try {
        // Call core encrypt action
        const result = await encrypt(config, params)

        setData(result)
        setIsLoading(false)
        setIsError(false)
        setError(undefined)

        return result
      } catch (err) {
        setData(undefined)
        setIsLoading(false)
        setIsError(true)
        setError(err as Error)

        throw err
      }
    },
    [config]
  )

  const reset = useCallback(() => {
    setData(undefined)
    setIsLoading(false)
    setIsError(false)
    setError(undefined)
  }, [])

  return {
    encrypt: encryptFn,
    data,
    isLoading,
    isError,
    error,
    reset,
  }
}
