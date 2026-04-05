import { createClient } from '@supabase/supabase-js';
import type { GameSummary, LeaderboardEntry, LeaderboardSource, PlayerProfile } from '../types/game';

const LEADERBOARD_STORAGE_KEY = 'agi-devourer:v2:leaderboard';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
        },
      })
    : null;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeEntries(entries: LeaderboardEntry[]) {
  return [...entries]
    .sort((left, right) => right.score - left.score || left.createdAt.localeCompare(right.createdAt))
    .slice(0, 20);
}

function loadLocalEntries() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return normalizeEntries(JSON.parse(raw) as LeaderboardEntry[]);
  } catch {
    return [];
  }
}

function saveLocalEntries(entries: LeaderboardEntry[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(normalizeEntries(entries)));
}

function upsertLocalEntry(entry: LeaderboardEntry) {
  const entries = loadLocalEntries();
  const existingIndex = entries.findIndex(
    (candidate) => candidate.playerId === entry.playerId || candidate.nickname === entry.nickname,
  );

  if (existingIndex >= 0) {
    if (entries[existingIndex].score >= entry.score) {
      return normalizeEntries(entries);
    }

    entries.splice(existingIndex, 1, entry);
  } else {
    entries.push(entry);
  }

  const normalized = normalizeEntries(entries);
  saveLocalEntries(normalized);
  return normalized;
}

function summaryToEntry(profile: PlayerProfile, summary: GameSummary, source: LeaderboardSource): LeaderboardEntry {
  return {
    id: crypto.randomUUID(),
    playerId: profile.id,
    nickname: profile.nickname,
    score: summary.score,
    story: summary.story,
    summary: summary.didWin ? '突破奇点' : '算力枯竭',
    createdAt: new Date().toISOString(),
    models: summary.models,
    source,
  };
}

function fromRemoteRecord(record: {
  id: string;
  nickname: string;
  score: number;
  story: string | null;
  summary: string | null;
  model_names: string[] | null;
  created_at: string;
}): LeaderboardEntry {
  return {
    id: record.id,
    nickname: record.nickname,
    score: record.score,
    story: record.story ?? '',
    summary: record.summary ?? '突破奇点',
    createdAt: record.created_at,
    models: record.model_names ?? [],
    source: 'supabase',
  };
}

export function isRemoteLeaderboardEnabled() {
  return Boolean(supabase);
}

export async function fetchLeaderboard(limit = 8): Promise<{ entries: LeaderboardEntry[]; source: LeaderboardSource }> {
  if (supabase) {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('id, nickname, score, story, summary, model_names, created_at')
      .order('score', { ascending: false })
      .limit(limit);

    if (!error && data) {
      return {
        entries: data.map(fromRemoteRecord),
        source: 'supabase',
      };
    }
  }

  return {
    entries: loadLocalEntries().slice(0, limit),
    source: 'local',
  };
}

export async function submitScore(
  profile: PlayerProfile,
  summary: GameSummary,
): Promise<{ entry: LeaderboardEntry; entries: LeaderboardEntry[]; source: LeaderboardSource }> {
  const localEntry = summaryToEntry(profile, summary, 'local');
  const localEntries = upsertLocalEntry(localEntry);

  if (supabase) {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .insert({
        nickname: profile.nickname,
        score: summary.score,
        story: summary.story,
        summary: summary.didWin ? '突破奇点' : '算力枯竭',
        model_names: summary.models,
      })
      .select('id, nickname, score, story, summary, model_names, created_at')
      .single();

    if (!error && data) {
      const remoteEntry = fromRemoteRecord(data);
      return {
        entry: remoteEntry,
        entries: (await fetchLeaderboard()).entries,
        source: 'supabase',
      };
    }
  }

  return {
    entry: localEntry,
    entries: localEntries,
    source: 'local',
  };
}
