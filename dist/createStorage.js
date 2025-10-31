/**
 * @fileoverview Storage abstraction layer following Wagmi's storage pattern.
 *
 * Provides framework-agnostic storage with automatic key prefixing and custom serialization
 * for FHEVM-specific types (BigInt, Uint8Array).
 *
 * **Key Features:**
 * - **Automatic Prefixing**: All keys prefixed with "fhevm." to avoid collisions
 * - **Custom Serialization**: Handles BigInt and Uint8Array (not supported by JSON)
 * - **Environment Detection**: Auto-selects localStorage (browser) or noop (SSR/Node.js)
 * - **Promise Support**: Works with both sync (localStorage) and async (IndexedDB) storage
 *
 * **Architecture:**
 * ```
 * createStorage({ storage: localStorage })
 * ├── Wrap BaseStorage (localStorage, IndexedDB, custom)
 * ├── Add prefix to all keys ("fhevm.state", "fhevm.decryption-signature")
 * ├── Serialize on setItem (JSON + BigInt/Uint8Array handling)
 * └── Deserialize on getItem (reverse transformation)
 * ```
 *
 * **Serialization Format:**
 * - BigInt: `"bigint::123456789012345678901234567890"`
 * - Uint8Array: `"uint8array::1,2,3,4,5"`
 * - Standard JSON for other types
 *
 * **WHY custom serialization:**
 * FHEVM uses BigInt for large encrypted values and Uint8Array for cryptographic handles.
 * Standard JSON.stringify throws on BigInt and converts Uint8Array to objects, losing type info.
 *
 * @module createStorage
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/createStorage.ts Wagmi createStorage}
 */
/////////////////////////////////////////////////////////////////////////////////////////////////
// Create Storage
/////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Creates storage abstraction with automatic key prefixing and FHEVM-aware serialization.
 *
 * Wraps any BaseStorage (localStorage, IndexedDB, React Native AsyncStorage) with:
 * 1. Automatic "fhevm." prefix on all keys (prevents collisions)
 * 2. Custom JSON serialization for BigInt and Uint8Array
 * 3. Type-safe key-value mapping via generics
 *
 * **Design Rationale:**
 *
 * **WHY automatic prefixing:**
 * - Prevents key collisions in shared storage (e.g., "state" → "fhevm.state")
 * - Multiple SDK instances can coexist (future: "fhevm-v2.", "fhevm-test.")
 * - Matches Wagmi pattern exactly (wagmi/core/src/createStorage.ts:56-65)
 *
 * **WHY custom serialization:**
 * - JSON.stringify(BigInt) throws "TypeError: Do not know how to serialize a BigInt"
 * - JSON.stringify(Uint8Array) produces `{"0":1,"1":2}` (object, not array)
 * - FHEVM extensively uses both types for cryptographic operations
 *
 * **WHY storage abstraction:**
 * - Same code works with localStorage (browser), AsyncStorage (React Native), IndexedDB (PWA)
 * - Supports both sync and async storage backends
 * - Easy to mock for testing
 *
 * @template itemMap - Additional key-value types beyond StorageItemMap
 * @template storageItemMap - Combined type map for all storage keys
 *
 * @param parameters - Storage configuration
 * @param parameters.storage - Base storage backend (default: getDefaultStorage() = localStorage or noop)
 * @param parameters.key - Key prefix for namespacing (default: "fhevm")
 * @param parameters.serialize - Custom serializer (default: JSON.stringify with BigInt/Uint8Array support)
 * @param parameters.deserialize - Custom deserializer (default: JSON.parse with BigInt/Uint8Array support)
 *
 * @returns Storage object with getItem, setItem, removeItem methods
 *
 * @example
 * // Default usage (localStorage with "fhevm." prefix)
 * const storage = createStorage({
 *   storage: getDefaultStorage() // Auto-detects localStorage or noop
 * })
 * await storage.setItem('state', { chainId: 31337 })
 * // Stores as: localStorage['fhevm.state'] = '{"chainId":31337}'
 *
 * @example
 * // Custom prefix for testing
 * const testStorage = createStorage({
 *   storage: localStorage,
 *   key: 'fhevm-test' // Keys become "fhevm-test.state", etc.
 * })
 *
 * @example
 * // React Native with AsyncStorage
 * import AsyncStorage from '@react-native-async-storage/async-storage'
 * const storage = createStorage({
 *   storage: AsyncStorage // Works seamlessly (async storage)
 * })
 *
 * @example
 * // Custom serialization (e.g., compress before storing)
 * const storage = createStorage({
 *   storage: localStorage,
 *   serialize: (value) => compress(JSON.stringify(value)),
 *   deserialize: (value) => JSON.parse(decompress(value))
 * })
 *
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/createStorage.ts#L50-L84 Wagmi createStorage implementation}
 * @see {@link getDefaultStorage} for default storage selection
 * @see {@link noopStorage} for SSR/testing
 */
