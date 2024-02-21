import { expect } from "chai";
import { Contract, Signer } from "ethers";
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

    let owner: Signer;
    let ownerAddress: string;

    before(async function () {

        // Instantiate Uniswap Quoter
        Quoter = await ethers.getContractAt(QuoterJson.abi, QUOTER_ADDRESS);

        // Instantiate USDT contract
        USDT = await ethers.getContractAt(ERC20Json.abi, USDT_ADDRESS);

        // Get owner address
        [owner] = await ethers.getSigners();
        ownerAddress = await owner.getAddress();
    })

    it("Should not initialize Swappy with zero address for swapRouter or WETH", async function () {
        
        const SwappyFactory = await ethers.getContractFactory("Swappy");

        await expect(upgrades.deployProxy(SwappyFactory, [ethers.ZeroAddress, WETH_ADDRESS])).to.rejectedWith("revert");

        await expect(upgrades.deployProxy(SwappyFactory, [SWAP_ROUTER_ADDRESS, ethers.ZeroAddress])).to.rejectedWith("revert");
    });

    it("Should successfully deploy and initialize Swappy", async function () {

        const SwappyFactory = await ethers.getContractFactory("Swappy");
        Swappy = await upgrades.deployProxy(SwappyFactory, [SWAP_ROUTER_ADDRESS, WETH_ADDRESS]);

        // Check that Swappy is initialized
        expect(await Swappy.swapRouter()).to.equal(SWAP_ROUTER_ADDRESS);
        expect(await Swappy.WETH()).to.equal(WETH_ADDRESS);
    });

    it("Should swap tokens", async function () {

        // Get info on pool dynamics - how much we should reeceive from this trade
        const quotedAmountOut = await Quoter.quoteExactInputSingle.staticCall(WETH_ADDRESS, USDT_ADDRESS, 500, parseEther("1"), 0);

        // Check USDT balance before swap
        const usdtBalanceBefore = await USDT.balanceOf(ownerAddress);

        /**
         * Swap 1 WETH for USDT
         * Pass `quotedAmountOut` as the minimum amount of USDT to receive
         */
        await expect(Swappy.swapEtherToToken(USDT_ADDRESS, quotedAmountOut, 500, { value: parseEther("1") }))
            .to.emit(Swappy, "SwapExecuted").withArgs(USDT_ADDRESS, parseEther("1"), quotedAmountOut, quotedAmountOut);

        // Check USDT balance after swap
        const usdtBalanceAfter = await USDT.balanceOf(ownerAddress);

        // Check that USDT balance has increased by at least `quotedAmountOut`
        expect(usdtBalanceAfter).to.be.gte(usdtBalanceBefore + quotedAmountOut);
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