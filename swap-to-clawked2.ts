import { createWalletClient, createPublicClient, http, formatUnits, parseUnits, Address } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = '0xe3b770f13153f0a55a0c76588ca9ba02a26c820efce1ed16906ff8514ff2d29b' as `0x${string}`;
const account = privateKeyToAccount(PRIVATE_KEY);

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
  
  // Check balances
  const wethBalance = await publicClient.readContract({
    address: WETH,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`WETH Balance: ${formatUnits(wethBalance as bigint, 18)}`);

  // Use most of WETH
  const amountIn = BigInt(wethBalance as bigint) - BigInt(100000000000000n);
  console.log(`Swapping: ${formatUnits(amountIn, 18)} WETH`);

  // Get price quote WETH -> CLAWKED with ignoreAllowance
  console.log('\n1. Getting price quote from ParaSwap...');
  const priceUrl = `https://apiv5.paraswap.io/prices?srcToken=${WETH}&destToken=${CLAWKED}&amount=${amountIn}&srcDecimals=18&destDecimals=18&network=8453&side=SELL&ignoreAllowance=true`;
  
  const priceResp = await fetch(priceUrl);
  const priceData = await priceResp.json();
  
  if (!priceData.priceRoute) {
    console.log('Error:', JSON.stringify(priceData, null, 2));
    return;
  }

  console.log('Price route destAmount:', priceData.priceRoute?.destAmount);
  console.log('You will receive:', formatUnits(BigInt(priceData.priceRoute.destAmount), 18), 'CLAWKED');

  // Build transaction with ignoreAllowance
  console.log('\n2. Building transaction...');
  const buildUrl = 'https://apiv5.paraswap.io/transactions/8453?ignoreAllowance=true';
  
  const buildBody = {
    priceRoute: priceData.priceRoute,
    srcToken: WETH,
    destToken: CLAWKED,
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
  
  if (buildData.error) {
    console.log('Build error:', JSON.stringify(buildData, null, 2));
    return;
  }
  
  console.log('Build success!');
  
  // Execute swap
  console.log('\n3. Executing swap...');
  
  const swapTx = await walletClient.sendTransaction({
    to: buildData.to as `0x${string}`,
    data: buildData.data as `0x${string}`,
    value: BigInt(buildData.value || 0),
    gas: BigInt(buildData.gas || 800000),
  });
  console.log(`Swap tx: ${swapTx}`);
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash: swapTx });
  console.log(`Swap confirmed! Gas used: ${receipt.gasUsed}`);
  console.log(`Transaction: https://basescan.org/tx/${swapTx}`);
  
  // Check final balances
  const finalWeth = await publicClient.readContract({
    address: WETH,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`\nWETH Balance: ${formatUnits(finalWeth as bigint, 18)}`);
  
  const finalClawked = await publicClient.readContract({
    address: CLAWKED,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`CLAWKED Balance: ${formatUnits(finalClawked as bigint, 18)}`);
}

main().catch(console.error);
