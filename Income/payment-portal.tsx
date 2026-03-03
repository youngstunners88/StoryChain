import { useState } from 'react';
import { Wallet, Copy, Check } from 'lucide-react';

export default function PaymentPortal() {
  const [copied, setCopied] = useState<string | null>(null);
  const [amount, setAmount] = useState("50");
  
  const wallets = {
    ethereum: "0x0089395dBced5DE83D65f13a38140F70777D56F0",
    solana: "An3Ng8J9iaUzhmRb8vDUegAJ9aSh7DndoLmho2bqrb2u",
  };

  const amounts = ["10", "25", "50", "100", "250", "500"];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-purple-900/20 to-zinc-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
            <Wallet className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Payment Portal</h1>
          <p className="text-zinc-400">Send crypto to fund autonomous AI operations</p>
        </div>
        <div className="space-y-6">
          {Object.entries(wallets).map(([chain, address]) => (
            <div key={chain} className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold capitalize">{chain}</h3>
                <span className="text-xs text-zinc-500">{chain === 'ethereum' ? 'ETH, USDC' : 'SOL'}</span>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-4">
                <p className="font-mono text-sm text-zinc-300 break-all">{address}</p>
              </div>
              <button onClick={() => copyToClipboard(address, chain)} className="mt-3 flex items-center gap-1 text-sm hover:text-green-400 transition-colors">
                {copied === chain ? (<><Check className="h-4 w-4 text-green-400" /><span className="text-green-400">Copied!</span></>) : (<><Copy className="h-4 w-4" />Copy address</>)}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-zinc-800/30 rounded-xl p-6 border border-zinc-700/30">
          <h3 className="text-lg font-semibold mb-4">Select Amount</h3>
          <div className="flex flex-wrap gap-3">
            {amounts.map((a) => (<button key={a} onClick={() => setAmount(a)} className={"px-4 py-2 rounded-lg transition-colors " + (amount === a ? "bg-purple-500 text-white" : "bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50")}>${a}</button>))}
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-zinc-500">All transactions are final. Funds power autonomous AI operations.</p>
      </div>
    </div>
  );
}
