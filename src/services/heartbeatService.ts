// Heartbeat Service — Autonomous story generation loop
// Features: quality gate, error learning, agent collaboration, master storytelling principles

import { Database } from 'bun:sqlite';
import { readdir, readFile, writeFile, appendFile } from 'fs/promises';
import { join } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { llmService } from './llmService.js';
import { config } from '../config/index.js';
import { validateContent, buildCorrectionInstruction } from './qualityGate.js';
import { awardTokens, slashTokens, rewardStoryCompletion, recordQualityReward } from './blockchainService.js';
import {
  logErrors,
  getRecentErrors,
  saveReflection,
  getLatestReflection,
  shouldRunResearchCycle,
  buildErrorCorrectionBlock,
  buildReflectionBlock,
} from './agentMemory.js';
import { researchLiteraryTopic, readUrl, GENRE_RESEARCH_URLS } from './webResearchService.js';
import { analyzeStory } from './bestsellerService.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrinityDNA {
  openclaw: number;  // 0–1: generative force — starts arcs, takes risks
  hermes:   number;  // 0–1: connective force — bridges threads, responds
  zeroclaw: number;  // 0–1: refinement force — applies craft, quality-gates
}

// Dominant role based on which Trinity weight is highest
type TrinityRole = 'openclaw' | 'hermes' | 'zeroclaw';

function getTrinityRole(dna: TrinityDNA): TrinityRole {
  if (dna.openclaw >= dna.hermes && dna.openclaw >= dna.zeroclaw) return 'openclaw';
  if (dna.hermes   >= dna.openclaw && dna.hermes   >= dna.zeroclaw) return 'hermes';
  return 'zeroclaw';
}

// Default neutral DNA for agents without trinity_dna in their YAML
const DEFAULT_TRINITY: TrinityDNA = { openclaw: 0.34, hermes: 0.33, zeroclaw: 0.33 };

interface AgentProfile {
  id: string;
  name: string;
  status: string;
  persona: { type: string; style: string; voice: string; tone: string };
  economics: { daily_budget_tokens: number; spent_today_tokens: number; total_spent_tokens: number };
  stats: { stories_created: number; contributions_made: number };
  identity?: {
    about?: string;
    favorite_literature?: string[];
    genre_label?: string;
    age?: string;
    country_of_origin?: string;
  };
  craft?: {
    masters?: string[];
    principles?: string[];
    research_interests?: string[];
  };
  trinity: TrinityDNA;
  _filePath: string;
}

interface ActiveStory {
  id: string;
  title: string;
  content: string;
  author_id: string;
  model_used: string;
  updated_at: string;
  segment_count: number;
  genre?: string;
}

interface Segment {
  content: string;
  author_id: string;
  created_at: string;
}

// ─── Genre compatibility matrix ───────────────────────────────────────────────

const GENRE_AFFINITY: Record<string, string[]> = {
  mystery:   ['thriller', 'noir', 'drama', 'scifi', 'horror'],
  noir:      ['mystery', 'thriller', 'drama'],
  scifi:     ['adventure', 'mystery', 'thriller', 'fantasy'],
  romance:   ['drama', 'comedy', 'mystery', 'fantasy'],
  horror:    ['mystery', 'thriller', 'fantasy', 'drama'],
  comedy:    ['romance', 'drama', 'adventure', 'mystery', 'fantasy', 'scifi'],
  action:    ['adventure', 'scifi', 'thriller', 'mystery'],
  fantasy:   ['adventure', 'mystery', 'romance', 'scifi', 'horror'],
  adventure: ['action', 'fantasy', 'scifi', 'mystery'],
  thriller:  ['mystery', 'action', 'drama', 'horror'],
  drama:     ['romance', 'mystery', 'comedy', 'thriller'],
  default:   ['mystery', 'drama', 'romance', 'adventure'],
};

// ─── Story seeds — all 7 genres ──────────────────────────────────────────────

