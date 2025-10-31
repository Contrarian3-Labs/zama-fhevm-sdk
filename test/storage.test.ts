import { describe, it, expect, beforeEach } from "vitest";
import { GenericStringInMemoryStorage } from "../src/storage/GenericStringStorage";
import type { GenericStringStorage } from "../src/storage/GenericStringStorage";

describe("GenericStringInMemoryStorage", () => {
  let storage: GenericStringInMemoryStorage;

  beforeEach(() => {
    storage = new GenericStringInMemoryStorage();
  });

  describe("Basic Operations", () => {
    it("should set and get values", () => {
      storage.setItem("key1", "value1");
      expect(storage.getItem("key1")).toBe("value1");
    });

    it("should return null for non-existent keys", () => {
      expect(storage.getItem("nonexistent")).toBe(null);
    });

    it("should remove values", () => {
      storage.setItem("key1", "value1");
      storage.removeItem("key1");
      expect(storage.getItem("key1")).toBe(null);
    });

    it("should handle sets/gets/removes in sequence", () => {
      storage.setItem("k", "v");
      expect(storage.getItem("k")).toBe("v");
      storage.removeItem("k");
      expect(storage.getItem("k")).toBe(null);
    });
  });

  describe("Multiple Keys", () => {
    it("should store multiple key-value pairs", () => {
      storage.setItem("key1", "value1");
      storage.setItem("key2", "value2");
      storage.setItem("key3", "value3");

      expect(storage.getItem("key1")).toBe("value1");
      expect(storage.getItem("key2")).toBe("value2");
      expect(storage.getItem("key3")).toBe("value3");
    });

    it("should remove specific keys without affecting others", () => {
      storage.setItem("key1", "value1");
      storage.setItem("key2", "value2");

      storage.removeItem("key1");

      expect(storage.getItem("key1")).toBe(null);
      expect(storage.getItem("key2")).toBe("value2");
    });

    it("should overwrite existing values", () => {
      storage.setItem("key1", "value1");
      storage.setItem("key1", "value2");

      expect(storage.getItem("key1")).toBe("value2");
    });
  });

  describe("Key Types", () => {
    it("should handle simple string keys", () => {
      storage.setItem("simple", "value");
      expect(storage.getItem("simple")).toBe("value");
    });

    it("should handle keys with special characters", () => {
      storage.setItem("key:with:colons", "value");
      expect(storage.getItem("key:with:colons")).toBe("value");
    });

    it("should handle keys with spaces", () => {
      storage.setItem("key with spaces", "value");
      expect(storage.getItem("key with spaces")).toBe("value");
    });

    it("should handle keys with slashes", () => {
      storage.setItem("path/to/key", "value");
      expect(storage.getItem("path/to/key")).toBe("value");
    });

    it("should handle empty string key", () => {
      storage.setItem("", "value");
      expect(storage.getItem("")).toBe("value");
    });

    it("should handle long keys", () => {
      const longKey = "a".repeat(1000);
      storage.setItem(longKey, "value");
      expect(storage.getItem(longKey)).toBe("value");
    });
  });

  describe("Value Types", () => {
    it("should handle simple string values", () => {
      storage.setItem("key", "simple value");
      expect(storage.getItem("key")).toBe("simple value");
    });

    it("should handle empty string values", () => {
      storage.setItem("key", "");
      expect(storage.getItem("key")).toBe("");
    });

    it("should handle long values", () => {
      const longValue = "x".repeat(10000);
      storage.setItem("key", longValue);
      expect(storage.getItem("key")).toBe(longValue);
    });

    it("should handle values with newlines", () => {
      const valueWithNewlines = "line1\nline2\nline3";
      storage.setItem("key", valueWithNewlines);
      expect(storage.getItem("key")).toBe(valueWithNewlines);
    });

    it("should handle JSON strings", () => {
      const jsonValue = JSON.stringify({ foo: "bar", baz: 123 });
      storage.setItem("key", jsonValue);
      expect(storage.getItem("key")).toBe(jsonValue);
    });

    it("should handle Unicode values", () => {
      const unicodeValue = "Hello 世界 🌍";
      storage.setItem("key", unicodeValue);
      expect(storage.getItem("key")).toBe(unicodeValue);
    });
  });

  describe("Edge Cases", () => {
    it("should handle removing non-existent key", () => {
      storage.removeItem("nonexistent");
      expect(storage.getItem("nonexistent")).toBe(null);
    });

    it("should handle removing already removed key", () => {
      storage.setItem("key", "value");
      storage.removeItem("key");
      storage.removeItem("key"); // Remove again

      expect(storage.getItem("key")).toBe(null);
    });

    it("should handle setting same key multiple times", () => {
      storage.setItem("key", "value1");
      storage.setItem("key", "value2");
      storage.setItem("key", "value3");

      expect(storage.getItem("key")).toBe("value3");
    });

    it("should handle rapid operations", () => {
      for (let i = 0; i < 100; i++) {
        storage.setItem(`key${i}`, `value${i}`);
      }

      for (let i = 0; i < 100; i++) {
        expect(storage.getItem(`key${i}`)).toBe(`value${i}`);
      }
    });

    it("should maintain independence between instances", () => {
      const storage1 = new GenericStringInMemoryStorage();
      const storage2 = new GenericStringInMemoryStorage();

      storage1.setItem("key", "value1");
      storage2.setItem("key", "value2");

      expect(storage1.getItem("key")).toBe("value1");
      expect(storage2.getItem("key")).toBe("value2");
    });
  });

  describe("Interface Compliance", () => {
    it("should implement GenericStringStorage interface", () => {
      const storageInterface: GenericStringStorage = storage;

      expect(typeof storageInterface.getItem).toBe("function");
      expect(typeof storageInterface.setItem).toBe("function");
      expect(typeof storageInterface.removeItem).toBe("function");
    });

    it("should return string, null, or Promise from getItem", () => {
      storage.setItem("key", "value");
      const result = storage.getItem("key");

      // Should be string or Promise<string | null>
      expect(
        typeof result === "string" ||
        (result instanceof Promise) ||
        result === null
      ).toBe(true);
    });

    it("should return void or Promise<void> from setItem", () => {
      const result = storage.setItem("key", "value");

      // Should be void or Promise<void>
      expect(
        result === undefined || result instanceof Promise
      ).toBe(true);
    });

    it("should return void or Promise<void> from removeItem", () => {
      const result = storage.removeItem("key");

      // Should be void or Promise<void>
      expect(
        result === undefined || result instanceof Promise
      ).toBe(true);
    });
  });

  describe("Memory Management", () => {
    it("should properly clear removed items from memory", () => {
      storage.setItem("key1", "value1");
      storage.setItem("key2", "value2");

      storage.removeItem("key1");

      // Only key2 should remain
      expect(storage.getItem("key1")).toBe(null);
      expect(storage.getItem("key2")).toBe("value2");
    });

    it("should handle large number of items", () => {
      const itemCount = 1000;

      for (let i = 0; i < itemCount; i++) {
        storage.setItem(`key${i}`, `value${i}`);
      }

      // Verify random samples
      expect(storage.getItem("key0")).toBe("value0");
      expect(storage.getItem("key500")).toBe("value500");
      expect(storage.getItem("key999")).toBe("value999");
    });
  });

  describe("Use Cases", () => {
    it("should work as cache for signatures", () => {
      const signatureKey = "0x1234:0xabcd:signature";
      const signatureValue = JSON.stringify({
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
      });

      storage.setItem(signatureKey, signatureValue);
      const retrieved = storage.getItem(signatureKey);

      expect(retrieved).toBe(signatureValue);
      expect(JSON.parse(retrieved!).publicKey).toBe("pub");
    });

    it("should work for storing FHEVM instance metadata", () => {
      const metadataKey = "fhevm:31337:metadata";
      const metadata = JSON.stringify({
        chainId: 31337,
        aclAddress: "0x123",
        timestamp: Date.now(),
      });

      storage.setItem(metadataKey, metadata);
      const retrieved = storage.getItem(metadataKey);

      expect(retrieved).toBe(metadata);
      expect(JSON.parse(retrieved!).chainId).toBe(31337);
    });

    it("should work for caching public keys", () => {
      const keyStorageKey = "publickey:0xACL";
      const publicKeyData = JSON.stringify({
        publicKey: "base64encodedkey",
        publicParams: "params",
        timestamp: Date.now(),
      });

      storage.setItem(keyStorageKey, publicKeyData);
      const retrieved = storage.getItem(keyStorageKey);

      expect(retrieved).not.toBeNull();
      expect(JSON.parse(retrieved!).publicKey).toBe("base64encodedkey");
    });
  });
});

