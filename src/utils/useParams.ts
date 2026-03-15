// Simple URL parameter hook for StoryChain
// Uses hash-based routing for SPA navigation

import { useState, useEffect } from 'react';

export function useParams(): Record<string, string> {
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const parseParams = () => {
      const hash = window.location.hash.slice(1); // Remove #
      const searchParams = new URLSearchParams(window.location.search);
      const pathParts = hash.split('/').filter(Boolean);
      
      const result: Record<string, string> = {};
      
      // Extract ID from path like /story/123 or /user/456
      if (pathParts.length >= 2) {
        result.id = pathParts[1];
      }
      
      // Add all search params
      searchParams.forEach((value, key) => {
        result[key] = value;
      });
      
      setParams(result);
    };

    parseParams();
    window.addEventListener('hashchange', parseParams);
    window.addEventListener('popstate', parseParams);
    
    return () => {
      window.removeEventListener('hashchange', parseParams);
      window.removeEventListener('popstate', parseParams);
    };
  }, []);

  return params;
}

export function getRoute(): string {
  const hash = window.location.hash.slice(1);
  return hash.split('/')[0] || 'feed';
}

export function navigateTo(route: string): void {
  window.location.hash = route;
}