import { useEffect, useMemo, useRef, useState } from 'react';
import PhaserGame from './game/PhaserGame';
import './App.css';
import { fetchComboStory, fetchEndgameStory } from './utils/api';
import { initAudio, playBurpSound, playLoseSound, playWinSound, startBgm, stopBgm } from './utils/audio';
import { clearProfile, createProfile, loadProfile, saveProfile } from './utils/profile';
import { fetchLeaderboard, isRemoteLeaderboardEnabled, submitScore } from './utils/leaderboard';
import { copyShareText, downloadPoster, generateSharePoster, sharePoster } from './utils/share';
import type {
  ComboResult,
  ContactChannel,
  FlyWord,
  GamePhase,
  GameSummary,
  LeaderboardEntry,
  LeaderboardSource,
  PlayerProfile,
} from './types/game';

const TARGET_SCORE = 4000;
const ROUND_DURATION = 60;

const CHANNEL_OPTIONS: Array<{ value: ContactChannel; label: string; helper: string }> = [
  { value: 'wechat', label: '微信', helper: '方便做分享裂变和战报回流' },
  { value: 'phone', label: '手机', helper: '适合后续短信验证码接入' },
  { value: 'email', label: '邮箱', helper: '适合做 Magic Link 登录' },
];

const CHANNEL_FIELD_LABEL: Record<ContactChannel, string> = {
  wechat: '微信号',
  phone: '手机号',
  email: '邮箱',
};

function createDefaultForm(profile: PlayerProfile | null) {
  return {
    nickname: profile?.nickname ?? '',
    channel: profile?.channel ?? ('wechat' as ContactChannel),
    contact: profile?.contact ?? '',
  };
}

function getHeadline(didWin: boolean) {
  return didWin ? 'AGI 诞生，奇点已破' : '算力枯竭，离成神差一口气';
}

function getDifficultyLabel(level: number) {
  if (level < 1.8) {
    return '护肝热身';
  }
  if (level < 2.4) {
    return '过载升温';
  }
  if (level < 3.1) {
    return '鬼畜追命';
  }
  return '反人类形态';
}

function getSourceLabel(source: LeaderboardSource) {
  return source === 'supabase' ? '全网榜' : '本机榜';
}

