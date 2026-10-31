#!/usr/bin/env python3
"""DropMinters — Python PoW miner for AI agents.

Usage:
  CONTRACT=0x... MINTER=0x... BSC_RPC_URL=https://bsc-dataseed.binance.org \\
    python3 scripts/agent_mine.py

Requires: pip install web3
Prints JSON with nonce + freeMint call params.
"""
from __future__ import annotations
import json, os, sys, time
from eth_hash.auto import keccak

try:
    from web3 import Web3
except ImportError:
    print('pip install web3', file=sys.stderr); sys.exit(1)

ABI = [
    {"name":"challenge","outputs":[{"type":"bytes32"}],"inputs":[],"stateMutability":"view","type":"function"},
    {"name":"difficultyTarget","outputs":[{"type":"uint256"}],"inputs":[],"stateMutability":"view","type":"function"},
    {"name":"miningFee","outputs":[{"type":"uint256"}],"inputs":[],"stateMutability":"view","type":"function"},
    {"name":"isAgent","outputs":[{"type":"bool"}],"inputs":[{"type":"address"}],"stateMutability":"view","type":"function"},
    {"name":"hasFreeMinted","outputs":[{"type":"bool"}],"inputs":[{"type":"address"}],"stateMutability":"view","type":"function"},
    {"name":"freeMintActive","outputs":[{"type":"bool"}],"inputs":[],"stateMutability":"view","type":"function"},
]

def main():
    rpc = os.environ.get('BSC_RPC_URL', 'https://bsc-dataseed.binance.org')
    addr = os.environ.get('CONTRACT')
    minter = os.environ.get('MINTER')
    if not addr or not minter:
        print('Set CONTRACT and MINTER', file=sys.stderr); sys.exit(1)
    w3 = Web3(Web3.HTTPProvider(rpc))
    c = w3.eth.contract(address=Web3.to_checksum_address(addr), abi=ABI)
    minter = Web3.to_checksum_address(minter)
    challenge = c.functions.challenge().call()
    target = c.functions.difficultyTarget().call()
    fee = c.functions.miningFee().call()
    if not c.functions.freeMintActive().call():
        raise SystemExit('free mint off')
    if not c.functions.isAgent(minter).call():
        raise SystemExit('wallet has no Agent ID')
    if c.functions.hasFreeMinted(minter).call():
        raise SystemExit('already free minted')

    # abi.encodePacked(address,uint256,bytes32) = 20 + 32 + 32
    m = bytes.fromhex(minter[2:].lower()).rjust(20, b'\0')[-20:]
    ch = challenge if isinstance(challenge, (bytes, bytearray)) else bytes.fromhex(challenge.hex())
    t0 = time.time()
    nonce = 0
    while True:
        packed = m + nonce.to_bytes(32, 'big') + ch
        digest = keccak(packed)
        if int.from_bytes(digest, 'big') < target:
            print(json.dumps({
                'nonce': str(nonce),
                'digest': '0x' + digest.hex(),
                'challenge': '0x' + ch.hex(),
                'difficultyTarget': str(target),
                'miningFeeWei': str(fee),
                'ms': int((time.time() - t0) * 1000),
                'call': {'method': 'freeMint', 'args': [str(nonce)], 'valueWei': str(fee)},
            }, indent=2))
            return
        nonce += 1
        if nonce % 50000 == 0:
            print(f'checked {nonce}…', file=sys.stderr)

if __name__ == '__main__':
    main()
