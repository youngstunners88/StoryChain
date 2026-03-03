import React, { useEffect, useState, useRef } from 'react';
import type { ActivePing } from '../types';
import { TAXI_RANKS } from '../constants';

interface Props {
  originId?: string;
  destinationId?: string;
  activePings?: ActivePing[];
  activeRoutePath?: { x: number; y: number }[];
  userCoords?: { x: number; y: number } | null;
  otherDrivers?: { id: string; name: string; coords: {x: number, y: number} }[];
}

const percentToLatLng = (x: number, y: number) => {
  const lat = -26.3 + (1 - y / 100) * 0.2;
  const lng = 27.9 + (x / 100) * 0.3;
  return [lat, lng] as [number, number];
};

const RouteMap: React.FC<Props> = ({
  originId,
  destinationId,
  activePings = [],
  activeRoutePath,
  userCoords,
  otherDrivers = []
}) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    
    if (!(window as any).L) {
      console.warn('Leaflet not loaded yet');
      return;
    }

    const map = (window as any).L.map(containerRef.current, {
      center: [-26.2041, 28.0473],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    (window as any).L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 250);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapReady && mapRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      });
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    
    const map = mapRef.current;
    
    map.eachLayer((layer: any) => {
      if (layer instanceof (window as any).L.Marker || layer instanceof (window as any).L.Polyline) {
        if (!layer._isTileLayer) map.removeLayer(layer);
      }
    });

    TAXI_RANKS.forEach(rank => {
      const isOrigin = rank.id === originId;
      const isDest = rank.id === destinationId;
      
      if (isOrigin || isDest) {
        const [lat, lng] = percentToLatLng(rank.coords.x, rank.coords.y);
        const icon = (window as any).L.divIcon({
          className: '',
          html: `<div class="${isOrigin ? 'bg-yellow-400' : 'bg-red-500'} p-2 rounded-full border-2 border-black shadow-lg scale-125 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            ${isDest ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="3"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'}
          </div>`,
          iconSize: [0, 0]
        });
        (window as any).L.marker([lat, lng], { icon }).addTo(map);
        if (isOrigin) map.panTo([lat, lng]);
      }
    });

    if (activeRoutePath && activeRoutePath.length > 1) {
      const latLngs = activeRoutePath.map(p => percentToLatLng(p.x, p.y));
      (window as any).L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.8,
        lineCap: 'round'
      }).addTo(map);
    }

    if (userCoords) {
      const [lat, lng] = percentToLatLng(userCoords.x, userCoords.y);
      const icon = (window as any).L.divIcon({
        className: '',
        html: `<div class="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>`,
        iconSize: [0, 0]
      });
      (window as any).L.marker([lat, lng], { icon }).addTo(map);
    }

    activePings.forEach(p => {
      const coords = p.customCoords || TAXI_RANKS.find(r => r.id === p.rankId)?.coords;
      if (coords) {
        const [lat, lng] = percentToLatLng(coords.x, coords.y);
        const icon = (window as any).L.divIcon({
          className: '',
          html: `<div class="p-2 rounded-full border-2 border-black shadow-xl ${p.isCustom ? 'bg-blue-500' : 'bg-green-500'} transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>`,
          iconSize: [0, 0]
        });
        (window as any).L.marker([lat, lng], { icon }).addTo(map);
      }
    });

    // Show other taxis on the route
    otherDrivers.forEach(driver => {
      const [lat, lng] = percentToLatLng(driver.coords.x, driver.coords.y);
      const icon = (window as any).L.divIcon({
        className: '',
        html: `<div class="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><rect x="3" y="4" width="18" height="12" rx="2"/><line x1="6" x2="6" y1="8" y2="8"/><line x1="6" x2="6" y1="12" y2="12"/></svg>
        </div>`,
        iconSize: [0, 0]
      });
      (window as any).L.marker([lat, lng], { icon }).addTo(map);
    });
  }, [mapReady, originId, destinationId, activeRoutePath, userCoords, activePings, otherDrivers]);

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden rounded-[2.5rem]">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border-2 border-black pointer-events-none shadow-xl z-[1000]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
          <span className="text-[11px] font-black text-black uppercase tracking-widest leading-none">JOZI LIVE NETWORK</span>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
