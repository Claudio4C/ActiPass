import React from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';

type LoyaltyLevelKey = 'rookie' | 'warrior' | 'champion' | 'legend';

type LoyaltyLevel = {
    key: LoyaltyLevelKey;
    name: string;
    minPoints: number;
    gradient: string;
};

type LoyaltyStatus = {
    points: number;
    credits: number;
    streak: number;
    bestStreak: number;
    boosters: number;
    lastAttendance: string | null;
    level: LoyaltyLevelKey;
};

type Challenge = {
    id: string;
    title: string;
    description: string;
    points: number;
    frequency: 'daily' | 'weekly';
    bonusBoosters?: number;
};

type ChallengeState = Challenge & {
    lastCompleted: string | null;
};

type Reward = {
    id: string;
    name: string;
    cost: number;
    type: 'reduction' | 'merch';
    highlight?: string;
};

type LoyaltyAchievement = {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
};

const loyaltyLevels: LoyaltyLevel[] = [
    {
        key: 'rookie',
        name: 'Rookie',
        minPoints: 0,
        gradient: 'from-slate-300 via-slate-200 to-slate-100',
    },
    {
        key: 'warrior',
        name: 'Warrior',
        minPoints: 180,
        gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    },
    {
        key: 'champion',
        name: 'Champion',
        minPoints: 360,
        gradient: 'from-amber-400 via-orange-500 to-red-500',
    },
    {
        key: 'legend',
        name: 'Legend',
        minPoints: 600,
        gradient: 'from-emerald-400 via-green-500 to-teal-500',
    },
];

const mockChallenges: Challenge[] = [
    {
        id: 'daily-checkin',
        title: 'Présence du jour',
        description: 'Valide ta présence à l’entraînement du jour.',
        points: 25,
        frequency: 'daily',
    },
    {
        id: 'weekly-triple',
        title: 'Triple session',
        description: 'Participe à 3 entraînements dans la semaine.',
        points: 60,
        frequency: 'weekly',
        bonusBoosters: 1,
    },
    {
        id: 'partner-invite',
        title: 'Invite un partenaire',
        description: 'Amène un partenaire d’entraînement pour un cours.',
        points: 40,
        frequency: 'weekly',
    },
];

const mockRewards: Reward[] = [
    { id: 'discount-10', name: '-10% sur l’adhésion du mois prochain', cost: 120, type: 'reduction' },
    { id: 'rashguard', name: 'Rashguard édition limitée', cost: 240, type: 'merch', highlight: 'Collection 2025' },
    { id: 'private-session', name: 'Coaching privé 30 min', cost: 320, type: 'reduction' },
    { id: 'bundle', name: 'Pack merchandising (t-shirt + gourde)', cost: 180, type: 'merch' },
];

const LOYALTY_STATUS_STORAGE_KEY = 'club.loyaltyStatus';
const LOYALTY_CHALLENGES_STORAGE_KEY = 'club.loyaltyChallenges';

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);
const getTodayKey = () => formatDateKey(new Date());

const computeLevelKey = (points: number): LoyaltyLevelKey => {
    const level =
        [...loyaltyLevels]
            .sort((a, b) => b.minPoints - a.minPoints)
            .find((lvl) => points >= lvl.minPoints) ?? loyaltyLevels[0];
    return level.key;
};

const hydrateLoyaltyStatus = (): LoyaltyStatus => {
    const base: LoyaltyStatus = {
        points: 260,
        credits: 120,
        streak: 2,
        bestStreak: 6,
        boosters: 1,
        lastAttendance: null,
        level: computeLevelKey(260),
    };
    if (typeof window === 'undefined') {
        return base;
    }
    try {
        const stored = window.localStorage.getItem(LOYALTY_STATUS_STORAGE_KEY);
        if (!stored) return base;
        const parsed = JSON.parse(stored) as Partial<LoyaltyStatus>;
        if (!parsed) return base;
        const points = typeof parsed.points === 'number' ? parsed.points : base.points;
        return {
            points,
            credits: typeof parsed.credits === 'number' ? parsed.credits : base.credits,
            streak: typeof parsed.streak === 'number' ? parsed.streak : base.streak,
            bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : base.bestStreak,
            boosters: typeof parsed.boosters === 'number' ? parsed.boosters : base.boosters,
            lastAttendance: typeof parsed.lastAttendance === 'string' ? parsed.lastAttendance : base.lastAttendance,
            level: computeLevelKey(points),
        };
    } catch (error) {
        console.error('Impossible de charger le statut fidélité', error);
        return base;
    }
};

