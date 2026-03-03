import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`;
const WALLET = '0x0089395dBced5DE83D65f13a38140F70777D56F0' as `0x${string}`;
const PARASWAP_PROXY = '0x93aAAe79a53759cD164340E4C8766E4Db5331cD7' as `0x${string}`;
const PARASWAP_PROXY2 = '0xB8901aB1a6026a8603D5cf6f69D04eb60fC56e4D' as `0x${string}`;

const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

async function main() {
  const client = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  const allowance1 = await client.readContract({
    address: USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [WALLET, PARASWAP_PROXY],
  });
  console.log(`Allowance for ParaSwap Proxy 1: ${allowance1}`);

  const allowance2 = await client.readContract({
    address: USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [WALLET, PARASWAP_PROXY2],
  });
  console.log(`Allowance for ParaSwap Proxy 2: ${allowance2}`);
}

main();
