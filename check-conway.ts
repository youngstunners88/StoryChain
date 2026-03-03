import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`;
const WETH = '0x4200000000000000000000000000000000000006' as `0x${string}`;
const CONWAY_WALLET = '0x0089395dBced5DE83D65f13a38140F70777D56F0' as `0x${string}`;

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

  console.log(`Checking Conway Wallet: ${CONWAY_WALLET}\n`);

  // Check ETH balance (native)
  const ethBalance = await client.getBalance({ address: CONWAY_WALLET });
  console.log(`ETH Balance: ${formatUnits(ethBalance, 18)} ETH`);

  // Check USDC balance
  const usdcBalance = await client.readContract({
    address: USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [CONWAY_WALLET],
  });
  console.log(`USDC Balance: ${formatUnits(usdcBalance as bigint, 6)} USDC`);

  // Check WETH balance
  const wethBalance = await client.readContract({
    address: WETH,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [CONWAY_WALLET],
  });
  console.log(`WETH Balance: ${formatUnits(wethBalance as bigint, 18)} WETH`);
}

main().catch(console.error);