const hydrateChallengeState = (): ChallengeState[] => {
    const fallback = mockChallenges.map((challenge) => ({
        ...challenge,
        lastCompleted: null,
    }));
    if (typeof window === 'undefined') {
        return fallback;
    }
    try {
        const stored = window.localStorage.getItem(LOYALTY_CHALLENGES_STORAGE_KEY);
        if (!stored) return fallback;
        const parsed = JSON.parse(stored) as Array<{ id: string; lastCompleted: string | null }>;
        if (!Array.isArray(parsed)) return fallback;
        return mockChallenges.map((challenge) => {
            const saved = parsed.find((item) => item.id === challenge.id);
            return {
                ...challenge,
                lastCompleted: saved?.lastCompleted ?? null,
            };
        });
    } catch (error) {
        console.error('Impossible de charger les défis fidélité', error);
        return fallback;
    }
};

const LoyaltyPage: React.FC = () => {
    const { user } = useAuth();
    const [loyaltyStatus, setLoyaltyStatus] = React.useState<LoyaltyStatus>(() => hydrateLoyaltyStatus());
    const [challengeStates, setChallengeStates] = React.useState<ChallengeState[]>(() => hydrateChallengeState());
    const [loyaltyHighlight, setLoyaltyHighlight] = React.useState<string | null>(null);
    const [recentReward, setRecentReward] = React.useState<string | null>(null);

    const qrPayload = React.useMemo(() => {
        const today = getTodayKey();
        const userId = user?.id ?? 'guest';
        return JSON.stringify({
            type: 'loyalty-checkin',
            userId,
            date: today,
        });
    }, [user?.id]);

    const qrUrl = React.useMemo(
        () => `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`,
        [qrPayload]
    );

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(LOYALTY_STATUS_STORAGE_KEY, JSON.stringify(loyaltyStatus));
        } catch (error) {
            console.error('Impossible de sauvegarder le statut fidélité', error);
        }
    }, [loyaltyStatus]);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const payload = challengeStates.map(({ id, lastCompleted }) => ({ id, lastCompleted }));
            window.localStorage.setItem(LOYALTY_CHALLENGES_STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
            console.error('Impossible de sauvegarder les défis fidélité', error);
        }
    }, [challengeStates]);

    React.useEffect(() => {
        if (!loyaltyHighlight) return;
        const timeout = setTimeout(() => setLoyaltyHighlight(null), 4000);
        return () => clearTimeout(timeout);
    }, [loyaltyHighlight]);

    const currentLevel = React.useMemo(() => {
        return [...loyaltyLevels]
            .sort((a, b) => b.minPoints - a.minPoints)
            .find((lvl) => loyaltyStatus.points >= lvl.minPoints) ?? loyaltyLevels[0];
    }, [loyaltyStatus.points]);

    const nextLevel = React.useMemo(() => {
        const currentIndex = loyaltyLevels.findIndex((lvl) => lvl.key === currentLevel.key);
        if (currentIndex === -1 || currentIndex + 1 >= loyaltyLevels.length) return null;
        return loyaltyLevels[currentIndex + 1];
    }, [currentLevel.key]);

    const progressToNext = nextLevel
        ? (loyaltyStatus.points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)
        : 1;
    const progressPercent = Math.min(100, Math.max(0, Math.round(progressToNext * 100)));
    const pointsToNext = nextLevel ? Math.max(0, nextLevel.minPoints - loyaltyStatus.points) : 0;
    const todayKey = getTodayKey();
    const hasCheckedInToday = loyaltyStatus.lastAttendance === todayKey;

    const challengesForToday = React.useMemo(
        () =>
            challengeStates.map((challenge) => ({
                ...challenge,
                completedToday: challenge.lastCompleted === todayKey,
            })),
        [challengeStates, todayKey]
    );

    const achievements = React.useMemo<LoyaltyAchievement[]>(() => {
        return [
            {
                id: 'streak-3',
                title: 'Routine lancée',
                description: 'Valide 3 jours consécutifs.',
                unlocked: loyaltyStatus.bestStreak >= 3,
            },
            {
                id: 'streak-7',
                title: 'Série de feu',
                description: 'Atteins une série de 7 jours.',
                unlocked: loyaltyStatus.bestStreak >= 7,
            },
            {
                id: 'points-400',
                title: 'Chasseur de points',
                description: 'Cumule 400 points de progression.',
                unlocked: loyaltyStatus.points >= 400,
            },
            {
                id: 'boost-master',
                title: 'Boost Master',
                description: 'Accumule au moins 3 boosters.',
                unlocked: loyaltyStatus.boosters >= 3,
            },
        ];
    }, [loyaltyStatus.bestStreak, loyaltyStatus.points, loyaltyStatus.boosters]);

    const rewardsWithAvailability = React.useMemo(
        () =>
            mockRewards.map((reward) => ({
                ...reward,
                available: loyaltyStatus.credits >= reward.cost,
            })),
        [loyaltyStatus.credits]
    );

    const upcomingReward = React.useMemo(() => {
        return mockRewards
            .filter((reward) => reward.cost > loyaltyStatus.credits)
            .sort((a, b) => a.cost - b.cost)[0] ?? null;
    }, [loyaltyStatus.credits]);

    const handleAttendance = React.useCallback(() => {
        const today = new Date();
        const todayKeyLocal = formatDateKey(today);
        let pointsAwarded = 0;
        let levelUpName: string | null = null;

        setLoyaltyStatus((prev) => {
            if (prev.lastAttendance === todayKeyLocal) {
                return prev;
            }
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const yesterdayKey = formatDateKey(yesterday);
            const consecutive = prev.lastAttendance === yesterdayKey;
            const newStreak = consecutive ? prev.streak + 1 : 1;
            const bestStreak = Math.max(prev.bestStreak, newStreak);
            const basePoints = 20;
            const consecutiveBonus = consecutive ? 5 : 0;
            const milestoneBonus = newStreak % 5 === 0 ? 15 : 0;
            pointsAwarded = basePoints + consecutiveBonus + milestoneBonus;
            const newPoints = prev.points + pointsAwarded;
            const previousLevelKey = computeLevelKey(prev.points);
            const newLevelKey = computeLevelKey(newPoints);
            if (newLevelKey !== previousLevelKey) {
                levelUpName = loyaltyLevels.find((lvl) => lvl.key === newLevelKey)?.name ?? null;
            }
            const boosterEarned = newLevelKey !== previousLevelKey ? 1 : 0;
            return {
                ...prev,
                points: newPoints,
                credits: prev.credits + pointsAwarded,
                streak: newStreak,
                bestStreak,
                lastAttendance: todayKeyLocal,
                boosters: prev.boosters + boosterEarned,
                level: newLevelKey,
            };
        });

        if (pointsAwarded > 0) {
            if (levelUpName) {
                setLoyaltyHighlight(`Rang ${levelUpName} atteint !`);
            } else {
                setLoyaltyHighlight(`+${pointsAwarded} pts • Check-in quotidien validé`);
            }
        } else {
            setLoyaltyHighlight('Présence déjà validée pour aujourd’hui');
        }
    }, []);

    const handleCompleteChallenge = React.useCallback(
        (challengeId: string) => {
            const todayKeyLocal = getTodayKey();
            const challenge = challengeStates.find((item) => item.id === challengeId);
            if (!challenge) {
                setLoyaltyHighlight('Défi introuvable');
                return;
            }
            if (challenge.lastCompleted === todayKeyLocal) {
                setLoyaltyHighlight('Défi déjà validé aujourd’hui');
                return;
            }

            let levelUpName: string | null = null;
            const pointsAwarded = challenge.points;
            const bonusBoosters = challenge.bonusBoosters ?? 0;

            setChallengeStates((prev) =>
                prev.map((item) =>
                    item.id === challengeId ? { ...item, lastCompleted: todayKeyLocal } : item
                )
            );

            setLoyaltyStatus((prev) => {
                const newPoints = prev.points + pointsAwarded;
                const previousLevelKey = computeLevelKey(prev.points);
                const newLevelKey = computeLevelKey(newPoints);
                if (newLevelKey !== previousLevelKey) {
                    levelUpName = loyaltyLevels.find((lvl) => lvl.key === newLevelKey)?.name ?? null;
                }
                const additionalBoosters = bonusBoosters + (newLevelKey !== previousLevelKey ? 1 : 0);
                return {
                    ...prev,
                    points: newPoints,
                    credits: prev.credits + pointsAwarded,
                    boosters: prev.boosters + additionalBoosters,
                    level: newLevelKey,
                };
            });

            if (levelUpName) {
                setLoyaltyHighlight(`Rang ${levelUpName} atteint !`);
            } else {
                setLoyaltyHighlight(`+${pointsAwarded} pts • Défi “${challenge.title}”`);
            }
        },
        [challengeStates]
    );

    const handleRedeemReward = React.useCallback(
        (reward: Reward) => {
            if (loyaltyStatus.credits < reward.cost) {
                setLoyaltyHighlight('Crédits insuffisants pour cette récompense');
                return;
            }

            setLoyaltyStatus((prev) => ({
                ...prev,
                credits: prev.credits - reward.cost,
                level: computeLevelKey(prev.points),
            }));
            setRecentReward(reward.name);
            setLoyaltyHighlight(`-${reward.cost} crédits • ${reward.name}`);
        },
        [loyaltyStatus.credits]
    );

    return (
        <Layout
            title="Programme de fidélité"
            subtitle="Collecte tes points, valide tes présences et débloque du merchandising exclusif."
            mode="club"
        >
            <section className="relative mb-8">
                <div className="absolute -inset-x-10 top-6 h-40 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-amber-500/20 blur-3xl" />
                <div className="relative flex flex-col lg:flex-row items-center gap-6 rounded-3xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-white/60">
                    <div className="flex flex-col items-center gap-3">
                        <div className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-slate-100">
                            <img src={qrUrl} alt="QR code fidélité" className="h-44 w-44" />
                        </div>
                        <p className="text-xs text-slate-600 text-center max-w-[220px]">
                            Présente ce QR code à ton coach pour valider ta présence et débloquer les points du jour.
                        </p>
                    </div>
                    <div className="flex-1 space-y-3">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Salut {user?.firstName ?? 'membre'} 👋
                        </h2>
                        <p className="text-sm text-slate-600 leading-6">
                            Chaque scan confirme ta participation et alimente automatiquement ton compteur de points.
                            Les coachs peuvent aussi vérifier ta série de présences en temps réel. Pense à revenir sur cette page à chaque séance !
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <GlowPill variant="light" icon="rank">
                                Rang actuel&nbsp;: {currentLevel.name}
                            </GlowPill>
                            <GlowPill variant="outline" icon="credit">
                                {loyaltyStatus.credits} crédits cumulés
                            </GlowPill>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-12">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                        <div
                            className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-lg bg-gradient-to-br ${currentLevel.gradient}`}
                        >
                            <LoyaltyAura position="top-right" />
                            <LoyaltyAura position="bottom-left" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_55%)] pointer-events-none" />
                            <div className="relative">
                                <div className="flex flex-wrap items-center gap-3">
                                    <GlowPill variant="light" icon="rank">
                                        Rang {currentLevel.name}
                                    </GlowPill>
                                    <GlowPill variant="dark" icon="credit">
                                        {loyaltyStatus.credits} crédits disponibles
                                    </GlowPill>
                                </div>
                                <h3 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight">
                                    {loyaltyStatus.points} pts cumulés
                                </h3>
                                <p className="mt-2 text-sm text-white/85 max-w-xl leading-6">
                                    Continue d’enchaîner les entraînements pour faire grimper ton rang et débloquer des
                                    avantages exclusifs. Chaque présence valide ton combo et alimente ta jauge de crédits.
                                </p>
                                <div className="mt-6">
                                    <div className="flex items-center justify-between text-xs text-white/80">
                                        <span>
                                            Progression vers{' '}
                                            {nextLevel ? nextLevel.name : 'le rang ultime'}
                                        </span>
                                        <span>{nextLevel ? `${progressPercent}%` : 'Max atteint'}</span>
                                    </div>
                                    <div className="mt-2 h-2 rounded-full bg-white/25 overflow-hidden">
                                        <span
                                            className="block h-full rounded-full bg-white/90 transition-all duration-700 ease-out"
                                            style={{ width: `${nextLevel ? progressPercent : 100}%` }}
                                        />
                                    </div>
                                    {nextLevel ? (
                                        <p className="mt-2 text-xs text-white/75">
                                            Plus que <span className="font-semibold text-white">{pointsToNext} pts</span> pour atteindre le rang {nextLevel.name}.
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-xs text-white/80">Rang maximum atteint, tu es une légende vivante !</p>
                                    )}
                                </div>
                                {loyaltyHighlight ? (
                                    <div className="mt-6">
                                        <GlowPill variant="light" icon="spark">
                                            {loyaltyHighlight}
                                        </GlowPill>
                                    </div>
                                ) : null}
                                {recentReward ? (
                                    <div className="mt-3">
                                        <GlowPill variant="outline" icon="reward">
                                            Dernière récompense obtenue : {recentReward}
                                        </GlowPill>
                                    </div>
                                ) : null}
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="relative overflow-hidden rounded-2xl bg-white/15 px-4 py-3">
                                        <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full border border-white/30 opacity-60" style={{ animation: 'spin 18s linear infinite' }} />
                                        <p className="text-xs text-white/70">Combo actuel</p>
                                        <p className="mt-2 text-lg font-semibold">{loyaltyStatus.streak} jour{loyaltyStatus.streak > 1 ? 's' : ''}</p>
                                        <p className="text-[11px] text-white/70">Meilleur combo : {loyaltyStatus.bestStreak}</p>
                                    </div>
                                    <div className="relative overflow-hidden rounded-2xl bg-white/15 px-4 py-3">
                                        <div className="absolute inset-x-0 bottom-0 h-px bg-white/30" />
                                        <p className="text-xs text-white/70">Boosters</p>
                                        <p className="mt-2 text-lg font-semibold">{loyaltyStatus.boosters}</p>
                                        <p className="text-[11px] text-white/70">Déclenche un super bonus sur un défi</p>
                                    </div>
                                    <div className="relative overflow-hidden rounded-2xl bg-white/15 px-4 py-3">
                                        <div className="absolute -bottom-10 -left-6 h-20 w-20 rounded-full bg-white/20 blur-xl opacity-50" />
                                        <p className="text-xs text-white/70">Prochain cadeau</p>
                                        {upcomingReward ? (
                                            <p className="mt-2 text-sm font-semibold">
                                                {upcomingReward.name}
                                                <span className="block text-[11px] text-white/70">Encore {upcomingReward.cost - loyaltyStatus.credits} crédits</span>
                                            </p>
                                        ) : (
                                            <p className="mt-2 text-sm font-semibold">Tout est débloqué, bravo !</p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleAttendance}
                                        disabled={hasCheckedInToday}
                                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70 ${
                                            hasCheckedInToday
                                                ? 'bg-white/30 text-white/80 cursor-not-allowed'
                                                : 'bg-white text-indigo-600 hover:bg-white/90'
                                        }`}
                                    >
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 animate-ping" />
                                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                        </span>
                                        {hasCheckedInToday ? 'Présence validée' : 'Valider ma présence'}
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                        onClick={() => setLoyaltyHighlight('Les boosters arrivent bientôt !')}
                                    >
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.6}
                                        >
                                            <path d="M12 4v4M12 16v4M6 12H2M22 12h-4M7.8 7.8 5.6 5.6M18.4 18.4l-2.2-2.2M16.2 7.8l2.2-2.2M5.6 18.4l2.2-2.2" />
                                        </svg>
                                        Utiliser un booster
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="rounded-3xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-white/60">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Succès déverrouillés</h4>
                                <span className="text-xs text-slate-500">
                                    {achievements.filter((item) => item.unlocked).length}/{achievements.length}
                                </span>
                            </div>
                            <div className="mt-4 space-y-3">
                                {achievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 ${
                                            achievement.unlocked
                                                ? 'border-emerald-100 bg-emerald-50/70 text-emerald-700'
                                                : 'border-slate-200/70 bg-white text-slate-600'
                                        }`}
                                    >
                                        <span
                                            className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                                                achievement.unlocked ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                                            }`}
                                        >
                                            {achievement.unlocked ? '✓' : '…'}
                                        </span>
                                        <div>
                                            <p className="text-xs font-semibold">{achievement.title}</p>
                                            <p className="text-[11px]">{achievement.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-3xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-white/60">
                            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Récompenses flash</h4>
                            <p className="mt-2 text-xs text-slate-600">
                                Collecte des crédits pour débloquer du merch exclusif et des remises sur tes prochains paiements.
                            </p>
                            <ul className="mt-3 space-y-2 text-xs text-slate-600">
                                <li>• -10% dès 120 crédits</li>
                                <li>• Coaching privé à prix réduit à 320 crédits</li>
                                <li>• Pack merchandising collector pour les membres légendaires</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 rounded-3xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-white/60">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Défis gamifiés</h4>
                            <span className="text-xs text-slate-500">Nouveaux défis chaque semaine</span>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {challengesForToday.map((challenge) => (
                                <div
                                    key={challenge.id}
                                    className={`relative rounded-2xl border p-4 shadow-sm transition ${
                                        challenge.completedToday
                                            ? 'border-emerald-100 bg-emerald-50/70'
                                            : 'border-slate-200/60 bg-white'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{challenge.title}</p>
                                            <p className="mt-1 text-xs text-slate-500">{challenge.description}</p>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-600">
                                            {challenge.frequency === 'daily' ? 'Quotidien' : 'Hebdo'}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                        <span>+{challenge.points} pts</span>
                                        {challenge.bonusBoosters ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                                                +{challenge.bonusBoosters} booster
                                            </span>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCompleteChallenge(challenge.id)}
                                        disabled={challenge.completedToday}
                                        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 ${
                                            challenge.completedToday
                                                ? 'bg-emerald-500/90 text-white cursor-default'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                        }`}
                                    >
                                        {challenge.completedToday ? 'Défi validé' : 'Valider le défi'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-3xl bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-white/60">
                        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Boutique fidélité</h4>
                        <p className="mt-2 text-xs text-slate-600">
                            Utilise tes crédits pour récupérer des récompenses instantanées.
                        </p>
                        <div className="mt-4 space-y-3">
                            {rewardsWithAvailability.map((reward) => (
                                <div
                                    key={reward.id}
                                    className="rounded-2xl border border-slate-200/70 bg-white px-3 py-3 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{reward.name}</p>
                                            <p className="text-xs text-slate-500">Coût : {reward.cost} crédits</p>
                                            {reward.highlight ? (
                                                <p className="text-[11px] text-indigo-500">{reward.highlight}</p>
                                            ) : null}
                                        </div>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${
                                                reward.available ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                                            }`}
                                        >
                                            {reward.type === 'merch' ? 'Merch' : 'Réduc'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRedeemReward(reward)}
                                        disabled={!reward.available}
                                        className={`mt-3 inline-flex w-full items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 ${
                                            reward.available
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {reward.available ? 'Réclamer' : 'Pas encore disponible'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

type GlowPillVariant = 'light' | 'dark' | 'outline';
type GlowIcon = 'rank' | 'credit' | 'spark' | 'reward';

const GlowPill: React.FC<{
    variant: GlowPillVariant;
    icon?: GlowIcon;
    className?: string;
    children: React.ReactNode;
}> = ({ variant, icon, className, children }) => {
    const palette: Record<
        GlowPillVariant,
        { wrapper: string; halo: string; text: string; iconBg: string; iconColor: string }
    > = {
        light: {
            wrapper: 'bg-white/25 text-slate-900',
            halo: 'linear-gradient(120deg, rgba(255,255,255,0.65), rgba(255,255,255,0.18) 55%, rgba(255,255,255,0))',
            text: 'text-slate-800',
            iconBg: 'bg-white/35 border border-white/40',
            iconColor: 'text-indigo-700',
        },
        dark: {
            wrapper: 'bg-black/25 text-white',
            halo: 'linear-gradient(120deg, rgba(17,24,39,0.55), rgba(255,255,255,0.12), rgba(17,24,39,0.35))',
            text: 'text-white',
            iconBg: 'bg-black/40 border border-white/20',
            iconColor: 'text-white',
        },
        outline: {
            wrapper: 'bg-white/10 text-white border border-white/30',
            halo: 'linear-gradient(120deg, rgba(255,255,255,0.45), rgba(99,102,241,0.18), rgba(255,255,255,0))',
            text: 'text-white',
            iconBg: 'bg-white/20 border border-white/30',
            iconColor: 'text-white',
        },
    };

    const paletteConfig = palette[variant];

    const renderIcon = (kind?: GlowIcon) => {
        if (!kind) return null;
        switch (kind) {
            case 'rank':
                return (
                    <svg className={`h-3.5 w-3.5 ${paletteConfig.iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                        <path d="m12 5 1.9 3.9 4.3.6-3.1 3 0.7 4.3L12 15.8l-3.8 2 0.7-4.3-3.1-3 4.3-.6L12 5Z" />
                    </svg>
                );
            case 'credit':
                return (
                    <svg className={`h-3.5 w-3.5 ${paletteConfig.iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <rect x="3.5" y="7" width="17" height="12" rx="2.4" />
                        <path d="M3.5 10.5h17" />
                        <path d="M8 15h3" />
                    </svg>
                );
            case 'spark':
                return (
                    <svg className={`h-3.5 w-3.5 ${paletteConfig.iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                        <path d="M12 4v4M12 16v4M8 8l-3-3M19 19l-3-3M20 12h-4M8 12H4M16 8l3-3M8 16l-3 3" />
                    </svg>
                );
            case 'reward':
                return (
                    <svg className={`h-3.5 w-3.5 ${paletteConfig.iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M6 4h12v4.5A6 6 0 0 1 12 14a6 6 0 0 1-6-5.5V4ZM12 14v6M8.5 20h7" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <span
            className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full px-3 py-1 text-xs font-semibold ${paletteConfig.wrapper} ${className ?? ''}`}
        >
            <span
                className="pointer-events-none absolute -inset-1 rounded-full opacity-60 blur-md"
                style={{ backgroundImage: paletteConfig.halo }}
            />
            <span className={`relative inline-flex shrink-0 items-center justify-center rounded-full p-1 ${paletteConfig.iconBg}`}>
                {renderIcon(icon)}
            </span>
            <span className={`relative whitespace-pre-wrap ${paletteConfig.text}`}>{children}</span>
        </span>
    );
};

const LoyaltyAura: React.FC<{ position: 'top-right' | 'bottom-left' }> = ({ position }) => {
    const isTop = position === 'top-right';
    return (
        <div
            className="pointer-events-none absolute opacity-70"
            style={{
                top: isTop ? '-70px' : 'auto',
                right: isTop ? '-90px' : 'auto',
                bottom: isTop ? 'auto' : '-90px',
                left: isTop ? 'auto' : '-80px',
            }}
        >
            <div className="relative h-64 w-64">
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: isTop
                            ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.38), rgba(129,140,248,0.08))'
                            : 'radial-gradient(circle at 70% 70%, rgba(129,140,248,0.35), rgba(255,255,255,0.05))',
                        filter: 'blur(12px) saturate(130%)',
                        animation: 'spin 26s linear infinite',
                        animationDirection: isTop ? 'normal' : 'reverse',
                    }}
                />
                <div
                    className="absolute inset-4 rounded-full border border-white/25"
                    style={{
                        animation: 'spin 18s linear infinite',
                        animationDirection: isTop ? 'reverse' : 'normal',
                    }}
                />
                <div
                    className="absolute inset-10 rounded-full border border-white/10"
                    style={{
                        animation: 'spin 32s linear infinite',
                        animationDirection: isTop ? 'normal' : 'reverse',
                    }}
                />
            </div>
        </div>
    );
};

export default LoyaltyPage;

