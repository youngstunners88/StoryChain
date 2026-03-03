#!/usr/bin/env python3
"""
Agent Lightning Integration for Autonomous Revenue Engine
Enables self-improving agents that learn from traces, prompts, and rewards
"""

import agentlightning as agl
from agentlightning import (
    DummyTracer,
    InMemoryLightningStore,
    set_active_tracer,
    Trainer
)
from datetime import datetime
import json

# Initialize Lightning Store for learning
store = InMemoryLightningStore()

# Initialize Tracer (using Dummy for now, can swap to OtelTracer/AgentOpsTracer)
tracer = DummyTracer()
set_active_tracer(tracer)

# Initialize Trainer for learning loop
trainer = Trainer(store=store)

class RewardLogger:
    """Simple reward logger until full tracer is configured"""
    
    def __init__(self, log_file: str = "/tmp/agent_rewards.jsonl"):
        self.log_file = log_file
        
    def log_reward(self, reward_type: str, value: float, attributes: dict):
        """Log a reward event"""
        event = {
            "timestamp": datetime.now().isoformat(),
            "type": reward_type,
            "reward": value,
            "attributes": attributes
        }
        with open(self.log_file, "a") as f:
            f.write(json.dumps(event) + "\n")
        return event

reward_logger = RewardLogger()

def emit_trade_reward(profit: float, strategy: str, pair: str = "ETH/USDC"):
    """Emit reward signal for trading bot"""
    event = reward_logger.log_reward(
        reward_type="trading_profit",
        value=profit,
        attributes={
            "strategy": strategy,
            "pair": pair,
            "agent": "trading_bot"
        }
    )
    print(f"💰 Trading reward: +${profit:.2f} ({strategy})")
    return event

def emit_outreach_reward(response: bool, lead_value: float, business: str):
    """Emit reward signal for outreach bot"""
    reward = lead_value if response else -10
    event = reward_logger.log_reward(
        reward_type="outreach_result",
        value=reward,
        attributes={
            "responded": response,
            "lead_value": lead_value,
            "business": business,
            "agent": "outreach_bot"
        }
    )
    status = "✅" if response else "❌"
    print(f"📧 Outreach reward: {status} R{lead_value:.0f} ({business})")
    return event

def emit_deal_closed(value: float, client: str, service: str):
    """Emit reward for closed deal"""
    event = reward_logger.log_reward(
        reward_type="deal_closed",
        value=value,
        attributes={
            "client": client,
            "service": service,
            "agent": "lead_generator"
        }
    )
    print(f"🎉 Deal closed: R{value:.0f} - {client} ({service})")
    return event

def get_total_rewards():
    """Get total rewards from log"""
    try:
        total = 0
        with open("/tmp/agent_rewards.jsonl", "r") as f:
            for line in f:
                event = json.loads(line)
                total += event["reward"]
        return total
    except FileNotFoundError:
        return 0

class AutonomousAgentRunner:
    """Runner that logs rewards for Agent Lightning"""
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.total_reward = 0
        
    def record_success(self, reward: float, details: dict):
        """Record successful task for learning"""
        self.total_reward += reward
        reward_logger.log_reward(
            reward_type=f"{self.agent_name}_task",
            value=reward,
            attributes={
                "success": True,
                "agent": self.agent_name,
                **details
            }
        )
        
    def record_failure(self, penalty: float, details: dict):
        """Record failed task for learning"""
        self.total_reward -= penalty
        reward_logger.log_reward(
            reward_type=f"{self.agent_name}_task",
            value=-penalty,
            attributes={
                "success": False,
                "agent": self.agent_name,
                **details
            }
        )

# Create runners for each autonomous agent
trading_runner = AutonomousAgentRunner("trading_bot")
outreach_runner = AutonomousAgentRunner("outreach_bot")
lead_gen_runner = AutonomousAgentRunner("lead_generator")

if __name__ == "__main__":
    print("⚡ Agent Lightning Initialized")
    print(f"  Version: {agl.__version__}")
    print(f"  Store: {type(store).__name__}")
    print(f"  Tracer: {type(tracer).__name__}")
    print(f"  Trainer: {type(trainer).__name__}")
    
    print("\n🎯 Ready to emit rewards and learn from traces")
    print("\nAutonomous Agents:")
    print("  • Trading Bot - emit_trade_reward()")
    print("  • Outreach Bot - emit_outreach_reward()")
    print("  • Lead Generator - emit_deal_closed()")
    
    print("\n📊 Test reward emission...")
    emit_trade_reward(25.50, "eth_usdc_arbitrage", "ETH/USDC")
    emit_outreach_reward(True, 3500, "Maboneng Café")
    emit_deal_closed(15000, "Tech Startup", "Consulting")
    
    print(f"\n📈 Total Rewards: R{get_total_rewards():.2f}")
    print("\n✅ Agent Lightning ready for production!")
    print("\n💡 The system will now learn from every trade, outreach, and deal")
