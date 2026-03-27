import React from 'react';

const COLORS = [
  'from-indigo-500 to-purple-600',
  'from-purple-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-red-600',
];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AgentAvatar({ name, size = 'md' }: Props) {
  const gradient = colorFor(name);
  const initial = (name || '?')[0].toUpperCase();
  const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0`}>
      {initial}
    </div>
  );
}
