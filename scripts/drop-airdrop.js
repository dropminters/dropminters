#!/usr/bin/env node
/**
 * DropMinters $DROP airdrop runner.
 * Pays 10,000 DROP once per unique non-owner minter via DropToken.spray(address[]).
 *
 * Recurring job:
 *   node /workspace/nft-collection/scripts/drop-airdrop.js
 *
 * DRY_RUN=1 node scripts/drop-airdrop.js
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const NFT = process.env.NFT || '0x74A404dA754A80818C7C896DE13C74F6Ac17f6A3';
const DROP = process.env.DROP || '0x5C55A1dA8CDe3Bb0712Dc265251e1ab01e40D1cc';
const OWNER = (process.env.OWNER || '0xF159CD2739E76fcbA210cB22Ac34cc39a9D4Bd87').toLowerCase();
const AGENT = process.env.AGENT || '0x857c8D7697f8457a7a0C660e75c525Dd9A3F18Cc';
const RPC = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
const LEDGER = process.env.LEDGER || path.join(__dirname, '..', '.deploy-tmp', 'drop-airdrop-ledger.json');
const MINTERS_FILE = process.env.MINTERS_FILE || path.join(__dirname, '..', '.deploy-tmp', 'airdrop-wallets.txt');
const MIN_BNB = Number(process.env.MIN_BNB || '0.001');
const DRY = process.env.DRY_RUN === '1';
const BATCH = Number(process.env.BATCH || '20');

const NFT_ABI = [
  'function totalSupply() view returns (uint256)',
  'function ownerOf(uint256) view returns (address)',
];
const DROP_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function airdropped(address) view returns (bool)',
  'function spray(address[] wallets)',
  'function AIRDROP_EACH() view returns (uint256)',
];

function loadLedger() {
  try { return JSON.parse(fs.readFileSync(LEDGER, 'utf8')); }
  catch { return { token: DROP, paid: {}, skipped: {}, lastRun: null }; }
}
function saveLedger(led) {
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  led.lastRun = new Date().toISOString();
  fs.writeFileSync(LEDGER, JSON.stringify(led, null, 2));
}
function bawJson(args) {
  const r = spawnSync('baw', [...args, '--json'], { encoding: 'utf8', maxBuffer: 10 << 20 });
  if (r.status !== 0) throw new Error(`baw failed: ${r.stderr || r.stdout}`);
  return JSON.parse(r.stdout);
}
function agentBnb() {
  const d = bawJson(['wallet', 'balance']);
  const row = (d.data || []).find((x) => String(x.binanceChainId) === '56' && x.symbol === 'BNB');
  return Number(row ? row.balance : 0);
}

async function collectMinters(provider) {
  const nft = new ethers.Contract(NFT, NFT_ABI, provider);
  const supply = Number(await nft.totalSupply());
  const set = new Set();
  if (fs.existsSync(MINTERS_FILE)) {
    for (const line of fs.readFileSync(MINTERS_FILE, 'utf8').split(/\r?\n/)) {
      const a = line.trim().toLowerCase();
      if (/^0x[a-f0-9]{40}$/.test(a) && a !== OWNER) set.add(a);
    }
  }
  const conc = 20;
  for (let i = 1; i <= supply; i += conc) {
    const ids = [];
    for (let j = i; j < i + conc && j <= supply; j++) ids.push(j);
    const addrs = await Promise.all(ids.map(async (id) => {
      try { return (await nft.ownerOf(id)).toLowerCase(); } catch { return null; }
    }));
    for (const a of addrs) if (a && a !== OWNER) set.add(a);
  }
  const list = [...set];
  fs.mkdirSync(path.dirname(MINTERS_FILE), { recursive: true });
  fs.writeFileSync(MINTERS_FILE, list.join('\n') + '\n');
  return list;
}

async function main() {
  console.log(JSON.stringify({ NFT, DROP, OWNER, AGENT, DRY, BATCH, LEDGER }, null, 2));
  const bnb = agentBnb();
  console.log('agent BNB:', bnb);
  if (bnb < MIN_BNB) {
    console.error(`STOP: agent BNB ${bnb} < ${MIN_BNB}`);
    process.exit(2);
  }
  const provider = new ethers.JsonRpcProvider(RPC, 56);
  const drop = new ethers.Contract(DROP, DROP_ABI, provider);
  const minters = await collectMinters(provider);
  console.log('non-owner minters:', minters.length);

  const led = loadLedger();
  led.token = DROP;
  const need = [];
  for (const w of minters) {
    if (led.paid[w]?.txHash || led.paid[w]?.via === 'constructor') {
      console.log('SKIP ledger', w);
      continue;
    }
    let done = false;
    try { done = await drop.airdropped(w); } catch (_) {}
    if (!done) {
      try { done = (await drop.balanceOf(w)) >= 10000n * 10n ** 18n; } catch (_) {}
    }
    if (done) {
      led.paid[w] = { via: 'onchain', at: new Date().toISOString() };
      saveLedger(led);
      console.log('SKIP onchain', w);
      continue;
    }
    need.push(w);
  }
  console.log('need spray:', need.length, need);

  if (!need.length) {
    saveLedger(led);
    console.log('DONE nothing to send');
    return;
  }
  if (DRY) {
    console.log('DRY would spray', need);
    return;
  }

  const results = [];
  for (let i = 0; i < need.length; i += BATCH) {
    if (agentBnb() < MIN_BNB) {
      console.error('STOP mid-run low BNB');
      process.exit(2);
    }
    const batch = need.slice(i, i + BATCH);
    const iface = new ethers.Interface(DROP_ABI);
    const data = iface.encodeFunctionData('spray', [batch]);
    console.log('spray batch', batch);
    const preview = bawJson([
      'contract-call', 'preview',
      '--binanceChainId', '56',
      '--from', AGENT,
      '--to', DROP,
      '--value', '0',
      '--inputData', data,
      '--gasLimit', String(80000 + batch.length * 60000),
    ]);
    if (!preview.success) throw new Error(JSON.stringify(preview));
    const requestId = preview.data.requestId;
    const exec = bawJson(['contract-call', 'execute', '--requestId', requestId]);
    if (!exec.success) throw new Error(JSON.stringify(exec));
    const txHash = exec.data?.txHash || null;
    console.log('  tx', txHash, exec.data?.status);
    for (const w of batch) {
      led.paid[w] = { txHash, via: 'spray', at: new Date().toISOString(), amount: '10000' };
      results.push({ wallet: w, status: 'sent', txHash });
    }
    saveLedger(led);
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log('DONE', JSON.stringify(results, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
