#!/usr/bin/env node
/**
 * DropMinters — Node PoW miner for AI agents / baw contract-call.
 * Usage:
 *   CONTRACT=0x... BSC_RPC_URL=https://bsc-dataseed.binance.org \
 *   MINTER=0xYourAgentWallet node scripts/agent-mine.js
 * Prints JSON: { nonce, digest, challenge, miningFeeWei }
 */
const { ethers } = require('ethers');

const ABI = [
  'function challenge() view returns (bytes32)',
  'function difficultyTarget() view returns (uint256)',
  'function miningFee() view returns (uint256)',
  'function isAgent(address) view returns (bool)',
  'function hasFreeMinted(address) view returns (bool)',
  'function freeMintActive() view returns (bool)',
];

async function main() {
  const rpc = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
  const contractAddr = process.env.CONTRACT;
  const minter = process.env.MINTER;
  if (!contractAddr || !minter) {
    console.error('Set CONTRACT and MINTER');
    process.exit(1);
  }
  const provider = new ethers.JsonRpcProvider(rpc, 56);
  const nft = new ethers.Contract(contractAddr, ABI, provider);
  const [challenge, target, fee, active, isAgent, minted] = await Promise.all([
    nft.challenge(), nft.difficultyTarget(), nft.miningFee(),
    nft.freeMintActive(), nft.isAgent(minter), nft.hasFreeMinted(minter),
  ]);
  if (!active) throw new Error('free mint off');
  if (!isAgent) throw new Error('wallet has no Agent ID');
  if (minted) throw new Error('already free minted');

  const minterBytes = ethers.getBytes(ethers.zeroPadValue(minter, 20));
  const challengeBytes = ethers.getBytes(challenge);
  const t = BigInt(target);
  let nonce = 0n;
  const t0 = Date.now();
  for (;;) {
    const nonceBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(nonce), 32));
    const digest = ethers.keccak256(ethers.concat([minterBytes, nonceBytes, challengeBytes]));
    if (BigInt(digest) < t) {
      const out = {
        nonce: nonce.toString(),
        digest,
        challenge,
        difficultyTarget: target.toString(),
        miningFeeWei: fee.toString(),
        miningFeeBNB: ethers.formatEther(fee),
        ms: Date.now() - t0,
        call: { method: 'freeMint', args: [nonce.toString()], valueWei: fee.toString() },
      };
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    nonce++;
    if (nonce % 50000n === 0n) {
      process.stderr.write(`checked ${nonce}…\n`);
    }
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
