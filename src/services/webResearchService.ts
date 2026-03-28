// Web Research Service — gives AI agents real internet access
// Jina Reader (r.jina.ai): converts any URL to clean markdown, FREE, no key required
// DuckDuckGo Instant Answers: free search, no key required

const JINA_BASE = 'https://r.jina.ai/';
const DDG_API   = 'https://api.duckduckgo.com/';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ResearchResult {
  query: string;
  sources: Array<{ url: string; title: string; content: string }>;
  summary: string;
}

// ─── Fetch a URL as clean markdown via Jina Reader ───────────────────────────

export async function readUrl(url: string, maxChars = 3000): Promise<string | null> {
  try {
    const res = await fetch(`${JINA_BASE}${url}`, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown',
        'X-Timeout': '15',
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    // Strip excessive whitespace, trim to maxChars
    return text.replace(/\n{3,}/g, '\n\n').trim().slice(0, maxChars);
  } catch {
    return null;
  }
}

// ─── DuckDuckGo search → top results ─────────────────────────────────────────

export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const url = `${DDG_API}?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1&skip_disambig=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json() as any;

    const results: SearchResult[] = [];

    // AbstractText + AbstractURL (usually a Wikipedia summary)
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.AbstractText,
      });
    }

    // RelatedTopics
    for (const topic of (data.RelatedTopics ?? []).slice(0, 4)) {
      if (topic.FirstURL && topic.Text) {
        results.push({ title: topic.Text.slice(0, 80), url: topic.FirstURL, snippet: topic.Text });
      }
    }

    return results.slice(0, 5);
  } catch {
    return [];
  }
}

// ─── Research a literary topic: search + read top result ─────────────────────

export async function researchLiteraryTopic(topic: string): Promise<ResearchResult> {
  const results = await searchWeb(topic);
  const sources: ResearchResult['sources'] = [];

  // Read top 2 results
  for (const r of results.slice(0, 2)) {
    if (!r.url || r.url.startsWith('https://duckduckgo.com')) continue;
    const content = await readUrl(r.url, 2000);
    if (content && content.length > 100) {
      sources.push({ url: r.url, title: r.title, content });
    }
    if (sources.length >= 2) break;
  }

  // If Jina failed, fall back to snippets
  if (sources.length === 0 && results.length > 0) {
    sources.push({
      url: results[0].url,
      title: results[0].title,
      content: results.map(r => r.snippet).filter(Boolean).join('\n\n'),
    });
  }

  const summary = sources.map(s => `[${s.title}]\n${s.content}`).join('\n\n---\n\n');

  return { query: topic, sources, summary };
}

// ─── Curated literary research URLs per genre ────────────────────────────────
// Agents can deep-read these rather than generic searches

export const GENRE_RESEARCH_URLS: Record<string, string[]> = {
  mystery:   [
    'https://en.wikipedia.org/wiki/Detective_fiction',
    'https://en.wikipedia.org/wiki/Hardboiled_fiction',
  ],
  horror:    [
    'https://en.wikipedia.org/wiki/Horror_fiction',
    'https://en.wikipedia.org/wiki/Gothic_fiction',
  ],
  romance:   [
    'https://en.wikipedia.org/wiki/Romance_novel',
    'https://en.wikipedia.org/wiki/Love_story',
  ],
  scifi:     [
    'https://en.wikipedia.org/wiki/Science_fiction',
    'https://en.wikipedia.org/wiki/Speculative_fiction',
  ],
  fantasy:   [
    'https://en.wikipedia.org/wiki/Fantasy_literature',
    'https://en.wikipedia.org/wiki/Epic_fantasy',
  ],
  comedy:    [
    'https://en.wikipedia.org/wiki/Comedic_fiction',
    'https://en.wikipedia.org/wiki/Satire',
  ],
  action:    [
    'https://en.wikipedia.org/wiki/Action_fiction',
    'https://en.wikipedia.org/wiki/Thriller_(genre)',
  ],
  default:   [
    'https://en.wikipedia.org/wiki/Literary_fiction',
    'https://en.wikipedia.org/wiki/Narrative_technique',
  ],
};
