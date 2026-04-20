import { ethers } from "ethers";
import { storeOnChain } from "@/lib/blockchain";
import { env } from "@/server/config/env";

const abi = [
  "function storeFingerprint(bytes32 contentHash, uint256 score, uint256 timestamp) external",
  "function getFingerprint(bytes32 contentHash) external view returns (tuple(bytes32 contentHash, uint256 score, uint256 timestamp))"
];

export async function storeFingerprint(hash: string, score: number, timestamp: number) {
  return storeOnChain(hash, score, timestamp);
}

export async function getFingerprint(hash: string) {
  if (!env.chainRpcUrl || !env.chainContractAddress) return null;
  const provider = new ethers.JsonRpcProvider(env.chainRpcUrl);
  const contract = new ethers.Contract(env.chainContractAddress, abi, provider);
  return contract.getFingerprint(`0x${hash}`);
}
