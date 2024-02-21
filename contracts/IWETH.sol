// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/**
 * @title WETH interface
 * @author 
 * @notice This is a dummy IWETH interface used for interacting with WETH contract
 * @dev Interface was written following the WETH implementation found on the mainnet
 */
interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function approve(address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}
