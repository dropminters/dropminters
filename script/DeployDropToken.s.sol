// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script, console2} from "forge-std/Script.sol";
import {DropToken} from "../src/DropToken.sol";
contract DeployDropToken is Script {
    address constant OWNER = 0xF159CD2739E76fcbA210cB22Ac34cc39a9D4Bd87;
    function run() external {
        address[] memory init = new address[](0);
        vm.startBroadcast();
        DropToken t = new DropToken(OWNER, init);
        console2.log("DropToken:", address(t));
        vm.stopBroadcast();
    }
}
