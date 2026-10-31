/* DropMinters PoW worker — ethers loaded inside worker only when mining */
importScripts('https://cdn.jsdelivr.net/npm/ethers@6.13.4/dist/ethers.umd.min.js');
let running = false;
self.onmessage = async (e) => {
  const { type } = e.data;
  if (type === 'stop') { running = false; return; }
  if (type !== 'mine') return;
  const { minter, challenge, difficultyTarget, startNonce, yieldEvery } = e.data;
  running = true;
  const minterBytes = ethers.getBytes(ethers.zeroPadValue(minter, 20));
  const challengeBytes = ethers.getBytes(challenge);
  const target = BigInt(difficultyTarget);
  let nonce = BigInt(startNonce || 0);
  let checked = 0n;
  const batch = BigInt(yieldEvery || 2000);
  const t0 = performance.now();
  while (running) {
    for (let i = 0n; i < batch; i++) {
      const nonceBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(nonce), 32));
      const digest = ethers.keccak256(ethers.concat([minterBytes, nonceBytes, challengeBytes]));
      if (BigInt(digest) < target) {
        self.postMessage({ type: 'found', nonce: nonce.toString(), digest, checked: (checked + i + 1n).toString(), ms: performance.now() - t0 });
        running = false; return;
      }
      nonce++;
    }
    checked += batch;
    const ms = performance.now() - t0;
    self.postMessage({ type: 'progress', nonce: nonce.toString(), checked: checked.toString(), hps: Number(checked) / (ms / 1000), ms });
    // yield to keep UI smooth on mobile
    await new Promise((r) => setTimeout(r, 0));
  }
};
