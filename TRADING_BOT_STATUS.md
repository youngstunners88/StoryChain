# Trading Bot Status

## Current Status: ACTIVE

**Started:** 2026-02-21 01:54:35 UTC
**PID:** 1513
**Network:** Base Chain
**DEX:** Aerodrome
**Trading Pair:** ETH/USDC
**Check Interval:** 60 seconds

## Wallet

**Address:** `0x3713C3af73870c2674F63E7C796B13c4A4014201`
**ETH Balance:** 0
**USDC Balance:** 0

⚠️ **WALLET IS EMPTY** - Send ETH or USDC (on Base chain) to start trading.

## Technical Indicators Used

1. **RSI (Relative Strength Index)** - Period 14
   - BUY when RSI < 30 (oversold)
   - SELL when RSI > 70 (overbought)

2. **MACD (Moving Average Convergence Divergence)**
   - BUY on bullish crossover
   - SELL on bearish crossover

3. **Bollinger Bands** - Period 20, 2 std dev
   - BUY when price < lower band
   - SELL when price > upper band

4. **EMA Trend** - EMA(20) vs EMA(50)
   - BUY when EMA(20) > EMA(50)
   - SELL when EMA(20) < EMA(50)

## Signal Confidence

- Score ≥ 50: Strong BUY
- Score ≤ -50: Strong SELL
- Otherwise: HOLD

## Log Files

- **Activity Log:** `/dev/shm/trading-bot.log`
- **Trade Log:** `/home/workspace/trades.jsonl`

## Commands

Check live logs:
```bash
tail -f /dev/shm/trading-bot.log
```

Check trade history:
```bash
cat /home/workspace/trades.jsonl
```

Restart bot:
```bash
pkill -f trading-bot-live
cd /home/workspace && setsid ./run-trading-bot.sh &
```

## Funding Instructions

1. Get ETH or USDC on Base chain (use Coinbase, Binance, or bridge)
2. Send to: `0x3713C3af73870c2674F63E7C796B13c4A4014201`
3. Bot will automatically detect funds and start trading

**Minimum recommended:** $50-100 USDC or 0.02-0.05 ETH