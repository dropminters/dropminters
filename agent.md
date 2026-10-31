# DropMinters — AI Agent Mint Guide

Machine-readable steps for AI agents (including Binance Agentic Wallet / `baw`) to mint on BNB Chain.

Site never needs your seed. Prefer the **Copy mint prompt** on https://dropminters.surge.sh — paste it to your agent, review the preview, then confirm.

## Config

Read `CONTRACT_ADDRESS` from https://dropminters.surge.sh/config.js.

- Empty string → mint opens soon. Do not mint.
- Non-empty → that is the live DropMinters NFT contract on BSC.

## Rules

- Only wallets that hold a **SPACE ID Agent ID** NFT can mint.
- Gate: `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` (`balanceOf(wallet) > 0`).
- EOAs only (`msg.sender == tx.origin`). No contract callers.
- Free mint: **1 per wallet**. Pays `miningFee` (default `0.0003` BNB) + gas.
- PoW: find `nonce` such that `keccak256(abi.encodePacked(minter, nonce, challenge)) < difficultyTarget`.
- Challenge rotates after every successful free mint — remine if stale.
- Paid mint: `0.003` BNB default, max **2** per wallet.
- Supply: **1111** total = **666** free PoW + **345** paid + **100** reserve.
- **Never approve tokens** for this mint.

## Preconditions

1. BNB Smart Chain (chainId `56`).
2. `CONTRACT_ADDRESS` published in config.js.
3. Wallet holds Agent ID; enough BNB for fee/price + gas.
4. Developer Mode on if using `baw contract-call`.

## Free mint

### 1. Read on-chain state

```text
challenge() -> bytes32
difficultyTarget() -> uint256
miningFee() -> uint256
freeMintActive() -> bool
isAgent(minter) -> bool
hasFreeMinted(minter) -> bool
remainingFree() -> uint256
```

Abort if free mint off, not agent, already minted, or sold out.

### 2. Mine nonce

```bash
CONTRACT=0x... MINTER=0x... BSC_RPC_URL=https://bsc-dataseed.binance.org \
  node scripts/agent-mine.js
# or
CONTRACT=0x... MINTER=0x... python3 scripts/agent_mine.py
```

Output JSON includes `nonce` and `miningFeeWei`.

### 3. Submit

Call `freeMint(uint256 nonce)` with `msg.value = miningFee`. Show preview; wait for user confirm. Report tx hash.

## Paid mint

`paidMint(uint256 quantity)` with `value = mintPrice * quantity`, max 2 per wallet.

## Airdrop

All DropMinters holders (free and paid mint) will receive a future airdrop from the creator.

## Safety

- Never approve tokens for minting.
- Never send more than miningFee / mintPrice + gas.
- Verify contract on Sourcify / BscScan before calling.
