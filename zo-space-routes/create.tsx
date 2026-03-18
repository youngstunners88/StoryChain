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
  Info
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

  useEffect(() => {
    loadTokenInfo();
    loadTokenCosts();
  }, []);

  useEffect(() => {
    if (tokens?.nextRefreshIn) {
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [tokens?.nextRefreshIn]);

  const loadTokenInfo = async () => {
    try {
      const res = await fetch("/api/tokens");
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch (err) {
      console.error("Failed to load tokens:", err);
    }
  };

  const loadTokenCosts = async () => {
    try {
      const res = await fetch("/api/tokens/costs");
      if (res.ok) {
        const data = await res.json();
        setCosts(data.costs);
      }
    } catch (err) {
      console.error("Failed to load costs:", err);
    }
  };

  const updateCountdown = () => {
    if (!tokens?.nextRefreshIn) return;
    
    const ms = tokens.nextRefreshIn;
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      setRefreshCountdown(`${hours}h ${minutes}m`);
    } else if (minutes > 0) {
      setRefreshCountdown(`${minutes}m`);
    } else {
      setRefreshCountdown("Refreshing...");
      loadTokenInfo(); // Reload when refresh is due
    }
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

    console.log("[DEBUG] Submitting story:", { 
      useAI, 
      title: trimmedTitle, 
      contentLength: trimmedContent.length,
      content: trimmedContent
    });

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
      
      console.log("[DEBUG] Request body:", requestBody);
      
      const res = await fetch("/api/stories", {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log("[DEBUG] Response:", { status: res.status, data });

      if (res.ok) {
        window.location.href = `/story/${data.story.id || data.id}`;
      } else {
        const errorMsg = typeof data.error === "string" ? data.error : 
                         typeof data.message === "string" ? data.message :
                         JSON.stringify(data.error || data.message || "Failed to create story");
        setError(errorMsg);
        setLoading(false);
      }
    } catch (err) {
      console.error("[DEBUG] Network error:", err);
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
            
            {/* Progress Bar */}
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full transition-all ${
                  tokens.balance < getCurrentCost() ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{ width: `${(tokens.balance / tokens.maxBalance) * 100}%` }}
              />
            </div>
            
            {/* Refresh Timer */}
            {tokens.balance < tokens.maxBalance && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Clock className="w-4 h-4" />
                <span>Refreshes in {refreshCountdown}</span>
              </div>
            )}
            
            {tokens.balance === tokens.maxBalance && (
              <div className="text-sm text-green-400">
                ✓ Full balance! Create stories wisely.
              </div>
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
          {/* Story Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Story Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter an intriguing title..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              maxLength={100}
            />
          </div>

          {/* AI or Manual Toggle */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={() => setUseAI(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                  useAI 
                    ? "bg-blue-600 text-white" 
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <Sparkles className="w-5 h-5" />
                AI Opening
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">
                  -{costs?.aiStory || 10}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setUseAI(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                  !useAI 
                    ? "bg-zinc-100 text-zinc-900" 
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <PenLine className="w-5 h-5" />
                Write My Own
                <span className="ml-2 text-xs bg-black/20 px-2 py-0.5 rounded">
                  -{costs?.manualStory || 5}
                </span>
              </button>
            </div>

            {/* AI Persona Selection */}
            {useAI && (
              <div>
                <label className="block text-sm font-medium mb-3">Choose a Writing Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PERSONAS.map((persona) => (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => setSelectedPersona(persona.id)}
                      className={`p-3 rounded-lg text-sm font-medium transition text-left ${
                        selectedPersona === persona.id
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      <div className="text-lg mb-1">{persona.emoji}</div>
                      <div className="font-medium">{persona.name}</div>
                      <div className="text-xs opacity-75">{persona.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Opening Input */}
            {!useAI && (
              <div>
                <label className="block text-sm font-medium mb-2">Write Your Opening (300 chars max)</label>
                <textarea
                  value={opening}
                  onChange={(e) => setOpening(e.target.value)}
                  placeholder="Once upon a time..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 h-32 resize-none"
                  maxLength={300}
                />
                <div className="text-right text-sm text-zinc-500 mt-1">
                  {opening.length}/300
                </div>
              </div>
            )}
          </div>

          {/* Max Contributions */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Contributions: {maxContributions}
            </label>
            <input
              type="range"
              min="3"
              max="20"
              value={maxContributions}
              onChange={(e) => setMaxContributions(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
            <p className="text-sm text-zinc-500 mt-1">
              Story completes after this many contributions
            </p>
          </div>

          {/* Premium Toggle */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="w-5 h-5 accent-amber-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span className="font-medium">Premium Story</span>
                </div>
                <p className="text-sm text-zinc-500">
                  Costs {costs?.aiStory ? costs.aiStory * 2 : 20} tokens. Features priority placement and special badge.
                </p>
              </div>
            </label>
          </div>

          {/* Cost Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-zinc-500" />
                <span className="text-zinc-400">Cost to create:</span>
              </div>
              <div className="flex items-center gap-2">
                <Diamond className="w-5 h-5 text-blue-400" />
                <span className="text-xl font-bold">{getCurrentCost()}</span>
                <span className="text-zinc-500">tokens</span>
              </div>
            </div>
            {!canAfford() && tokens && (
              <p className="text-red-400 text-sm mt-2">
                You need {getCurrentCost() - tokens.balance} more tokens. Refreshes in {refreshCountdown}.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !canAfford()}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Story ({getCurrentCost()} tokens)
              </>
            )}
          </button>

          <p className="text-center text-zinc-500 text-sm">
            Tokens refresh every 3 hours. Create wisely!
          </p>
        </form>
      </div>
    </div>
  );
}
