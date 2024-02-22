# ERC-20 swapping contract

The task is to create a simple Solidity contract for exchanging Ether to an arbitrary ERC-20.

## Requirements

1. Implement the following interface as a Solidity Contract

   ```solidity
   interface ERC20Swapper {
       /// @dev swaps the `msg.value` Ether to at least `minAmount` of tokens in `address`, or reverts
       /// @param token The address of ERC-20 token to swap
       /// @param minAmount The minimum amount of tokens transferred to msg.sender
       /// @return The actual amount of transferred tokens
       function swapEtherToToken(address token, uint minAmount) public payable returns (uint);
   }
   ```

2. Deploy the contract to a public Ethereum testnet (e.g. Sepolia)
3. Send the address of deployed contract and the source code to us

### Non-requirements

- Feel free to implement the contract by integrating to whatever DEX you feel comfortable - the exchange implementation is not required.

## Evaluation

Following properties of the contract implementation will be evaluated in this exercise:

- **Safety and trust minimization**. Are user's assets kept safe during the exchange transaction? Is the exchange rate fair and correct? Does the contract have an owner?
- **Performance**. How much gas will the `swapEtherToToken` execution and the deployment take?
- **Upgradeability**. How can the contract be updated if e.g. the DEX it uses has a critical vulnerability and/or the liquidity gets drained?
- **Usability and interoperability**. Is the contract usable for EOAs? Are other contracts able to interoperate with it?
- **Readability and code quality**. Are the code and design understandable and error-tolerant? Is the contract easily testable?

## Discussion of solution

- Setup repo with running `yarn` and filling .env variables
- Solution is implemented with transparent proxy which has an admin set on the proxy contract. This admin can upgrade the contract in case of an emergency. Transparent proxy was used for simplicity, if gas efficiency were a big priority - UUPS would most likely be used.
- Current contract is fairly simple in its' implementation and can be used by non-EOA. To add features such as more functionality on interacting with Uniswap pools (providing liquidity, ...) - the contract gets more complicated and we have to be more careful in dealing with Uniswap integration.
- Yul is written as a fun exercise and demonstration of skills - I would think twice before pushing Yul code to production.
- There is no vulnerability in letting the users directly call the implementation instead of going though the proxy since no state is handled.
- To trade you need to specify a pool fee argument because of UniswapV3 pool fee varieties.
- I've deployed it to Goerli (deprecated) so you can properly test it on-chain since UniswapV3 for some reason doesn't have SwapRouter deployed on Sepolia: https://goerli.etherscan.io/address/0x9c3363B569D5B839d6A9e6c897C0A1be350457aE#writeProxyContract
