import { randomUUID } from "crypto";
import { ethers } from "ethers";

const abi = [
  "function storeFingerprint(bytes32 contentHash, uint256 score, uint256 timestamp) external",
  "function getFingerprint(bytes32 contentHash) external view returns (tuple(bytes32 contentHash, uint256 score, uint256 timestamp))"
];

export async function storeOnChain(hash: string, truthScore: number, timestamp: number) {
  const rpcUrl = process.env.CHAIN_RPC_URL;
  const privateKey = process.env.CHAIN_PRIVATE_KEY;
  const contractAddress = process.env.CHAIN_CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    return {
      status: "queued" as const,
      transactionHash: `demo-${randomUUID()}`
    };
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, abi, signer);
  const tx = await contract.storeFingerprint(`0x${hash}`, truthScore, timestamp);
  const receipt = await tx.wait();

  return {
    status: "confirmed" as const,
    transactionHash: receipt?.hash || tx.hash
  };
}
