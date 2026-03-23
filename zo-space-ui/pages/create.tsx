// Enhanced Create Story Page with Token Economy
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  PenLine,
  Crown,
  Diamond,
  Clock,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";

const PERSONAS = [
  { id: "spooky", name: "Spooky", emoji: "🌙", desc: "Mysterious and haunting" },
  { id: "whimsical", name: "Whimsical", emoji: "🦋", desc: "Playful and magical" },
  { id: "noir", name: "Noir", emoji: "🕵️", desc: "Dark and detective" },
  { id: "scifi", name: "Sci-Fi", emoji: "🚀", desc: "Future and technology" },
  { id: "romance", name: "Romance", emoji: "💕", desc: "Love and passion" },
  { id: "adventure", name: "Adventure", emoji: "⚔️", desc: "Action and quest" },
  { id: "comedy", name: "Comedy", emoji: "😂", desc: "Humor and wit" },
];

interface TokenInfo {
  balance: number;
  maxBalance: number;
  nextRefreshIn: number;
  canCreateAI: boolean;
  canCreateManual: boolean;
}

interface TokenCosts {
  aiStory: number;
  manualStory: number;
  aiContribute: number;
  maxBalance: number;
  refreshHours: number;
}

export default function CreateStory() {
  const [title, setTitle] = useState("");
  const [opening, setOpening] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("spooky");
  const [useAI, setUseAI] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [maxContributions, setMaxContributions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [tokens, setTokens] = useState<TokenInfo | null>(null);
  const [costs, setCosts] = useState<TokenCosts | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState("");
  const [tokensFetchedAt, setTokensFetchedAt] = useState<number>(0);

  useEffect(() => {
    void loadTokenInfo();
    void loadTokenCosts();
  }, []);

  useEffect(() => {
    if (!tokens?.nextRefreshIn || !tokensFetchedAt) return;

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000);
    return () => clearInterval(interval);
  }, [tokens?.nextRefreshIn, tokensFetchedAt]);

  const loadTokenInfo = async () => {
    try {
      const res = await fetch("/api/tokens");
      if (!res.ok) return;

      const data = await res.json();
      setTokens(data);
      setTokensFetchedAt(Date.now());
    } catch {
      // Non-critical for page rendering.
    }
  };

  const loadTokenCosts = async () => {
    try {
      const res = await fetch("/api/tokens/costs");
      if (!res.ok) return;

      const data = await res.json();
      setCosts(data.costs);
    } catch {
      // Non-critical for page rendering.
    }
  };

  const updateCountdown = () => {
    if (!tokens?.nextRefreshIn || !tokensFetchedAt) return;

    const elapsed = Date.now() - tokensFetchedAt;
    const remaining = Math.max(0, tokens.nextRefreshIn - elapsed);

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    if (remaining === 0) {
      setRefreshCountdown("Refreshing...");
      void loadTokenInfo();
      return;
    }

    if (hours > 0) {
      setRefreshCountdown(`${hours}h ${minutes}m`);
      return;
    }

    setRefreshCountdown(`${minutes}m`);
  };

  const getCurrentCost = () => {
    if (!costs) return 0;
    if (isPremium) return costs.aiStory * 2;
    return useAI ? costs.aiStory : costs.manualStory;
  };

  const canAfford = () => {
    if (!tokens) return false;
    return tokens.balance >= getCurrentCost();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!canAfford()) {
      setError(`Insufficient tokens. Need ${getCurrentCost()} tokens. Refreshes in ${refreshCountdown}.`);
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedContent = useAI ? "" : opening.trim();

    if (!trimmedTitle) {
      setError("Please enter a story title");
      return;
    }

    if (!useAI && !trimmedContent) {
      setError("Please write an opening or enable AI generation");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const requestBody = {
        title: trimmedTitle,
        content: trimmedContent,
        modelUsed: "kimi-k2.5",
        ai_persona: useAI ? selectedPersona : undefined,
        max_contributions: maxContributions,
        is_premium: isPremium,
      };

      const res = await fetch("/api/stories", {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const storyId = data?.story?.id ?? data?.id;
        if (!storyId) {
          setError("Story created but no story id was returned.");
          setLoading(false);
          return;
        }

        window.location.assign(`/story/${storyId}`);
        return;
      }

      const errorMsg =
        typeof data.error === "string"
          ? data.error
          : typeof data.message === "string"
            ? data.message
            : "Failed to create story";
      setError(errorMsg);
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <a href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-300 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </a>

        {/* Token Display */}
        {tokens && costs && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Diamond className="w-5 h-5 text-blue-400" />
                <span className="font-medium">Your Tokens</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{tokens.balance}</span>
                <span className="text-zinc-500"> / {tokens.maxBalance}</span>
              </div>
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all ${
                  tokens.balance < getCurrentCost() ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(100, (tokens.balance / Math.max(tokens.maxBalance, 1)) * 100)}%` }}
              />
            </div>

            {tokens.balance < tokens.maxBalance && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Clock className="w-4 h-4" />
                <span>Refreshes in {refreshCountdown}</span>
              </div>
            )}

            {tokens.balance === tokens.maxBalance && (
              <div className="text-sm text-green-400">✓ Full balance! Create stories wisely.</div>
            )}
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">Create a Story</h1>
        <p className="text-zinc-400 mb-6">Start a new collaborative story</p>

        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{String(error)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Story Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter an intriguing title..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              required
            />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="font-medium">Creation Mode</span>
              </div>
              <div className="flex bg-zinc-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setUseAI(true)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    useAI ? "bg-amber-500 text-black" : "text-zinc-400"
                  }`}
                >
                  AI Generate ({costs?.aiStory || 10} tokens)
                </button>
                <button
                  type="button"
                  onClick={() => setUseAI(false)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    !useAI ? "bg-amber-500 text-black" : "text-zinc-400"
                  }`}
                >
                  Manual ({costs?.manualStory || 5} tokens)
                </button>
              </div>
            </div>

            {useAI ? (
              <div>
                <label className="block text-sm font-medium mb-3">Choose AI Persona</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERSONAS.map((persona) => (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => setSelectedPersona(persona.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedPersona === persona.id
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-zinc-700 hover:border-zinc-600"
                      }`}
                    >
                      <div className="text-lg mb-1">{persona.emoji}</div>
                      <div className="text-sm font-medium">{persona.name}</div>
                      <div className="text-xs text-zinc-500">{persona.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Opening Paragraph</label>
                <textarea
                  value={opening}
                  onChange={(e) => setOpening(e.target.value)}
                  placeholder="Write the first paragraph of your story..."
                  rows={6}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                  required={!useAI}
                />
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium">Advanced Options</span>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Max Contributions</label>
              <input
                type="range"
                min="5"
                max="50"
                value={maxContributions}
                onChange={(e) => setMaxContributions(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-zinc-500 mt-1">{maxContributions} contributions max</div>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-sm">Premium Story (+100% tokens)</span>
              </div>
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="w-4 h-4 rounded"
              />
            </label>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">Total Cost</span>
              <span className="text-xl font-bold text-amber-400">{getCurrentCost()} tokens</span>
            </div>
            {tokens && (
              <div className="text-sm text-zinc-500">
                Balance after creation: {Math.max(0, tokens.balance - getCurrentCost())} tokens
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !canAfford()}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Story...
              </>
            ) : (
              <>
                {useAI ? <Sparkles className="w-5 h-5" /> : <PenLine className="w-5 h-5" />}
                Create Story ({getCurrentCost()} tokens)
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
