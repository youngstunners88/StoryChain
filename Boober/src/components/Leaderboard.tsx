import React from 'react';
import type { UserProfile } from '../types';
import { UserRole } from '../types';
import { Trophy, Star, TrendingUp, Medal, User as UserIcon, Sparkles } from 'lucide-react';

interface Props {
  user: UserProfile;
}

const Leaderboard: React.FC<Props> = ({ user }) => {
  const topDrivers = [
    { name: 'Baba Joe', points: 4500, rank: 1, title: 'King of Bree', rating: 4.9 },
    { name: 'Sipho X', points: 3800, rank: 2, title: 'Noord Legend', rating: 4.7 },
    { name: 'Captain Bara', points: 3100, rank: 3, title: 'Route Master', rating: 4.8 },
    { name: 'Malume Thabo', points: 2850, rank: 4, title: 'Soweto Scout', rating: 4.6 },
    { name: 'Skhokho Mike', points: 2600, rank: 5, title: 'Alex Navigator', rating: 4.9 }
  ];

  const weeklyWinners = [
    {
      role: UserRole.DRIVER,
      name: 'Baba Joe',
      accolade: 'King of Bree',
      rating: 4.9,
      reviews: 124,
      imageColor: 'bg-yellow-400',
      tag: 'Driver of the Week'
    },
    {
      role: UserRole.PASSENGER,
      name: 'Mama Nandi',
      accolade: 'Elite Scout',
      rating: 4.8,
      reviews: 86,
      imageColor: 'bg-green-400',
      tag: 'Commuter of the Week'
    },
    {
      role: UserRole.MARSHAL,
      name: 'Marshal Thabo',
      accolade: 'Queue Master',
      rating: 5.0,
      reviews: 210,
      imageColor: 'bg-orange-500',
      tag: 'Marshal of the Week'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-black text-white p-10 rounded-[3rem] border-4 border-yellow-400 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, #ffffff 20px, #ffffff 21px)' }} />
        <Trophy className="mx-auto text-yellow-400 mb-4 drop-shadow-[0_0_15px_#fbbf24]" size={64} />
        <h2 className="text-3xl font-black tracking-tighter italic uppercase relative z-10">HALL OF FAME</h2>
        <div className="mt-6 bg-yellow-400 text-black px-6 py-2.5 rounded-full inline-block font-black text-xs uppercase tracking-widest border-2 border-black shadow-xl relative z-10">
          MY SCORE: {user.points} PTS
        </div>
        <p className="text-yellow-400/60 text-[10px] font-bold uppercase tracking-[0.3em] mt-3 relative z-10">Level: {user.rankTitle}</p>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-black flex items-center gap-3 px-3 text-lg uppercase tracking-tighter italic">
          <Sparkles className="text-yellow-500" /> WEEKLY SPOTLIGHT
        </h3>
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x px-1">
          {weeklyWinners.map((winner, idx) => (
            <div key={idx} className="flex-shrink-0 w-[280px] snap-center bg-black text-white p-6 rounded-[2.5rem] border-4 border-yellow-400 relative overflow-hidden shadow-lg">
              <Sparkles className="absolute -right-2 -top-2 text-yellow-400/10 w-24 h-24 rotate-12" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="relative">
                  <div className={`w-16 h-16 ${winner.imageColor} rounded-2xl border-2 border-white flex items-center justify-center shadow-lg overflow-hidden`}>
                    <UserIcon size={32} className="text-black" />
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-[8px] font-black uppercase text-yellow-400 tracking-[0.2em] block mb-1">{winner.tag}</span>
                  <h4 className="text-lg font-black italic uppercase tracking-tighter leading-none">{winner.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase italic mt-1">{winner.accolade}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={8} fill={i < Math.floor(winner.rating) ? 'currentColor' : 'none'} className="stroke-current" />)}
                  </div>
                  <span className="text-[9px] font-black text-gray-400 uppercase">{winner.rating}</span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-yellow-400/60">{winner.reviews} REVIEWS</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="font-black text-black flex items-center gap-3 px-3 text-lg uppercase tracking-tighter italic">
          <Medal className="text-yellow-500" /> ELITE DRIVERS
        </h3>
        <div className="bg-white rounded-[3rem] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          {topDrivers.map((d, i) => (
            <div key={i} className={`flex items-center p-6 ${i !== topDrivers.length - 1 ? 'border-b-2 border-gray-100' : ''}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl mr-5 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]
                ${i === 0 ? 'bg-yellow-400 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-orange-400 text-black' : 'bg-gray-100 text-gray-400'}`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-black text-md text-gray-800 uppercase italic tracking-tighter leading-none">{d.name}</p>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-200">
                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] font-black text-yellow-700">{d.rating}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{d.title}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-lg text-yellow-600 italic tracking-tighter">{d.points}</p>
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">PTS</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-yellow-400 to-orange-400 p-8 rounded-[3.5rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-black">
        <div className="flex items-center gap-3 mb-5">
          <TrendingUp className="text-black" />
          <h4 className="font-black text-xl uppercase italic tracking-tighter">BOOST YOUR RANK</h4>
        </div>
        <ul className="space-y-4">
          {[
            { icon: '🔥', text: 'Correct rank info for +20 pts' },
            { icon: '🚀', text: '5 trips in a week for Elite Badge' },
            { icon: '⭐', text: '4.8+ rating = Daily Multiplier' },
            { icon: '✅', text: 'Share to WhatsApp for +50 pts' }
          ].map((tip, idx) => (
            <li key={idx} className="flex gap-4 items-center bg-white/30 p-3 rounded-2xl border-2 border-black/10">
              <span className="text-2xl">{tip.icon}</span>
              <p className="text-sm font-black uppercase tracking-tight leading-tight">{tip.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Leaderboard;
