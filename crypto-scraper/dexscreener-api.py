import asyncio
import logging
from collections import defaultdict
from dexscreen import DexscreenerClient, FilterPresets, FilterConfig
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# PRICE ALERTS
# ============================================

async def price_alert(pair):
    """Callback for price changes"""
    print(f"[{datetime.now()}] {pair.base_token.symbol}: ${pair.price_usd:.4f}")
    print(f"  Chain: {pair.chain_id}")
    print(f"  Liquidity: ${pair.liquidity.usd:,.2f}" if pair.liquidity else "  Liquidity: N/A")
    print(f"  Volume 24h: ${pair.volume.h24:,.2f}" if pair.volume else "  Volume: N/A")

async def monitor_price_alerts():
    """Monitor USDC/WETH pair for price changes > 0.1%"""
    client = DexscreenerClient()

    print("=" * 60)
    print("MONITORING: USDC/WETH on Ethereum")
    print("Alert threshold: 0.1% price change")
    print("=" * 60)

    await client.subscribe_pairs(
        chain_id="ethereum",
        pair_addresses=["0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"],
        callback=price_alert,
        filter=FilterPresets.significant_price_changes(0.001)
    )

    await asyncio.sleep(60)  # Monitor for 1 minute
    await client.close_streams()

# ============================================
# ARBITRAGE SCANNER
# ============================================

class ArbitrageScanner:
    def __init__(self, spread_threshold=0.01):  # 1% minimum spread
        self.client = DexscreenerClient()
        self.spread_threshold = spread_threshold
        self.prices_by_chain = defaultdict(dict)
        self.opportunities = []

    async def scan_token(self, token_symbol, token_addresses):
        """Scan a token across multiple chains"""
        print(f"\n{'='*60}")
        print(f"SCANNING: {token_symbol} for arbitrage opportunities")
        print(f"{'='*60}\n")

        # Fetch pairs from all chains concurrently
        tasks = []
        for chain_id, token_address in token_addresses.items():
            task = self.client.get_pairs_by_token_address_async(chain_id, token_address)
            tasks.append((chain_id, task))

        # Process results
        for chain_id, task in tasks:
            try:
                pairs = await task
                if pairs:
                    # Get the most liquid pair
                    best_pair = max(pairs, key=lambda p: p.liquidity.usd if p.liquidity else 0)

                    if best_pair.price_usd:
                        self.prices_by_chain[token_symbol][chain_id] = {
                            'price': best_pair.price_usd,
                            'pair': best_pair,
                            'liquidity': best_pair.liquidity.usd if best_pair.liquidity else 0
                        }
                        print(f"  {chain_id.upper()}: ${best_pair.price_usd:.6f} (Liquidity: ${best_pair.liquidity.usd:,.0f})")
            except Exception as e:
                logger.error(f"Error fetching {chain_id}: {e}")

        # Find arbitrage opportunities
        self.find_opportunities(token_symbol)

    def find_opportunities(self, token_symbol):
        """Find arbitrage opportunities for a token"""
        prices = self.prices_by_chain[token_symbol]

        if len(prices) < 2:
            print(f"\n  Need at least 2 chains with prices for {token_symbol}")
            return

        print(f"\n{'='*60}")
        print(f"ARBITRAGE OPPORTUNITIES: {token_symbol}")
        print(f"{'='*60}")

        # Find min and max prices
        chains = list(prices.keys())
        for i in range(len(chains)):
            for j in range(i + 1, len(chains)):
                chain1, chain2 = chains[i], chains[j]
                price1 = prices[chain1]['price']
                price2 = prices[chain2]['price']

                # Calculate spread
                if price1 > price2:
                    buy_chain, sell_chain = chain2, chain1
                    buy_price, sell_price = price2, price1
                else:
                    buy_chain, sell_chain = chain1, chain2
                    buy_price, sell_price = price1, price2

                spread = (sell_price - buy_price) / buy_price * 100

                if spread >= self.spread_threshold * 100:
                    opportunity = {
                        'token': token_symbol,
                        'buy_chain': buy_chain,
                        'sell_chain': sell_chain,
                        'buy_price': buy_price,
                        'sell_price': sell_price,
                        'spread': spread,
                        'buy_liquidity': prices[buy_chain]['liquidity'],
                        'sell_liquidity': prices[sell_chain]['liquidity']
                    }
                    self.opportunities.append(opportunity)

                    print(f"\n  💰 OPPORTUNITY FOUND!")
                    print(f"  BUY on {buy_chain.upper()}: ${buy_price:.6f}")
                    print(f"  SELL on {sell_chain.upper()}: ${sell_price:.6f}")
                    print(f"  SPREAD: {spread:.2f}%")
                    print(f"  Liquidity: ${prices[buy_chain]['liquidity']:,.0f} / ${prices[sell_chain]['liquidity']:,.0f}")

    async def close(self):
        await self.client.close_streams()

# ============================================
# MULTI-CHAIN MONITORING
# ============================================

async def arbitrage_callback(pair):
    """Callback for cross-chain arbitrage monitoring"""
    print(f"[{pair.chain_id}] {pair.base_token.symbol}: ${pair.price_usd:.6f}")

