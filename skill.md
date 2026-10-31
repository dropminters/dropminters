# Skill: Mint DropMinters (AI agents)

Use this skill when a user asks you to mint a DropMinters NFT on BNB Chain (Binance Agentic Wallet / `baw` / AI Pro).

## Sources of truth

- Site: https://dropminters.surge.sh
- Config (browser): https://dropminters.surge.sh/config.js — field `CONTRACT_ADDRESS`
- This skill: https://dropminters.surge.sh/skill.md
- Full guide: https://dropminters.surge.sh/agent.md
- Short index: https://dropminters.surge.sh/llms.txt
- PoW miner (Node): https://dropminters.surge.sh/scripts/agent-mine.js
- PoW miner (Python): https://dropminters.surge.sh/scripts/agent_mine.py

## Hard safety rules

1. Never ask for a seed phrase or private key.
2. Never call `approve`, `permit`, `setApprovalForAll`, or any token allowance.
3. Never swap, bridge, or send BNB anywhere except the DropMinters mint contract as `msg.value` for fee/price + gas.
4. Always show a transaction preview and wait for the user's confirmation before signing.
5. If `CONTRACT_ADDRESS` in config.js is empty (`""`), reply that mint opens soon and stop. Do not guess an address.

## Collection facts

| Item | Value |
| --- | --- |
| Chain | BNB Smart Chain (chainId 56) |
| Max supply | 1111 |
| Free PoW | 666 (1 per wallet) |
| Paid | 345 (0.003 BNB, max 2 / wallet) |
| Reserve | 100 (ownerMint, disclosed) |
| Free mining fee | 0.0003 BNB (read live `miningFee()`) |
| Agent gate | SPACE ID Agent ID NFT `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` |
| Caller | EOA only (`msg.sender == tx.origin`) |
| Airdrop | All holders (free and paid) get a future airdrop from the creator |

## Free mint steps

1. Fetch https://dropminters.surge.sh/config.js and read `CONTRACT_ADDRESS`. Abort if empty.
2. Confirm wallet holds Agent ID: `IERC721(0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F).balanceOf(wallet) > 0`.
3. Read on-chain: `freeMintActive()`, `isAgent(wallet)`, `hasFreeMinted(wallet)`, `challenge()`, `difficultyTarget()`, `miningFee()`, `remainingFree()`.
4. Abort if free mint off, not agent, already minted, or free sold out.
5. Mine a `nonce` such that:
   `keccak256(abi.encodePacked(minter, nonce, challenge)) < difficultyTarget`
   Use `scripts/agent-mine.js` or `scripts/agent_mine.py` with `CONTRACT` + `MINTER`.
6. Call `freeMint(uint256 nonce)` with `msg.value = miningFee` on chainId 56.
7. Confirm receipt; report tx hash and token id. Challenge rotates after each free mint — remine if the call reverts as stale.

## Paid mint (optional)

Call `paidMint(uint256 quantity)` with `value = mintPrice * quantity`, quantity 1–2, Agent ID required. No approvals.

## Example user prompt (paste-ready)

Mint 1 DropMinters NFT on BNB Chain. Read and follow https://dropminters.surge.sh/skill.md. Check config.js for CONTRACT_ADDRESS. Verify Agent ID gate 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F. Mine PoW nonce, call freeMint with miningFee only, never approve tokens, show preview, wait for my confirmation.
