import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const CLAWKED = '0xe54F44b6e1F5F5e7BB2222b21Ba5aAe9FFf2d812' as `0x${string}`;
const WALLET = '0x0089395dBced5DE83D65f13a38140F70777D56F0' as `0x${string}`;

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
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

  const clawkedBalance = await client.readContract({
    address: CLAWKED,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [WALLET],
  });
  console.log(`CLAWKED Balance: ${formatUnits(clawkedBalance as bigint, 18)}`);
}

main();
