import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
import { SWAP_ROUTER_ADDRESS, WETH_ADDRESS, USDT_ADDRESS, QUOTER_ADDRESS } from "./addresses";
import { parseEther } from "ethers";

import QuoterJson from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';
import ERC20Json from "@openzeppelin/contracts/build/contracts/IERC20.json";

/**
 * This test suite is for the Swappy contract
 * Tests are conducted on a fork of the Ethereum mainnet: see hardhat.config.ts
 * We are using existing Uniswap contracts on the mainnet for testing
 * 
 * Run with: npx hardhat test
 */

describe("Swappy", function () {

    let Swappy: Contract;
    let Quoter: Contract;
    let USDT: Contract;

    before(async function () {
        // Deploy Swappy
        const SwappyFactory = await ethers.getContractFactory("Swappy");
        Swappy = await upgrades.deployProxy(SwappyFactory, [SWAP_ROUTER_ADDRESS, WETH_ADDRESS]);

        // Instantiate Uniswap Quoter
        Quoter = await ethers.getContractAt(QuoterJson.abi, QUOTER_ADDRESS);

        // Instantiate USDT contract
        USDT = await ethers.getContractAt(ERC20Json.abi, USDT_ADDRESS);
    })

    it("Should swap tokens", async function () {

        // Get info on pool dynamics - how much we should reeceive from this trade
        const quotedAmountOut = await Quoter.quoteExactInputSingle.staticCall(WETH_ADDRESS, USDT_ADDRESS, 500, parseEther("1"), 0);

        /**
         * Swap 1 WETH for USDT
         * Pass `quotedAmountOut` as the minimum amount of USDT to receive
         */
        await Swappy.swapEtherToToken(USDT_ADDRESS, quotedAmountOut, 500, { value: parseEther("1") });
    });

    it("Should not swap tokens because output amount is less than minimum", async function () {

        // Get info on pool dynamics
        const quotedAmountOut = await Quoter.quoteExactInputSingle.staticCall(WETH_ADDRESS, USDT_ADDRESS, 500, parseEther("1"), 0);

        // Transaction should fail since we expect to receive more than quotedAmountOut
        await expect(Swappy.swapEtherToToken(USDT_ADDRESS, quotedAmountOut + 1n, 500, { value: parseEther("1") })).to.rejectedWith("revert");
    });

    it("Should not allow initializing a second time", async function () {

        await expect(Swappy.initialize(SWAP_ROUTER_ADDRESS, WETH_ADDRESS)).to.rejectedWith("revert");

    });

});