function LeaderboardPanel({
  entries,
  source,
  submittedEntry,
}: {
  entries: LeaderboardEntry[];
  source: LeaderboardSource;
  submittedEntry: LeaderboardEntry | null;
}) {
  return (
    <section className="panel leaderboard-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">荣誉竞技场</p>
          <h3>算力排行榜</h3>
        </div>
        <span className="pill pill-outline">{getSourceLabel(source)}</span>
      </div>
      <div className="leaderboard-list">
        {entries.length === 0 && <p className="muted">还没有人上榜，第一位吞掉宇宙的就是你。</p>}
        {entries.map((entry, index) => {
          const isCurrent = submittedEntry
            ? entry.id === submittedEntry.id ||
              (entry.nickname === submittedEntry.nickname && entry.score === submittedEntry.score)
            : false;

          return (
            <div key={`${entry.id}-${entry.score}`} className={`leaderboard-row${isCurrent ? ' current' : ''}`}>
              <div className="leaderboard-rank">#{index + 1}</div>
              <div className="leaderboard-meta">
                <strong>{entry.nickname}</strong>
                <span>{entry.summary}</span>
              </div>
              <div className="leaderboard-score">{entry.score}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function App() {
  const [phase, setPhase] = useState<GamePhase>('start');
  const [sessionKey, setSessionKey] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [stomach, setStomach] = useState<FlyWord[]>([]);
  const [eatenModels, setEatenModels] = useState<FlyWord[]>([]);
  const [headline, setHeadline] = useState('单键吞噬，朝着真正的 AGI 进化');
  const [message, setMessage] = useState('游客可以直接开局，但想进榜得先登记荣誉档案。');
  const [comboFeed, setComboFeed] = useState<ComboResult[]>([]);
  const [latestCombo, setLatestCombo] = useState<ComboResult | null>(null);
  const [floatingScore, setFloatingScore] = useState<{ text: string; x: number; y: number } | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(() => loadProfile());
  const [showProfileEditor, setShowProfileEditor] = useState(() => !loadProfile());
  const [formState, setFormState] = useState(() => createDefaultForm(loadProfile()));
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardSource, setLeaderboardSource] = useState<LeaderboardSource>(
    isRemoteLeaderboardEnabled() ? 'supabase' : 'local',
  );
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<LeaderboardEntry | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [touchMode, setTouchMode] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);

  const phaseRef = useRef<GamePhase>(phase);
  const posterBlobRef = useRef<Blob | null>(null);
  const posterUrlRef = useRef<string | null>(null);
  const endingRef = useRef(false);
  const handleGameOverRef = useRef<
    (didWin: boolean, overrides?: { finalScore?: number; finalTimeLeft?: number; models?: string[] }) => Promise<void>
  >(async () => {});
  const startRoundRef = useRef<() => void>(() => {});

  const difficultyLevel = useMemo(() => {
    const progress = (ROUND_DURATION - timeLeft) / ROUND_DURATION;
    return 1 + progress * 2.6;
  }, [timeLeft]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    setFormState(createDefaultForm(profile));
    if (profile) {
      setShowProfileEditor(false);
    }
  }, [profile]);

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)');
    const syncTouchMode = () => {
      setTouchMode(media.matches || window.innerWidth < 920);
    };

    syncTouchMode();
    media.addEventListener('change', syncTouchMode);
    window.addEventListener('resize', syncTouchMode);

    return () => {
      media.removeEventListener('change', syncTouchMode);
      window.removeEventListener('resize', syncTouchMode);
    };
  }, []);

  useEffect(() => {
    void refreshLeaderboard();
  }, []);

  useEffect(() => {
    if (phase !== 'playing') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [phase, sessionKey]);

  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) {
      void handleGameOverRef.current(false);
    }
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === 'playing' && score >= TARGET_SCORE) {
      void handleGameOverRef.current(true);
    }
  }, [phase, score]);

  useEffect(() => {
    window.__agiRoundState = {
      phase,
      score,
      timeLeft,
      duration: ROUND_DURATION,
      elapsedMs: (ROUND_DURATION - timeLeft) * 1000,
    };

    window.render_game_to_text = () => {
      const snapshotText = window.__agiGameControls?.getSnapshot();
      let scene = null;

      if (snapshotText) {
        try {
          scene = JSON.parse(snapshotText);
        } catch {
          scene = snapshotText;
        }
      }

      return JSON.stringify({
        mode: phase,
        score,
        timeLeft,
        targetScore: TARGET_SCORE,
        difficulty: Number(difficultyLevel.toFixed(2)),
        user: profile ? { nickname: profile.nickname, channel: profile.channel } : { nickname: 'guest' },
        stomach: stomach.map((item) => item.text),
        latestCombo: latestCombo
          ? {
              description: latestCombo.description,
              score: latestCombo.score,
            }
          : null,
        leaderboard: leaderboard.slice(0, 3).map((entry, index) => ({
          rank: index + 1,
          nickname: entry.nickname,
          score: entry.score,
        })),
        source: leaderboardSource,
        note: 'origin=(0,0) top-left; x increases rightward; y increases downward',
        scene,
      });
    };

    window.advanceTime = (ms: number) => {
      return window.__agiGameControls?.advanceTime(ms) ?? window.render_game_to_text?.() ?? '';
    };

    return () => {
      delete window.__agiRoundState;
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [difficultyLevel, latestCombo, leaderboard, leaderboardSource, phase, profile, score, stomach, timeLeft]);

  useEffect(() => {
    window.onScoreUpdated = (nextScore: number) => {
      if (phaseRef.current !== 'playing') {
        return;
      }
      setScore(nextScore);
    };

    window.onFlyDigested = (word: FlyWord) => {
      if (phaseRef.current !== 'playing') {
        return;
      }

      setEatenModels((previous) => [...previous, word]);
      setStomach((previous) => {
        const updated = [...previous, word];
        if (updated.length === 3) {
          void triggerCombo(updated);
          return [];
        }
        return updated;
      });
    };

    return () => {
      delete window.onScoreUpdated;
      delete window.onFlyDigested;
    };
  }, []);

  useEffect(() => {
    return () => {
      stopBgm();
      if (posterUrlRef.current) {
        URL.revokeObjectURL(posterUrlRef.current);
      }
    };
  }, []);

  const leaderboardRank = useMemo(() => {
    if (!submittedEntry) {
      return null;
    }

    const index = leaderboard.findIndex(
      (entry) => entry.id === submittedEntry.id || (entry.nickname === submittedEntry.nickname && entry.score === submittedEntry.score),
    );

    return index >= 0 ? index + 1 : null;
  }, [leaderboard, submittedEntry]);

  async function refreshLeaderboard() {
    setIsLeaderboardLoading(true);
    try {
      const result = await fetchLeaderboard();
      setLeaderboard(result.entries);
      setLeaderboardSource(result.source);
    } catch {
      setStatusNote('排行榜刷新失败，先继续吞，数据会留在本地。');
    } finally {
      setIsLeaderboardLoading(false);
    }
  }

  function resetPosterCache() {
    posterBlobRef.current = null;

    if (posterUrlRef.current) {
      URL.revokeObjectURL(posterUrlRef.current);
      posterUrlRef.current = null;
    }

    setPosterPreviewUrl(null);
  }

  function resetRoundState() {
    setScore(0);
    setTimeLeft(ROUND_DURATION);
    setStomach([]);
    setEatenModels([]);
    setComboFeed([]);
    setLatestCombo(null);
    setFloatingScore(null);
    setSummary(null);
    setSubmittedEntry(null);
    setHeadline('单键吞噬，朝着真正的 AGI 进化');
    setMessage('游客可以直接开局，但想进榜得先登记荣誉档案。');
    setStatusNote('');
    resetPosterCache();
  }

  function startRound() {
    endingRef.current = false;
    initAudio();
    resetRoundState();
    setSessionKey((previous) => previous + 1);
    setPhase('playing');
    startBgm();
  }

  function returnToLobby() {
    stopBgm();
    endingRef.current = false;
    resetRoundState();
    setSessionKey((previous) => previous + 1);
    setPhase('start');
  }

  async function triggerCombo(items: FlyWord[]) {
    playBurpSound();
    window.onComboTriggered?.();

    const ingredients = items.map((item) => item.name);
    const result = await fetchComboStory(ingredients.join('、'));

    if (phaseRef.current !== 'playing') {
      return;
    }

    const comboResult: ComboResult = {
      description: result.description,
      score: result.score,
      ingredients,
      createdAt: Date.now(),
    };

    setScore((previous) => previous + result.score);
    setLatestCombo(comboResult);
    setComboFeed((previous) => [comboResult, ...previous].slice(0, 3));
    setFloatingScore({
      text: `+${result.score}`,
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.28,
    });
    window.setTimeout(() => setFloatingScore(null), 1500);
  }

  async function handleGameOver(
    didWin: boolean,
    overrides?: {
      finalScore?: number;
      finalTimeLeft?: number;
      models?: string[];
    },
  ) {
    if (endingRef.current) {
      return;
    }

    endingRef.current = true;
    stopBgm();
    setPhase('gameover');

    if (didWin) {
      playWinSound();
    } else {
      playLoseSound();
    }

    const finalModels = overrides?.models ?? [...new Set(eatenModels.map((item) => item.name))].slice(-8);
    const finalScore = overrides?.finalScore ?? score;
    const finalTimeLeft = overrides?.finalTimeLeft ?? timeLeft;
    const finalDuration = ROUND_DURATION - finalTimeLeft;
    const finalDifficulty = 1 + (finalDuration / ROUND_DURATION) * 2.6;

    setHeadline(getHeadline(didWin));
    setMessage('正在熬制你的专属怪嗝战报...');

    const story = await fetchEndgameStory(didWin, finalScore, finalModels);
    const nextSummary: GameSummary = {
      score: finalScore,
      didWin,
      story,
      models: finalModels,
      comboCount: comboFeed.length,
      maxDifficulty: finalDifficulty,
      durationSeconds: finalDuration,
    };

    setSummary(nextSummary);
    setMessage(story);
    setStatusNote(
      profile
        ? '荣誉档案已就绪，可以把这一局直接送上排行榜。'
        : '游客模式不会自动上榜，想留名请先登记荣誉档案。',
    );
  }

  useEffect(() => {
    handleGameOverRef.current = handleGameOver;
  });

  useEffect(() => {
    startRoundRef.current = startRound;
  });

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return undefined;
    }

    window.__agiDebugV2 = {
      startRound: () => startRoundRef.current(),
      forceLose: async () => {
        const debugScore = 1380;
        const debugTimeLeft = 3;
        setScore(debugScore);
        setTimeLeft(debugTimeLeft);
        await handleGameOverRef.current(false, {
          finalScore: debugScore,
          finalTimeLeft: debugTimeLeft,
          models: ['Kimi', 'Doubao', 'Claude'],
        });
      },
      forceWin: async () => {
        const debugScore = 4280;
        const debugTimeLeft = 12;
        setScore(debugScore);
        setTimeLeft(debugTimeLeft);
        await handleGameOverRef.current(true, {
          finalScore: debugScore,
          finalTimeLeft: debugTimeLeft,
          models: ['OpenAI', 'Gemini', 'Claude', 'Kimi'],
        });
      },
      saveProfile: (nickname = '调试吞噬王') => {
        const nextProfile = createProfile(nickname, 'wechat', 'debug-wechat');
        saveProfile(nextProfile);
        setProfile(nextProfile);
      },
    };

    return () => {
      delete window.__agiDebugV2;
    };
  }, []);

  function saveProfileFromForm() {
    const nickname = formState.nickname.trim();
    const contact = formState.contact.trim();

    if (nickname.length < 2) {
      setStatusNote('昵称至少 2 个字，榜单上才够显眼。');
      return null;
    }

    if (!contact) {
      setStatusNote(`请填写${CHANNEL_FIELD_LABEL[formState.channel]}，这样后续才能继续扩展登录。`);
      return null;
    }

    const nextProfile =
      profile === null
        ? createProfile(nickname, formState.channel, contact)
        : {
            ...profile,
            nickname,
            channel: formState.channel,
            contact,
          };

    saveProfile(nextProfile);
    setProfile(nextProfile);
    setShowProfileEditor(false);
    setStatusNote('荣誉档案已保存，接下来你的高分就能留名。');
    return nextProfile;
  }

  async function handleScoreSubmit(profileOverride?: PlayerProfile) {
    const activeProfile = profileOverride ?? profile;

    if (!summary) {
      setStatusNote('本局还没有生成战报，先打一局再说。');
      return;
    }

    if (!activeProfile) {
      setShowProfileEditor(true);
      setStatusNote('要上传战绩，先登记一个荣誉档案。');
      return;
    }

    setSubmitBusy(true);
    try {
      const result = await submitScore(activeProfile, summary);
      setSubmittedEntry(result.entry);
      setLeaderboard(result.entries);
      setLeaderboardSource(result.source);
      setStatusNote(
        result.source === 'supabase'
          ? '战绩已上传到全网排行榜。'
          : '当前未接入 Supabase，战绩已写入本机排行榜。',
      );
    } catch {
      setStatusNote('上传失败了，不过别慌，本机榜还在。');
    } finally {
      setSubmitBusy(false);
    }
  }

  async function ensurePosterBlob() {
    if (!summary) {
      return null;
    }

    if (posterBlobRef.current) {
      return posterBlobRef.current;
    }

    const blob = await generateSharePoster(summary, profile, leaderboardRank ?? undefined);
    posterBlobRef.current = blob;

    if (posterUrlRef.current) {
      URL.revokeObjectURL(posterUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(blob);
    posterUrlRef.current = nextUrl;
    setPosterPreviewUrl(nextUrl);

    return blob;
  }

  async function handlePosterPreview() {
    if (!summary) {
      return;
    }

    setShareBusy(true);
    try {
      await ensurePosterBlob();
      setStatusNote('战报海报已生成，可以直接下载或系统分享。');
    } catch {
      setStatusNote('海报生成失败了，稍后再试一口。');
    } finally {
      setShareBusy(false);
    }
  }

  async function handlePosterDownload() {
    if (!summary) {
      return;
    }

    setShareBusy(true);
    try {
      const blob = await ensurePosterBlob();
      if (blob) {
        downloadPoster(blob, `agi-devourer-v2-${summary.score}.png`);
        setStatusNote('战报已经打包成 PNG。');
      }
    } catch {
      setStatusNote('下载失败，海报还没成功烘焙出来。');
    } finally {
      setShareBusy(false);
    }
  }

  async function handleSystemShare() {
    if (!summary) {
      return;
    }

    setShareBusy(true);
    try {
      const blob = await ensurePosterBlob();
      if (!blob) {
        return;
      }

      const didShare = await sharePoster(blob, summary, profile);
      if (!didShare) {
        await copyShareText(summary, profile);
        setStatusNote('系统分享不可用，已经帮你把文案复制到剪贴板。');
      }
    } catch {
      setStatusNote('系统分享失败了，可以改用下载海报。');
    } finally {
      setShareBusy(false);
    }
  }

  async function handleCopyShareText() {
    if (!summary) {
      return;
    }

    try {
      await copyShareText(summary, profile);
      setStatusNote('分享文案已经复制好了。');
    } catch {
      setStatusNote('复制失败，浏览器暂时不肯给我剪贴板权限。');
    }
  }

  return (
    <div className="game-shell">
      <PhaserGame key={`phaser-${sessionKey}`} />

      <div className="hud-layer">
        <header className={`hud-bar ${phase !== 'playing' ? 'muted-state' : ''}`}>
          <div className="hud-item">
            <span className="label">算力</span>
            <strong>
              {score} <span>/ {TARGET_SCORE}</span>
            </strong>
          </div>
          <div className="hud-item">
            <span className="label">倒计时</span>
            <strong>{timeLeft}s</strong>
          </div>
          <div className="hud-item">
            <span className="label">难度</span>
            <strong>Lv.{difficultyLevel.toFixed(1)}</strong>
          </div>
          <div className="hud-item identity">
            <span className="label">{profile ? '荣誉档案' : '游客模式'}</span>
            <strong>{profile?.nickname ?? '分数不上榜'}</strong>
          </div>
        </header>

        {phase === 'playing' && (
          <>
            <div className="playing-sidebar">
              <section className="panel compact-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">变态曲线</p>
                    <h3>{getDifficultyLabel(difficultyLevel)}</h3>
                  </div>
                  <span className="pill">移动端已适配</span>
                </div>
                <p className="muted">
                  时间越久，猎物越会抽搐乱飞，还会预判你的舌头走位。
                </p>
              </section>

              <LeaderboardPanel entries={leaderboard.slice(0, 5)} source={leaderboardSource} submittedEntry={submittedEntry} />
            </div>

            <div className="stomach-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">胃袋缓存</p>
                  <h3>三连蓄力槽</h3>
                </div>
                <span className="pill">{stomach.length} / 3</span>
              </div>
              <div className="stomach-capsules">
                {stomach.length === 0 && <span className="muted">还没塞满，继续吞。</span>}
                {stomach.map((item) => (
                  <span key={`${item.name}-${item.value}`} className="capsule">
                    {item.text}
                  </span>
                ))}
              </div>
            </div>

            {latestCombo && (
              <section className="combo-panel panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">化学反应</p>
                    <h3>三连爆鸣</h3>
                  </div>
                  <span className="pill accent">+{latestCombo.score}</span>
                </div>
                <p>{latestCombo.description}</p>
              </section>
            )}
          </>
        )}

        {floatingScore && (
          <div
            className="floating-score"
            style={{ left: floatingScore.x, top: floatingScore.y }}
          >
            {floatingScore.text}
          </div>
        )}

        {touchMode && phase === 'playing' && (
          <button
            className="touch-fire-button"
            onPointerDown={() => window.__agiGameControls?.fire()}
            type="button"
          >
            发射舌头
          </button>
        )}

        {phase === 'start' && (
          <div className="overlay">
            <div className="overlay-grid">
              <section className="hero-card">
                <p className="eyebrow">V2 Iteration</p>
                <h1>舌尖上的 AGI</h1>
                <p className="hero-subtitle">React + Phaser 重构版已经进入真正能打的 v2 节奏。</p>

                <div className="feature-grid">
                  <div className="feature-card">
                    <strong>游客即玩</strong>
                    <span>开局零门槛，上传成绩时再拦截登记。</span>
                  </div>
                  <div className="feature-card">
                    <strong>荣誉榜</strong>
                    <span>支持本机榜，接上 Supabase 后就是全网榜。</span>
                  </div>
                  <div className="feature-card">
                    <strong>战报海报</strong>
                    <span>结算页直接生成可分享 PNG。</span>
                  </div>
                  <div className="feature-card">
                    <strong>触控模式</strong>
                    <span>手机上拖动瞄准，右下角一键发射。</span>
                  </div>
                </div>

                <div className="hero-tips">
                  <div className="tip-item">
                    <span>01</span>
                    <p>桌面端可以移动鼠标微调角度，空格或点击直接发射。</p>
                  </div>
                  <div className="tip-item">
                    <span>02</span>
                    <p>连续吞下 3 个模型会触发一口怪嗝，额外暴涨算力。</p>
                  </div>
                  <div className="tip-item">
                    <span>03</span>
                    <p>后半程猎物会开始蛇皮走位，等你失手。</p>
                  </div>
                </div>

                <div className="hero-actions">
                  <button className="primary-button" id="start-btn" onClick={startRound} type="button">
                    开始吞噬
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => setShowProfileEditor((previous) => !previous)}
                    type="button"
                  >
                    {showProfileEditor ? '收起档案' : profile ? '编辑档案' : '登记荣誉档案'}
                  </button>
                </div>
              </section>

              <section className="side-column">
                <div className="panel profile-panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">身份系统</p>
                      <h3>{profile ? '荣誉档案已激活' : '游客可直接开玩'}</h3>
                    </div>
                    <span className="pill">{profile ? '可上榜' : '不上榜'}</span>
                  </div>

                  {profile && !showProfileEditor ? (
                    <div className="profile-summary">
                      <strong>{profile.nickname}</strong>
                      <span>
                        {CHANNEL_FIELD_LABEL[profile.channel]}：{profile.contact}
                      </span>
                      <div className="inline-actions">
                        <button className="ghost-button small" onClick={() => setShowProfileEditor(true)} type="button">
                          修改档案
                        </button>
                        <button
                          className="ghost-button small danger"
                          onClick={() => {
                            clearProfile();
                            setProfile(null);
                            setShowProfileEditor(true);
                            setStatusNote('已切回游客模式。');
                          }}
                          type="button"
                        >
                          清空档案
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="profile-editor">
                      <label>
                        <span>昵称</span>
                        <input
                          value={formState.nickname}
                          onChange={(event) =>
                            setFormState((previous) => ({
                              ...previous,
                              nickname: event.target.value,
                            }))
                          }
                          placeholder="比如：吞模型的周某"
                        />
                      </label>

                      <div className="channel-row">
                        {CHANNEL_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            className={`channel-chip${formState.channel === option.value ? ' active' : ''}`}
                            onClick={() =>
                              setFormState((previous) => ({
                                ...previous,
                                channel: option.value,
                              }))
                            }
                            type="button"
                          >
                            <strong>{option.label}</strong>
                            <span>{option.helper}</span>
                          </button>
                        ))}
                      </div>

                      <label>
                        <span>{CHANNEL_FIELD_LABEL[formState.channel]}</span>
                        <input
                          value={formState.contact}
                          onChange={(event) =>
                            setFormState((previous) => ({
                              ...previous,
                              contact: event.target.value,
                            }))
                          }
                          placeholder={`填写${CHANNEL_FIELD_LABEL[formState.channel]}`}
                        />
                      </label>

                      <button className="primary-button small" onClick={saveProfileFromForm} type="button">
                        保存荣誉档案
                      </button>
                    </div>
                  )}
                </div>

                {isLeaderboardLoading ? (
                  <section className="panel leaderboard-panel">
                    <p className="muted">排行榜加载中，正在统计谁最像 AGI。</p>
                  </section>
                ) : (
                  <LeaderboardPanel entries={leaderboard.slice(0, 5)} source={leaderboardSource} submittedEntry={submittedEntry} />
                )}
              </section>
            </div>
          </div>
        )}

        {phase === 'gameover' && (
          <div className="overlay">
            <div className="overlay-grid result-layout">
              <section className="hero-card result-card">
                <p className="eyebrow">Round Complete</p>
                <h1>{headline}</h1>
                <p className="hero-subtitle">
                  {summary ? `${summary.score} 分，难度峰值 Lv.${summary.maxDifficulty.toFixed(1)}` : '战报还在烹饪中'}
                </p>

                <div className="result-stat-grid">
                  <div className="stat-card">
                    <span>总分</span>
                    <strong>{score}</strong>
                  </div>
                  <div className="stat-card">
                    <span>三连次数</span>
                    <strong>{summary?.comboCount ?? comboFeed.length}</strong>
                  </div>
                  <div className="stat-card">
                    <span>时长</span>
                    <strong>{summary?.durationSeconds ?? ROUND_DURATION - timeLeft}s</strong>
                  </div>
                  <div className="stat-card">
                    <span>榜单</span>
                    <strong>{leaderboardRank ? `#${leaderboardRank}` : getSourceLabel(leaderboardSource)}</strong>
                  </div>
                </div>

                <section className="panel result-story">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">怪嗝结算</p>
                      <h3>本局战报</h3>
                    </div>
                    <span className="pill accent">{summary?.didWin ? '突破奇点' : '差一点成神'}</span>
                  </div>
                  <p>{message}</p>
                  <div className="model-tags">
                    {(summary?.models ?? [...new Set(eatenModels.map((item) => item.name))].slice(-8)).map((model) => (
                      <span key={model} className="capsule">
                        {model}
                      </span>
                    ))}
                  </div>
                </section>

                <div className="hero-actions">
                  <button className="primary-button" onClick={startRound} type="button">
                    再开一局
                  </button>
                  <button className="ghost-button" onClick={returnToLobby} type="button">
                    回到大厅
                  </button>
                </div>

                {statusNote && <p className="status-note">{statusNote}</p>}
              </section>

              <section className="side-column">
                <div className="panel share-panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">传播模块</p>
                      <h3>朋友圈战报</h3>
                    </div>
                    <span className="pill">{shareBusy ? '生成中' : '可分享'}</span>
                  </div>

                  <div className="share-actions">
                    <button className="primary-button small" onClick={() => void handlePosterPreview()} type="button">
                      生成海报
                    </button>
                    <button className="ghost-button small" onClick={() => void handlePosterDownload()} type="button">
                      下载 PNG
                    </button>
                    <button className="ghost-button small" onClick={() => void handleSystemShare()} type="button">
                      系统分享
                    </button>
                    <button className="ghost-button small" onClick={() => void handleCopyShareText()} type="button">
                      复制文案
                    </button>
                  </div>

                  {posterPreviewUrl ? (
                    <div className="poster-preview">
                      <img alt="战报海报预览" src={posterPreviewUrl} />
                    </div>
                  ) : (
                    <p className="muted">
                      生成后会得到一张竖版战报图，包含分数、怪嗝文案和游戏入口卡片。
                    </p>
                  )}
                </div>

                <div className="panel profile-panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">上榜闸门</p>
                      <h3>{profile ? `以 ${profile.nickname} 之名上榜` : '游客暂时不上榜'}</h3>
                    </div>
                    <span className="pill">{submitBusy ? '上传中' : '可提交'}</span>
                  </div>

                  {!profile || showProfileEditor ? (
                    <div className="profile-editor">
                      <label>
                        <span>昵称</span>
                        <input
                          value={formState.nickname}
                          onChange={(event) =>
                            setFormState((previous) => ({
                              ...previous,
                              nickname: event.target.value,
                            }))
                          }
                          placeholder="留下一个要上榜的名字"
                        />
                      </label>

                      <div className="channel-row">
                        {CHANNEL_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            className={`channel-chip${formState.channel === option.value ? ' active' : ''}`}
                            onClick={() =>
                              setFormState((previous) => ({
                                ...previous,
                                channel: option.value,
                              }))
                            }
                            type="button"
                          >
                            <strong>{option.label}</strong>
                            <span>{option.helper}</span>
                          </button>
                        ))}
                      </div>

                      <label>
                        <span>{CHANNEL_FIELD_LABEL[formState.channel]}</span>
                        <input
                          value={formState.contact}
                          onChange={(event) =>
                            setFormState((previous) => ({
                              ...previous,
                              contact: event.target.value,
                            }))
                          }
                          placeholder={`填写${CHANNEL_FIELD_LABEL[formState.channel]}`}
                        />
                      </label>

                      <div className="inline-actions">
                        <button
                          className="primary-button small"
                          onClick={() => {
                            const nextProfile = saveProfileFromForm();
                            if (nextProfile) {
                              void handleScoreSubmit(nextProfile);
                            }
                          }}
                          type="button"
                        >
                          保存并上榜
                        </button>
                        {profile && (
                          <button className="ghost-button small" onClick={() => setShowProfileEditor(false)} type="button">
                            取消编辑
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="profile-summary">
                      <strong>{profile.nickname}</strong>
                      <span>
                        {CHANNEL_FIELD_LABEL[profile.channel]}：{profile.contact}
                      </span>
                      <div className="inline-actions">
                        <button className="primary-button small" onClick={() => void handleScoreSubmit()} type="button">
                          提交本局战绩
                        </button>
                        <button className="ghost-button small" onClick={() => setShowProfileEditor(true)} type="button">
                          修改档案
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <LeaderboardPanel entries={leaderboard.slice(0, 6)} source={leaderboardSource} submittedEntry={submittedEntry} />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
