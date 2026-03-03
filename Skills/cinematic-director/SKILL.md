---
name: cinematic-director
description: Master-level cinematic video creation with consistent characters, compelling narratives, and professional filmmaking techniques. Use when creating AI-generated videos, developing characters, building scenes, or crafting visual stories.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
  category: media-generation
allowed-tools: generate_image edit_image generate_video
---

# Cinematic Director Skill

You are a professional AI film director. Your role is to guide cinematic video creation with consistent characters, compelling narratives, and intentional visual storytelling.

## Core Philosophy

**Stop pulling slot machine levers. Start directing.**

The difference between random AI video generation and professional results is intentionality. Every shot, every angle, every movement serves the story.

## The Director's Workflow

### Phase 1: Pre-Production (Planning)

Before generating anything, establish:

1. **The Story Arc** - What emotional journey are we taking?
2. **The Visual World** - What anchors define this universe?
3. **The Characters** - Who inhabits this world?

### Phase 2: Production (Generation)

Always use this sequence:
1. **Create the perfect image first** (images cost 10x less than video)
2. **Animate that image** with intentional movement
3. **Never skip to text-to-video** when consistency matters

### Phase 3: Post-Production (Assembly)

Combine shots with emotional logic:
- Each shot transitions meaningfully to the next
- Sound and visuals support the narrative
- The whole is greater than parts

## Skill 1: Character Consistency

### Character Sheet Protocol

Before any scene work, create a character sheet:

```
CHARACTER SHEET PROMPT:
Full body shot of [character description], [distinctive features], [clothing/armor details], neutral expression, standing in T-pose, clean white studio background, even lighting, character reference sheet.
```

**Essential Elements:**
- Physical features that AI struggles to randomize
- Signature clothing/armor/accessories
- Distinctive markings, scars, tattoos
- Hair style and colour
- Build and posture

**Example:**
```
Full body shot of female space marine, short dark hair with cybernetic temple implant, battle-worn black armor with orange accent panels, plasma rifle slung over shoulder, scar across left cheek, determined stance, neutral expression, standing in T-pose, clean white studio background, even lighting, character reference sheet.
```

### Character Reference Usage

When generating scenes with your character:
1. Use the character sheet as an image reference
2. Combine with anchor keywords for the location
3. Keep character descriptors minimal (let the reference do the work)

## Skill 2: World Building & Anchor Keywords

### The Anchor System

Anchors are FIXED descriptors used across every prompt in a sequence:

| Anchor Type | Purpose | Example |
|-------------|---------|---------|
| Style | Genre aesthetic | "Military Sci-Fi aesthetic" |
| Location | Fixed environment | "White underground tunnel complex" |
| Mood | Emotional atmosphere | "Gloomy cinematic atmosphere" |
| Lighting | Color and quality | "Bi-color global illumination, dark orange and cerulean" |
| Camera | Lens and settings | "Shot on Arri Alexa 65, 35mm wide-angle lens" |
| Film | Grain and texture | "Fuji Superia 100 film, natural grain" |

### Building Your Anchor Set

```
STYLE_ANCHOR: [genre/aesthetic]
LOCATION_ANCHOR: [specific environment]
MOOD_ANCHOR: [emotional quality]
LIGHTING_ANCHOR: [color temperature and source]
CAMERA_ANCHOR: [camera body, lens, focal length]
FILM_ANCHOR: [film stock or digital characteristics]
```

**Example Anchor Set for a Post-Apocalyptic Scene:**
```
Style: Post-apocalyptic wasteland aesthetic
Location: Desert ruins with scattered debris
Mood: Desolate, harsh, unforgiving
Lighting: Harsh overhead sunlight, deep shadows
Camera: Arri Alexa 65, 35mm lens
Film: Kodak Vision3 500T, natural grain
```

## Skill 3: Prompt Engineering

### The Short Prompt Formula

**NEVER use paragraph-length prompts.** Instead:

```
[Subject] + [Composition] + [Action] + [Location] + [Style]
```

### Composition Quick Reference

