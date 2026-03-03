---
name: cinematic-video
description: Create cinematic narrative videos with consistent characters, compelling storylines, and professional film techniques. Covers character development, story structure, shot composition, editing rhythm, and multi-scene production using AI video generation.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
---

# Cinematic Video Production

Create compelling narrative videos with professional film techniques, consistent characters, and engaging storylines.

## Core Principles

### 1. Character Consistency System

**Character Anchoring:**
- Establish 3-5 defining visual traits per character
- Create a character reference sheet with: physical appearance, signature clothing, characteristic poses, emotional range
- Use consistent seed values or reference images across shots

**Visual Identity Markers:**
```
Character A:
- Hair: Dark curls, shoulder length
- Clothing: Navy blazer, white shirt
- Posture: Confident, shoulders back
- Key prop: Vintage camera
- Distinguishing mark: Small scar on left eyebrow
```

**Consistency Techniques:**
- When generating base images, use `edit_image` with up to 3 reference images of the same character
- Save successful character generations as reference assets
- Describe the character identically each time, adding only scene-specific details

### 2. Narrative Architecture

**Three-Act Structure:**
```
ACT 1 - Setup (15-20% of runtime)
- Establish world and characters
- Present the status quo
- Introduce the inciting incident
- Plant seeds for future payoffs

ACT 2 - Confrontation (50-60% of runtime)
- Rising action and complications
- Character development through challenges
- Midpoint reversal (raise stakes)
- Build toward climax

ACT 3 - Resolution (20-25% of runtime)
- Climax and confrontation
- Character arc completion
- New equilibrium established
- Thematic resonance
```

**Scene Beats:**
Each scene should have:
- A clear purpose (advance plot, reveal character, or create atmosphere)
- A mini-arc (beginning, middle, end)
- Emotional shift (start state → end state)
- Visual storytelling opportunity

**Dialogue-Free Storytelling:**
Since AI videos often lack dialogue, use:
- Visual metaphors (wilting flower = sadness)
- Environmental storytelling (messy room = chaos)
- Body language and facial expressions
- Symbolic objects (ring, letter, photograph)
- Music and sound cues (via audio description tags)

### 3. Shot Composition

**Shot Types:**
- Extreme wide: Establishing location, isolation
- Wide: Full body, environment context
- Medium: Waist up, dialogue, interaction
- Close-up: Face, emotion, reaction
- Extreme close-up: Details, eyes, hands, objects

**Camera Movements:**
- Static: Calm, stable, observational
- Pan: Revealing, scanning environment
- Tilt: Height, power dynamics
- Dolly/Track: Following, immersion
- Handheld: Tension, documentary feel
- Crane/Drone: Grandeur, overview

**Compositional Rules:**
- Rule of thirds for balanced framing
- Leading lines draw the eye
- Negative space for isolation or tension
- Symmetry for formality or order
- Dutch angle for unease or disorientation

### 4. Lighting & Atmosphere

**Lighting Setups:**
- High key: Bright, even, optimistic
- Low key: Dark, dramatic, mysterious
- Rembrandt: Triangle under eye, classic portrait
- Silhouette: Anonymous, dramatic, threat
- Backlit: Ethereal, divine, separation from background

**Time of Day:**
- Golden hour: Warm, romantic, nostalgic
- Blue hour: Cool, melancholic, cinematic
- Midday: Harsh, exposing, clinical
- Night: Intimate, dangerous, secretive

**Weather as Emotion:**
- Rain: Sadness, cleansing, revelation
- Fog: Mystery, confusion, otherworldly
- Snow: Silence, purity, isolation
- Storm: Turmoil, conflict, climax

### 5. Editing Rhythm

**Pacing Guidelines:**
- Opening shots: 3-5 seconds for establishment
- Action sequences: 1-2 second cuts
- Emotional moments: 4-8 seconds, let breathe
- Montages: Rapid cuts, 0.5-1.5 seconds
- Climax: Accelerate then hold

**Transitions:**
- Cut: Immediate, jarring, matches action
- Fade: Time passage, scene end, emotional shift
- Dissolve: Memory, dream, connection
- Match cut: Visual echo, thematic link
- J-cut/L-cut: Audio leads or trails

**The Kuleshov Effect:**
Same shot + different following shot = different meaning
Use reaction shots to control interpretation

### 6. Audio Design (for video generation)

**Audio Tags in generate_video:**
```
<S>Spoken dialogue here<E> - Spoken words
<AUDCAP>Sound of rain on metal roof<ENDAUDCAP> - Ambient sound
<AUDCAP>Dramatic orchestral swell<ENDAUDCAP> - Music cues
<AUDCAP>Distant city ambience<ENDAUDCAP> - Atmosphere
```

**Audio Storytelling:**
- Establish location through ambient sound
- Use music to guide emotional response
- Silence is powerful - use sparingly
- Sound can bridge cuts and scenes

### 7. Genre-Specific Techniques

**Drama:**
- Close-ups for emotional beats
- Slower pacing, longer takes
- Natural lighting
- Emphasis on performance and expression

**Thriller/Suspense:**
- Dutch angles for unease
- Shadows and low-key lighting
- Tight framing creates claustrophobia
- Build tension through withholding

**Romance:**
- Soft, warm lighting
- Two-shots for chemistry
- Close-ups on eyes and hands
- Slow, graceful camera movements

