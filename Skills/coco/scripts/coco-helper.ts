#!/usr/bin/env bun

/**
 * COCO Helper Script
 * 
 * Usage:
 *   bun coco-helper.ts start [project]  - Start COCO in a project
 *   bun coco-helper.ts config           - Show current config
 *   bun coco-helper.ts skill <name>     - Create a new skill template
 *   bun coco-helper.ts providers        - List available providers
 */

import { execSync } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const args = process.argv.slice(2);
const command = args[0] || "help";

const COCO_CMD = "npx @corbat-tech/coco";

switch (command) {
  case "start": {
    const project = args[1] || process.cwd();
    console.log(`Starting COCO in: ${project}`);
    console.log(`Run: cd ${project} && ${COCO_CMD}`);
    break;
  }

  case "config": {
    console.log(`COCO Configuration:`);
    console.log(`  Version: 2.7.0`);
    console.log(`  Command: ${COCO_CMD}`);
    console.log(`  Config file: .coco.config.json (project)`);
    console.log(`  Skills dir: .coco/skills/ (project)`);
    console.log(`  Global skills: ~/.coco/skills/`);
    break;
  }

  case "skill": {
    const skillName = args[1];
    if (!skillName) {
      console.log(`Usage: bun coco-helper.ts skill <name>`);
      console.log(`Creates a skill template at .coco/skills/<name>.md`);
      process.exit(1);
    }

    const skillDir = ".coco/skills";
    const skillPath = join(skillDir, `${skillName}.md`);

    if (!existsSync(skillDir)) {
      mkdirSync(skillDir, { recursive: true });
    }

    const template = `---
name: ${skillName}
description: Description of what this skill does
---

# ${skillName}

Instructions for this skill:

1. First step
2. Second step
3. Final step

## Example Usage

\`\`\`
User prompt that triggers this skill
\`\`\`
`;

    writeFileSync(skillPath, template);
    console.log(`Created skill: ${skillPath}`);
    break;
  }

  case "providers": {
    console.log(`COCO Supported Providers:`);
    console.log(``);
    console.log(`  Anthropic    - Claude Opus, Sonnet, Haiku`);
    console.log(`  OpenAI       - GPT-4.1, o4-mini`);
    console.log(`  Google       - Gemini 2.5 Pro/Flash`);
    console.log(`  Groq         - Llama 4, Mixtral`);
    console.log(`  OpenRouter   - 200+ models`);
    console.log(`  Mistral      - Mistral Large, Codestral`);
    console.log(`  DeepSeek     - DeepSeek-V3, R1`);
    console.log(`  Together AI  - Llama 4, Qwen`);
    console.log(`  xAI          - Grok-2`);
    console.log(`  Cohere       - Command R+`);
    console.log(`  Ollama       - Any local model`);
    console.log(`  LM Studio    - Any GGUF model`);
    console.log(``);
    console.log(`Switch: coco config set provider <name>`);
    break;
  }

  case "quality": {
    console.log(`COCO 12-Dimension Quality Scoring:`);
    console.log(``);
    console.log(`  1. Correctness     - Test pass rate + build`);
    console.log(`  2. Security        - OWASP patterns (must be 100)`);
    console.log(`  3. Test Coverage   - c8/v8 instrumentation`);
    console.log(`  4. Complexity      - Cyclomatic complexity`);
    console.log(`  5. Duplication     - Similarity detection`);
    console.log(`  6. Style           - Linting rules`);
    console.log(`  7. Documentation   - JSDoc coverage`);
    console.log(`  8. Readability     - Complexity + naming`);
    console.log(`  9. Maintainability - Maintainability Index`);
    console.log(` 10. Test Quality    - Assertion density`);
    console.log(` 11. Completeness    - Requirements traceability`);
    console.log(` 12. Robustness      - Error handling`);
    break;
  }

  case "help":
  default:
    console.log(`COCO Helper`);
    console.log(``);
    console.log(`Commands:`);
    console.log(`  start [project]  - Start COCO in project`);
    console.log(`  config           - Show configuration`);
    console.log(`  skill <name>     - Create skill template`);
    console.log(`  providers        - List providers`);
    console.log(`  quality          - Show quality dimensions`);
    console.log(`  help             - Show this help`);
    break;
}
