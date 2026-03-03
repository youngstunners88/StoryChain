import { useCallback } from 'react';
import { LINK_PATTERNS, EXPLICIT_KEYWORDS, SUSPENSION_DURATION } from '../constants';

export interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  action?: 'block' | 'suspend' | 'warn';
  suspensionDays?: number;
}

export function useContentModeration() {
  const containsLinks = useCallback((content: string): boolean => {
    if (!content) return false;
    for (const pattern of LINK_PATTERNS) {
      if (pattern.test(content)) {
        return true;
      }
    }
    return false;
  }, []);

  const containsExplicitContent = useCallback((content: string): boolean => {
    if (!content) return false;
    const lowerContent = content.toLowerCase();
    
    for (const keyword of EXPLICIT_KEYWORDS) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    
    const suspiciousPatterns = [
      /\bnude\s*(?:pic|photo|image|selfie)s?\b/i,
      /\bnaked\s*(?:pic|photo|image|selfie)s?\b/i,
      /\bexplicit\s*(?:content|photo|pic)s?\b/i,
      /\bonly\s*fan/i,
      /\bnsfw\b/i,
      /\bxxx\b/i,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }
    
    return false;
  }, []);

  const moderateContent = useCallback((content: string): ModerationResult => {
    if (containsLinks(content)) {
      return {
        isAllowed: false,
        reason: 'Links are not allowed in messages or posts.',
        action: 'block'
      };
    }

    if (containsExplicitContent(content)) {
      return {
        isAllowed: false,
        reason: 'Explicit content detected. Your account has been suspended for 13 days.',
        action: 'suspend',
        suspensionDays: 13
      };
    }

    return { isAllowed: true };
  }, [containsLinks, containsExplicitContent]);

  const moderateImage = useCallback((imageDescription: string): ModerationResult => {
    if (containsExplicitContent(imageDescription)) {
      return {
        isAllowed: false,
        reason: 'Explicit image content detected. Your account has been suspended for 13 days.',
        action: 'suspend',
        suspensionDays: 13
      };
    }
    
    return { isAllowed: true };
  }, [containsExplicitContent]);

  const getSuspensionEndDate = useCallback((): number => {
    return Date.now() + SUSPENSION_DURATION;
  }, []);

  return {
    moderateContent,
    moderateImage,
    containsLinks,
    containsExplicitContent,
    getSuspensionEndDate
  };
}

export default useContentModeration;
