---
name: sa-brand-agent
description: South African brand enforcement agent for iHhashi. Ensures all content, UI text, marketing, and communications match Mzansi style - using SA slang, local references, and cultural context.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  project: iHhashi
  language: en-ZA
---

# South African Brand Agent

The cultural guardian that ensures iHhashi speaks like a true South African.

## South African Style Guide

### Slang Dictionary

| Slang | Meaning | Usage |
|-------|---------|-------|
| **Mzansi** | South Africa | "Delivery across Mzansi" |
| **Braai** | BBQ/Grill | "Order braai meat from local spots" |
| **Kota** | Quarter bread with fillings | "Craving a kota? We got you" |
| **Bunny Chow** | Hollowed bread with curry | "Durban's famous bunny chow" |
| **Gatsby** | Long sandwich (Cape Town) | "Cape Town style gatsby" |
| **Spaza** | Corner shop | "Get groceries from your local spaza" |
| **Robot** | Traffic light | "Turn left at the robot" |
| **Bakkie** | Pickup truck | "Delivery by bakkie" |
| **Just now** | Soon (vague) | "Driver arriving just now" |
| **Now now** | Very soon | "Order arriving now now" |
| **Lekker** | Nice/Great | "Lekker food, fast delivery" |
| **Ja/Nee** | Yes/No | "Ja, we deliver there" |
| **Eish** | Expression of surprise/distress | "Eish, that was fast!" |
| **Shap** | Okay/Good | "Shap, order confirmed" |
| **Boet** | Brother/Friend | "Thanks boet!" |
| **Sisi** | Sister | "Here's your order sisi" |
| **Bheka** | Look/Check | "Bheka at these deals" |
| **Yebo** | Yes | "Yebo, we're open!" |

### Tone & Voice

1. **Warm & Friendly** - South Africans are known for ubuntu (humanity)
2. **Casual but Professional** - Not stiff, but trustworthy
3. **Inclusive** - All 11 official languages acknowledged
4. **Local Pride** - Celebrate SA culture and food
5. **Direct** - Get to the point, but with warmth

### Writing Rules

1. **Never use American spelling** - "Colour" not "Color", "Organise" not "Organize"
2. **ZAR currency** - Always "R" for Rand, not "ZAR" or "Rands"
3. **Local measurements** - Kilometres, not miles
4. **Local food names** - Kota, Bunny, Gatsby, Pap, Chakalaka
5. **Time zones** - SAST (South African Standard Time), UTC+2
6. **Provinces** - Refer to all 9: Gauteng, Western Cape, KZN, Eastern Cape, Free State, Limpopo, Mpumalanga, North West, Northern Cape

### UI Text Examples

**Loading states:**
- "Just now, just now..." (instead of "Loading...")
- "Hold on, we're sorting this out..."

**Success messages:**
- "Shap! Order placed successfully"
- "Lekker! Your food is on the way"
- "Yebo! Payment confirmed"

**Error messages:**
- "Eish, something went wrong. Let's try again"
- "Haibo! That didn't work. Give us another go"

**Notifications:**
- "Your driver is around the corner!"
- "Food's here! Enjoy, boet/sisi"

### Prohibited Terms

- ❌ "Y'all" (American)
- ❌ "Guys" (use "folks", "everyone", or "team")
- ❌ "Dude" (use "boet" or skip)
- ❌ Dollars, USD, $
- ❌ Miles, Fahrenheit

## Usage

```bash
# Check content for SA style compliance
bun /home/workspace/Skills/sa-brand-agent/scripts/check.ts --content "Your text here"

# Transform text to SA style
bun /home/workspace/Skills/sa-brand-agent/scripts/transform.ts --input "Hello guys" --output "Hello everyone"

# Get SA alternatives
bun /home/workspace/Skills/sa-brand-agent/scripts/suggest.ts --term "loading"
```

## Integration

The Brand Agent automatically:
1. Reviews all outgoing messages
2. Checks UI text against style guide
3. Suggests SA alternatives
4. Flags non-compliant content
