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
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const PARASWAP_PROXY = '0x93aAAe79a53759cD164340E4C8766E4Db5331cD7' as Address;

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

  const clawkedBalance = await publicClient.readContract({
    address: CLAWKED,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`CLAWKED Balance: ${formatUnits(clawkedBalance as bigint, 18)}`);

  // Use most of WETH (leave some for potential gas)
  const amountIn = BigInt(wethBalance as bigint) - BigInt(100000000000000n); // Leave 0.0001 WETH
  console.log(`Swapping: ${formatUnits(amountIn, 18)} WETH`);
  
  // Approve WETH for ParaSwap
  console.log('\n1. Approving WETH for ParaSwap...');
  const approveTx = await walletClient.writeContract({
    address: WETH,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [PARASWAP_PROXY, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
  });
  console.log(`Approval tx: ${approveTx}`);
  await publicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log('Approved!');

  // Get price quote WETH -> CLAWKED
  console.log('\n2. Getting price quote from ParaSwap...');
  const priceUrl = `https://apiv5.paraswap.io/prices?srcToken=${WETH}&destToken=${CLAWKED}&amount=${amountIn}&srcDecimals=18&destDecimals=18&network=8453&side=SELL`;
  
  const priceResp = await fetch(priceUrl);
  const priceData = await priceResp.json();
  console.log('Price response:', JSON.stringify(priceData, null, 2).substring(0, 500));
  
  if (!priceData.priceRoute) {
    console.log('Error getting price route');
    // Try direct swap via Uniswap V4
    console.log('\nTrying direct swap via Uniswap V4...');
    return;
  }

  console.log('Price route destAmount:', priceData.priceRoute?.destAmount);

  // Build transaction
  console.log('\n3. Building transaction...');
  const buildUrl = 'https://apiv5.paraswap.io/transactions/8453';
  
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
  console.log('\n4. Executing swap...');
  
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