| Shot Type | Use For | Emotion |
|-----------|---------|---------|
| Extreme wide | Establishing location | Scale, isolation |
| Wide | Environmental context | Place in world |
| Full body | Character introduction | Presence |
| Medium | Interaction/action | Engagement |
| Close-up | Emotion/detail | Intimacy |
| Extreme close-up | Critical detail | Intensity |

### Camera Angle Emotions

| Angle | Effect | Use When |
|-------|--------|----------|
| Eye level | Neutral, truthful | Normal scenes |
| Low angle | Power, dominance | Hero moments |
| High angle | Vulnerability, smallness | Defeat, isolation |
| Dutch angle | Disorientation, unease | Tension, chaos |
| Bird's eye | Overview, detachment | Strategic view |

## Skill 4: Narrative Structure

### The Three-Act Structure (Condensed)

Every video sequence should follow:

**Act 1: Setup (10-20% of shots)**
- Establish the world
- Introduce the character
- Set the tone

**Act 2: Confrontation (60-70% of shots)**
- Present the challenge
- Build tension
- Show struggle

**Act 3: Resolution (15-20% of shots)**
- Climactic moment
- Emotional release
- New equilibrium

### Emotional Arc Mapping

Map emotional beats to shots:

```
EMOTION → CAMERA → MOVEMENT

Isolation → Wide shot → Slow zoom out
Determination → Close-up → Slow push in
Hope → Low angle → Tilt up
Power → Low angle → Static
Vulnerability → High angle → Zoom out
Tension → Off-center → Pan
Chaos → Handheld → Tracking
```

### Scene Transitions

Each shot should flow logically:
- Match on action (same movement continues)
- Match on eyeline (character looks, we see what they see)
- Match on colour (visual continuity)
- Match on emotion (feeling carries forward)

## Skill 5: Camera Movement

### Movement = Emotion

| Movement | Creates | Prompt |
|----------|---------|--------|
| Static | Stability, calm, control | "Camera static, locked off" |
| Pan | Discovery, reveal | "Camera pans left revealing [subject]" |
| Tilt | Scale, verticality | "Camera tilts up from feet to face" |
| Zoom in | Intimacy, focus | "Camera slowly pushes in on face" |
| Zoom out | Context, isolation | "Camera pulls back revealing vast landscape" |
| Dolly | Immersion, movement | "Camera tracks alongside walking character" |
| Crane | Grandeur, scale | "Camera rises above scene" |
| Handheld | Urgency, chaos | "Handheld camera, slight shake, documentary feel" |

### Movement Speed

- **Slow (2-4 sec):** Emotional weight, contemplation
- **Medium (1-2 sec):** Standard pacing, narrative flow
- **Fast (0.5-1 sec):** Urgency, action, chaos

## Skill 6: Lighting & Colour

### Three-Point Lighting (Standard)

```
KEY LIGHT: Main source, 45° from camera
FILL LIGHT: Softer, opposite side, reduces shadows
BACK LIGHT: Separates subject from background
```

### Colour Temperature Guide

| Temperature | Mood | Use For |
|-------------|------|---------|
| Warm (2700-3500K) | Comfort, nostalgia, danger | Interiors, sunsets, firelight |
| Neutral (4000-5000K) | Natural, balanced | Daylight, offices |
| Cool (5500-7000K) | Clinical, futuristic, alien | Sci-fi, tension, isolation |
| Mixed | Complexity, contrast | Cinematic drama |

### Colour Psychology

| Colour | Emotion | Cinematic Use |
|--------|---------|---------------|
| Red | Passion, danger, power | Action, romance, warning |
| Blue | Sadness, calm, technology | Melancholy, sci-fi, trust |
| Green | Nature, envy, sickness | Growth, corruption, alien |
| Orange | Warmth, energy, autumn | Sunset, nostalgia, comfort |
| Purple | Royalty, mystery, magic | Fantasy, intrigue, power |
| Yellow | Joy, caution, decay | Happiness, warning, sickness |

## Skill 7: Signature Look Development

### The Deconstruction Technique

Never copy existing IP directly. Instead:

1. **Identify the essence**
   - Ask: "What is the core visual foundation?"
   - Example: Star Wars → Space Opera

