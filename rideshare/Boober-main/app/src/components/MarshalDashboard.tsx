import React, { useState, useMemo } from 'react';
import type { UserProfile, RankStatus, QueueCapacity, ChatMessage, RoutePath } from '../types';
import { TAXI_RANKS, POINT_VALUES } from '../constants';
import { MapPin, Bell, Star, Trophy, Activity, User, MessageCircle, Banknote, X, Search, Send } from 'lucide-react';

interface Props {
  user: UserProfile;
  addPoints: (amount: number) => void;
  routes: RoutePath[];
  onUpdateStatus: (status: RankStatus) => void;
  currentStatuses: Record<string, RankStatus>;
  onSendMessage: (content: string, routeId?: string, isAlert?: boolean, alertType?: ChatMessage['alertType'], channel?: ChatMessage['channel'], rankTag?: string) => void;
  isOnline?: boolean;
}

const MarshalDashboard: React.FC<Props> = ({
  user, addPoints, routes, onUpdateStatus, currentStatuses, onSendMessage, isOnline = true
}) => {
  const [selectedRank, setSelectedRank] = useState('');
  const [capacity, setCapacity] = useState<QueueCapacity>('HALF_FULL');
  const [loadEstimate, setLoadEstimate] = useState(50);
  const [alertMessage, setAlertMessage] = useState('');
  const [showPriceBoard, setShowPriceBoard] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatChannel, setChatChannel] = useState<'DRIVERS' | 'MARSHALS' | 'PASSENGERS'>('DRIVERS');
  const [priceSearch, setPriceSearch] = useState('');

  const categories = ['CBD', 'Soweto', 'Alexandra', 'Greater Joburg', 'East Rand', 'West Rand', 'Northern Suburbs', 'Long Distance'];
  const [selectedCategory, setSelectedCategory] = useState('CBD');

  const getRankName = (id: string) => TAXI_RANKS.find(r => r.id === id)?.name || id;

  const filteredPriceRoutes = useMemo(() => {
    const search = priceSearch.toLowerCase();
    return routes.filter(r => {
      const originName = getRankName(r.originId).toLowerCase();
      const destName = getRankName(r.destinationId).toLowerCase();
      return originName.includes(search) || destName.includes(search);
    });
  }, [routes, priceSearch]);

  const filteredMessages = useMemo(() => {
    return [] as ChatMessage[];
  }, []);

  const handleUpdatePrice = (routeId: string, _newPrice: number) => {
    // Marshals can update prices
    const route = routes.find(r => r.id === routeId);
    if (route) {
      addPoints(POINT_VALUES.SUBMIT_PRICE);
    }
  };

  const sendTextMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput, undefined, false, 'GENERAL', chatChannel);
    setChatInput('');
  };

  const filteredRanks = useMemo(() => 
    TAXI_RANKS.filter(r => r.category === selectedCategory),
    [selectedCategory]
  );

  const handleUpdateStatus = () => {
    if (!selectedRank) return;
    
    const status: RankStatus = {
      rankId: selectedRank,
      capacity,
      lastUpdated: Date.now(),
      marshalName: user.name,
      loadEstimate
    };
    
    onUpdateStatus(status);
    alert('Rank status updated! +30 points earned.');
  };

  const handleSendAlert = () => {
    if (!alertMessage.trim()) return;
    
    const rankName = TAXI_RANKS.find(r => r.id === selectedRank)?.name || 'Jozi Network';
    const message = `[${rankName}] ${alertMessage}`;
    
    onSendMessage(message, undefined, true, 'GENERAL', 'DRIVERS', rankName);
    onSendMessage(message, undefined, true, 'GENERAL', 'PASSENGERS', rankName);
    
    setAlertMessage('');
    addPoints(POINT_VALUES.MARSHAL_PING_FLEET);
    alert('Alert broadcasted to all users!');
  };

  const getCapacityColor = (cap: QueueCapacity) => {
    switch (cap) {
      case 'EMPTY': return 'bg-green-500';
      case 'MOVING': return 'bg-green-400';
      case 'HALF_FULL': return 'bg-yellow-400';
      case 'FULL_HOUSE': return 'bg-orange-500';
      case 'OVERFLOWING': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getCapacityLabel = (cap: QueueCapacity) => {
    switch (cap) {
      case 'EMPTY': return 'EMPTY';
      case 'MOVING': return 'MOVING';
      case 'HALF_FULL': return 'HALF FULL';
      case 'FULL_HOUSE': return 'FULL HOUSE';
      case 'OVERFLOWING': return 'OVERFLOWING';
      default: return cap;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {!isOnline && (
        <div className="bg-red-500 text-white p-3 rounded-2xl border-2 border-black text-center text-xs font-black uppercase animate-pulse">
          OFFLINE MODE - Status updates will sync when back online
        </div>
      )}

      <div className="bg-orange-600 text-white p-6 rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center border-2 border-yellow-400 overflow-hidden">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="text-yellow-400" size={28} />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-yellow-300">Sho! Marshal {user.name}!</h2>
            <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest mt-1">Rank Controller</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPriceBoard(true)} className="p-3 rounded-2xl border-2 border-black bg-orange-700 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">
            <Banknote size={20} />
          </button>
          <button onClick={() => setShowChat(!showChat)} className={`p-3 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all ${showChat ? 'bg-yellow-400 text-black' : 'bg-orange-700 text-white'}`}>
            <MessageCircle size={20} />
          </button>
        </div>
      </div>

      <div className="bg-black text-white p-6 rounded-[3rem] border-4 border-orange-500 shadow-[12px_12px_0_0_rgba(0,0,0,1)] grid grid-cols-3 gap-4">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto border border-orange-500/30">
            <Star className="text-orange-500" size={18} />
          </div>
          <p className="text-lg font-black">{user.averageRating?.toFixed(1) || '5.0'}</p>
          <p className="text-[7px] font-black uppercase text-gray-500 tracking-widest">RATING</p>
        </div>
        <div className="text-center space-y-1">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto border border-yellow-500/30">
            <Activity className="text-yellow-500" size={18} />
          </div>
          <p className="text-lg font-black">{Object.keys(currentStatuses).length}</p>
          <p className="text-[7px] font-black uppercase text-gray-500 tracking-widest">UPDATES</p>
        </div>
        <div className="text-center space-y-1">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto border border-green-500/30">
            <Trophy className="text-green-500" size={18} />
          </div>
          <p className="text-lg font-black">{user.points}</p>
          <p className="text-[7px] font-black uppercase text-gray-500 tracking-widest">POINTS</p>
        </div>
      </div>

      {showPriceBoard && (
        <div className="bg-white p-6 rounded-[2.5rem] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-4 fixed inset-x-5 top-24 bottom-24 z-[100] flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-black text-lg uppercase italic tracking-tighter flex items-center gap-2"><Banknote size={20} className="text-blue-500" /> PRICE BOARD</h3>
            <button onClick={() => setShowPriceBoard(false)} className="text-gray-400 hover:text-black"><X size={24}/></button>
          </div>
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={priceSearch} onChange={(e) => setPriceSearch(e.target.value)} placeholder="Search routes..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-black rounded-xl font-black text-xs outline-none" />
          </div>
          <div className="space-y-3 overflow-y-auto no-scrollbar flex-1">
            {filteredPriceRoutes.map(r => (
              <div key={r.id} className="p-4 bg-gray-50 rounded-2xl border-2 border-black/10 flex justify-between items-center">
                <div className="max-w-[65%] text-xs font-black italic uppercase">
                  <div className="text-blue-500">FROM: {getRankName(r.originId)}</div>
                  <div className="text-gray-800">TO: {getRankName(r.destinationId)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" defaultValue={r.price} onBlur={(e) => handleUpdatePrice(r.id, parseInt(e.target.value))} className="w-16 p-2 bg-white border-2 border-black rounded-lg font-black text-center text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)]" />
                  <span className="text-xs font-black italic">R</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showChat && (
        <div className="bg-white p-6 rounded-[2.5rem] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-4 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-lg uppercase italic tracking-tighter flex items-center gap-2"><MessageCircle size={20} className="text-orange-500" /> COMMS HUB</h3>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setChatChannel('DRIVERS')} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${chatChannel === 'DRIVERS' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>DRIVERS</button>
              <button onClick={() => setChatChannel('MARSHALS')} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${chatChannel === 'MARSHALS' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>MARSHALS</button>
              <button onClick={() => setChatChannel('PASSENGERS')} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${chatChannel === 'PASSENGERS' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>PASSENGERS</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar mb-4 flex flex-col-reverse">
            {filteredMessages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-[10px] font-black uppercase">No messages yet</p>
              </div>
            ) : (
              filteredMessages.slice().reverse().map(msg => (
                <div key={msg.id} className={`p-3 rounded-2xl border-2 ${msg.isAlert ? 'bg-red-50 border-red-500' : msg.senderId === user.id ? 'bg-orange-50 border-orange-200 ml-4' : 'bg-gray-50 border-black/5 mr-4'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-orange-600">
                      {msg.senderName} {msg.rankTag ? `(@ ${msg.rankTag})` : ''}
                    </span>
                    <span className="text-[7px] text-gray-400 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-xs font-bold leading-tight">{msg.content}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={sendTextMsg} className="flex gap-2">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={`Message ${chatChannel.toLowerCase()}...`} className="flex-1 bg-gray-50 border-2 border-black rounded-xl px-4 py-2 font-black text-xs outline-none"/>
            <button type="submit" className="bg-black text-white p-2 rounded-xl border-2 border-black active:scale-95"><Send size={18} /></button>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-[3rem] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl border-2 border-black">
            <MapPin className="text-white" size={20} />
          </div>
          <h3 className="text-xl font-black italic uppercase tracking-tighter">UPDATE RANK STATUS</h3>
        </div>

        <div className="flex overflow-x-auto gap-1 no-scrollbar pb-1">
          {categories.map(c => (
            <button 
              key={c} 
              onClick={() => setSelectedCategory(c)} 
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl border-2 border-black text-[8px] font-black uppercase transition-all ${selectedCategory === c ? 'bg-orange-500 text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'bg-gray-50 text-gray-400'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <select 
          value={selectedRank} 
          onChange={(e) => setSelectedRank(e.target.value)} 
          className="w-full p-4 bg-gray-50 border-4 border-black rounded-[1.5rem] font-black text-sm outline-none appearance-none"
        >
          <option value="">SELECT RANK IN {selectedCategory}...</option>
          {filteredRanks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">QUEUE CAPACITY</label>
          <div className="grid grid-cols-5 gap-2">
            {(['EMPTY', 'MOVING', 'HALF_FULL', 'FULL_HOUSE', 'OVERFLOWING'] as QueueCapacity[]).map(cap => (
              <button
                key={cap}
                onClick={() => setCapacity(cap)}
                className={`p-3 rounded-xl border-2 border-black text-[7px] font-black uppercase transition-all ${capacity === cap ? 'bg-orange-500 text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'bg-gray-50 text-gray-400'}`}
              >
                {getCapacityLabel(cap)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex justify-between">
            <span>LOAD ESTIMATE</span>
            <span>{loadEstimate}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={loadEstimate}
            onChange={(e) => setLoadEstimate(parseInt(e.target.value))}
            className="w-full h-4 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <button 
          onClick={handleUpdateStatus}
          disabled={!selectedRank}
          className={`w-full font-black py-4 rounded-[2rem] border-4 border-black transition-all ${selectedRank ? 'bg-orange-500 text-white shadow-[6px_6px_0_0_rgba(0,0,0,1)]' : 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'}`}
        >
          UPDATE STATUS +30 PTS
        </button>
      </div>

      <div className="bg-red-50 p-6 rounded-[3rem] border-4 border-red-500 shadow-[10px_10px_0px_0px_rgba(239,68,68,0.3)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 p-2 rounded-xl border-2 border-black">
            <Bell className="text-white" size={20} />
          </div>
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-red-600">BROADCAST ALERT</h3>
        </div>

        <textarea
          value={alertMessage}
          onChange={(e) => setAlertMessage(e.target.value)}
          placeholder="Alert all drivers and passengers... (no links allowed)"
          className="w-full p-4 bg-white border-4 border-red-200 rounded-[2rem] font-bold focus:ring-4 ring-red-400/20 outline-none resize-none h-24 text-sm"
        />

        <button 
          onClick={handleSendAlert}
          disabled={!alertMessage.trim()}
          className={`w-full font-black py-4 rounded-[2rem] border-4 border-black transition-all ${alertMessage.trim() ? 'bg-red-500 text-white shadow-[6px_6px_0_0_rgba(0,0,0,1)]' : 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'}`}
        >
          <Bell size={18} className="inline mr-2" /> BROADCAST ALERT +25 PTS
        </button>
      </div>

      {Object.keys(currentStatuses).length > 0 && (
        <div className="space-y-4">
          <h3 className="font-black text-black flex items-center gap-3 px-3 text-lg uppercase tracking-tighter italic">
            <Activity className="text-orange-500" /> LIVE RANK STATUS
          </h3>
          <div className="space-y-3">
            {Object.values(currentStatuses).map(status => {
              const rank = TAXI_RANKS.find(r => r.id === status.rankId);
              if (!rank) return null;
              return (
                <div key={status.rankId} className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black uppercase italic">{rank.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Updated by {status.marshalName}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase text-white ${getCapacityColor(status.capacity)}`}>
                    {getCapacityLabel(status.capacity)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarshalDashboard;
