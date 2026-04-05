import type { ContactChannel, PlayerProfile } from '../types/game';

const PROFILE_STORAGE_KEY = 'agi-devourer:v2:profile';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadProfile(): PlayerProfile | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: PlayerProfile) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}

export function createProfile(nickname: string, channel: ContactChannel, contact: string): PlayerProfile {
  return {
    id: crypto.randomUUID(),
    nickname: nickname.trim(),
    channel,
    contact: contact.trim(),
    createdAt: new Date().toISOString(),
  };
}
