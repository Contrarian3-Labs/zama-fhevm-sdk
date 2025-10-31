import { describe, it, expect, vi, beforeEach } from "vitest";
import { FhevmDecryptionSignature } from "../src/FhevmDecryptionSignature";
import type { FhevmInstance } from "../src/fhevmTypes";
import type { GenericStringStorage } from "../src/storage/GenericStringStorage";
import type { JsonRpcSigner } from "ethers";

describe("FhevmDecryptionSignature", () => {
  describe("checkIs - Type Guard", () => {
    it("should return false for empty object", () => {
      // @ts-expect-error invalid type
      expect(FhevmDecryptionSignature.checkIs({})).toBe(false);
    });

    it("should return false for null", () => {
      expect(FhevmDecryptionSignature.checkIs(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(FhevmDecryptionSignature.checkIs(undefined)).toBe(false);
    });

    it("should return false for non-object", () => {
      expect(FhevmDecryptionSignature.checkIs("string")).toBe(false);
      expect(FhevmDecryptionSignature.checkIs(123)).toBe(false);
      expect(FhevmDecryptionSignature.checkIs(true)).toBe(false);
    });

    it("should return false for missing publicKey", () => {
      expect(FhevmDecryptionSignature.checkIs({
        privateKey: "priv",
        signature: "sig",
        startTimestamp: 123,
        durationDays: 365,
        contractAddresses: ["0x123"],
        userAddress: "0x456",
        eip712: { domain: {}, primaryType: "test", message: {}, types: {} },
      })).toBe(false);
    });

    it("should return false for missing privateKey", () => {
      expect(FhevmDecryptionSignature.checkIs({
        publicKey: "pub",
        signature: "sig",
        startTimestamp: 123,
        durationDays: 365,
        contractAddresses: ["0x123"],
        userAddress: "0x456",
        eip712: { domain: {}, primaryType: "test", message: {}, types: {} },
      })).toBe(false);
    });

    it("should return false for missing signature", () => {
      expect(FhevmDecryptionSignature.checkIs({
        publicKey: "pub",
        privateKey: "priv",
        startTimestamp: 123,
        durationDays: 365,
        contractAddresses: ["0x123"],
        userAddress: "0x456",
        eip712: { domain: {}, primaryType: "test", message: {}, types: {} },
      })).toBe(false);
    });

    it("should return false for missing startTimestamp", () => {
      expect(FhevmDecryptionSignature.checkIs({
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        durationDays: 365,
        contractAddresses: ["0x123"],
        userAddress: "0x456",
        eip712: { domain: {}, primaryType: "test", message: {}, types: {} },
      })).toBe(false);
    });

    it("should return false for missing durationDays", () => {
      expect(FhevmDecryptionSignature.checkIs({
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        startTimestamp: 123,
        contractAddresses: ["0x123"],
        userAddress: "0x456",
        eip712: { domain: {}, primaryType: "test", message: {}, types: {} },
      })).toBe(false);
    });

    it("should return false for non-array contractAddresses", () => {
      expect(FhevmDecryptionSignature.checkIs({
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        startTimestamp: 123,
        durationDays: 365,
        contractAddresses: "not-array",
        userAddress: "0x456",
        eip712: { domain: {}, primaryType: "test", message: {}, types: {} },
      })).toBe(false);
    });

    it("should return false for contractAddresses without 0x prefix", () => {
      expect(FhevmDecryptionSignature.checkIs({
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        startTimestamp: 123,
        durationDays: 365,
        contractAddresses: ["123"], // Missing 0x
        userAddress: "0x456",
        eip712: { domain: {}, primaryType: "test", message: {}, types: {} },
      })).toBe(false);
    });

    it("should return false for userAddress without 0x prefix", () => {
      expect(FhevmDecryptionSignature.checkIs({
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        startTimestamp: 123,
        durationDays: 365,
        contractAddresses: ["0x123"],
        userAddress: "456", // Missing 0x
        eip712: { domain: {}, primaryType: "test", message: {}, types: {} },
      })).toBe(false);
    });

    it("should return false for missing eip712", () => {
      expect(FhevmDecryptionSignature.checkIs({
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        startTimestamp: 123,
        durationDays: 365,
        contractAddresses: ["0x123"],
        userAddress: "0x456",
      })).toBe(false);
    });

    it("should return false for invalid eip712 structure", () => {
      expect(FhevmDecryptionSignature.checkIs({
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        startTimestamp: 123,
        durationDays: 365,
        contractAddresses: ["0x123"],
        userAddress: "0x456",
        eip712: { domain: {} }, // Missing other fields
      })).toBe(false);
    });

    it("should return true for valid signature object", () => {
      expect(FhevmDecryptionSignature.checkIs({
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        startTimestamp: 123,
        durationDays: 365,
        contractAddresses: ["0x123"],
        userAddress: "0x456",
        eip712: {
          domain: {},
          primaryType: "test",
          message: {},
          types: {},
        },
      })).toBe(true);
    });
  });

  describe("Getters", () => {
    const validSignatureData = {
      publicKey: "test-public-key",
      privateKey: "test-private-key",
      signature: "test-signature",
      startTimestamp: 1000000,
      durationDays: 365,
      contractAddresses: ["0x1234567890123456789012345678901234567890"] as `0x${string}`[],
      userAddress: "0x0987654321098765432109876543210987654321" as `0x${string}`,
      eip712: {
        domain: { name: "Test" },
        primaryType: "TestType",
        message: { test: "value" },
        types: { TestType: [] },
      },
    };

    let signature: any;

    beforeEach(() => {
      signature = FhevmDecryptionSignature.fromJSON(validSignatureData);
    });

    it("should expose publicKey getter", () => {
      expect(signature.publicKey).toBe("test-public-key");
    });

    it("should expose privateKey getter", () => {
      expect(signature.privateKey).toBe("test-private-key");
    });

    it("should expose signature getter", () => {
      expect(signature.signature).toBe("test-signature");
    });

    it("should expose startTimestamp getter", () => {
      expect(signature.startTimestamp).toBe(1000000);
    });

    it("should expose durationDays getter", () => {
      expect(signature.durationDays).toBe(365);
    });

    it("should expose contractAddresses getter", () => {
      expect(signature.contractAddresses).toEqual([
        "0x1234567890123456789012345678901234567890",
      ]);
    });

    it("should expose userAddress getter", () => {
      expect(signature.userAddress).toBe(
        "0x0987654321098765432109876543210987654321"
      );
    });
  });

  describe("Serialization", () => {
    const validSignatureData = {
      publicKey: "test-public-key",
      privateKey: "test-private-key",
      signature: "test-signature",
      startTimestamp: 1000000,
      durationDays: 365,
      contractAddresses: ["0x1234567890123456789012345678901234567890"] as `0x${string}`[],
      userAddress: "0x0987654321098765432109876543210987654321" as `0x${string}`,
      eip712: {
        domain: { name: "Test" },
        primaryType: "TestType",
        message: { test: "value" },
        types: { TestType: [] },
      },
    };

    it("should serialize to JSON", () => {
      const signature = FhevmDecryptionSignature.fromJSON(validSignatureData);
      const json = signature.toJSON();

      expect(json.publicKey).toBe("test-public-key");
      expect(json.privateKey).toBe("test-private-key");
      expect(json.signature).toBe("test-signature");
      expect(json.startTimestamp).toBe(1000000);
      expect(json.durationDays).toBe(365);
    });

    it("should deserialize from JSON object", () => {
      const signature = FhevmDecryptionSignature.fromJSON(validSignatureData);

      expect(signature.publicKey).toBe("test-public-key");
      expect(signature.privateKey).toBe("test-private-key");
    });

    it("should deserialize from JSON string", () => {
      const jsonString = JSON.stringify(validSignatureData);
      const signature = FhevmDecryptionSignature.fromJSON(jsonString);

      expect(signature.publicKey).toBe("test-public-key");
      expect(signature.privateKey).toBe("test-private-key");
    });

    it("should round-trip serialize/deserialize", () => {
      const signature1 = FhevmDecryptionSignature.fromJSON(validSignatureData);
      const json = signature1.toJSON();
      const signature2 = FhevmDecryptionSignature.fromJSON(json);

      expect(signature2.publicKey).toBe(signature1.publicKey);
      expect(signature2.privateKey).toBe(signature1.privateKey);
      expect(signature2.signature).toBe(signature1.signature);
    });
  });

  describe("Validation", () => {
    const createSignatureData = (startTimestamp: number) => ({
      publicKey: "test-public-key",
      privateKey: "test-private-key",
      signature: "test-signature",
      startTimestamp,
      durationDays: 365,
      contractAddresses: ["0x1234567890123456789012345678901234567890"] as `0x${string}`[],
      userAddress: "0x0987654321098765432109876543210987654321" as `0x${string}`,
      eip712: {
        domain: { name: "Test" },
        primaryType: "TestType",
        message: { test: "value" },
        types: { TestType: [] },
      },
    });

    it("should validate unexpired signature", () => {
      const now = Math.floor(Date.now() / 1000);
      const signature = FhevmDecryptionSignature.fromJSON(
        createSignatureData(now)
      );

      expect(signature.isValid()).toBe(true);
    });

    it("should invalidate expired signature", () => {
      const oneYearAgo = Math.floor(Date.now() / 1000) - 366 * 24 * 60 * 60;
      const signature = FhevmDecryptionSignature.fromJSON(
        createSignatureData(oneYearAgo)
      );

      expect(signature.isValid()).toBe(false);
    });

    it("should validate signature at exact expiry boundary", () => {
      const almostExpired =
        Math.floor(Date.now() / 1000) - 364 * 24 * 60 * 60;
      const signature = FhevmDecryptionSignature.fromJSON(
        createSignatureData(almostExpired)
      );

      expect(signature.isValid()).toBe(true);
    });
  });

  describe("Equality", () => {
    const signatureData1 = {
      publicKey: "pub1",
      privateKey: "priv1",
      signature: "sig1",
      startTimestamp: 1000000,
      durationDays: 365,
      contractAddresses: ["0x1234567890123456789012345678901234567890"] as `0x${string}`[],
      userAddress: "0x0987654321098765432109876543210987654321" as `0x${string}`,
      eip712: {
        domain: {},
        primaryType: "test",
        message: {},
        types: {},
      },
    };

    const signatureData2 = {
      ...signatureData1,
      signature: "sig2", // Different signature
    };

    it("should return true for equal signatures", () => {
      const sig1 = FhevmDecryptionSignature.fromJSON(signatureData1);
      const sig2 = FhevmDecryptionSignature.fromJSON(signatureData1);

      expect(sig1.equals(sig2.toJSON())).toBe(true);
    });

    it("should return false for different signatures", () => {
      const sig1 = FhevmDecryptionSignature.fromJSON(signatureData1);
      const sig2 = FhevmDecryptionSignature.fromJSON(signatureData2);

      expect(sig1.equals(sig2.toJSON())).toBe(false);
    });
  });

  describe("Storage Integration", () => {
    let mockStorage: GenericStringStorage;
    let mockInstance: FhevmInstance;

    beforeEach(() => {
      mockStorage = {
        getItem: vi.fn().mockResolvedValue(null),
        setItem: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn().mockResolvedValue(undefined),
      };

      mockInstance = {
        createEIP712: vi.fn().mockReturnValue({
          domain: {},
          types: { UserDecryptRequestVerification: [] },
          message: {},
        }),
      } as any;
    });

    it("should save to storage", async () => {
      const signatureData = {
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        startTimestamp: Math.floor(Date.now() / 1000),
        durationDays: 365,
        contractAddresses: ["0x1234567890123456789012345678901234567890"] as `0x${string}`[],
        userAddress: "0x0987654321098765432109876543210987654321" as `0x${string}`,
        eip712: {
          domain: {},
          primaryType: "test",
          message: {},
          types: {},
        },
      };

      const signature = FhevmDecryptionSignature.fromJSON(signatureData);

      await signature.saveToGenericStringStorage(
        mockStorage,
        mockInstance,
        false
      );

      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    it("should handle save errors gracefully", async () => {
      mockStorage.setItem = vi.fn().mockRejectedValue(new Error("Storage error"));

      const signatureData = {
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        startTimestamp: Math.floor(Date.now() / 1000),
        durationDays: 365,
        contractAddresses: ["0x1234567890123456789012345678901234567890"] as `0x${string}`[],
        userAddress: "0x0987654321098765432109876543210987654321" as `0x${string}`,
        eip712: {
          domain: {},
          primaryType: "test",
          message: {},
          types: {},
        },
      };

      const signature = FhevmDecryptionSignature.fromJSON(signatureData);

      // Should not throw
      await expect(
        signature.saveToGenericStringStorage(mockStorage, mockInstance, false)
      ).resolves.not.toThrow();
    });

    it("should load from storage", async () => {
      const signatureData = {
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        startTimestamp: Math.floor(Date.now() / 1000),
        durationDays: 365,
        contractAddresses: ["0x1234567890123456789012345678901234567890"] as `0x${string}`[],
        userAddress: "0x0987654321098765432109876543210987654321" as `0x${string}`,
        eip712: {
          domain: {},
          primaryType: "test",
          message: {},
          types: {},
        },
      };

      mockStorage.getItem = vi.fn().mockResolvedValue(
        JSON.stringify(signatureData)
      );

      const loaded = await FhevmDecryptionSignature.loadFromGenericStringStorage(
        mockStorage,
        mockInstance,
        ["0x1234567890123456789012345678901234567890"],
        "0x0987654321098765432109876543210987654321"
      );

      expect(loaded).not.toBeNull();
      expect(loaded!.publicKey).toBe("pub");
    });

    it("should return null for non-existent storage", async () => {
      mockStorage.getItem = vi.fn().mockResolvedValue(null);

      const loaded = await FhevmDecryptionSignature.loadFromGenericStringStorage(
        mockStorage,
        mockInstance,
        ["0x1234567890123456789012345678901234567890"],
        "0x0987654321098765432109876543210987654321"
      );

      expect(loaded).toBeNull();
    });

    it("should return null for expired cached signature", async () => {
      const expiredData = {
        publicKey: "pub",
        privateKey: "priv",
        signature: "sig",
        startTimestamp: Math.floor(Date.now() / 1000) - 400 * 24 * 60 * 60, // Expired
        durationDays: 365,
        contractAddresses: ["0x1234567890123456789012345678901234567890"] as `0x${string}`[],
        userAddress: "0x0987654321098765432109876543210987654321" as `0x${string}`,
        eip712: {
          domain: {},
          primaryType: "test",
          message: {},
          types: {},
        },
      };

      mockStorage.getItem = vi.fn().mockResolvedValue(
        JSON.stringify(expiredData)
      );

      const loaded = await FhevmDecryptionSignature.loadFromGenericStringStorage(
        mockStorage,
        mockInstance,
        ["0x1234567890123456789012345678901234567890"],
        "0x0987654321098765432109876543210987654321"
      );

      expect(loaded).toBeNull();
    });

    it("should handle invalid JSON in storage", async () => {
      mockStorage.getItem = vi.fn().mockResolvedValue("invalid json");

      const loaded = await FhevmDecryptionSignature.loadFromGenericStringStorage(
        mockStorage,
        mockInstance,
        ["0x1234567890123456789012345678901234567890"],
        "0x0987654321098765432109876543210987654321"
      );

      expect(loaded).toBeNull();
    });
  });
});

