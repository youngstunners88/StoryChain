import React from 'react';
import type { UserProfile } from '../types';
import { AlertTriangle, Clock, ShieldAlert, Lock } from 'lucide-react';

interface Props {
  user: UserProfile;
  onClose: () => void;
}

const SuspensionModal: React.FC<Props> = ({ user, onClose }) => {
  const daysRemaining = user.suspensionEndDate 
    ? Math.ceil((user.suspensionEndDate - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const hoursRemaining = user.suspensionEndDate
    ? Math.ceil((user.suspensionEndDate - Date.now()) / (1000 * 60 * 60)) % 24
    : 0;

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[3rem] border-4 border-red-600 overflow-hidden flex flex-col shadow-[15px_15px_0_0_rgba(220,38,38,1)]">
        <div className="bg-red-600 p-8 border-b-4 border-black text-center">
          <div className="w-20 h-20 bg-black rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
            <Lock className="text-red-500" size={40} />
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white leading-none">
            ACCOUNT SUSPENDED
          </h2>
          <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">
            Security Violation Detected
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <AlertTriangle className="mx-auto text-red-600 mb-3" size={32} />
            <p className="text-sm font-black text-red-800 uppercase tracking-tight leading-tight">
              {user.suspensionReason || 'Your account has been suspended for violating community guidelines.'}
            </p>
          </div>

          <div className="bg-black text-white p-6 rounded-2xl border-4 border-yellow-400 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Clock className="text-yellow-400" size={20} />
              <span className="text-xs font-black uppercase tracking-widest">TIME REMAINING</span>
            </div>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-black text-yellow-400">{daysRemaining}</div>
                <div className="text-[10px] font-black uppercase text-gray-400">DAYS</div>
              </div>
              <div className="text-4xl font-black text-yellow-400">:</div>
              <div className="text-center">
                <div className="text-4xl font-black text-yellow-400">{hoursRemaining}</div>
                <div className="text-[10px] font-black uppercase text-gray-400">HOURS</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-gray-100 p-4 rounded-xl">
            <ShieldAlert className="text-orange-500 shrink-0" size={20} />
            <p className="text-[10px] font-bold text-gray-600 leading-relaxed">
              Repeated violations may result in permanent account termination. 
              Please review our community guidelines before your suspension ends.
            </p>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t-4 border-black">
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter border-2 border-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 transition-all"
          >
            I UNDERSTAND
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspensionModal;
