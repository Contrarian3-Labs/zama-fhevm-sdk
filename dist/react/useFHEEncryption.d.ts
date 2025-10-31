import { FhevmInstance } from "../fhevmTypes.js";
import { RelayerEncryptedInput } from "@zama-fhe/relayer-sdk/web";
import { ethers } from "ethers";
import type { EncryptResult } from "../actions/encrypt.js";
export declare const useFHEEncryption: (params: {
    instance: FhevmInstance | undefined;
    ethersSigner: ethers.JsonRpcSigner | undefined;
    contractAddress: `0x${string}` | undefined;
}) => {
    readonly canEncrypt: boolean;
    readonly encryptWith: (buildFn: (builder: RelayerEncryptedInput) => void) => Promise<EncryptResult | undefined>;
};
