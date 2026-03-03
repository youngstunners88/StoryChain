import { createWalletClient, createPublicClient, http, formatUnits, parseUnits, Address, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = '0xe3b770f13153f0a55a0c76588ca9ba02a26c820efce1ed16906ff8514ff2d29b' as `0x${string}`;
const account = privateKeyToAccount(PRIVATE_KEY);

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const WETH = '0x4200000000000000000000000000000000000006' as Address;
const CLAWKED = '0xe54F44b6e1F5F5e7BB2222b21Ba5aAe9FFf2d812' as Address;

// Aerodrome Router
const AERO_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43' as Address;

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const ROUTER_ABI = [
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'stable', type: 'bool' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'to', type: 'address' },
    ],
    name: 'getAmountsOut',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'routes', type: 'tuple[]' },
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

async function main() {
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  console.log(`Wallet: ${account.address}`);
  
  const usdcBalance = await publicClient.readContract({
    address: USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`USDC Balance: ${formatUnits(usdcBalance as bigint, 6)}`);

  // Use OpenOcean API for best route on Base
  console.log('\nFetching route from OpenOcean...');
  const amountIn = parseUnits('4.5', 6);
  
  const openOceanUrl = `https://ethapi.openocean.finance/v3/8453/quote_quote?inTokenAddress=${USDC}&outTokenAddress=${WETH}&amount=${amountIn}&gasPrice=1000000000&slippage=0.01`;
  
  try {
    const resp = await fetch(openOceanUrl);
    const data = await resp.json();
    console.log('OpenOcean response:', JSON.stringify(data, null, 2).substring(0, 800));
  } catch (e) {
    console.log('OpenOcean error:', e);
  }

  // Try ParaSwap API
  console.log('\nFetching route from ParaSwap...');
  const paraUrl = `https://apiv5.paraswap.io/prices?srcToken=${USDC}&destToken=${WETH}&amount=${amountIn}&srcDecimals=6&destDecimals=18&network=8453&side=SELL&includeDEXs=uniswapv3,aerodrome`;
  
  try {
    const resp = await fetch(paraUrl);
    const data = await resp.json();
    console.log('ParaSwap response:', JSON.stringify(data, null, 2).substring(0, 1000));
  } catch (e) {
    console.log('ParaSwap error:', e);
  }
}

main().catch(console.error);
