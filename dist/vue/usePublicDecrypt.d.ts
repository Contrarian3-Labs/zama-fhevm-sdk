/**
 * usePublicDecrypt Composable - Decrypt Publicly Marked FHEVM Handles
 *
 * Vue composable that wraps the publicDecrypt action
 * Provides a function to decrypt publicly marked handles with reactive loading/error states
 *
 * This is a thin wrapper (~15 lines) that calls the core publicDecrypt action
 * NO signature required - handles must be marked via FHE.makePubliclyDecryptable()
 */
import { type Ref } from 'vue';
import { type PublicDecryptParameters, type PublicDecryptReturnType } from '../actions/publicDecrypt.js';
import type { FhevmConfig } from '../createConfig.js';
export type UsePublicDecryptParameters = {
    config?: FhevmConfig | undefined;
};
export type UsePublicDecryptReturnType = {
    publicDecrypt: (parameters: PublicDecryptParameters) => Promise<PublicDecryptReturnType>;
    data: Ref<PublicDecryptReturnType | undefined>;
    isLoading: Ref<boolean>;
    isError: Ref<boolean>;
    error: Ref<Error | undefined>;
    reset: () => void;
};
/**
 * Composable for decrypting publicly marked FHEVM ciphertext handles
 *
 * Unlike useDecrypt, this composable does NOT require user signature.
 * Handles must be marked as publicly decryptable in the smart contract
 * via FHE.makePubliclyDecryptable(handle).
 *
 * @param parameters - Composable configuration
 * @returns Object with publicDecrypt function, reactive data, and state
 *
 * @example
 * ```vue
 * <script setup>
 * import { useFhevmInstance, usePublicDecrypt } from '@fhevm-sdk/vue'
 *
 * const { instance } = useFhevmInstance({ provider: window.ethereum })
 * const { publicDecrypt, data, isLoading, error } = usePublicDecrypt()
 *
 * const fetchLeaderboard = async () => {
 *   if (!instance.value) return
 *
 *   // Get handles from contract (must be marked as publicly decryptable)
 *   const topScore1 = await contract.topScore1()
 *   const topScore2 = await contract.topScore2()
 *   const topScore3 = await contract.topScore3()
 *
 *   // Decrypt publicly - NO signature prompt
 *   const decrypted = await publicDecrypt({
 *     instance: instance.value,
 *     handles: [topScore1, topScore2, topScore3],
 *   })
 *
 *   console.log('Top scores:', Object.values(decrypted))
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button @click="fetchLeaderboard" :disabled="isLoading">
 *       {{ isLoading ? 'Loading...' : 'Fetch Leaderboard' }}
 *     </button>
 *     <ul v-if="data">
 *       <li v-for="(score, handle) in data" :key="handle">
 *         Score: {{ score.toString() }}
 *       </li>
 *     </ul>
 *     <div v-if="error">Error: {{ error.message }}</div>
 *   </div>
 * </template>
 * ```
 *
 * @example
 * ```vue
 * <!-- Auction results (publicly visible after auction ends) -->
 * <script setup>
 * import { onMounted } from 'vue'
 * import { useFhevmInstance, usePublicDecrypt } from '@fhevm-sdk/vue'
 *
 * const { instance } = useFhevmInstance({ provider })
 * const { publicDecrypt, data } = usePublicDecrypt()
 *
 * onMounted(async () => {
 *   if (!instance.value) return
 *
 *   const winningBidHandle = await auctionContract.winningBid()
 *
 *   // NO signature - bid is public after auction ends
 *   await publicDecrypt({
 *     instance: instance.value,
 *     handles: [winningBidHandle],
 *   })
 * })
 * </script>
 *
 * <template>
 *   <div v-if="data">
 *     Winning bid: {{ Object.values(data)[0] }}
 *   </div>
 * </template>
 * ```
 */
export declare function usePublicDecrypt(parameters?: UsePublicDecryptParameters): UsePublicDecryptReturnType;
