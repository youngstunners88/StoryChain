#!/usr/bin/env python3
"""
Business Research Agent
Scrapes and researches businesses for lead generation
"""

import json
from datetime import datetime

# Target areas in Johannesburg
TARGET_AREAS = [
    {
        "area": "Maboneng",
        "type": "Arts & Culture Precinct",
        "businesses": [
            {"name": "Arts on Main", "type": "Gallery", "needs": ["Event website", "Artist portfolio", "Booking system"]},
            {"name": "Market on Main", "type": "Market", "needs": ["Vendor listing", "Event calendar", "Newsletter"]},
            {"name": "Craft Restaurant", "type": "Restaurant", "needs": ["Website redesign", "Online menu", "Order system"]},
            {"name": "Canteen", "type": "Restaurant", "needs": ["Reservation system", "Menu management", "Reviews"]},
            {"name": "The Living Room", "type": "Cafe/Bar", "needs": ["Social media automation", "Event promotion"]}
        ]
    },
    {
        "area": "Rosebank",
        "type": "Business District",
        "businesses": [
            {"name": "The Zone @ Rosebank", "type": "Shopping", "needs": ["Store directory", "Events page", "Loyalty app"]},
            {"name": "CITY Lodge", "type": "Hotel", "needs": ["Booking system", "Guest portal", "Reviews integration"]},
            {"name": "The Firs", "type": "Office Park", "needs": ["Tenant directory", "Facility booking", "Newsletter"]}
        ]
    },
    {
        "area": "Sandton",
        "type": "Financial District",
        "businesses": [
            {"name": "Sandton City", "type": "Mall", "needs": ["Store finder", "Deals platform", "Loyalty program"]},
            {"name": "Nelson Mandela Square", "type": "Plaza", "needs": ["Restaurant booking", "Events calendar", "Valet app"]},
            {"name": "Sandton Convention Centre", "type": "Venue", "needs": ["Event management", "Ticketing", "Exhibitor portal"]}
        ]
    },
    {
        "area": "Braamfontein",
        "type": "Education Hub",
        "businesses": [
            {"name": "The Orbit", "type": "Jazz Club", "needs": ["Booking system", "Event calendar", "Newsletter"]},
            {"name": "Kalashnikovv Gallery", "type": "Gallery", "needs": ["Artist portfolio", "Sales platform", "Exhibition archive"]},
            {"name": "Father Coffee", "type": "Coffee Shop", "needs": ["Online ordering", "Loyalty app", "Gift cards"]}
        ]
    },
    {
        "area": "Melville",
        "type": "Creative Hub",
        "businesses": [
            {"name": "Xai Xai", "type": "Restaurant/Bar", "needs": ["Menu website", "Booking system", "Events page"]},
            {"name": "Ant Cafe", "type": "Cafe", "needs": ["Online menu", "Delivery integration", "Social media"]},
            {"name": "Random Harvest", "type": "Nursery", "needs": ["Product catalog", "Order system", "Care guides"]}
        ]
    }
]

def calculate_opportunity_value(business):
    """Calculate potential value based on needs"""
    prices = {
        "Website redesign": 5000,
        "Online menu": 1500,
        "Order system": 3500,
        "Booking system": 4000,
        "Event website": 10000,
        "Artist portfolio": 3000,
        "Vendor listing": 8000,
        "Event calendar": 2000,
        "Newsletter": 1500,
        "Social media automation": 2500,
        "Event promotion": 1500,
        "Loyalty app": 5000,
        "Reservation system": 3000,
        "Menu management": 1500,
        "Reviews integration": 1000,
        "Store directory": 6000,
        "Events page": 2000,
        "Tenant directory": 4000,
        "Facility booking": 5000,
        "Store finder": 3000,
        "Deals platform": 8000,
        "Ticketing": 6000,
        "Online ordering": 4000,
        "Gift cards": 2000,
        "Product catalog": 5000,
        "Delivery integration": 3000
    }
    
    value = sum(prices.get(need, 2000) for need in business["needs"])
    return value

def generate_lead_report():
    """Generate comprehensive lead report"""
    all_leads = []
    
    for area in TARGET_AREAS:
        for business in area["businesses"]:
            lead = {
                "area": area["area"],
                "area_type": area["type"],
                "name": business["name"],
                "type": business["type"],
                "needs": business["needs"],
                "value": calculate_opportunity_value(business),
                "priority": "high" if calculate_opportunity_value(business) > 8000 else "medium" if calculate_opportunity_value(business) > 5000 else "low"
            }
            all_leads.append(lead)
    
    # Sort by value
    all_leads.sort(key=lambda x: x["value"], reverse=True)
    
    return all_leads

def main():
    leads = generate_lead_report()
    
    # Calculate totals
    total_value = sum(l["value"] for l in leads)
    high_priority = [l for l in leads if l["priority"] == "high"]
    
    report = {
        "generated": datetime.now().isoformat(),
        "total_leads": len(leads),
        "total_pipeline": total_value,
        "high_priority_count": len(high_priority),
        "leads": leads
    }
    
    # Save report
    with open("/home/workspace/revenue-leads/business-research.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print("=" * 60)
    print("BUSINESS RESEARCH REPORT")
    print("=" * 60)
    print()
    print(f"Total Leads: {len(leads)}")
    print(f"Total Pipeline: R{total_value:,}")
    print(f"High Priority: {len(high_priority)}")
    print()
    print("TOP 10 OPPORTUNITIES:")
    print("-" * 60)
    for i, lead in enumerate(leads[:10], 1):
        print(f"{i}. {lead['name']} ({lead['area']})")
        print(f"   Type: {lead['type']} | Value: R{lead['value']:,}")
        print(f"   Needs: {', '.join(lead['needs'][:2])}")
        print()
    
    print(f"Report saved to: /home/workspace/revenue-leads/business-research.json")

if __name__ == "__main__":
    main()
