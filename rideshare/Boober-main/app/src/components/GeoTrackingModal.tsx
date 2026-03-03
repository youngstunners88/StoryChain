import React from 'react';
import { MapPin, Navigation, ShieldCheck, X, LocateFixed } from 'lucide-react';

interface Props {
  onEnable: () => void;
  onCancel: () => void;
}

const GeoTrackingModal: React.FC<Props> = ({ onEnable, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[3rem] border-4 border-black overflow-hidden flex flex-col shadow-[15px_15px_0_0_rgba(34,197,94,1)]">
        {/* Header */}
        <div className="bg-green-500 p-8 border-b-4 border-black text-center relative">
          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 bg-black/20 p-2 rounded-full hover:bg-black/30 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
          <div className="w-20 h-20 bg-black rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
            <LocateFixed className="text-green-500" size={40} />
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-black leading-none">
            ACTIVATE GPS
          </h2>
          <p className="text-[10px] font-black text-black/60 uppercase tracking-[0.2em] mt-2">
            Enable Location Tracking
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-green-50 p-4 rounded-2xl border-2 border-green-200">
              <Navigation className="text-green-600 shrink-0 mt-1" size={20} />
              <div>
                <p className="text-xs font-black text-green-800 uppercase">Real-Time Location</p>
                <p className="text-[10px] font-bold text-green-600 leading-relaxed mt-1">
                  Share your live location with nearby drivers and passengers
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-blue-50 p-4 rounded-2xl border-2 border-blue-200">
              <MapPin className="text-blue-600 shrink-0 mt-1" size={20} />
              <div>
                <p className="text-xs font-black text-blue-800 uppercase">Find Ranks Faster</p>
                <p className="text-[10px] font-bold text-blue-600 leading-relaxed mt-1">
                  Get directions to the nearest taxi ranks based on your location
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-yellow-50 p-4 rounded-2xl border-2 border-yellow-200">
              <ShieldCheck className="text-yellow-600 shrink-0 mt-1" size={20} />
              <div>
                <p className="text-xs font-black text-yellow-800 uppercase">Privacy Protected</p>
                <p className="text-[10px] font-bold text-yellow-600 leading-relaxed mt-1">
                  Your location is only shared while the app is active. You can disable anytime.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-xl">
            <p className="text-[10px] font-bold text-gray-500 text-center leading-relaxed">
              By enabling GPS tracking, you agree to share your location 
              with the Boober network to improve your taxi experience.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t-4 border-black flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase italic tracking-tighter border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 transition-all"
          >
            NOT NOW
          </button>
          <button
            onClick={onEnable}
            className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <LocateFixed size={18} />
            ENABLE GPS
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeoTrackingModal;