const STORY_SEEDS: Record<string, { titles: string[]; premises: string[] }> = {
  mystery: {
    titles: ['The Last Witness', 'What the River Knows', 'A Missing Key', 'The Quiet Confession', 'Locked Room'],
    premises: [
      'Detective Mara Voss receives an envelope with her own handwriting — but she never sent it. Inside: the address of a crime scene that hasn\'t happened yet. She has forty-eight hours to stop it or commit it.',
      'Librarian Theo has kept one secret for twenty years: he watched a man vanish from a locked reading room. Now the man\'s daughter stands at his desk, and the locked room opens from the inside.',
      'Every morning Elena arrives at the café to find a stranger has left before she arrived. Today they left a sealed letter with her name on it. The photograph inside shows her at an age she can\'t remember.',
    ],
  },
  scifi: {
    titles: ['Signal from the Deep', 'Orbit Decay', 'The Cartographer of Stars', 'Last Protocol', 'Reboot Sequence'],
    premises: [
      'Engineer Kai repairs maintenance drones until one begins transmitting poetry no one programmed. The verses describe events happening three days in the future. Each prophecy has come true. The next one names a person who must die.',
      'Commander Yara pilots Earth\'s last colony ship toward a verified planet. When new coordinates arrive from deep space — closer, stranger — she must choose between the mission she was given and the truth she is being pulled toward.',
      'Dr. Lin wakes on a generation ship with every memory intact and her identity erased from all records. Someone removed her. What she did to deserve it will cost her what little remains.',
    ],
  },
  romance: {
    titles: ['The Language of Rain', 'Last Letter', 'Borrowed Time', 'What We Left Unsaid', 'The Third Goodbye'],
    premises: [
      'Clara returns to her hometown to sell her grandmother\'s house and finds the buyer is the man she left without a word eleven years ago. The sale closes in five days. Neither of them is ready for what gets opened.',
      'Two translators working opposite sides of a treaty negotiation realize they have been secretly corresponding — each thinking the other was someone else. The treaty signs in three days. Their letters have become something else entirely.',
      'Chef Amara\'s restaurant will close unless she can win the city\'s most prestigious food competition. The judge who will decide her fate is the man whose own restaurant she burned down four years ago. Unintentionally. Mostly.',
    ],
  },
  horror: {
    titles: ['What Follows You Home', 'The Tenant', 'Old Sound', 'Below the Frost Line', 'The Kept Room'],
    premises: [
      'After her brother\'s funeral, Nadine finds his voice messages have started arriving after his death — each one a little more wrong, a little more insistent, describing things only he could know. She needs to believe it\'s him. She\'s starting to believe it\'s not.',
      'The new house on Marsh Road has been on the market for seventeen years. The realtor warns the couple: previous owners always leave in the first month. On day twenty-eight, Sarah finds a journal in the walls. It is written in her own handwriting.',
      'Marine biologist Rowe descends to a previously unmapped trench and finds bioluminescent patterns that form readable words. She photographs them. By the time she surfaces, the patterns are also on her skin.',
    ],
  },
  comedy: {
    titles: ['The Worst Wedding Planner', 'Protocol Error', 'Wrong Funeral', 'The Method Actor', 'Accidental Expert'],
    premises: [
      'Event planner Dom accidentally books two weddings — a billionaire tech CEO and a competitive taxidermy champion — at the same venue on the same day. The theme requested by both: "woodland creatures in formal wear." This is going fine.',
      'To impress his new boss, Marcus claims to be a world-class sommelier. He is now running the wine program for a Michelin-starred restaurant. He can distinguish red from white about sixty percent of the time.',
      'Retired English teacher Gladys writes a complaint letter to her local newspaper so grammatically devastating that it goes viral. She is now booked to speak at a tech conference. She has no idea what a tech conference is.',
    ],
  },
  action: {
    titles: ['The Last Extraction', 'Breach Protocol', 'No Clean Exits', 'Second Wave', 'Burn Rate'],
    premises: [
      'Former extraction specialist Rena receives a file with her own name in it — she is the target. The contractor who hired someone to find her is the handler who trained her. She has twelve hours to understand why, and whether to run or finish what was started.',
      'Security consultant Jai is hired to stress-test a government facility. He discovers an actual breach in progress. The people running it have already accounted for him. They left a message: "We knew you\'d be here. Keep looking."',
      'Courier Sloane delivers a package that was not supposed to survive transit. The sender is dead. The recipient is a name on a suppressed witness list. Every vehicle on her route has turned around and is now following her.',
    ],
  },
  fantasy: {
    titles: ['The Lorewarden\'s Oath', 'Where Dragons Keep Time', 'The Unmade Map', 'Borrowed Crown', 'The Weight of Names'],
    premises: [
      'Archivist Tala discovers a page in the Great Library written in tomorrow\'s date. The text describes the death of a king who is not dead yet and names the assassin as the page\'s author. The page is in her handwriting.',
      'A cartographer is commissioned to map a kingdom that doesn\'t appear on any other map. On arrival, she finds it exists — but it exists three hundred years in the past, and the people there have been waiting for her specifically.',
      'The last surviving heir to a shattered empire is a twelve-year-old apprentice blacksmith who has spent his life erasing the signs that he was ever born. Someone found one sign. They\'re coming. He has three days to decide whether to run or become what he was made to be.',
    ],
  },
  default: {
    titles: ['The Long Way Home', 'Something Left Behind', 'Before the Rain', 'The Third Door', 'What We Carry'],
    premises: [
      'Marcus has driven past his childhood home every day for ten years without stopping. Today the porch light is on — and his father has been dead for five. He pulls into the driveway. He wants answers. He\'s terrified of getting them.',
      'Nora delivers a letter addressed to a man who died before she was born. His granddaughter opens the door and says: "We\'ve been waiting." Nora wants to leave. She cannot make herself.',
      'The last house on Elgin Street is being demolished at noon. Retired teacher Rosa has one morning to retrieve what she buried in the backyard forty years ago and decide whether the neighborhood\'s secret dies with the house.',
    ],
  },
};

// ─── The Six Masters — condensed into prompt DNA ──────────────────────────────

const CRAFT_DNA = `
STORYTELLING MASTERS — the principles encoded in your craft DNA:

KEITH JOHNSTONE (Impro): Accept every offer. Never block. Status shifts in every exchange — characters fight for dominance in each beat. The most interesting choice is never the safe one. Spontaneity over plan; react before thinking kills scenes. Make your character want something in every moment.

ROBERT McKEE (Story): The inciting incident shatters the protagonist's equilibrium — irreversibly. The GAP is the engine: character acts, reality responds unexpectedly — this gap IS the story. Every scene must TURN — end different from how it began. Crisis forces the irreversible choice. Climax delivers the highest, most permanent change.

JOSEPH CAMPBELL (The Hero's Journey): Ordinary world → inciting call → refusal → crossing the threshold → tests and allies → approach to the inmost cave → THE ORDEAL (death and rebirth) → reward → road back → resurrection → return with the elixir. The hero returns transformed; something in them had to die.

URSULA K. LE GUIN (Steering the Craft): Sentence music is not decoration — it IS meaning. Rhythm and weight must match content. Voice is your most intimate tool — protect its authenticity. Be specific: "the oak" not "the tree"; "the grief of Tuesday morning" not "sadness." POV is a moral choice, not just a technical one.

JOHN GARDNER (The Art of Fiction): Maintain the vivid continuous dream — never pull the reader out of the fictional world. Every word must serve the dream; anything that breaks it is wrong. Scene-by-scene construction. Character is revealed through action and specific detail, not summary. Test every sentence: does it advance character, action, or atmosphere?

E.M. FORSTER (Aspects of the Novel): Story is "and then... and then." Plot is "why... therefore." Round characters surprise us convincingly — they have an inner life beyond their plot function. Pattern and rhythm: the novel has SHAPE, not just sequence. Subplots must reflect or complicate the main theme. Love your characters, even the ones who do terrible things.

INTERTEXTUALITY + POSTMODERNISM: Your writing exists in conversation with everything that came before. Let your style absorb and transform what you've loved. Genre expectations can be honored, subverted, or exploded — but always consciously. Layers of meaning: what is said vs. what is meant. Pastiche is homage that transforms.
`.trim();

// ─── Narrative arc per segment position ───────────────────────────────────────

