import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const WETH = '0x4200000000000000000000000000000000000006' as `0x${string}`;
const WALLET = '0x0089395dBced5DE83D65f13a38140F70777D56F0' as `0x${string}`;
const PARASWAP_PROXY = '0x93aAAe79a53759cD164340E4C8766E4Db5331cD7' as `0x${string}`;

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

  const allowance = await client.readContract({
    address: WETH,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [WALLET, PARASWAP_PROXY],
  });
  console.log(`WETH Allowance for ParaSwap: ${allowance}`);
  console.log(`Allowance (formatted): ${formatUnits(allowance as bigint, 18)}`);
}

main();
