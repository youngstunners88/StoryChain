import React from 'react';
import type { UserProfile, VerificationRequest } from '../types';
import { UserRole } from '../types';
import { ShieldCheck, ThumbsUp, ThumbsDown, AlertCircle, User, Shield } from 'lucide-react';

interface Props {
  user: UserProfile;
  requests: VerificationRequest[];
  onVote: (requestId: string, vote: 'FOR' | 'AGAINST') => void;
}

const VerificationQueue: React.FC<Props> = ({ user, requests, onVote }) => {
  if (user.role !== UserRole.MARSHAL) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-black text-black flex items-center gap-3 text-lg uppercase tracking-tighter italic">
          <Shield className="text-orange-600" /> Security Queue
        </h3>
        <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black">{requests.length} ALERTS</span>
      </div>
      <div className="space-y-4">
        {requests.length > 0 ? requests.map(req => (
          <div key={req.id} className={`p-6 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex flex-col gap-4 ${req.type === 'DUPLICATE_PLATE_DISPUTE' ? 'bg-red-50' : 'bg-white'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl border-2 border-black flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-black text-sm uppercase italic leading-none">{req.targetUserName}</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">
                    {req.type === 'MARSHAL_APPROVAL' ? 'NEW MARSHAL APPLICATION' : 'DUPLICATE PLATE DISPUTE'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase text-orange-600 italic">VOTES: {req.votesFor.length + req.votesAgainst.length} / {req.requiredVotes}</p>
              </div>
            </div>
            {req.type === 'DUPLICATE_PLATE_DISPUTE' && (
              <div className="bg-red-600 text-white p-3 rounded-xl flex gap-3 border-2 border-black">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[8px] font-black uppercase leading-tight">This vehicle plate is already registered to another account. Verify the true owner.</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => onVote(req.id, 'FOR')}
                disabled={req.votesFor.includes(user.id) || req.votesAgainst.includes(user.id)}
                className="flex-1 bg-green-500 text-white py-4 rounded-2xl border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 font-black uppercase italic text-xs transition-all active:translate-y-1 disabled:opacity-30"
              >
                <ThumbsUp size={16} /> LEGIT (+10 PTS)
              </button>
              <button
                onClick={() => onVote(req.id, 'AGAINST')}
                disabled={req.votesFor.includes(user.id) || req.votesAgainst.includes(user.id)}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 font-black uppercase italic text-xs transition-all active:translate-y-1 disabled:opacity-30"
              >
                <ThumbsDown size={16} /> REJECT
              </button>
            </div>
          </div>
        )) : (
          <div className="bg-white/50 p-10 rounded-[3rem] border-4 border-dashed border-black/10 text-center">
            <ShieldCheck size={48} className="mx-auto text-black/5 mb-2" />
            <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">Network Secure. No Pending Disputes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationQueue;
