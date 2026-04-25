import { ethers } from "ethers";
import { getExplorerUrl, getUserChainResults, storeOnChain, verifyHashOnChain } from "@/lib/blockchain";
import { env } from "@/server/config/env";

const abi = [
  "function storeFingerprint(bytes32 contentHash, uint256 score, uint256 timestamp) external",
  "function getFingerprint(bytes32 contentHash) external view returns (tuple(bytes32 contentHash, uint256 score, uint256 timestamp))"
];

export async function storeFingerprint(hash: string, score: number, timestamp: number, verdict?: string, userAddress?: string) {
  return storeOnChain(hash, score, timestamp, verdict, userAddress);
}

export async function storeIdentitySnapshot(userHash: string, score: number) {
  return storeOnChain(userHash, score, Math.floor(Date.now() / 1000));
}

export async function getFingerprint(hash: string) {
  if (!env.chainRpcUrl || !env.chainContractAddress) return null;
  const provider = new ethers.JsonRpcProvider(env.chainRpcUrl);
  const contract = new ethers.Contract(env.chainContractAddress, abi, provider);
  return contract.getFingerprint(`0x${hash}`);
}

export async function verifyAuthenticity(hash: string) {
  return verifyHashOnChain(hash);
}

export async function listWalletResults(userAddress: string) {
  return getUserChainResults(userAddress);
}

export { getExplorerUrl };

export async function getIdentitySnapshot(userHash: string) {
  return getFingerprint(userHash);
}
