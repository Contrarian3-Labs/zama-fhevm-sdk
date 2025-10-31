/**
 * useFHEEncryption Composable - Simplified Encryption for FHEVM
 *
 * Vue composable that mirrors React's useFHEEncryption hook pattern
 * Provides a streamlined API for encrypting values with custom builder functions
 *
 * This is a lightweight wrapper that checks readiness and calls encryptWith action
 */

import { computed, type MaybeRefOrGetter, toValue, toRaw, type ComputedRef } from 'vue'
import { encryptWith, type EncryptReturnType } from '../actions/encrypt.js'
import type { FhevmInstance } from '../fhevmTypes.js'
import type { FhevmConfig } from '../createConfig.js'
import type { RelayerEncryptedInput } from '@zama-fhe/relayer-sdk/web'
import type { JsonRpcSigner } from 'ethers'
import { useConfig } from './useConfig.js'

export type UseFHEEncryptionParameters = {
  instance: MaybeRefOrGetter<FhevmInstance | undefined>
  ethersSigner: MaybeRefOrGetter<JsonRpcSigner | undefined>
  contractAddress: MaybeRefOrGetter<`0x${string}` | undefined>
  config?: FhevmConfig | undefined
}

export type UseFHEEncryptionReturnType = {
  /**
   * Indicates whether all required parameters are available for encryption
   */
  canEncrypt: ComputedRef<boolean>
  /**
   * Encrypts values using a custom builder function
   *
   * @param buildFn - Function that receives a RelayerEncryptedInput builder and calls its methods
   * @returns Promise resolving to EncryptResult or undefined if parameters are missing
   *
   * @example
   * ```ts
   * const { encryptWith } = useFHEEncryption({ instance, ethersSigner, contractAddress })
   *
   * const encrypted = await encryptWith((builder) => {
   *   builder.add32(42)
   *   builder.addBool(true)
   * })
   * ```
   */
  encryptWith: (buildFn: (builder: RelayerEncryptedInput) => void) => Promise<EncryptReturnType | undefined>
}

/**
 * Composable for simplified encryption with FHEVM
 *
 * Mirrors React's useFHEEncryption hook, providing a streamlined API for encrypting
 * values with custom builder functions. Automatically checks if all required parameters
 * are available and extracts user address from signer.
 *
 * @param parameters - Composable configuration
 * @returns Object with canEncrypt flag and encryptWith function
 *
 * @example
 * ```vue
 * <script setup>
 * import { useFhevmInstance, useFHEEncryption } from '@fhevm-sdk/vue'
 * import { BrowserProvider } from 'ethers'
 *
 * const provider = window.ethereum
 * const { instance } = useFhevmInstance({ provider })
 *
 * // Get signer from provider
 * const ethersProvider = new BrowserProvider(provider)
 * const ethersSigner = await ethersProvider.getSigner()
 *
 * const { canEncrypt, encryptWith } = useFHEEncryption({
 *   instance,
 *   ethersSigner,
 *   contractAddress: '0x...'
 * })
 *
 * const handleEncrypt = async () => {
 *   if (!canEncrypt.value) return
 *
 *   const encrypted = await encryptWith((builder) => {
 *     builder.add8(42)
 *     builder.addBool(true)
 *     builder.add64(1000000n)
 *   })
 *
 *   console.log('Encrypted:', encrypted)
 * }
 * </script>
 *
 * <template>
 *   <button @click="handleEncrypt" :disabled="!canEncrypt">
 *     Encrypt
 *   </button>
 * </template>
 * ```
 */
export function useFHEEncryption(
  parameters: UseFHEEncryptionParameters
): UseFHEEncryptionReturnType {
  const { instance, ethersSigner, contractAddress, config: configOverride } = parameters

  const config = useConfig({ config: configOverride })

  // Computed: Check if all required parameters are available
  const canEncrypt = computed(() => {
    const instanceValue = toValue(instance)
    const signerValue = toValue(ethersSigner)
    const contractValue = toValue(contractAddress)

    return Boolean(instanceValue && signerValue && contractValue)
  })

  // Encrypt function with custom builder
  const encryptWithFn = async (
    buildFn: (builder: RelayerEncryptedInput) => void
  ): Promise<EncryptReturnType | undefined> => {
    const instanceValue = toValue(instance)
    const signerValue = toValue(ethersSigner)
    const contractValue = toValue(contractAddress)

    if (!instanceValue || !signerValue || !contractValue) {
      return undefined
    }

    // CRITICAL: Use toRaw to completely unwrap Vue Proxy
    // toValue() only unwraps Ref, but values may still be reactive Proxies
    // Third-party libraries (FhevmInstance, JsonRpcSigner) have private fields
    // that are inaccessible through Vue Proxies
    const rawInstance = toRaw(instanceValue)
    const rawSigner = toRaw(signerValue)

    // Get user address from signer
    const userAddress = await rawSigner.getAddress() as `0x${string}`

    // Call core encryptWith action
    const result = await encryptWith(config, {
      instance: rawInstance,  // Pass raw instance, not Proxy
      contractAddress: contractValue,
      userAddress,
      buildFn,
    })

    return result
  }

  return {
    canEncrypt,
    encryptWith: encryptWithFn,
  }
}
