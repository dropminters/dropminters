// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {DropToken} from "../src/DropToken.sol";

contract DropTokenForkTest is Test {
    address constant OWNER = 0xF159CD2739E76fcbA210cB22Ac34cc39a9D4Bd87;
    address constant NFT = 0x74A404dA754A80818C7C896DE13C74F6Ac17f6A3;

    function setUp() public {
        vm.createSelectFork(vm.envOr("BSC_RPC_URL", string("https://bsc-dataseed.binance.org")));
    }

    function test_fork_deploy_spray() public {
        address[] memory init = new address[](1);
        init[0] = address(0x1234);
        DropToken t = new DropToken(OWNER, init);
        assertEq(t.balanceOf(address(0x1234)), 10_000 ether);
        (bool ok, bytes memory data) = NFT.staticcall(abi.encodeWithSignature("totalSupply()"));
        assertTrue(ok);
        console2.log("NFT totalSupply:", abi.decode(data, (uint256)));
        address[] memory more = new address[](1);
        more[0] = address(0x5678);
        t.spray(more);
        assertEq(t.balanceOf(address(0x5678)), 10_000 ether);
    }
}
