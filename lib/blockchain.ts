import { randomUUID } from "crypto";
import { ethers } from "ethers";

const abi = [
  "function storeResult(string memory contentHash, uint256 trustScore, string memory verdict) external",
  "function getResults(address user) external view returns (tuple(string contentHash, uint256 trustScore, string verdict, uint256 timestamp, address user)[])",
  "function getResultByHash(string memory contentHash) external view returns (tuple(string contentHash, uint256 trustScore, string verdict, uint256 timestamp, address user))",
  "function storeFingerprint(bytes32 contentHash, uint256 score, uint256 timestamp) external",
  "function getFingerprint(bytes32 contentHash) external view returns (tuple(bytes32 contentHash, uint256 score, uint256 timestamp))"
];

function resolveEtherscanBase() {
  const network = (process.env.CHAIN_NETWORK || "sepolia").toLowerCase();
  if (network === "mainnet") return "https://etherscan.io";
  if (network === "polygon-amoy" || network === "amoy") return "https://amoy.polygonscan.com";
  return "https://sepolia.etherscan.io";
}

function resolveRpcUrl() {
  return process.env.CHAIN_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "";
}

function resolveContractAddress() {
  return process.env.CHAIN_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_BLOCKCHAIN_CONTRACT || "";
}

export function getExplorerUrl(txHash: string) {
  return `${resolveEtherscanBase()}/tx/${txHash}`;
}

export async function storeOnChain(hash: string, truthScore: number, timestamp: number, verdict?: string, userAddress?: string) {
  const rpcUrl = resolveRpcUrl();
  const privateKey = process.env.CHAIN_PRIVATE_KEY;
  const contractAddress = resolveContractAddress();

  if (!rpcUrl || !privateKey || !contractAddress) {
    return {
      status: "queued" as const,
      transactionHash: `demo-${randomUUID()}`
    };
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, abi, signer);
  let tx;

  try {
    tx = await contract.storeResult(hash, truthScore, verdict || (truthScore < 40 ? "Risk" : truthScore < 70 ? "Suspicious" : "Safe"));
  } catch {
    tx = await contract.storeFingerprint(`0x${hash}`, truthScore, timestamp);
  }

  const receipt = await tx.wait();

  return {
    status: "confirmed" as const,
    transactionHash: receipt?.hash || tx.hash,
    explorerUrl: getExplorerUrl(receipt?.hash || tx.hash),
    userAddress: userAddress || signer.address
  };
}

export async function verifyHashOnChain(hash: string) {
  const rpcUrl = resolveRpcUrl();
  const contractAddress = resolveContractAddress();

  if (!rpcUrl || !contractAddress) {
    return null;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, abi, provider);

  try {
    const result = await contract.getResultByHash(hash);
    const contentHash = result?.contentHash || result?.[0];
    if (!contentHash) return null;

    return {
      found: true,
      contentHash,
      trustScore: Number(result.trustScore ?? result[1] ?? 0),
      verdict: String(result.verdict ?? result[2] ?? ""),
      timestamp: Number(result.timestamp ?? result[3] ?? 0),
      user: String(result.user ?? result[4] ?? "")
    };
  } catch {
    try {
      const result = await contract.getFingerprint(`0x${hash}`);
      const contentHash = result?.contentHash || result?.[0];
      if (!contentHash) return null;

      return {
        found: true,
        contentHash: String(contentHash),
        trustScore: Number(result.score ?? result[1] ?? 0),
        verdict: "",
        timestamp: Number(result.timestamp ?? result[2] ?? 0),
        user: ""
      };
    } catch {
      return null;
    }
  }
}

export async function getUserChainResults(userAddress: string) {
  const rpcUrl = resolveRpcUrl();
  const contractAddress = resolveContractAddress();

  if (!rpcUrl || !contractAddress) {
    return [];
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, abi, provider);

  try {
    const results = await contract.getResults(userAddress);
    return (results || []).map((result: any) => ({
      contentHash: String(result.contentHash ?? result[0] ?? ""),
      trustScore: Number(result.trustScore ?? result[1] ?? 0),
      verdict: String(result.verdict ?? result[2] ?? ""),
      timestamp: Number(result.timestamp ?? result[3] ?? 0),
      user: String(result.user ?? result[4] ?? "")
    }));
  } catch {
    return [];
  }
}
