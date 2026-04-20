import { ethers } from "hardhat";

async function main() {
  const factory = await ethers.getContractFactory("TruthChainRegistry");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  console.log("TruthChainRegistry deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
