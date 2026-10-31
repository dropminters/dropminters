// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DropToken} from "../src/DropToken.sol";

contract DropTokenTest is Test {
    address constant OWNER = 0xF159CD2739E76fcbA210cB22Ac34cc39a9D4Bd87;
    address constant A = address(0xA11CE);
    address constant B = address(0xB0B);

    function test_metadata_and_split() public {
        address[] memory init = new address[](2);
        init[0] = A;
        init[1] = B;
        DropToken t = new DropToken(OWNER, init);
        assertEq(t.name(), "DropMinters");
        assertEq(t.symbol(), "DROP");
        assertEq(t.decimals(), 18);
        assertEq(t.totalSupply(), 1_000_000_000 ether);
        assertEq(t.balanceOf(OWNER), 985_000_000 ether);
        assertEq(t.balanceOf(A), 10_000 ether);
        assertEq(t.balanceOf(B), 10_000 ether);
        assertEq(t.balanceOf(address(t)), 15_000_000 ether - 20_000 ether);
        assertTrue(t.airdropped(A));
    }

    function test_spray_idempotent() public {
        address[] memory init = new address[](0);
        DropToken t = new DropToken(OWNER, init);
        address[] memory w = new address[](1);
        w[0] = A;
        t.spray(w);
        assertEq(t.balanceOf(A), 10_000 ether);
        t.spray(w); // no-op
        assertEq(t.balanceOf(A), 10_000 ether);
        assertEq(t.balanceOf(address(t)), 15_000_000 ether - 10_000 ether);
    }

    function test_revert_zero_owner() public {
        address[] memory init = new address[](0);
        vm.expectRevert(bytes("zero"));
        new DropToken(address(0), init);
    }
}
