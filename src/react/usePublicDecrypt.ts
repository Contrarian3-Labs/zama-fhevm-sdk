/**
 * usePublicDecrypt Hook - Decrypt Publicly Marked FHEVM Handles
 *
 * React hook that wraps the publicDecrypt action
 * Provides a callback to decrypt publicly marked handles with loading/error states
 *
 * This is a thin wrapper (~15 lines) that calls the core publicDecrypt action
 * NO signature required - handles must be marked via FHE.makePubliclyDecryptable()
 */

'use client'

import { useCallback, useState } from 'react'
import { publicDecrypt, type PublicDecryptParameters, type PublicDecryptReturnType } from '../actions/publicDecrypt.js'
import type { FhevmConfig } from '../createConfig.js'
import { useConfig } from './useConfig.js'

export type UsePublicDecryptParameters = {
  config?: FhevmConfig | undefined
}

export type UsePublicDecryptReturnType = {
  publicDecrypt: (parameters: PublicDecryptParameters) => Promise<PublicDecryptReturnType>
  data: PublicDecryptReturnType | undefined
  isLoading: boolean
  isError: boolean
  error: Error | undefined
  reset: () => void
}

/**
 * Hook for decrypting publicly marked FHEVM ciphertext handles
 *
 * Unlike useDecrypt, this hook does NOT require user signature.
 * Handles must be marked as publicly decryptable in the smart contract
 * via FHE.makePubliclyDecryptable(handle).
 *
 * @param parameters - Hook configuration
 * @returns Object with publicDecrypt function, data, and state
 *
 * @example
 * ```tsx
 * import { useFhevmInstance, usePublicDecrypt } from '@fhevm-sdk/react'
 *
 * function LeaderboardComponent() {
 *   const { instance } = useFhevmInstance({ provider: window.ethereum })
 *   const { publicDecrypt, data, isLoading, error } = usePublicDecrypt()
 *
 *   const fetchLeaderboard = async () => {
 *     if (!instance) return
 *
 *     // Get handles from contract (must be marked as publicly decryptable)
 *     const topScore1 = await contract.topScore1()
 *     const topScore2 = await contract.topScore2()
 *     const topScore3 = await contract.topScore3()
 *
 *     // Decrypt publicly - NO signature prompt
 *     const decrypted = await publicDecrypt({
 *       instance,
 *       handles: [topScore1, topScore2, topScore3],
 *     })
 *
 *     console.log('Top scores:', Object.values(decrypted)) // [100n, 95n, 90n]
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={fetchLeaderboard} disabled={isLoading}>
 *         {isLoading ? 'Loading...' : 'Fetch Leaderboard'}
 *       </button>
 *       {data && (
 *         <ul>
 *           {Object.entries(data).map(([handle, score]) => (
 *             <li key={handle}>Score: {score.toString()}</li>
 *           ))}
 *         </ul>
 *       )}
 *       {error && <div>Error: {error.message}</div>}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Auction results (publicly visible after auction ends)
 * function AuctionResults() {
 *   const { instance } = useFhevmInstance({ provider })
 *   const { publicDecrypt, data } = usePublicDecrypt()
 *
 *   useEffect(() => {
 *     async function revealWinner() {
 *       const winningBidHandle = await auctionContract.winningBid()
 *
 *       // NO signature - bid is public after auction ends
 *       const decrypted = await publicDecrypt({
 *         instance,
 *         handles: [winningBidHandle],
 *       })
 *
 *       console.log('Winning bid:', decrypted[winningBidHandle])
 *     }
 *     revealWinner()
 *   }, [instance])
 *
 *   return <div>Winner: {data && Object.values(data)[0]}</div>
 * }
 * ```
 */
export function usePublicDecrypt(
  parameters: UsePublicDecryptParameters = {}
): UsePublicDecryptReturnType {
  const config = useConfig(parameters)

  const [data, setData] = useState<PublicDecryptReturnType | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | undefined>(undefined)

  const publicDecryptFn = useCallback(
    async (params: PublicDecryptParameters) => {
      setIsLoading(true)
      setIsError(false)
      setError(undefined)

      try {
        // Call core publicDecrypt action
        const result = await publicDecrypt(config, params)

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
    publicDecrypt: publicDecryptFn,
    data,
    isLoading,
    isError,
    error,
    reset,
  }
}
