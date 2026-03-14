import React, { useState, useCallback } from 'react';
import {
    View, StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import { Text, Card, Avatar, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import {
    User, TrendingUp, Target, Shield, Activity,
    BarChart2, Award, Calendar
} from 'lucide-react-native';
import { getAllMatchStates } from '../database/database';

// ── helpers ──────────────────────────────────────────────────────────────────

const normalize = (name) => (name || '').trim().toLowerCase();

const oversString = (overs, balls) => `${overs}.${balls}`;

const economy = (runs, overs, balls) => {
    const total = overs + balls / 6;
    return total > 0 ? (runs / total).toFixed(2) : '0.00';
};

const strikeRate = (runs, balls) =>
    balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';

// ── main component ────────────────────────────────────────────────────────────

const PlayerStatsScreen = ({ route }) => {
    const { player } = route.params;

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentMatches, setRecentMatches] = useState([]);

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [])
    );

    const loadStats = async () => {
        setLoading(true);
        try {
            const matches = await getAllMatchStates();
            const playerName = normalize(player.name);

            // Aggregated batting
            let totalRuns = 0;
            let totalBalls = 0;
            let totalFours = 0;
            let totalSixes = 0;
            let totalFifties = 0;
            let totalHundreds = 0;
            let highestScore = 0;
            let matchesAsPlayer = 0;

            // Aggregated bowling
            let totalOvers = 0;
            let totalBowlingBalls = 0;
            let totalRunsConceded = 0;
            let totalWickets = 0;
            let bestWickets = 0;
            let bestRuns = 9999;

            const recent = [];

            for (const match of matches) {
                if (!match.state_json) continue;

                let state;
                try {
                    state = JSON.parse(match.state_json);
                } catch {
                    continue;
                }

                const inningsDetails = state.inningsDetails;
                if (!inningsDetails) continue;

                let appearedInMatch = false;
                let matchBatRuns = null;
                let matchBatBalls = null;
                let matchBowlWickets = null;
                let matchBowlRuns = null;
                let matchBowlOvers = null;
                let matchBowlBalls = null;

                // ── batting ──
                for (const inningNum of [1, 2]) {
                    const inning = inningsDetails[inningNum];
                    if (!inning || !inning.batsmenStats) continue;

                    for (const [batName, bat] of Object.entries(inning.batsmenStats)) {
                        if (normalize(batName) !== playerName) continue;

                        appearedInMatch = true;
                        const runs = bat.runs || 0;
                        const balls = bat.balls || 0;
                        const fours = bat.fours || 0;
                        const sixes = bat.sixes || 0;

                        totalRuns += runs;
                        totalBalls += balls;
                        totalFours += fours;
                        totalSixes += sixes;
                        if (runs >= 100) totalHundreds++;
                        else if (runs >= 50) totalFifties++;
                        if (runs > highestScore) highestScore = runs;

                        // track for recent
                        if (matchBatRuns === null || runs > matchBatRuns) {
                            matchBatRuns = runs;
                            matchBatBalls = balls;
                        }
                    }
                }

                // ── bowling ──
                for (const inningNum of [1, 2]) {
                    const inning = inningsDetails[inningNum];
                    if (!inning || !inning.bowlerStats) continue;

                    for (const [bowlName, bowl] of Object.entries(inning.bowlerStats)) {
                        if (normalize(bowlName) !== playerName) continue;

                        appearedInMatch = true;
                        const w = bowl.wickets || 0;
                        const r = bowl.runs || 0;
                        const o = bowl.overs || 0;
                        const b = bowl.balls || 0;

                        totalRunsConceded += r;
                        totalWickets += w;
                        totalOvers += o;
                        totalBowlingBalls += b;

                        // normalise bowling balls to full overs
                        if (totalBowlingBalls >= 6) {
                            totalOvers += Math.floor(totalBowlingBalls / 6);
                            totalBowlingBalls = totalBowlingBalls % 6;
                        }

                        // best bowling: most wickets first, then fewest runs
                        if (
                            w > bestWickets ||
                            (w === bestWickets && r < bestRuns && bestWickets > 0)
                        ) {
                            bestWickets = w;
                            bestRuns = r;
                        }

                        if (matchBowlWickets === null || w > matchBowlWickets) {
                            matchBowlWickets = w;
                            matchBowlRuns = r;
                            matchBowlOvers = o;
                            matchBowlBalls = b;
                        }
                    }
                }

                if (appearedInMatch) {
                    matchesAsPlayer++;
                    recent.push({
                        id: match.id,
                        teamA: match.teamA,
                        teamB: match.teamB,
                        date: match.date,
                        result: state.matchResult || '',
                        batRuns: matchBatRuns,
                        batBalls: matchBatBalls,
                        bowlWickets: matchBowlWickets,
                        bowlRuns: matchBowlRuns,
                        bowlOvers: matchBowlOvers,
                        bowlBalls: matchBowlBalls,
                    });
                }
            }

            const bestBowling =
                bestWickets > 0 ? `${bestWickets}/${bestRuns}` : '—';

            setStats({
                matchesPlayed: matchesAsPlayer,
                // batting
                totalRuns,
                totalBalls,
                totalFours,
                totalSixes,
                totalFifties,
                totalHundreds,
                highestScore,
                // bowling
                totalOvers,
                totalBowlingBalls,
                totalRunsConceded,
                totalWickets,
                bestBowling,
            });

            setRecentMatches(recent.slice(0, 5));
        } catch (error) {
            console.error('Failed to load player stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── render helpers ────────────────────────────────────────────────────────

    const StatItem = ({ label, value, accent, dark }) => (
        <View style={[styles.statItem, dark && styles.statItemDark]}>
            <Text style={[
                styles.statValue,
                dark && { color: accent ? '#A5D6A7' : 'white' },
                !dark && accent && { color: '#4C8C4A' }
            ]}>{value}</Text>
            <Text style={[styles.statLabel, dark && { color: 'rgba(255,255,255,0.6)' }]}>{label}</Text>
        </View>
    );

    const SectionHeader = ({ icon: Icon, title, color = '#1B4D3E' }) => (
        <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: color + '18' }]}>
                <Icon size={18} color={color} />
            </View>
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
        </View>
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // ── loading ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4C8C4A" />
                <Text style={styles.loadingText}>Computing stats…</Text>
            </View>
        );
    }

    const s = stats || {};
    const bowlOversStr = `${s.totalOvers || 0}.${s.totalBowlingBalls || 0}`;
    const eco = economy(s.totalRunsConceded || 0, s.totalOvers || 0, s.totalBowlingBalls || 0);
    const sr = strikeRate(s.totalRuns || 0, s.totalBalls || 0);

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* ── Player Header ── */}
            <View style={styles.profileHeader}>
                <View style={styles.avatarWrap}>
                    {player.image_uri ? (
                        <Avatar.Image size={72} source={{ uri: player.image_uri }} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <User size={36} color="#4C8C4A" />
                        </View>
                    )}
                    {player.is_captain === 1 && (
                        <View style={styles.captainBadge}>
                            <Text style={styles.captainBadgeText}>C</Text>
                        </View>
                    )}
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    {player.role && <Text style={styles.playerRole}>{player.role}</Text>}
                    <View style={styles.profileBadgesRow}>
                        {player.jersey_number ? (
                            <View style={styles.profileBadge}>
                                <Text style={styles.profileBadgeText}>#{player.jersey_number}</Text>
                            </View>
                        ) : null}
                        {player.batting_style ? (
                            <View style={styles.profileBadge}>
                                <Text style={styles.profileBadgeText}>
                                    {player.batting_style === 'Right Hand' ? 'RHB' : 'LHB'}
                                </Text>
                            </View>
                        ) : null}
                        {player.bowling_style ? (
                            <View style={styles.profileBadge}>
                                <Text style={styles.profileBadgeText}>
                                    {player.bowling_style.split(' ').map(w => w[0]).join('')}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>

            {/* ── Summary Card ── */}
            <Card style={styles.summaryCard}>
                <Card.Content>
                    <SectionHeader icon={Award} title="Career Summary" color="#ffffff" />
                    <View style={styles.statsGrid}>
                        <StatItem label="Matches" value={s.matchesPlayed || 0} dark />
                        <StatItem label="Total Runs" value={s.totalRuns || 0} dark accent />
                        <StatItem label="Total Wkts" value={s.totalWickets || 0} dark accent />
                        <StatItem label="Highest" value={s.highestScore || 0} dark />
                        <StatItem label="Best Bowling" value={s.bestBowling || '—'} dark />
                    </View>
                </Card.Content>
            </Card>

            {/* ── Batting Stats ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <SectionHeader icon={TrendingUp} title="Batting Statistics" color="#2E7D32" />
                    <Divider style={styles.divider} />
                    <View style={styles.statsGrid}>
                        <StatItem label="Runs" value={s.totalRuns || 0} accent />
                        <StatItem label="Balls" value={s.totalBalls || 0} />
                        <StatItem label="Strike Rate" value={sr} />
                        <StatItem label="Fours" value={s.totalFours || 0} />
                        <StatItem label="Sixes" value={s.totalSixes || 0} />
                        <StatItem label="50s" value={s.totalFifties || 0} />
                        <StatItem label="100s" value={s.totalHundreds || 0} />
                        <StatItem label="Highest" value={s.highestScore || 0} />
                    </View>
                </Card.Content>
            </Card>

            {/* ── Bowling Stats ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <SectionHeader icon={Target} title="Bowling Statistics" color="#1565C0" />
                    <Divider style={styles.divider} />
                    <View style={styles.statsGrid}>
                        <StatItem label="Overs" value={bowlOversStr} />
                        <StatItem label="Runs Given" value={s.totalRunsConceded || 0} />
                        <StatItem label="Wickets" value={s.totalWickets || 0} accent />
                        <StatItem label="Economy" value={eco} />
                        <StatItem label="Best" value={s.bestBowling || '—'} />
                        <StatItem label="Maidens" value="—" />
                    </View>
                </Card.Content>
            </Card>

            {/* ── Fielding Stats ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <SectionHeader icon={Shield} title="Fielding Statistics" color="#6A1B9A" />
                    <Divider style={styles.divider} />
                    <Text style={styles.fieldingNote}>
                        Fielding data is not yet tracked in this version.
                    </Text>
                    <View style={styles.statsGrid}>
                        <StatItem label="Catches" value="—" />
                        <StatItem label="Run Outs" value="—" />
                        <StatItem label="Stumpings" value="—" />
                    </View>
                </Card.Content>
            </Card>

            {/* ── Recent Matches ── */}
            <Card style={[styles.card, { marginBottom: 32 }]}>
                <Card.Content>
                    <SectionHeader icon={Calendar} title="Recent Matches" color="#E65100" />
                    <Divider style={styles.divider} />

                    {recentMatches.length === 0 ? (
                        <View style={styles.emptyMatches}>
                            <Activity size={32} color="#ccc" />
                            <Text style={styles.emptyMatchesText}>No match history found</Text>
                        </View>
                    ) : (
                        recentMatches.map((m, idx) => (
                            <View key={m.id} style={[styles.recentRow, idx < recentMatches.length - 1 && styles.recentRowBorder]}>
                                <View style={styles.recentLeft}>
                                    <Text style={styles.recentMatchup} numberOfLines={1}>
                                        {m.teamA} vs {m.teamB}
                                    </Text>
                                    <Text style={styles.recentDate}>{formatDate(m.date)}</Text>
                                    {m.result ? (
                                        <Text style={styles.recentResult} numberOfLines={1}>{m.result}</Text>
                                    ) : null}
                                </View>
                                <View style={styles.recentRight}>
                                    {m.batRuns !== null && (
                                        <View style={styles.recentStatChip}>
                                            <TrendingUp size={11} color="#2E7D32" />
                                            <Text style={styles.recentChipText}>
                                                {m.batRuns}
                                                {m.batBalls !== null ? `(${m.batBalls})` : ''}
                                            </Text>
                                        </View>
                                    )}
                                    {m.bowlWickets !== null && (
                                        <View style={[styles.recentStatChip, { backgroundColor: '#E3F2FD' }]}>
                                            <Target size={11} color="#1565C0" />
                                            <Text style={[styles.recentChipText, { color: '#1565C0' }]}>
                                                {m.bowlWickets}/{m.bowlRuns}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </Card.Content>
            </Card>

        </ScrollView>
    );
};

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F2' },
    content: { padding: 16 },

    // loading
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F2' },
    loadingText: { marginTop: 12, color: '#666', fontSize: 15 },

    // player header
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1B4D3E',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 4,
    },
    avatarWrap: { position: 'relative', marginRight: 16 },
    avatarFallback: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#A5D6A7',
    },
    captainBadge: {
        position: 'absolute', bottom: 0, right: -4,
        backgroundColor: '#FBC02D', borderRadius: 10, width: 20, height: 20,
        justifyContent: 'center', alignItems: 'center',
    },
    captainBadgeText: { color: '#333', fontSize: 11, fontWeight: 'bold' },
    profileInfo: { flex: 1 },
    playerName: { color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 2 },
    playerRole: { color: '#A5D6A7', fontSize: 13, marginBottom: 8 },
    profileBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    profileBadge: {
        backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 8,
    },
    profileBadgeText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },

    // summary card
    summaryCard: {
        borderRadius: 16, marginBottom: 16, elevation: 4,
        backgroundColor: '#1B4D3E',
    },

    // generic card
    card: {
        borderRadius: 16, marginBottom: 16, elevation: 3, backgroundColor: 'white',
    },

    // section header
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionIconBg: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '700' },

    divider: { marginBottom: 14, backgroundColor: '#F0F4F2', height: 1.5 },

    // stats grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statItem: {
        width: '30%', alignItems: 'center',
        backgroundColor: '#F8FAF9', borderRadius: 10, paddingVertical: 10,
        marginBottom: 10,
    },
    statValue: { fontSize: 20, fontWeight: '800', color: '#1B4D3E' },
    statLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '600', textAlign: 'center' },
    statItemDark: { backgroundColor: 'rgba(255,255,255,0.12)' },

    // summary card overrides (white text on dark bg)
    fieldingNote: { fontSize: 12, color: '#999', marginBottom: 12, fontStyle: 'italic' },

    // recent matches
    emptyMatches: { alignItems: 'center', paddingVertical: 24 },
    emptyMatchesText: { color: '#bbb', marginTop: 8, fontSize: 14 },
    recentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    recentRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F4F2' },
    recentLeft: { flex: 1, paddingRight: 12 },
    recentMatchup: { fontSize: 14, fontWeight: '700', color: '#1B4D3E' },
    recentDate: { fontSize: 11, color: '#999', marginTop: 2 },
    recentResult: { fontSize: 11, color: '#4C8C4A', marginTop: 2, fontWeight: '600' },
    recentRight: { gap: 6, alignItems: 'flex-end' },
    recentStatChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    recentChipText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
});

export default PlayerStatsScreen;