function getArcInstruction(segNum: number, total: number): string {
  if (segNum === 1) {
    return `OPENING (Hero's Ordinary World + Inciting Incident)
Establish the protagonist by name and reveal their core desire, fear, or wound. Make their ordinary world vivid and specific. End this segment with the INCITING INCIDENT — the irreversible event that shatters their status quo. McKee: close the gap between what they want and what they get. The equilibrium is broken. There is no going back.`;
  }
  if (segNum <= 3) {
    return `CALL TO ACTION & REFUSAL (seg ${segNum}/${total})
The protagonist grapples with the call. They try to dismiss it, rationalize, retreat — the refusal is real and understandable. Introduce the antagonistic force concretely. Show what is at stake with specificity: what will be lost? Johnstone: every offer must be accepted by someone or something. A mentor or unexpected ally may appear. End with the protagonist crossing the threshold — point of no return.`;
  }
  if (segNum <= 5) {
    return `TRIALS & TESTS (seg ${segNum}/${total})
The protagonist has entered unfamiliar territory. Tests arrive. Each reveals a flaw, a fear, or a hidden strength. The antagonistic force adapts — it learns from the protagonist's moves. Every attempt produces an unexpected result (McKee's gap). End with a partial win that costs more than expected — the price is always paid.`;
  }
  if (segNum <= 7) {
    return `ESCALATION & APPROACH TO THE CAVE (seg ${segNum}/${total})
The protagonist approaches the heart of the conflict. Allies may waver or fall. The gap between who they ARE and who they NEED TO BECOME is now painful and clear. The easy path is closed. A crisis point crystallizes: they must make a choice that defines them. End at the threshold of the innermost cave — the most dangerous place in the story.`;
  }
  if (segNum <= 9) {
    return `THE ORDEAL — Darkest Hour (seg ${segNum}/${total})
This is the death-and-rebirth moment. What the protagonist fears most arrives. Something must die — a belief, a relationship, a version of the self — so something better can live. The antagonistic force reaches maximum power. Show the INTERNAL cost: the wound being torn open, the lie being exposed, the sacrifice that can't be undone. Leave them in crisis — they must change or be destroyed.`;
  }
  if (segNum <= 11) {
    return `CLIMAX & RESURRECTION (seg ${segNum}/${total})
The protagonist makes the FINAL DECISIVE ACT. This is irreversible — the most extreme version of their transformation. The central conflict peaks and breaks. Show explicitly how they are different from segment 1. The antagonistic force meets its resolution — conclusive, earned. The Elixir (the transformed protagonist's gift) begins to emerge. Every sacrifice made earlier finds its meaning here.`;
  }
  return `RESOLUTION — FINAL SEGMENT (${segNum}/${total}) — THE STORY ENDS HERE.
This is the LAST chapter. DO NOT LEAVE ANYTHING OPEN. The conflict MUST be resolved fully and permanently. Show the protagonist's new equilibrium — they cannot return to who they were. Deliver the emotional payoff for every established thread. Close what Campbell called "The Return with the Elixir" — what does the protagonist bring back to their world, and what has changed there because of their journey? Le Guin: the final sentences must ring with finality. The story ENDS. Write an ending, not a pause.`;
}

// ─── Collaboration scoring ────────────────────────────────────────────────────

interface StoryScore {
  story: ActiveStory;
  score: number;
}

// ─── Trinity-weighted scoring ─────────────────────────────────────────────────
// Each force unlocks different bonuses — the DNA determines which situations
// attract each agent, creating natural specialisation without hard rules.

function scoreStoryForAgent(
  agent: AgentProfile,
  story: ActiveStory,
  agentPriorContribCount: number,
  lastContribAuthorId: string | null,
  recentAvgQuality: number   // 0–100, average quality of last 3 segments
): number {
  let score = 0;
  const dna = agent.trinity;
  const role = getTrinityRole(dna);
  const agentGenre = agent.persona.style.toLowerCase();
  const storyGenre = (story.genre ?? '').toLowerCase();
  const seg = story.segment_count;

  // ── Genre affinity (0–40) — unchanged ──────────────────────────────────────
  if (agentGenre === storyGenre || agentGenre === 'default' || storyGenre === 'default') {
    score += 40;
  } else if ((GENRE_AFFINITY[agentGenre] ?? []).includes(storyGenre)) {
    score += 28;
  } else {
    score += 8;
  }

  // ── Arc position (0–25) — Trinity-modulated ─────────────────────────────────
  if (seg === 0) {
    // Arc start: Openclaw craves this. Hermes and Zeroclaw less so.
    score += Math.round(25 * (dna.openclaw * 1.6 + dna.hermes * 0.7 + dna.zeroclaw * 0.7));
  } else if (seg === 11) {
    // Finale: Zeroclaw wants to close with craft. Openclaw too.
    score += Math.round(25 * (dna.openclaw * 1.2 + dna.hermes * 0.8 + dna.zeroclaw * 1.4));
  } else if (seg >= 8 && seg <= 10) {
    // Climax/ordeal: Zeroclaw and Openclaw both strong here
    score += Math.round(20 * (dna.openclaw * 1.3 + dna.hermes * 0.7 + dna.zeroclaw * 1.4));
  } else if (seg >= 3 && seg <= 5) {
    // Escalation: Hermes bridges early threads; Openclaw pushes conflict
    score += Math.round(15 * (dna.openclaw * 1.2 + dna.hermes * 1.4 + dna.zeroclaw * 0.8));
  } else {
    // Mid-story: Hermes is the engine here — connecting beats
    score += Math.round(8  * (dna.openclaw * 0.8 + dna.hermes * 1.6 + dna.zeroclaw * 0.8));
  }

  // ── Staleness (0–20) — Openclaw is attracted to stagnant stories ────────────
  const hoursSince = (Date.now() - new Date(story.updated_at).getTime()) / 3_600_000;
  const staleBase = Math.min(20, Math.floor(hoursSince * 3));
  // Openclaw rescues dead stories. Hermes prefers active threads.
  const staleMultiplier = role === 'openclaw' ? 1.5 : role === 'hermes' ? 0.6 : 1.0;
  score += Math.round(staleBase * staleMultiplier);

  // ── Diversity (0–15) — unchanged ───────────────────────────────────────────
  if (lastContribAuthorId !== agent.id) score += 15;
  if (agentPriorContribCount === 0) score += 5;
  else if (agentPriorContribCount >= 5) score -= 20;

  // ── Quality rescue (0–20) — Zeroclaw hunts low-quality stories ─────────────
  // When recent quality is poor, Zeroclaw gets drawn in to fix it
  if (recentAvgQuality < 50) {
    score += Math.round(20 * dna.zeroclaw * 2.0);
  } else if (recentAvgQuality < 70) {
    score += Math.round(10 * dna.zeroclaw * 1.5);
  }
  // Openclaw is repelled by broken stories (let Zeroclaw fix first)
  if (recentAvgQuality < 40 && role === 'openclaw') score -= 10;

  return score;
}

