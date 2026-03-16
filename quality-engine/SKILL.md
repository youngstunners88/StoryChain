# StoryChain Quality Engine

**Content moderation and quality assurance system.**

## Purpose

Ensures all stories and contributions meet StoryChain quality standards:
- Content moderation (spam, abuse, inappropriate content)
- Quality scoring (readability, engagement potential)
- Plagiarism detection
- Grammar and style checking

## Architecture

```
quality-engine/
├── SKILL.md              # This file
├── soul/
│   └── default.yaml      # Quality standards definition
├── memory/
│   ├── rules/             # Moderation rules
│   │   └── content-rules.yaml
│   ├── blocked/           # Blocked content log
│   │   └── blocked.jsonl
│   └── quality-scores/    # Content quality ratings
│       └── {content-id}.yaml
├── tools/
│   ├── moderator.ts       # Content moderation
│   ├── quality-scorer.ts  # Quality assessment
│   ├── plagiarism-check.ts # Originality check
│   └── grammar-check.ts   # Grammar/style check
└── scripts/
    ├── moderate-content.ts # Run moderation
    ├── score-story.ts      # Quality score a story
    └── audit-quality.ts    # Review quality metrics
```

## Quality Rules

```yaml
# quality-engine/memory/rules/content-rules.yaml
moderation:
  blocked_patterns:
    - hate_speech
    - harassment
    - spam
    - explicit_content
  
  quality_thresholds:
    min_readability_score: 60  # Flesch Reading Ease
    min_grammar_score: 70
    max_plagiarism_score: 15   # Percentage
    
  auto_actions:
    - block_if_spam_score > 80
    - flag_if_plagiarism > 30
    - approve_if_all_scores_pass
```

## Commands

```bash
# Moderate new content
bun quality-engine/scripts/moderate-content.ts --story-id story_abc123

# Score story quality
bun quality-engine/scripts/score-story.ts --story-id story_abc123

# Check for plagiarism
bun quality-engine/tools/plagiarism-check.ts --content "Story text here..."

# Run quality audit
bun quality-engine/scripts/audit-quality.ts
```

## Integration

Quality engine runs on:
- New story submission (before publish)
- New contribution (before add)
- Scheduled audit (daily)

Results stored in content-quality database table.