async def monitor_multi_chain():
    """Monitor USDC across multiple chains for price differences"""
    client = DexscreenerClient()

    usdc_pairs = {
        "ethereum": ["0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"],
        "polygon": ["0x2791bca1f2de4661ed88a30c99a7a9449aa84174"],
        "arbitrum": ["0x17c42e1b89faeba27a7c0a2e6a593e5d34c55d97"]
    }

    print("Monitoring USDC across Ethereum, Polygon, and Arbitrum...")

    chains = ["ethereum", "polygon", "arbitrum"]
    for chain in chains:
        await client.subscribe_pairs(chain, usdc_pairs[chain], arbitrage_callback)

    await asyncio.sleep(60)
    await client.close_streams()

# ============================================
# PORTFOLIO TRACKING
# ============================================

async def portfolio_callback(pair):
    """Callback for portfolio updates"""
    print(f"[PORTFOLIO] {pair.chain_id} - {pair.base_token.symbol}: ${pair.price_usd:.4f}")

async def track_portfolio():
    """Track multiple assets with custom filters per chain"""
    client = DexscreenerClient()

    portfolio_config = {
        "ethereum": {
            "pairs": ["0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"],  # USDC/WETH
            "filter": FilterPresets.significant_price_changes(0.005)
        },
        "solana": {
            "pairs": ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],  # USDC
            "filter": FilterPresets.significant_price_changes(0.005)
        }
    }

    for chain_id, config in portfolio_config.items():
        await client.subscribe_pairs(
            chain_id=chain_id,
            pair_addresses=config['pairs'],
            callback=portfolio_callback,
            filter=config['filter']
        )

    await asyncio.sleep(60)
    await client.close_streams()

# ============================================
# VOLUME & LIQUIDITY MONITORING
# ============================================

async def volume_callback(pair):
    """Callback for volume spikes"""
    print(f"[VOLUME SPIKE] {pair.base_token.symbol} on {pair.chain_id}")
    print(f"  Volume 5m: ${pair.volume.m5:,.0f}" if pair.volume else "  Volume: N/A")

async def liquidity_callback(pair):
    """Callback for liquidity changes"""
    print(f"[LIQUIDITY CHANGE] {pair.base_token.symbol} on {pair.chain_id}")
    print(f"  Liquidity: ${pair.liquidity.usd:,.0f}" if pair.liquidity else "  Liquidity: N/A")

async def monitor_volume_liquidity():
    """Monitor for unusual trading activity and liquidity changes"""
    client = DexscreenerClient()

    # Detect unusual trading activity (50% volume increase)
    volume_config = FilterConfig(
        change_fields=["volume.m5", "volume.h1"],
        volume_change_threshold=0.50
    )

    # Track liquidity additions/removals (10% liquidity change)
    liquidity_config = FilterConfig(
        change_fields=["liquidity.usd"],
        liquidity_change_threshold=0.10
    )

    print("Monitoring for volume spikes and liquidity changes...")

    # Subscribe with volume filter
    await client.subscribe_pairs(
        chain_id="ethereum",
        pair_addresses=["0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"],
        callback=volume_callback,
        filter=volume_config
    )

    # Subscribe with liquidity filter
    await client.subscribe_pairs(
        chain_id="ethereum",
        pair_addresses=["0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"],
        callback=liquidity_callback,
        filter=liquidity_config
    )

    await asyncio.sleep(60)
    await client.close_streams()

# ============================================
# SAFE CALLBACK WRAPPER
# ============================================

async def safe_callback(pair):
    """Error-handling wrapper for callbacks"""
    try:
        await process_update(pair)
    except Exception as e:
        logger.error(f"Callback error: {e}")
        # Don't let errors crash subscriptions

async def process_update(pair):
    """Process pair update"""
    print(f"Processing: {pair.base_token.symbol} - ${pair.price_usd:.4f}")

# ============================================
# MAIN EXECUTION
# ============================================

async def main():
    print("\n" + "="*60)
    print("DEXSCREENER API - CRYPTO SCRAPER")
    print("="*60)

    # 1. Run Arbitrage Scanner
    scanner = ArbitrageScanner(spread_threshold=0.005)  # 0.5% minimum spread

    # Token addresses across chains (example: USDC, WETH, etc.)
    tokens_to_scan = {
        "USDC": {
            "ethereum": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            "polygon": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
            "arbitrum": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            "base": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        },
        "WETH": {
            "ethereum": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            "arbitrum": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
            "base": "0x4200000000000000000000000000000000000006"
        },
        "SOL": {
            "solana": "So11111111111111111111111111111111111111112"
        }
    }

    for token_symbol, addresses in tokens_to_scan.items():
        await scanner.scan_token(token_symbol, addresses)

    await scanner.close()

    # 2. Summary
    if scanner.opportunities:
        print(f"\n{'='*60}")
        print(f"SUMMARY: {len(scanner.opportunities)} opportunities found!")
        print(f"{'='*60}")

        # Sort by spread
        scanner.opportunities.sort(key=lambda x: x['spread'], reverse=True)

        for i, opp in enumerate(scanner.opportunities[:5], 1):
            print(f"\n{i}. {opp['token']}: {opp['spread']:.2f}% spread")
            print(f"   BUY {opp['buy_chain'].upper()} @ ${opp['buy_price']:.6f}")
            print(f"   SELL {opp['sell_chain'].upper()} @ ${opp['sell_price']:.6f}")
    else:
        print("\n  No arbitrage opportunities above threshold.")

if __name__ == "__main__":
    asyncio.run(main())
