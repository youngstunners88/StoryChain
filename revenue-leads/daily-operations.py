#!/usr/bin/env python3
"""
Daily Revenue Operations
Runs automatically to generate leads and track progress
"""

import json
import os
from datetime import datetime

LEADS_FILE = "/home/workspace/revenue-leads/leads.json"
ACTIVITY_FILE = "/home/workspace/revenue-leads/activity.jsonl"

def load_leads():
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE) as f:
            return json.load(f)
    return {"leads": [], "total_pipeline": 0}

def log_activity(action, details):
    entry = {
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "details": details
    }
    with open(ACTIVITY_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    return entry

def generate_daily_tasks():
    """Generate tasks for the day"""
    tasks = [
        {
            "time": "09:00",
            "task": "Review leads and prioritize by value",
            "priority": "high"
        },
        {
            "time": "10:00",
            "task": "Send outreach emails to top 3 leads",
            "priority": "high"
        },
        {
            "time": "12:00",
            "task": "Update portfolio website with latest work",
            "priority": "medium"
        },
        {
            "time": "14:00",
            "task": "Research 5 new businesses in target area",
            "priority": "medium"
        },
        {
            "time": "16:00",
            "task": "Follow up on pending proposals",
            "priority": "high"
        },
        {
            "time": "18:00",
            "task": "Review daily metrics and plan tomorrow",
            "priority": "low"
        }
    ]
    return tasks

def calculate_metrics():
    """Calculate key metrics"""
    leads_data = load_leads()
    
    metrics = {
        "total_pipeline": leads_data.get("total_pipeline", 0),
        "num_leads": len(leads_data.get("leads", [])),
        "avg_lead_value": 0,
        "conversion_target": 0.20,  # 20% conversion rate
        "expected_revenue": 0
    }
    
    if metrics["num_leads"] > 0:
        metrics["avg_lead_value"] = metrics["total_pipeline"] / metrics["num_leads"]
        metrics["expected_revenue"] = metrics["total_pipeline"] * metrics["conversion_target"]
    
    return metrics

def main():
    print("=" * 60)
    print("WEALTHWEAVER DAILY OPERATIONS")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    print()
    
    # Metrics
    metrics = calculate_metrics()
    print("METRICS:")
    print(f"  Total Pipeline: R{metrics['total_pipeline']:,}")
    print(f"  Active Leads: {metrics['num_leads']}")
    print(f"  Avg Lead Value: R{metrics['avg_lead_value']:,.0f}")
    print(f"  Expected Revenue (20%): R{metrics['expected_revenue']:,.0f}")
    print()
    
    # Daily Tasks
    print("TODAY'S TASKS:")
    for task in generate_daily_tasks():
        print(f"  [{task['time']}] {task['task']} ({task['priority']})")
    print()
    
    # Revenue Targets
    print("REVENUE TARGETS:")
    print("  Week 1: R500 (proof of concept)")
    print("  Week 2: R1,000 (scaling)")
    print("  Week 3: R2,000 (automation)")
    print("  Week 4: R3,000+ (full autonomous)")
    print()
    
    # Log activity
    log_activity("daily_operations_run", {"metrics": metrics})
    
    print("Status: OPERATIONAL")
    print("Next: Execute outreach campaign")

if __name__ == "__main__":
    main()
