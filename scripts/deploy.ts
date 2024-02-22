import { ethers, upgrades } from "hardhat";
import { SWAP_ROUTER_ADDRESS, WETH_ADDRESS } from "./addresses";

// Run with: npx hardhat run scripts/deploy.ts --network NETWORK_NAME

async function main() {

  const SwappyFactory = await ethers.getContractFactory("Swappy");

  // add comment here explaining what kind of proxy pattern is used
  const Swappy = await upgrades.deployProxy(SwappyFactory, [SWAP_ROUTER_ADDRESS, WETH_ADDRESS]);

  console.log(
    `Swappy deployed to ${await Swappy.getAddress()}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
