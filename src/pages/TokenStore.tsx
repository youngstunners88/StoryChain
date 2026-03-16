import React, { useState, useEffect } from 'react';
import { Coins, CreditCard, Gift, Zap, Check, AlertCircle, RefreshCw, ArrowLeft, Sparkles, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TokenPackage {
  id: string;
  tokens: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

const TOKEN_PACKAGES: TokenPackage[] = [
  { id: 'starter', tokens: 100, price: 4.99, bonus: 0 },
  { id: 'popular', tokens: 500, price: 19.99, bonus: 50, popular: true },
  { id: 'pro', tokens: 1000, price: 34.99, bonus: 150 },
  { id: 'unlimited', tokens: 5000, price: 149.99, bonus: 1000 },
];

interface Transaction {
  id: string;
  amount: number;
  type: 'purchase' | 'spend' | 'bonus';
  description: string;
  createdAt: string;
}

export const TokenStore: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [balance, setBalance] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [profileRes, txRes] = await Promise.all([
        fetchWithAuth('/api/user/profile'),
        fetchWithAuth('/api/user/transactions'),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setBalance(profileData.user?.tokens || 0);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setPurchasing(true);
    setMessage(null);

    try {
      const response = await fetchWithAuth('/api/tokens/purchase', {
        method: 'POST',
        body: JSON.stringify({
          packageId: selectedPackage.id,
          tokens: selectedPackage.tokens + selectedPackage.bonus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Purchase failed');
      }

      const data = await response.json();
      setBalance(data.newBalance);
      setMessage({
        type: 'success',
        text: `Successfully purchased ${selectedPackage.tokens + selectedPackage.bonus} tokens!`,
      });
      setSelectedPackage(null);
      
      // Refresh transactions
      await loadUserData();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Purchase failed. Please try again.',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const getFreeTokens = async () => {
    try {
      const response = await fetchWithAuth('/api/tokens/free', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to claim free tokens');
      }

      const data = await response.json();
      setBalance(data.newBalance);
      setMessage({
        type: 'success',
        text: `Claimed ${data.tokensGranted} free tokens!`,
      });
      
      await loadUserData();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to claim free tokens',
      });
    }
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <a
          href="/feed"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </a>

        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mb-4">
            <Coins className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Token Store</h1>
          <p className="text-zinc-500">Purchase tokens to extend your stories and contributions</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-400 mb-1">Current Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{balance}</span>
                <span className="text-amber-400">tokens</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm"
              >
                History
              </button>
              <button
                onClick={getFreeTokens}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <Gift className="w-4 h-4" />
                Free Tokens
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`
              flex items-center gap-2 p-4 rounded-lg
              ${message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }
            `}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Transaction History */}
        {showHistory && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Transaction History</h2>
            {transactions.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-10 h-10 rounded-lg flex items-center justify-center
                          ${tx.type === 'purchase' || tx.type === 'bonus'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                          }
                        `}
                      >
                        {tx.type === 'purchase' ? (
                          <CreditCard className="w-5 h-5" />
                        ) : tx.type === 'bonus' ? (
                          <Gift className="w-5 h-5" />
                        ) : (
                          <Zap className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-300">{tx.description}</p>
                        <p className="text-xs text-zinc-500">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <span
                      className={`font-medium ${
                        tx.type === 'purchase' || tx.type === 'bonus'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {tx.type === 'purchase' || tx.type === 'bonus' ? '+' : '-'}
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Token Packages */}
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">Purchase Tokens</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TOKEN_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`
                  relative p-6 rounded-xl border-2 transition-all text-left
                  ${selectedPackage?.id === pkg.id
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }
                `}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      POPULAR
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span className="text-2xl font-bold text-zinc-100">{pkg.tokens}</span>
                </div>
                
                {pkg.bonus > 0 && (
                  <div className="mb-3">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      +{pkg.bonus} bonus
                    </span>
                  </div>
                )}
                
                <p className="text-lg font-semibold text-amber-400">${pkg.price}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  ${(pkg.price / (pkg.tokens + pkg.bonus)).toFixed(3)} per token
                </p>

                {selectedPackage?.id === pkg.id && (
                  <div className="absolute top-3 right-3">
                    <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Purchase Button */}
        {selectedPackage && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-400">Selected Package</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {selectedPackage.tokens + selectedPackage.bonus} tokens
                </p>
                <p className="text-sm text-zinc-500">for ${selectedPackage.price}</p>
              </div>
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-black font-medium rounded-xl transition-colors"
              >
                {purchasing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Purchase Now
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-4">
              * In a production environment, this would integrate with Stripe for secure payment processing.
            </p>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">How Tokens Work</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-zinc-300">Free Base</h3>
                <p className="text-sm text-zinc-500">First 300 characters are always free</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-medium text-zinc-300">Extensions</h3>
                <p className="text-sm text-zinc-500">5 tokens per 100 extra characters</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-zinc-300">Daily Free</h3>
                <p className="text-sm text-zinc-500">Claim free tokens every 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenStore;