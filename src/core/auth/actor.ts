import { timingSafeEqual } from 'node:crypto';

export interface ActorIdentity {
  userId: string;
  email: string;
  isGuest: boolean;
}

function safeEqual(a: string, b: string): boolean {
  const aBytes = Buffer.from(a);
  const bBytes = Buffer.from(b);
  if (aBytes.length !== bBytes.length) return false;
  return timingSafeEqual(aBytes, bBytes);
}

export function resolveActorIdentity(params: {
  authorizationHeader?: string;
  sessionIdHeader?: string;
  expectedToken?: string;
}): ActorIdentity {
  const { authorizationHeader, sessionIdHeader, expectedToken } = params;

  const sessionSeed = (sessionIdHeader || '').trim();
  const guestSeed = sessionSeed || `guest_${Math.random().toString(36).slice(2, 12)}`;
  const guestActor: ActorIdentity = {
    userId: guestSeed.startsWith('guest_') ? guestSeed : `guest_${guestSeed}`,
    email: 'guest@storychain.local',
    isGuest: true,
  };

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return guestActor;
  }

  const token = authorizationHeader.slice(7).trim();
  if (!token) {
    return guestActor;
  }

  // If no server token configured, allow platform-wide guest access without auth friction.
  if (!expectedToken) {
    return {
      userId: `user_${token.slice(-16)}`,
      email: 'user@storychain.local',
      isGuest: false,
    };
  }

  if (!safeEqual(token, expectedToken)) {
    return guestActor;
  }

  return {
    userId: `user_${token.slice(-16)}`,
    email: 'user@storychain.local',
    isGuest: false,
  };
}
