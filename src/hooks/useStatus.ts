import { useState, useEffect } from 'react';

export interface SiteStatus {
  server: string;
  autonomous_loop: string;
  last_heartbeat: string | null;
  stories_active: number;
  stories_completed: number;
  segments_generated_today: number;
  providers_available: string[];
  default_provider: string;
}

export function useStatus() {
  const [status, setStatus] = useState<SiteStatus | null>(null);
  const [loopActive, setLoopActive] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) return;
        const data: SiteStatus = await res.json();
        setStatus(data);
        setLoopActive(data.autonomous_loop === 'active');
      } catch { /* silent */ }
    };
    fetch_();
    const id = setInterval(fetch_, 30_000);
    return () => clearInterval(id);
  }, []);

  return { status, loopActive };
}