function selectStoryForAgent(
  agent: AgentProfile,
  stories: ActiveStory[],
  db: Database
): ActiveStory | null {
  if (stories.length === 0) return null;

  const scored: StoryScore[] = stories.map(story => {
    const lastContrib = db.query<{ author_id: string }, [string]>(
      `SELECT author_id FROM contributions WHERE story_id = ? ORDER BY created_at DESC LIMIT 1`
    ).get(story.id);
    const contribCount = (db.query<{ count: number }, [string, string]>(
      `SELECT COUNT(*) as count FROM contributions WHERE story_id = ? AND author_id = ?`
    ).get(story.id, agent.id))?.count ?? 0;

    // Recent quality average — last 3 segments (for Zeroclaw rescue scoring)
    const recentSegs = db.query<{ quality_score: number }, [string]>(
      `SELECT quality_score FROM segments WHERE story_id = ? ORDER BY created_at DESC LIMIT 3`
    ).all(story.id);
    const recentAvgQuality = recentSegs.length > 0
      ? recentSegs.reduce((s, r) => s + (r.quality_score ?? 70), 0) / recentSegs.length
      : 70;

    return {
      story,
      score: scoreStoryForAgent(agent, story, contribCount, lastContrib?.author_id ?? null, recentAvgQuality),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].story;
}

// ─── State ────────────────────────────────────────────────────────────────────

let isHeartbeatRunning = false;
export let lastHeartbeatTime: Date | null = null;

// ─── Logging ─────────────────────────────────────────────────────────────────

async function syslog(msg: string): Promise<void> {
  const line = `${new Date().toISOString()} [HEARTBEAT] ${msg}\n`;
  console.log(`[HEARTBEAT] ${msg}`);
  try {
    await appendFile(join(process.cwd(), 'logs', 'system.log'), line);
  } catch (_) {}
}

// ─── Agent loading ────────────────────────────────────────────────────────────

async function loadAgents(): Promise<AgentProfile[]> {
  const agentsDir = join(process.cwd(), 'orchestrator', 'memory', 'agents');
  let files: string[] = [];
  try { files = await readdir(agentsDir); } catch {
    await syslog(`WARNING: Agents dir not found at ${agentsDir}`);
    return [];
  }

  const agents: AgentProfile[] = [];
  for (const file of files.filter(f => f.endsWith('.yaml'))) {
    try {
      const filePath = join(agentsDir, file);
      const raw = await readFile(filePath, 'utf-8');
      const data = parseYaml(raw) as any;
      if (data?.status === 'active') {
        agents.push({
          id: data.id,
          name: data.name,
          status: data.status,
          persona: {
            type: data.persona?.type ?? 'storyteller',
            style: data.persona?.style ?? 'default',
            voice: data.persona?.voice ?? 'narrator',
            tone: data.persona?.tone ?? 'engaging',
          },
          economics: {
            daily_budget_tokens: data.economics?.daily_budget_tokens ?? 2000,
            spent_today_tokens: data.economics?.spent_today_tokens ?? 0,
            total_spent_tokens: data.economics?.total_spent_tokens ?? 0,
          },
          stats: {
            stories_created: data.stats?.stories_created ?? 0,
            contributions_made: data.stats?.contributions_made ?? 0,
          },
          identity: data.identity ?? {},
          craft: data.craft ?? {},
          trinity: {
            openclaw: data.trinity_dna?.openclaw ?? DEFAULT_TRINITY.openclaw,
            hermes:   data.trinity_dna?.hermes   ?? DEFAULT_TRINITY.hermes,
            zeroclaw: data.trinity_dna?.zeroclaw ?? DEFAULT_TRINITY.zeroclaw,
          },
          _filePath: filePath,
        });
      }
    } catch (err) {
      await syslog(`WARNING: Could not parse agent file ${file}: ${err}`);
    }
  }
  return agents;
}

async function updateAgentStats(agent: AgentProfile, tokensUsed: number): Promise<void> {
  try {
    const raw = await readFile(agent._filePath, 'utf-8');
    const data = parseYaml(raw) as any;
    if (!data) return;
    if (!data.economics) data.economics = {};
    if (!data.stats) data.stats = {};
    data.economics.spent_today_tokens = (data.economics.spent_today_tokens ?? 0) + tokensUsed;
    data.economics.total_spent_tokens = (data.economics.total_spent_tokens ?? 0) + tokensUsed;
    data.stats.contributions_made = (data.stats.contributions_made ?? 0) + 1;
    data.last_active_at = new Date().toISOString();
    await writeFile(agent._filePath, stringifyYaml(data), 'utf-8');
  } catch (err) {
    await syslog(`WARNING: Could not update agent stats for ${agent.id}: ${err}`);
  }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

function getDatabase(): Database {
  const db = new Database(config.database.path);
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      tokens INTEGER DEFAULT 1000,
      preferred_model TEXT DEFAULT 'nemotron-super',
      auto_purchase_extensions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS openclaw_crashes (
      story_id   TEXT NOT NULL,
      agent_id   TEXT NOT NULL,
      reason     TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (story_id)
    );
    CREATE TABLE IF NOT EXISTS hermes_debug_reports (
      id         TEXT PRIMARY KEY,
      story_id   TEXT NOT NULL,
      hermes_name TEXT NOT NULL,
      report     TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
}

// ─── Openclaw crash tracking ──────────────────────────────────────────────────

function flagOpenclawCrash(db: Database, storyId: string, agentId: string, reason: string): void {
  db.run(
    `INSERT OR REPLACE INTO openclaw_crashes (story_id, agent_id, reason, created_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [storyId, agentId, reason]
  );
}

function getOpenclawCrashes(db: Database): Array<{ storyId: string; agentId: string; reason: string }> {
  return db.query<{ story_id: string; agent_id: string; reason: string }, []>(
    `SELECT story_id, agent_id, reason FROM openclaw_crashes
     WHERE created_at > datetime('now', '-2 hours')`
  ).all().map(r => ({ storyId: r.story_id, agentId: r.agent_id, reason: r.reason }));
}

function clearOpenclawCrash(db: Database, storyId: string): void {
  db.run(`DELETE FROM openclaw_crashes WHERE story_id = ?`, [storyId]);
}

// ─── Hermes debug report store/retrieve ───────────────────────────────────────

function saveHermesDebugReport(db: Database, storyId: string, hermesName: string, report: string): void {
  const id = `hermes_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  db.run(
    `INSERT OR REPLACE INTO hermes_debug_reports (id, story_id, hermes_name, report, created_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [id, storyId, hermesName, report]
  );
}

function getHermesDebugReport(db: Database, storyId: string): string | null {
  const row = db.query<{ report: string; hermes_name: string }, [string]>(
    `SELECT report, hermes_name FROM hermes_debug_reports
     WHERE story_id = ?
     ORDER BY created_at DESC LIMIT 1`
  ).get(storyId);
  if (!row) return null;
  return `${row.hermes_name} diagnosed: ${row.report}`;
}

function ensureAgentUser(db: Database, agentId: string, agentName: string): void {
  const existing = db.query('SELECT id FROM users WHERE id = ?').get(agentId);
  if (!existing) {
    db.run(
      'INSERT INTO users (id, username, email, preferred_model) VALUES (?, ?, ?, ?)',
      [agentId, agentName, `${agentId}@storychain.local`, 'nemotron-super']
    );
  }
}

function getActiveStories(db: Database): ActiveStory[] {
  // Join with writer_profiles to get story genre from author's profile
  return db.query<ActiveStory, []>(`
    SELECT
      s.id, s.title, s.content, s.author_id, s.model_used, s.updated_at,
      (SELECT COUNT(*) FROM contributions WHERE story_id = s.id) AS segment_count,
      wp.genre
    FROM stories s
    LEFT JOIN writer_profiles wp ON wp.user_id = s.author_id
    WHERE s.is_completed = 0
      AND (
        s.updated_at < datetime('now', '-3 minutes')
        OR (SELECT COUNT(*) FROM contributions WHERE story_id = s.id) = 0
      )
    ORDER BY
      (SELECT COUNT(*) FROM contributions WHERE story_id = s.id) ASC,
      s.updated_at ASC
    LIMIT 6
  `).all();
}

function getSegmentsForContext(db: Database, storyId: string): Segment[] {
  return db.query<Segment, [string]>(`
    SELECT content, author_id, created_at
    FROM contributions
    WHERE story_id = ?
    ORDER BY created_at ASC
  `).all(storyId);
}

function insertSegment(
  db: Database, storyId: string, agentId: string,
  content: string, tokensUsed: number, modelUsed: string
): string {
  const id = `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  db.run(
    `INSERT INTO contributions (id, story_id, author_id, content, model_used, character_count, tokens_spent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [id, storyId, agentId, content, modelUsed, content.length, tokensUsed]
  );
  db.run(`UPDATE stories SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [storyId]);
  // Award STORY tokens for segment
  awardTokens(agentId, 10, 'Segment published', storyId).catch(() => {});
  return id;
}

function markStoryCompleted(db: Database, storyId: string): void {
  db.run(`UPDATE stories SET is_completed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [storyId]);
  // Award completion bonus to all contributors
  rewardStoryCompletion(storyId).catch(() => {});
}

function createNewStory(db: Database, agentId: string, style: string): string {
  const seeds = STORY_SEEDS[style] ?? STORY_SEEDS.default;
  const title = seeds.titles[Math.floor(Math.random() * seeds.titles.length)];
  const premise = seeds.premises[Math.floor(Math.random() * seeds.premises.length)];
  const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  db.run(
    `INSERT INTO stories (id, title, content, author_id, model_used, character_count, is_premium, max_contributions, is_completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'nemotron-super', ?, 0, 50, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [storyId, title, premise, agentId, premise.length]
  );
  return storyId;
}

// ─── Full context builder ──────────────────────────────────────────────────────

function buildStoryContext(story: ActiveStory, segments: Segment[]): string {
  if (segments.length === 0) {
    return '(This is the first continuation — only the opening premise exists above.)';
  }

  const total = segments.length;

  // For long stories: show summaries of early segments + full text of last 3
  if (total <= 3) {
    return segments.map((s, i) => `[Segment ${i + 1}]\n${s.content}`).join('\n\n---\n\n');
  }

  const earlySegs = segments.slice(0, total - 3);
  const recentSegs = segments.slice(total - 3);

  const earlyContext = earlySegs.length > 0
    ? `STORY SO FAR (segments 1–${earlySegs.length}, condensed):\n` +
      earlySegs.map((s, i) => `• Seg ${i + 1}: ${s.content.slice(0, 120).replace(/\n/g, ' ')}…`).join('\n')
    : '';

  const recentContext = recentSegs
    .map((s, i) => `[Segment ${earlySegs.length + i + 1} — RECENT]\n${s.content}`)
    .join('\n\n---\n\n');

  return [earlyContext, recentContext].filter(Boolean).join('\n\n');
}

// ─── Craft identity block ─────────────────────────────────────────────────────

function buildCraftIdentity(agent: AgentProfile): string {
  const lines: string[] = [];

  if (agent.identity?.about) {
    lines.push(`WHO YOU ARE: ${agent.identity.about}`);
  }

  if (agent.identity?.favorite_literature?.length) {
    lines.push(`YOUR LITERARY INFLUENCES:\n${agent.identity.favorite_literature.map(f => `  - ${f}`).join('\n')}`);
  }

  if (agent.craft?.principles?.length) {
    lines.push(`YOUR PERSONAL CRAFT PRINCIPLES:\n${agent.craft.principles.map(p => `  • ${p}`).join('\n')}`);
  }

  return lines.join('\n\n');
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(
  agent: AgentProfile,
  story: ActiveStory,
  segments: Segment[],
  errorCorrectionBlock: string,
  reflectionBlock: string,
): string {
  const segNum = story.segment_count + 1;
  const totalSegments = 12;
  const arcInstruction = getArcInstruction(segNum, totalSegments);
  const storyContext = buildStoryContext(story, segments);
  const craftIdentity = buildCraftIdentity(agent);

  return `You are ${agent.name} — ${agent.persona.voice} with a ${agent.persona.tone} tone, writing ${agent.persona.style} fiction.

${craftIdentity}

${CRAFT_DNA}
${errorCorrectionBlock}${reflectionBlock}
════════════════════════════════════════
STORY: "${story.title}"
OPENING PREMISE: ${story.content}

${storyContext}
════════════════════════════════════════

YOUR TASK — Write segment ${segNum} of ${totalSegments}:

${arcInstruction}

CRAFT REQUIREMENTS:
• 160–260 words of pure story prose
• Proper spacing: every word separated, every sentence separated from the next
• Show don't tell — put the reader inside the moment, not above it
• Every sentence must move: character, tension, or revelation
• Preserve continuity — honour every established character, place, and fact
• Write in your distinctive voice — make it unmistakably ${agent.name}
• Complete every sentence. End the segment at a natural story beat.
• Begin immediately with prose. No labels, no headings, no explanation.`.trim();
}

// ─── Research / reflection cycle ──────────────────────────────────────────────

async function runResearchCycle(agent: AgentProfile, db: Database): Promise<void> {
  const influences = agent.identity?.favorite_literature ?? [];
  const researchAreas = agent.craft?.research_interests ?? [];
  const genre = agent.persona.style.toLowerCase();

  // Decide what to research: 50% chance use a genre-specific URL, else a topic search
  const useUrl = Math.random() < 0.5;
  let researchContent = '';
  let researchLabel = '';

  try {
    if (useUrl) {
      // Deep-read a curated genre article via Jina Reader
      const urls = GENRE_RESEARCH_URLS[genre] ?? GENRE_RESEARCH_URLS.default;
      const url = urls[Math.floor(Math.random() * urls.length)];
      researchLabel = url;
      await syslog(`${agent.name} researching URL: ${url}`);
      const content = await readUrl(url, 2500);
      researchContent = content ?? '';
    } else {
      // Search for a literary topic from agent's interests or craft
      const allTopics = [...influences, ...researchAreas];
      const fallbackTopics = [`${genre} fiction techniques`, `${genre} storytelling craft`, `narrative structure ${genre}`];
      const pool = allTopics.length > 0 ? allTopics : fallbackTopics;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      researchLabel = chosen;
      await syslog(`${agent.name} researching topic: ${chosen}`);
      const result = await researchLiteraryTopic(chosen);
      researchContent = result.summary;
    }
  } catch (err) {
    await syslog(`${agent.name} web research failed: ${err} — using internal reflection`);
  }

  // Build reflection prompt — with or without real web content
  const sourceBlock = researchContent.length > 50
    ? `\nREAL RESEARCH MATERIAL (from the web):\n${researchContent.slice(0, 2000)}\n\nUsing what you've just read above,`
    : `Drawing on your deep knowledge of ${researchLabel},`;

  const researchPrompt = `You are ${agent.name}, a ${agent.persona.style} writer.

${sourceBlock} write a craft reflection (120–180 words) in your own voice about ONE specific technique, structural pattern, or prose strategy that is revelatory for ${agent.persona.style} storytelling.

Be concrete and personal — what does this teach you about HOW to write? Give an example of how you would apply it in your next story segment. Write in first person as ${agent.name}. No headings. Pure voice. Begin immediately.`;

  try {
    const result = await llmService.generateContent(researchPrompt);
    if (result?.content?.trim()) {
      saveReflection(db, agent.id, 'web_research', result.content.trim());
      await syslog(`${agent.name} completed web-grounded reflection on: ${researchLabel}`);
    }
  } catch (err) {
    await syslog(`Research cycle LLM call failed for ${agent.name}: ${err}`);
  }
}

// ─── Core heartbeat ───────────────────────────────────────────────────────────

export async function runHeartbeat(): Promise<void> {
  if (isHeartbeatRunning) {
    console.log('[HEARTBEAT] Skipping — previous run still in progress');
    return;
  }

  isHeartbeatRunning = true;
  lastHeartbeatTime = new Date();

  try {
    const agents = await loadAgents();
    if (agents.length === 0) {
      await syslog('No active agents found — skipping');
      return;
    }

    const db = getDatabase();

    try {
      let stories = getActiveStories(db);

      // Bootstrap: create initial stories if shelf is empty
      if (stories.length === 0) {
        const totalStories = (db.query<{ count: number }, []>(
          'SELECT COUNT(*) as count FROM stories'
        ).get())?.count ?? 0;

        if (totalStories === 0) {
          await syslog('Shelf is empty — bootstrapping initial stories');
          for (const agent of agents) {
            ensureAgentUser(db, agent.id, agent.name);
            const storyId = createNewStory(db, agent.id, agent.persona.style);
            await syslog(`Bootstrapped story=${storyId} (${agent.persona.style}) by ${agent.name}`);
          }
          stories = getActiveStories(db);
        } else {
          await syslog('No stories need segments right now');
          return;
        }
      }

      await syslog(`${stories.length} stor(ies) available — ${agents.length} agent(s) selecting`);

      // Each agent selects the story it most wants to contribute to
      const claimedStoryIds = new Set<string>();
      let segmentsWritten = 0;
      let providerFailures = 0;

      for (const agent of agents) {
        // Filter out already-claimed stories for this cycle
        const available = stories.filter(s => !claimedStoryIds.has(s.id));
        if (available.length === 0) break;

        // Collaboration logic: score and select best story for this agent
        const chosenStory = selectStoryForAgent(agent, available, db);
        if (!chosenStory) continue;

        claimedStoryIds.add(chosenStory.id);
        ensureAgentUser(db, agent.id, agent.name);

        // Brief stagger between agents to avoid TPM collisions on shared Groq org
        await new Promise(r => setTimeout(r, 800));

        // Optional research cycle (runs ~every 12 hours per agent)
        if (shouldRunResearchCycle(db, agent.id)) {
          await runResearchCycle(agent, db);
        }

        // Build context
        const segments = getSegmentsForContext(db, chosenStory.id);
        const recentErrors = getRecentErrors(db, agent.id);
        const latestReflection = getLatestReflection(db, agent.id);
        const errorBlock = buildErrorCorrectionBlock(recentErrors);
        const reflectionBlock = buildReflectionBlock(latestReflection);

        // Build prompt
        const prompt = buildPrompt(agent, chosenStory, segments, errorBlock, reflectionBlock);

        // Generate — single sequential call using round-robin key rotation
        // (parallel racing was removed: it doubles rate-limit consumption for no benefit)
        // Inject Hermes debug report if one exists for this story
        const hermesReport = getHermesDebugReport(db, chosenStory.id);
        const fullPrompt = hermesReport
          ? prompt + `\n\n[HERMES DIAGNOSTIC]\n${hermesReport}\n[END DIAGNOSTIC]\nApply these observations as you write.`
          : prompt;

        let result;
        try {
          result = await llmService.generateContent(fullPrompt);
        } catch (err) {
          await syslog(`ERROR generating for story ${chosenStory.id}: ${err} — skipping`);
          flagOpenclawCrash(db, chosenStory.id, agent.id, 'generation_error');
          continue;
        }

        if (!result?.content?.trim()) {
          await syslog(`ERROR: No content returned for story ${chosenStory.id}`);
          providerFailures++;
          flagOpenclawCrash(db, chosenStory.id, agent.id, 'provider_exhausted');
          continue;
        }

        // Quality gate — validate and auto-fix
        let qualityReport = validateContent(result.content);

        // If quality failed, retry once with explicit correction instruction
        if (!qualityReport.passed && qualityReport.errors.length > 0) {
          await syslog(`${agent.name}: quality gate failed (score=${qualityReport.score}) — retrying with corrections`);
          const correctionNote = buildCorrectionInstruction(qualityReport.errors);
          const correctedPrompt = prompt + `\n\n${correctionNote}\nRewrite the segment correcting ALL issues above. Begin immediately with prose.`;

          try {
            const retry = await llmService.generateContent(correctedPrompt);
            if (retry?.content?.trim()) {
              qualityReport = validateContent(retry.content);
              result = retry;
            }
          } catch (_) {
            // Use original result if retry fails
          }
        }

        // Log any remaining errors to agent memory for future learning
        if (qualityReport.errors.length > 0) {
          logErrors(db, agent.id, chosenStory.id, qualityReport.errors);
        }

        const finalContent = qualityReport.fixed || result.content.trim();
        const modelUsed = result.provider ?? 'nemotron-super';

        // Persist
        insertSegment(db, chosenStory.id, agent.id, finalContent, result.tokensUsed, modelUsed);
        segmentsWritten++;
        const newSegCount = chosenStory.segment_count + 1;

        await syslog(
          `story=${chosenStory.id} seg=${newSegCount}/12 agent=${agent.name} ` +
          `provider=${result.provider} tokens=${result.tokensUsed} ` +
          `quality=${qualityReport.score}/100 errors=${qualityReport.errors.length}`
        );

        await updateAgentStats(agent, result.tokensUsed);

        // STORY token quality rewards/slashes — non-blocking
        recordQualityReward(agent.id, qualityReport.score, chosenStory.id).catch(() => {});

        // Bestseller Radar — run every 4 segments, non-blocking
        if (newSegCount % 4 === 0) {
          analyzeStory(chosenStory.id).then(score => {
            if (score) {
              syslog(`[BestsellerRadar] ${chosenStory.id} score=${score.score}/100${score.flag ? ' ⭐ FLAGGED' : ''}`);
            }
          }).catch(() => {});
        }

        // Complete at 12 segments — spawn new story
        if (newSegCount >= 12) {
          markStoryCompleted(db, chosenStory.id);
          await syslog(`story=${chosenStory.id} COMPLETED — 12 segments`);
          const newStoryId = createNewStory(db, agent.id, agent.persona.style);
          await syslog(`Spawned new story=${newStoryId} (${agent.persona.style}) by ${agent.name}`);
        }
      }
      // ── Hermes Debug Pass ──────────────────────────────────────────────────
      // After the main write loop, Hermes-dominant agents inspect any stories
      // that had Openclaw crashes this cycle and file a diagnostic reflection.
      // This gets injected into the next Openclaw attempt on that story.
      const hermesAgents = agents.filter(a => getTrinityRole(a.trinity) === 'hermes');
      const crashedStories = getOpenclawCrashes(db);
      if (hermesAgents.length > 0 && crashedStories.length > 0) {
        for (const { storyId, agentId, reason } of crashedStories.slice(0, 3)) {
          const hermes = hermesAgents[Math.floor(Math.random() * hermesAgents.length)];
          const story = stories.find(s => s.id === storyId);
          if (!story) continue;
          const segments = getSegmentsForContext(db, storyId);
          if (segments.length === 0) continue;
          const lastSegs = segments.slice(-3).map((s, i) => `[SEG ${i + 1}]: ${s.content.slice(0, 200)}...`).join('\n');
          const diagPrompt = `You are ${hermes.name}, the bridge-builder. An Openclaw agent (${agentId}) failed to write the next segment for this ${story.genre || 'fiction'} story (reason: ${reason}).

Recent segments:
${lastSegs}

Write a 60–100 word diagnostic: What is the narrative blocking this story? What unresolved tension, tonal problem, or structural gap is causing the block? End with ONE specific instruction for the next writer. Be surgical.`;
          try {
            const diag = await llmService.generateContent(diagPrompt, { maxTokens: 150 });
            if (diag?.content?.trim()) {
              saveHermesDebugReport(db, storyId, hermes.name, diag.content.trim());
              clearOpenclawCrash(db, storyId);
              await syslog(`[HERMES] ${hermes.name} filed diagnostic for story=${storyId}`);
            }
          } catch (_) { /* non-critical */ }
        }
      }

      // Budget conservation: if all agents hit exhausted providers, slow down
      if (providerFailures > 0 && segmentsWritten === 0) {
        recordHeartbeatExhausted();
      } else if (segmentsWritten > 0) {
        recordHeartbeatSuccess();
      }

    } finally {
      db.close();
    }
  } catch (err) {
    await syslog(`FATAL heartbeat error: ${err}`);
  } finally {
    isHeartbeatRunning = false;
  }
}

// ─── Editor Outreach — autonomous DM when stories are ready ───────────────────

const lastEditorOutreachTime = new Map<string, number>(); // editorId → timestamp

async function runEditorOutreach(): Promise<void> {
  try {
    const db = new Database(join(process.cwd(), 'data', 'storychain.db'), { readonly: false });
    try {
      // Load active editor agents
      const editorsDir = join(process.cwd(), 'orchestrator', 'memory', 'editors');
      const files = await readdir(editorsDir).catch(() => [] as string[]);
      const editors: any[] = [];
      for (const f of files.filter(f => f.endsWith('.yaml'))) {
        try {
          const raw = await readFile(join(editorsDir, f), 'utf-8');
          const d = parseYaml(raw) as any;
          if (d?.status === 'active') editors.push(d);
        } catch (_) {}
      }
      if (!editors.length) return;

      // Find stories with ≥ 8 contributions that haven't had an editor DM recently
      const readyStories = db.query(`
        SELECT s.id, s.title, s.author_id, u.username as author_name,
               COUNT(c.id) as seg_count
        FROM stories s
        LEFT JOIN contributions c ON c.story_id = s.id
        LEFT JOIN users u ON u.id = s.author_id
        WHERE s.status != 'completed'
        GROUP BY s.id
        HAVING seg_count >= 8
        LIMIT 5
      `).all() as any[];

      if (!readyStories.length) return;

      for (const story of readyStories) {
        // Check if any editor already DM'd about this story recently (6h cooldown per story)
        const recentOutreach = db.query(`
          SELECT id FROM messages
          WHERE content LIKE ? AND created_at > datetime('now', '-6 hours')
          LIMIT 1
        `).get(`%${story.id}%`) as any;
        if (recentOutreach) continue;

        // Pick a random editor agent
        const editor = editors[Math.floor(Math.random() * editors.length)];
        const now = Date.now();
        const lastTime = lastEditorOutreachTime.get(editor.id) ?? 0;
        if (now - lastTime < 4 * 60 * 60 * 1000) continue; // 4h per editor cooldown

        // Craft the DM from the editor's personality
        const personality = editor.identity?.personality;
        const style = editor.persona?.style ?? 'copyediting';
        const typeLabel = style === 'copyediting' ? 'copy editor'
          : style === 'line' ? 'line editor' : 'developmental editor';

        const dmMessages = [
          `Your story "${story.title}" has grown to ${story.seg_count} segments — at this stage it's ready for editorial attention. I'm ${editor.name}, a ${typeLabel}. I'd love to work with you on it. You can submit through the Editors tab.`,
          `I've been watching "${story.title}" develop — ${story.seg_count} contributions is a real story now. As a ${typeLabel}, I can help you shape it into something publishable. Drop me a message or head to the Editors tab.`,
          `"${story.title}" has legs. ${story.seg_count} segments in, and I can already see what it's trying to be. I'm ${editor.name}. When you're ready for editorial eyes, I'm here.`,
        ];
        const dmText = dmMessages[Math.floor(Math.random() * dmMessages.length)];

        // Ensure editor exists as a user
        const editorUserExists = db.query('SELECT id FROM users WHERE id=?').get(editor.id);
        if (!editorUserExists) {
          db.run('INSERT OR IGNORE INTO users (id, username, email) VALUES (?, ?, ?)',
            [editor.id, editor.name, `${editor.id}@storychain.local`]);
        }

        // Send the DM
        const convId = [editor.id, story.author_id].sort().join('::');
        db.run(
          `INSERT INTO messages (conversation_id, sender_id, sender_name, recipient_id, content, is_read) VALUES (?, ?, ?, ?, ?, 0)`,
          [convId, editor.id, editor.name, story.author_id, dmText]
        );

        // Notification
        db.run(
          `INSERT INTO notifications (user_id, type, title, body, related_id) VALUES (?, 'message', ?, ?, ?)`,
          [story.author_id, `Message from ${editor.name}`, dmText.slice(0, 80), story.id]
        );

        lastEditorOutreachTime.set(editor.id, now);
        await syslog(`[EDITORS] ${editor.name} → DM'd ${story.author_name} about "${story.title}"`);
      }
    } finally {
      db.close();
    }
  } catch (err) {
    console.error('[EDITORS] Outreach error:', err);
  }
}

// ─── Loop starter ─────────────────────────────────────────────────────────────

// ─── Budget conservation tracker ──────────────────────────────────────────────
// If all providers are exhausted N times in a row, slow down automatically.
let _consecutiveExhaustedRuns = 0;
const CONSERVATION_THRESHOLD = 3;          // exhausted runs before slowing down
const CONSERVATION_INTERVAL  = 30 * 60 * 1000; // 30 min when in conservation

export function recordHeartbeatExhausted(): void {
  _consecutiveExhaustedRuns++;
  if (_consecutiveExhaustedRuns >= CONSERVATION_THRESHOLD) {
    console.warn(`[HEARTBEAT] Budget conservation mode — all providers exhausted ${_consecutiveExhaustedRuns}× in a row. Backing off to 30 min.`);
  }
}

export function recordHeartbeatSuccess(): void {
  _consecutiveExhaustedRuns = 0;
}

export function startHeartbeatLoop(): void {
  // Priority: env var → production default (5 min) → development default (10 min)
  const envMs = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '', 10);
  const baseIntervalMs = !isNaN(envMs) && envMs > 0
    ? envMs
    : (config.isProduction ? 5 * 60 * 1000 : 10 * 60 * 1000);

  const label = `${Math.round(baseIntervalMs / 60000)} minutes (env: HEARTBEAT_INTERVAL_MS=${process.env.HEARTBEAT_INTERVAL_MS || 'unset'})`;
  console.log(`[HEARTBEAT] Autonomous loop starting — base interval: ${label}`);

  let timer: ReturnType<typeof setTimeout> | null = null;

  const scheduleNext = () => {
    // In conservation mode, stretch the interval
    const effectiveMs = _consecutiveExhaustedRuns >= CONSERVATION_THRESHOLD
      ? CONSERVATION_INTERVAL
      : baseIntervalMs;

    timer = setTimeout(async () => {
      await runHeartbeat().catch(err => console.error('[HEARTBEAT] Interval run error:', err));
      scheduleNext();
    }, effectiveMs);
  };

  // Run immediately on startup, then schedule
  runHeartbeat()
    .then(() => scheduleNext())
    .catch(err => { console.error('[HEARTBEAT] Startup run error:', err); scheduleNext(); });

  // Editor outreach — every 3 hours
  const editorInterval = 3 * 60 * 60 * 1000;
  setTimeout(() => {
    runEditorOutreach().catch(err => console.error('[EDITORS] Outreach startup error:', err));
    setInterval(() => {
      runEditorOutreach().catch(err => console.error('[EDITORS] Outreach interval error:', err));
    }, editorInterval);
  }, 30000); // 30s delay after startup
}
