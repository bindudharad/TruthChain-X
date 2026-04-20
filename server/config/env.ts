export const env = {
  mongoUri: process.env.MONGODB_URI || "",
  chainRpcUrl: process.env.CHAIN_RPC_URL || "",
  chainPrivateKey: process.env.CHAIN_PRIVATE_KEY || "",
  chainContractAddress: process.env.CHAIN_CONTRACT_ADDRESS || "",
  groqApiKey: process.env.GROQ_API_KEY || "",
  gemmaApiKey: process.env.GEMMA_API_KEY || "",
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || "",
  nemotronApiKey: process.env.NEMOTRON_API_KEY || "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  demoMode: process.env.NODE_ENV !== "production"
};
