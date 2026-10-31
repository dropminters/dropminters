/* DropMinters — single source of truth for mint site + agent prompts.
   Set CONTRACT_ADDRESS after deploy; leave "" while mint is closed. */
window.DROPMINTERS = {
  SITE_URL: "https://dropminters.surge.sh",
  DROP_TOKEN: "0x5C55A1dA8CDe3Bb0712Dc265251e1ab01e40D1cc",
  CONTRACT_ADDRESS: "0x74a404da754a80818c7c896de13c74f6ac17f6a3",
  AGENT_ID_NFT: "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",
  CHAIN_ID: 56,
  CHAIN_NAME: "BNB Smart Chain",
  MAX_SUPPLY: 1111,
  FREE_CAP: 666,
  PAID_CAP: 345,
  RESERVE_CAP: 100,
  MINING_FEE_BNB: "0.0005",
  MINT_PRICE_BNB: "0.005",
  MAX_PAID_PER_WALLET: 2,
  FREE_PER_WALLET: 1,
  ROYALTY_BPS: 500,
  SKILL_URL: "https://dropminters.surge.sh/skill.md",
  AGENT_URL: "https://dropminters.surge.sh/agent.md",
  LLMS_URL: "https://dropminters.surge.sh/llms.txt"
};
