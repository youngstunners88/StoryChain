import { createWalletClient, createPublicClient, http, formatUnits, parseUnits, Address } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = '0xe3b770f13153f0a55a0c76588ca9ba02a26c820efce1ed16906ff8514ff2d29b' as `0x${string}`;
const account = privateKeyToAccount(PRIVATE_KEY);

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const WETH = '0x4200000000000000000000000000000000000006' as Address;
const CLAWKED = '0xe54F44b6e1F5F5e7BB2222b21Ba5aAe9FFf2d812' as Address;

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

  const amountIn = parseUnits('4.5', 6);
  
  // Get price quote and build in one go
  console.log('\n1. Getting price quote from ParaSwap...');
  const priceUrl = `https://apiv5.paraswap.io/prices?srcToken=${USDC}&destToken=${WETH}&amount=${amountIn}&srcDecimals=6&destDecimals=18&network=8453&side=SELL`;
  
  const priceResp = await fetch(priceUrl);
  const priceData = await priceResp.json();
  console.log('Price route found, destAmount:', priceData.priceRoute?.destAmount);
  
  if (!priceData.priceRoute) {
    console.log('Error:', JSON.stringify(priceData, null, 2));
    return;
  }

  // Build transaction
  console.log('\n2. Building transaction...');
  const buildUrl = 'https://apiv5.paraswap.io/transactions/8453';
  
  const buildBody = {
    priceRoute: priceData.priceRoute,
    srcToken: USDC,
    destToken: WETH,
    srcAmount: amountIn.toString(),
    userAddress: account.address,
    slippage: 500,
  };
  
  const buildResp = await fetch(buildUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody),
  });
  
  const buildData = await buildResp.json();
  console.log('Build response status:', buildResp.status);
  
  if (buildData.error) {
    console.log('Build error:', JSON.stringify(buildData, null, 2));
    return;
  }
  
  console.log('Build success! TX data received.');
  
  // Execute swap
  console.log('\n3. Executing swap...');
  
  const swapTx = await walletClient.sendTransaction({
    to: buildData.tx.to,
    data: buildData.tx.data,
    value: BigInt(buildData.tx.value || 0),
    gas: BigInt(buildData.tx.gas || 500000),
  });
  console.log(`Swap tx: ${swapTx}`);
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash: swapTx });
  console.log(`Swap confirmed! Gas used: ${receipt.gasUsed}`);
  console.log(`Transaction: https://basescan.org/tx/${swapTx}`);
  
  // Check final balances
  const wethBalance = await publicClient.readContract({
    address: WETH,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`\nWETH Balance: ${formatUnits(wethBalance as bigint, 18)}`);
  
  const finalUsdc = await publicClient.readContract({
    address: USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`USDC Balance: ${formatUnits(finalUsdc as bigint, 6)}`);
}

main().catch(console.error);
