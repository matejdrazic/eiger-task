import { ethers, upgrades } from "hardhat";

async function main() {

  const SwappyFactory = await ethers.getContractFactory("Swappy");

  // add comment here explaining what kind of proxy pattern is used
  const Swappy = await upgrades.deployProxy(SwappyFactory, [process.env.SWAP_ROUTER_ADDRESS]);

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
