#!/usr/bin/env bash
# Recurring $DROP airdrop for new DropMinters holders.
# Pays 10,000 DROP once per unique non-owner minter via DropToken.spray().
set -euo pipefail
cd "$(dirname "$0")/.."
export DROP="${DROP:-0x5C55A1dA8CDe3Bb0712Dc265251e1ab01e40D1cc}"
export NFT="${NFT:-0x74A404dA754A80818C7C896DE13C74F6Ac17f6A3}"
exec node scripts/drop-airdrop.js "$@"