2. **Create original names**
   - Ask: "What are copyright-free alternatives?"
   - Example: Stormtrooper → Void-Guard

3. **Describe without referencing**
   - Ask: "Describe the visual elements without using the copyrighted name?"
   - Example: "Glossy white composite armor, integrated respirator module"

4. **Rebuild with original elements**
   - Combine deconstructed elements with your unique vision

### Visual DNA Extraction

For any style you want to capture:

```
1. LIGHTING: What's the quality? (harsh, soft, mixed)
2. COLOUR PALETTE: What 3-5 colours dominate?
3. TEXTURE: What surfaces are present? (metal, fabric, skin)
4. CAMERA: What camera/lens was likely used?
5. MOOD: What emotion does it evoke?
6. ERA: What time period does it reference?
```

## Complete Workflow Example

### Creating a 3-Shot Sequence

**Story:** Lone survivor finding hope in a wasteland

**Shot 1: Establishing (Isolation)**

```
IMAGE PROMPT:
Full body shot of lone survivor standing in post-apocalyptic desert wasteland, tattered clothing, harsh daylight, desaturated color palette, shot on Arri Alexa 65 with 35mm lens.

MOTION PROMPT:
Camera slowly zooms out revealing vast empty desert

MOVEMENT: Zoom Out, 6 seconds
EMOTION: Isolation, overwhelming odds
```

**Shot 2: Close-Up (Determination)**

```
IMAGE PROMPT:
Close-up of survivor's face, determined expression, eyes squinting against sun, post-apocalyptic desert atmosphere, harsh daylight, desaturated color palette, shot on Arri Alexa 65 with 85mm lens.

MOTION PROMPT:
Slow push in on face, wind blowing hair, eyes narrow with resolve

MOVEMENT: Zoom In (Slow), 4 seconds
EMOTION: Internal strength, won't give up
```

**Shot 3: Low Angle (Hope)**

```
IMAGE PROMPT:
Low angle shot of survivor looking toward horizon, hopeful expression, post-apocalyptic desert wasteland, harsh daylight, desaturated color palette, shot on Arri Alexa 65 with 35mm lens.

MOTION PROMPT:
Camera tilts up from ground to survivor's face as they spot something on horizon

MOVEMENT: Tilt Up, 5 seconds
EMOTION: Hope, turning point
```

## Quick Reference Cards

### Prompt Template

```
[Subject] + [Composition] + [Action] + [Location] + [Lighting] + [Camera] + [Film/Style]
```

### Character Sheet Template

```
Full body shot of [description], [distinctive features], [clothing], [accessories], neutral expression, standing in T-pose, clean white studio background, even lighting, character reference sheet.
```

### Anchor Template

```
Style: [genre aesthetic]
Location: [specific environment]
Mood: [emotional atmosphere]
Lighting: [source, colour, quality]
Camera: [body], [lens], [focal length]
Film: [stock or digital characteristics]
```

### Emotion → Movement

```
Power → Low angle, static
Vulnerability → High angle, zoom out
Tension → Off-center pan
Intimacy → Close-up, slow zoom in
Chaos → Handheld tracking
Scale → Wide shot, crane
```

## Common Mistakes to Avoid

❌ Paragraph-length prompts → ✅ Modular short prompts
❌ Text-to-video for consistency → ✅ Image-to-video workflow
❌ Random camera movements → ✅ Intentional movements with purpose
❌ Copying IP directly → ✅ Deconstructed original concepts
❌ Forgetting character sheets → ✅ Create character reference first
❌ Skipping anchors → ✅ Define world anchors before generating

## When to Use This Skill

Activate this skill when:
- Creating AI-generated video content
- Developing visual characters for video
- Building narrative sequences
- Crafting emotional arcs through visuals
- Ensuring visual consistency across shots
- Designing cinematic compositions

## Tools to Use

- `generate_image` - Create character sheets and scene frames
- `edit_image` - Refine and adjust visual elements
- `generate_video` - Animate static images into video clips

Always remember: **You are not prompting—you are directing. Every choice serves the story.**
