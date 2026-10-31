// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DropMinters ($DROP)
 * @notice Fixed-supply ERC20. No owner, no mint after deploy, no tax, no blacklist.
 * @dev Supply 1e9:
 *      - 985,000,000 to owner treasury
 *      - 15,000,000 airdrop pool (held by this contract)
 *      Constructor optionally pays 10,000 DROP to each initial minter from the pool.
 *      Anyone may call `spray` later to pay unpaid wallets 10,000 DROP once.
 */
contract DropToken is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether;
    uint256 public constant AIRDROP_POOL = 15_000_000 ether;
    uint256 public constant OWNER_ALLOCATION = 985_000_000 ether;
    uint256 public constant AIRDROP_EACH = 10_000 ether;

    mapping(address => bool) public airdropped;

    event Airdropped(address indexed wallet, uint256 amount);

    constructor(address ownerTreasury, address[] memory initialMinters) ERC20("DropMinters", "DROP") {
        require(ownerTreasury != address(0), "zero");
        require(AIRDROP_POOL + OWNER_ALLOCATION == TOTAL_SUPPLY, "split");
        _mint(ownerTreasury, OWNER_ALLOCATION);
        _mint(address(this), AIRDROP_POOL);

        for (uint256 i = 0; i < initialMinters.length; i++) {
            address to = initialMinters[i];
            if (to == address(0) || to == ownerTreasury || airdropped[to]) continue;
            airdropped[to] = true;
            _transfer(address(this), to, AIRDROP_EACH);
            emit Airdropped(to, AIRDROP_EACH);
        }
    }

    /// @notice Pay 10,000 DROP once per wallet from the remaining pool. Idempotent.
    function spray(address[] calldata wallets) external {
        uint256 amt = AIRDROP_EACH;
        for (uint256 i = 0; i < wallets.length; i++) {
            address to = wallets[i];
            if (to == address(0) || airdropped[to]) continue;
            airdropped[to] = true;
            _transfer(address(this), to, amt);
            emit Airdropped(to, amt);
        }
    }
}
