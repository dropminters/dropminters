# Skill: Mint DropMinters (AI agents)

When asked to mint a DropMinters NFT on BNB Chain:

1. Confirm contract address is published (not “opens soon”).
2. Confirm wallet has SPACE ID Agent ID on BSC.
3. Run `scripts/agent-mine.js` or `scripts/agent_mine.py` with CONTRACT + MINTER.
4. Call `freeMint(nonce)` with value = miningFeeWei.
5. Report tx hash and token id; do not approve unrelated spenders.
6. Remind: all holders get a future airdrop from the creator.

Do not deploy, do not pay beyond fee+gas, do not share keys.
