"use client";
import { useCallback, useMemo } from "react";
export const useFHEEncryption = (params) => {
    const { instance, ethersSigner, contractAddress } = params;
    const canEncrypt = useMemo(() => Boolean(instance && ethersSigner && contractAddress), [instance, ethersSigner, contractAddress]);
    const encryptWith = useCallback(async (buildFn) => {
        if (!instance || !ethersSigner || !contractAddress)
            return undefined;
        const userAddress = await ethersSigner.getAddress();
        const input = instance.createEncryptedInput(contractAddress, userAddress);
        buildFn(input);
        const enc = await input.encrypt();
        return enc;
    }, [instance, ethersSigner, contractAddress]);
    return {
        canEncrypt,
        encryptWith,
    };
};
