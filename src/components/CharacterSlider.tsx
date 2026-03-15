import React from 'react';
import { Type, Coins, AlertCircle, Check } from 'lucide-react';
import { DEFAULT_CHARACTER_EXTENSION } from '../types';

interface CharacterSliderProps {
  currentCharacters: number;
  maxCharacters: number;
  onChange: (characters: number) => void;
  tokens: number;
  autoPurchase: boolean;
  onAutoPurchaseChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export const CharacterSlider: React.FC<CharacterSliderProps> = ({
  currentCharacters,
  maxCharacters,
  onChange,
  tokens,
  autoPurchase,
  onAutoPurchaseChange,
  disabled = false,
}) => {
  const {
    baseCharacters,
    extensionSize,
    tokensPerExtension,
    maxTotalCharacters,
  } = DEFAULT_CHARACTER_EXTENSION;

  const extensionsUsed = Math.max(0, Math.ceil((maxCharacters - baseCharacters) / extensionSize));
  const tokensNeeded = extensionsUsed * tokensPerExtension;
  const canAfford = tokens >= tokensNeeded;
  const baseExtensions = Math.max(0, Math.ceil((currentCharacters - baseCharacters) / extensionSize));
  const baseTokens = baseExtensions * tokensPerExtension;

  // Calculate min/max for slider (0 = base, 5 = max)
  const sliderValue = extensionsUsed;
  const maxSlider = DEFAULT_CHARACTER_EXTENSION.maxExtensions;

  const handleSliderChange = (value: number) => {
    const newMax = baseCharacters + (value * extensionSize);
    onChange(Math.min(currentCharacters, newMax));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Type className="w-4 h-4 text-blue-400" />
          Character Limit
        </label>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-zinc-100">
            {maxCharacters}
          </span>
          <span className="text-xs text-zinc-500">chars</span>
        </div>
      </div>

      {/* Character usage bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            Using {currentCharacters} / {maxCharacters}
          </span>
          <span className={`${currentCharacters > maxCharacters ? 'text-red-400' : 'text-zinc-500'}`}>
            {currentCharacters > maxCharacters ? 'Over limit!' : `${maxCharacters - currentCharacters} remaining`}
          </span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`
              h-full transition-all duration-300 rounded-full
              ${currentCharacters > maxCharacters
                ? 'bg-red-500'
                : currentCharacters > baseCharacters
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              }
            `}
            style={{ width: `${Math.min(100, (currentCharacters / maxCharacters) * 100)}%` }}
          />
        </div>
      </div>

      {/* Extension slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Base ({baseCharacters})</span>
          <span>+{maxSlider} Extensions</span>
        </div>
        <input
          type="range"
          min={0}
          max={maxSlider}
          value={sliderValue}
          onChange={(e) => handleSliderChange(parseInt(e.target.value))}
          disabled={disabled}
          className="
            w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer
            disabled:cursor-not-allowed disabled:opacity-50
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-amber-500
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
          "
        />
        <div className="flex justify-between text-xs text-zinc-500">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={sliderValue === n ? 'text-amber-400 font-medium' : ''}
            >
              {n === 0 ? '0' : `+${n}`}
            </span>
          ))}
        </div>
      </div>

      {/* Token cost */}
      {extensionsUsed > 0 && (
        <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-zinc-300">Token Cost</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Base ({baseCharacters} chars)</span>
              <span className="text-green-400">Free</span>
            </div>
            {extensionsUsed > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-400">+{extensionsUsed} extensions ({extensionsUsed * extensionSize} chars)</span>
                <span className="text-amber-400">{tokensNeeded} tokens</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-zinc-700">
              <span className="text-zinc-300">Total cost</span>
              <span className={`font-medium ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                {tokensNeeded} tokens
              </span>
            </div>
          </div>

          {/* Balance check */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Your balance:</span>
            <span className={`font-medium ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
              {tokens} tokens
            </span>
            {!canAfford && (
              <span className="text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Need {tokensNeeded - tokens} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Auto-purchase toggle */}
      <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg">
        <button
          onClick={() => onAutoPurchaseChange(!autoPurchase)}
          disabled={disabled}
          className={`
            relative w-11 h-6 rounded-full transition-colors
            ${autoPurchase ? 'bg-amber-500' : 'bg-zinc-700'}
            disabled:opacity-50
          `}
        >
          <span
            className={`
              absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
              ${autoPurchase ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
        <div className="flex-1">
          <div className="text-sm font-medium text-zinc-300">Auto-purchase extensions</div>
          <div className="text-xs text-zinc-500">
            Automatically buy tokens when needed
          </div>
        </div>
        {autoPurchase && <Check className="w-4 h-4 text-green-400" />}
      </div>
    </div>
  );
};

export default CharacterSlider;
