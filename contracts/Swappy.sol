// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

import {IWETH} from "./IWETH.sol";

import {ERC20Swapper} from "./ISwappy.sol";


/**
 * The `Swappy` contract is a proxy contract that allows users to swap tokens on Uniswap V3.
 * It is initialized with the address of the Uniswap V3 SwapRouter and the WETH token.
 * This contract follows the Transparent Proxy pattern, see more: https://docs.openzeppelin.com/contracts/4.x/api/proxy#transparent_proxy
 */
contract Swappy is ERC20Swapper {

    // Wrapped Ether address on Sepolia testnet
    address public WETH;

    // Uniswap V3 Router address on Sepolia testnet
    address public swapRouter;

    // Gap variables for upgradeability, see more: https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#storage-gaps
    uint256[50] private __gap;

    ///////////////////////////// EVENTS ///////////////////////////////////
    event SwapExecuted(
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 amountOutMinimum
    );

    ///////////////////////////// ERRORS ///////////////////////////////////
    error AlreadyInitialized();
    error ZeroAddress();

    /**
     * Initializes the contract with the Uniswap V3 SwapRouter and WETH addresses.
     * @param _swapRouter The address of the Uniswap V3 SwapRouter
     * @param _WETH The address of the WETH token
     * @dev This function can only be called once.
     * 
     * NOTE I initially wrote this function in Solidity but I started having too much fun with Yul - my apologies :)
     */
    function initialize(address _swapRouter, address _WETH) external {

        assembly {
            if or(
                iszero(_swapRouter),
                iszero(_WETH)
            ) {
                revert(0, 0)
            }
        }
        // This is the equivalent of the following:
        // if (_swapRouter == address(0) || _WETH == address(0))
        //    revert ZeroAddress();

        assembly {
            if sload(swapRouter.slot) {
                revert(0, 0)
            }
        }
        // This is the equivalent of the following:
        // if (swapRouter != address(0)) revert AlreadyInitialized();

        assembly {
            sstore(swapRouter.slot, _swapRouter)
            sstore(WETH.slot, _WETH)
        }
        // This is the equivalent of the following:
        // swapRouter = _swapRouter;
        // WETH = _WETH;

        // Approve the router to spend WETH
        _approveWETH();
    }

    // @inheritdoc ERC20Swapper
    function swapEtherToToken(
        address token,
        uint256 minAmount,
        uint24 poolFee
    ) external payable returns (uint256) {
        // Uniswap router expects WETH, so we need to wrap the Ether
        IWETH(WETH).deposit{value: msg.value}();

        // See more: https://docs.uniswap.org/contracts/v3/guides/swaps/single-swaps
        ISwapRouter.ExactInputSingleParams memory swapParams_ = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: WETH,
                tokenOut: token,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: msg.value,
                amountOutMinimum: minAmount,
                sqrtPriceLimitX96: 0 // for now
            });

        // Executes the swap
        uint256 amountOut = ISwapRouter(swapRouter).exactInputSingle(
            swapParams_
        );

        emit SwapExecuted(token, msg.value, amountOut, minAmount);

        return amountOut;
    }

    /**
     * Approves max amount of WETH to be transferred by Uniswap Router during swaps.
     */
    function _approveWETH() private {
        bool success = IWETH(WETH).approve(swapRouter, type(uint256).max);
        require(success, "Approval not successful");
    }
}