**Action:**
- Rapid cuts, dynamic angles
- Wide shots for spatial clarity
- Close-ups for impact
- Movement matches energy

**Horror:**
- Long takes build dread
- Reveal slowly or not at all
- Sound design crucial
- Darkness as character

### 8. Multi-Scene Production Workflow

**Pre-Production:**
1. Write a one-page story outline
2. Create character reference sheets
3. Break into scenes with beat sheet
4. Plan shot list for each scene
5. Identify key moments to emphasise

**Production (Per Scene):**
1. Generate establishing shot
2. Create character images if needed
3. Generate scene clips with consistent characters
4. Use edit_image to maintain consistency across shots
5. Save successful generations as references

**Assembly:**
1. Arrange clips in narrative order
2. Check for visual continuity
3. Note where audio bridges needed
4. Identify any missing coverage
5. Generate any pickup shots

### 9. Visual Continuity Checklist

- [ ] Character appearance consistent across shots
- [ ] Lighting matches within scene
- [ ] Props stay in same position
- [ ] Background elements consistent
- [ ] Eye-line matches between shots
- [ ] Action flows between cuts
- [ ] Time of day established and maintained
- [ ] Weather/atmosphere consistent

### 10. Common Mistakes to Avoid

**Narrative:**
- Starting too slow or too fast
- Unclear character motivations
- Missing emotional throughline
- Convenient endings without setup

**Visual:**
- Inconsistent character appearance
- Jarring style changes between shots
- Over-crowded frames
- Ignoring screen direction

**Technical:**
- Cuts on action don't match
- Lighting contradicts time of day
- Audio doesn't match environment
- Pacing feels rushed or dragging

## Example Production: "The Last Letter"

**Story:** A woman discovers old letters revealing a family secret.

**Characters:**
- Maya (30s): Dark hair in bun, reading glasses, cream sweater, thoughtful expression
- Young Maya (child): Same features, pigtails, yellow dress

**Structure:**
```
SCENE 1: Attic Discovery (30 sec)
- Wide: Dusty attic, light through window
- Medium: Maya opens old trunk
- Close-up: Hands lifting letter bundle
- Close-up: Face as she reads

SCENE 2: Flashback (20 sec)
- Wide: Garden, childhood home
- Medium: Young Maya playing
- Close-up: Mother hiding letters
- Medium: Young Maya watches from distance

SCENE 3: Revelation (25 sec)
- Close-up: Present Maya's eyes widening
- Medium: She finds photograph
- Extreme close-up: Photo shows mother with man (not father)
- Wide: Maya sits back, processing

SCENE 4: Resolution (15 sec)
- Medium: Maya holds letter to chest
- Close-up: Single tear
- Wide: Light shifts through window
- Fade to warm amber
```

**Shot Prompts:**
```
"Interior attic, afternoon golden light streaming through dust particles, 
woman in cream sweater (30s, dark bun hairstyle, reading glasses) 
kneeling by vintage trunk, discovering bundle of old letters, 
candlelit atmosphere, cinematic 4K"

"Exterior garden, 1980s, soft overcast light, young girl (7, 
dark hair in pigtails, yellow sundress) playing with wooden toys, 
analog film aesthetic, warm nostalgic colour grading"
```

## Tools Reference

**generate_video:**
- Takes an input image + instruction
- Use descriptive prompts with cinematic language
- Include camera movement, lighting, atmosphere
- Maximum ~5 seconds per clip
- Can describe audio with tags

**edit_image:**
- Use for character consistency
- Feed 1-3 reference images of same character
- Describes changes in natural language
- Good for iterative refinement

**generate_image:**
- Create base shots and reference images
- Establish character appearance
- Set environmental mood
- Use for establishing shots

## Quick Reference

**Shot Duration Guide:**
| Shot Type | Typical Duration | Use For |
|-----------|-----------------|---------|
| Establishing | 4-6 sec | Location, mood |
| Action | 1-2 sec | Movement, energy |
| Dialogue | 3-5 sec | Conversation |
| Reaction | 2-4 sec | Response, emotion |
| Montage | 0.5-1.5 sec | Time passage, collection |
| Climax | Variable | Build then hold |

**Emotion → Technique:**
| Emotion | Lighting | Camera | Pacing |
|---------|----------|--------|--------|
| Tension | Low key, shadows | Tight, handheld | Slow then fast |
| Joy | High key, warm | Moving, fluid | Upbeat |
| Sadness | Soft, diffused | Static, wide | Slow, lingering |
| Fear | Dark, harsh | Dutch, tight | Unpredictable |
| Love | Warm, soft | Close, two-shot | Gentle |

## Advanced Techniques

**The Long Take:**
- Builds immersion and tension
- Reveal information progressively
- Single shot = real-time feeling
- Use for important dramatic moments

**Parallel Editing:**
- Cut between simultaneous actions
- Creates tension and connection
- Increase frequency toward convergence
- Clear visual distinction between threads

**Visual Motifs:**
- Recurring images with meaning
- Mirrors, windows, doorways
- Objects that symbolise themes
- Return with variation for resonance

**Colour as Story:**
- Assign colour palettes to characters
- Shift palette to show change
- Warm → cool = comfort to isolation
- Desaturated to saturated = awakening

---

Remember: Every shot should serve the story. Technical craft is meaningless without emotional truth. The audience remembers how they felt, not what they saw.
