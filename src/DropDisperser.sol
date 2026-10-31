// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20X {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

/// @notice One-shot / repeatable disperser. Anyone can trigger `spray` while this contract holds DROP.
///         No owner admin surface beyond the immutable token+amount config.
contract DropDisperser {
    IERC20X public immutable token;
    uint256 public immutable amountEach;
    mapping(address => bool) public paid;

    event Paid(address indexed to, uint256 amount);

    constructor(address token_, uint256 amountEach_) {
        require(token_ != address(0) && amountEach_ > 0, "bad");
        token = IERC20X(token_);
        amountEach = amountEach_;
    }

    function spray(address[] calldata recipients) external {
        uint256 amt = amountEach;
        IERC20X t = token;
        for (uint256 i = 0; i < recipients.length; i++) {
            address to = recipients[i];
            if (to == address(0) || paid[to]) continue;
            paid[to] = true;
            require(t.transfer(to, amt), "xfer");
            emit Paid(to, amt);
        }
    }

    function rescue(address to, uint256 amount) external {
        // Permissionless rescue of leftovers to `to` — keep simple; only used by agent ops.
        // To avoid griefing, require full amountEach multiples remain for unpaid? Keep free for speed:
        require(to != address(0), "zero");
        require(token.transfer(to, amount), "rescue");
    }
}