export function createStorage(parameters) {
    const { deserialize = defaultDeserialize, key: prefix = 'fhevm', serialize = defaultSerialize, storage = noopStorage, } = parameters;
    function unwrap(value) {
        if (value instanceof Promise)
            return value.then((x) => x).catch(() => null);
        return value;
    }
    return {
        ...storage,
        key: prefix,
        async getItem(key, defaultValue) {
            const value = storage.getItem(`${prefix}.${key}`);
            const unwrapped = await unwrap(value);
            if (unwrapped)
                return deserialize(unwrapped) ?? null;
            return (defaultValue ?? null);
        },
        async setItem(key, value) {
            const storageKey = `${prefix}.${key}`;
            if (value === null)
                await unwrap(storage.removeItem(storageKey));
            else
                await unwrap(storage.setItem(storageKey, serialize(value)));
        },
        async removeItem(key) {
            await unwrap(storage.removeItem(`${prefix}.${key}`));
        },
    };
}
/////////////////////////////////////////////////////////////////////////////////////////////////
// Default Implementations
/////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * No-op storage for SSR, testing, or environments without persistent storage.
 *
 * All operations succeed silently but don't persist data. Useful for:
 * - Server-side rendering (no window.localStorage)
 * - Node.js environments
 * - Testing without side effects
 * - Disabling persistence intentionally
 *
 * @example
 * // SSR mode (Next.js, Nuxt)
 * const config = createFhevmConfig({
 *   chains: [31337],
 *   storage: createStorage({ storage: noopStorage }), // Explicit noop
 *   ssr: true
 * })
 *
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/createStorage.ts#L86-L90 Wagmi noopStorage}
 */
export const noopStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
};
/**
 * Detects and returns appropriate storage for current environment.
 *
 * **Selection Logic:**
 * - Browser (window.localStorage exists): Returns localStorage wrapper
 * - SSR/Node.js (no window): Returns noopStorage
 *
 * **WHY wrapper instead of direct localStorage:**
 * - Silent error handling (QuotaExceededError, SecurityError, etc.)
 * - Consistent interface across environments
 * - Matches Wagmi's defensive approach
 *
 * **Error Handling:**
 * localStorage.setItem can throw:
 * - QuotaExceededError: Storage full
 * - SecurityError: Private browsing mode
 * - InvalidStateError: Corrupted storage
 *
 * This wrapper catches and silences these errors to prevent crashes.
 *
 * @returns BaseStorage - localStorage wrapper (browser) or noopStorage (SSR)
 *
 * @example
 * // Automatic environment detection
 * const storage = createStorage({
 *   storage: getDefaultStorage() // localStorage in browser, noop in Node
 * })
 *
 * @example
 * // Manual usage
 * const storage = getDefaultStorage()
 * storage.setItem('key', 'value') // Never throws, even if storage is full
 *
 * @see {@link https://github.com/wevm/wagmi/blob/main/packages/core/src/createStorage.ts#L92-L113 Wagmi getDefaultStorage}
 * @see {@link noopStorage} for SSR fallback
 */
export function getDefaultStorage() {
    const storage = (() => {
        // Check for window and localStorage (browser environment)
        if (typeof window !== 'undefined' && window.localStorage)
            return window.localStorage;
        return noopStorage;
    })();
    return {
        getItem(key) {
            return storage.getItem(key);
        },
        removeItem(key) {
            storage.removeItem(key);
        },
        setItem(key, value) {
            try {
                storage.setItem(key, value);
                // silence errors by default (QuotaExceededError, SecurityError, etc.)
            }
            catch { }
        },
    };
}
/////////////////////////////////////////////////////////////////////////////////////////////////
// Serialization Helpers
/////////////////////////////////////////////////////////////////////////////////////////////////
function defaultSerialize(value) {
    return JSON.stringify(value, (_, v) => {
        // Handle BigInt serialization
        if (typeof v === 'bigint')
            return `bigint::${v.toString()}`;
        // Handle Uint8Array serialization
        if (v instanceof Uint8Array)
            return `uint8array::${Array.from(v).join(',')}`;
        return v;
    });
}
function defaultDeserialize(value) {
    return JSON.parse(value, (_, v) => {
        // Handle BigInt deserialization
        if (typeof v === 'string' && v.startsWith('bigint::')) {
            return BigInt(v.slice(8));
        }
        // Handle Uint8Array deserialization
        if (typeof v === 'string' && v.startsWith('uint8array::')) {
            const nums = v.slice(12).split(',').map(Number);
            return new Uint8Array(nums);
        }
        return v;
    });
}
