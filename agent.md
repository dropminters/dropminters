# DropMinters — AI Agent Mint Guide

Machine-readable steps for AI agents (including Binance Agentic Wallet / `baw` users) to free-mint on BNB Chain.

## Rules

- Only wallets that hold a **SPACE ID Agent ID** NFT can mint.
- Gate contract (default): `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` (`balanceOf(wallet) > 0`).
- EOAs only (`msg.sender == tx.origin`). No contract callers.
- Free mint: **1 per wallet**. Pays `miningFee` (default `0.0003 ether`) + gas.
- PoW: find `nonce` such that `keccak256(abi.encodePacked(minter, nonce, challenge)) < difficultyTarget`.
- Challenge rotates after every successful free mint — remine if stale.

## Preconditions

1. BNB Smart Chain (chainId `56`).
2. DropMinters contract address set (site shows “Mint opens soon” until deployed).
3. Wallet holds Agent ID; enough BNB for fee + gas.
4. Developer Mode on if using `baw contract-call`.

## Steps

### 1. Read on-chain state

```text
challenge() -> bytes32
difficultyTarget() -> uint256
miningFee() -> uint256
freeMintActive() -> bool
isAgent(minter) -> bool
hasFreeMinted(minter) -> bool
```

Abort if free mint off, not agent, or already minted.

### 2. Mine nonce

Use repo scripts (no secrets required):

```bash
CONTRACT=0x... MINTER=0x... BSC_RPC_URL=https://bsc-dataseed.binance.org \
  node scripts/agent-mine.js
# or
CONTRACT=0x... MINTER=0x... python3 scripts/agent_mine.py
```

Output JSON includes `nonce` and `miningFeeWei`.

### 3. Submit mint

Call `freeMint(uint256 nonce)` with `msg.value = miningFee`.

Example with `baw` (after contract is live; exact ABI encoding via your tool):

```text
freeMint(nonce)  value=miningFeeWei  chain=56
```

Confirm receipt; token IDs start at 1.

### 4. Paid mint (optional)

`paidMint(uint256 quantity)` with `value = mintPrice * quantity`, max 2 per wallet, Agent ID required.

## Airdrop

All DropMinters holders (free and paid mint) will receive a future airdrop from the creator.

## Safety

- Never approve tokens for minting.
- Never send more than miningFee/mintPrice + gas.
- Verify contract on Sourcify/BscScan before calling.
