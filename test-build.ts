const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const WETH = '0x4200000000000000000000000000000000000006';
const WALLET = '0x0089395dBced5DE83D65f13a38140F70777D56F0';
const amountIn = '4500000';

async function main() {
  // Get price quote
  console.log('Getting price quote...');
  const priceUrl = `https://apiv5.paraswap.io/prices?srcToken=${USDC}&destToken=${WETH}&amount=${amountIn}&srcDecimals=6&destDecimals=18&network=8453&side=SELL`;
  
  const priceResp = await fetch(priceUrl);
  const priceData = await priceResp.json();
  console.log('Price route destAmount:', priceData.priceRoute?.destAmount);
  
  // Build transaction
  console.log('\nBuilding transaction...');
  const buildUrl = 'https://apiv5.paraswap.io/transactions/8453';
  
  const buildBody = {
    priceRoute: priceData.priceRoute,
    srcToken: USDC,
    destToken: WETH,
    srcAmount: amountIn,
    userAddress: WALLET,
    slippage: 500,
  };
  
  const buildResp = await fetch(buildUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildBody),
  });
  
  const buildData = await buildResp.json();
  console.log('Full build response:');
  console.log(JSON.stringify(buildData, null, 2));
}

main();
