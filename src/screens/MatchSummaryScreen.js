import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Animated, Easing } from 'react-native';
import { Text, Button, Divider, Avatar, Portal, Dialog, IconButton } from 'react-native-paper';
import { Shield, Star, Trophy, RefreshCcw, Coins } from 'lucide-react-native';
import { useMatch } from '../context/MatchContext';
import { createMatch, addAppPlayer } from '../database/database';
import { COLORS, FONT_SIZES, BORDER_RADIUS } from '../DesignSystem';

const MatchSummaryScreen = ({ navigation }) => {
    const { setupData = {}, startMatch } = useMatch();

    const [tossWinner, setTossWinner] = useState(setupData?.teamA?.name || '');
    const [tossDecision, setTossDecision] = useState('bat');
    const [loading, setLoading] = useState(false);
    const [isFlipping, setIsFlipping] = useState(false);
    const [showResultDialog, setShowResultDialog] = useState(false);

    const flipAnim = useRef(new Animated.Value(0)).current;

    const handleFlip = () => {
        setIsFlipping(true);
        flipAnim.setValue(0);

        Animated.timing(flipAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            const winner = Math.random() > 0.5 ? setupData?.teamA?.name : setupData?.teamB?.name;
            setTossWinner(winner || '');
            setIsFlipping(false);
            setShowResultDialog(true);
        });
    };

    const rotateY = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '1800deg']
    });

    const flipScale = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.8, 1]
    });

    const handleStartMatch = async () => {
        setLoading(true);
        try {
            const matchData = {
                teamA: setupData.teamA.name,
                teamB: setupData.teamB.name,
                overs: setupData.overs,
                tossWinner: tossWinner,
                tossDecision: tossDecision,
                playersPerTeam: setupData.playersPerTeam,
                teamAData: setupData.teamA,
                teamBData: setupData.teamB,
                ground: setupData.ground || '',
                date: setupData.date || new Date().toLocaleString()
            };

            const matchId = await createMatch(matchData);

            // Save manual players to app_players if they are new and user opted to save
            if (setupData.saveTeamB !== false) {
                for (const p of (setupData.teamB?.players || [])) {
                    if (p.isManual) {
                        try {
                            const isCaptain = setupData.teamB.captain?.id === p.id;
                            const isWK = setupData.teamB.wicketkeeper?.id === p.id;
                            await addAppPlayer(
                                p.name, '', '', '', '', '', '', '',
                                isWK, '', isCaptain, setupData.teamB.name
                            );
                        } catch (e) {
                            console.log('Player might already exist or save failed', e);
                        }
                    }
                }
            }

            // Initialize global match state
            startMatch(matchId, matchData);

            // Success
            navigation.navigate('Scoring');
        } catch (error) {
            console.error('Failed to start match:', error);
            Alert.alert('Error', 'Failed to initialize match in database.');
        } finally {
            setLoading(false);
        }
    };

    const TeamSummary = ({ team, side }) => (
        <View style={styles.teamCard}>
            <View style={styles.teamHeader}>
                <Avatar.Icon
                    size={42}
                    icon="shield"
                    color="white"
                    style={{ backgroundColor: side === 'A' ? COLORS.primary : '#EF5350' }}
                />
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.teamTitle}>{team?.name || ''}</Text>
                    <Text style={styles.teamSubtitle}>{team?.players?.length || 0} Players</Text>
                </View>
            </View>
            <View style={styles.teamContent}>
                <View style={styles.rolesRow}>
                    <View style={styles.roleItem}>
                        <Star size={14} color={COLORS.primary} fill={COLORS.primary} />
                        <Text style={styles.roleLabel}>Captain:</Text>
                        <Text style={styles.roleName}>{team.captain?.name}</Text>
                    </View>
                    <View style={styles.roleItem}>
                        <Shield size={14} color="#2196F3" fill="#2196F3" />
                        <Text style={styles.roleLabel}>WK:</Text>
                        <Text style={styles.roleName}>{team.wicketkeeper?.name}</Text>
                    </View>
                </View>
                <Divider style={{ marginVertical: 12, backgroundColor: COLORS.surfaceVariant, opacity: 0.3 }} />
                <Text style={styles.playersTitle}>Playing XI</Text>
                <View style={styles.playersGrid}>
                    {(team.players || []).map((p, index) => (
                        <View key={p.id} style={styles.playerNameContainer}>
                            <Text style={styles.playerName} numberOfLines={1}>
                                {index + 1}. {p.name}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TeamSummary team={setupData.teamA} side="A" />
            <TeamSummary team={setupData.teamB} side="B" />

            <View style={styles.tossCard}>
                <View style={styles.tossCardContent}>
                    <View style={styles.tossHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Trophy size={20} color={COLORS.primary} />
                            <Text style={styles.tossTitle}>Match Setup</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.flipBtn, isFlipping && styles.flipBtnDisabled]}
                            onPress={handleFlip}
                            disabled={isFlipping}
                        >
                            <RefreshCcw size={16} color="white" />
                            <Text style={styles.flipBtnText}>Flip Coin</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.oversBadge}>
                        <Text style={styles.oversLabel}>Total Overs</Text>
                        <Text style={styles.oversValue}>{setupData?.overs || 10} Overs</Text>
                    </View>

                    {isFlipping ? (
                        <View style={styles.flipAnimationZone}>
                            <Animated.View style={[
                                styles.coin,
                                {
                                    transform: [
                                        { rotateY: rotateY },
                                        { scale: flipScale }
                                    ]
                                }
                            ]}>
                                <Coins size={64} color={COLORS.primary} />
                            </Animated.View>
                            <Text style={styles.flippingText}>The coin is in the air...</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.tossStatusBox}>
                                <Text style={styles.tossStatusText}>
                                    {tossWinner ? `${tossWinner} won the toss and chose to ${tossDecision === 'bat' ? 'Bat' : 'Bowl'}` : 'Toss not yet flipped'}
                                </Text>
                            </View>
                            <View style={styles.tossControls}>
                                <Text style={styles.label}>Toss Winner</Text>
                                <View style={styles.customSegmented}>
                                    <TouchableOpacity
                                        style={[styles.segmentBtn, tossWinner === setupData?.teamA?.name && styles.segmentBtnActive]}
                                        onPress={() => setTossWinner(setupData?.teamA?.name || '')}
                                    >
                                        <Text style={[styles.segmentBtnText, tossWinner === setupData?.teamA?.name && styles.segmentBtnTextActive]}>
                                            {setupData?.teamA?.name || 'Team A'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.segmentBtn, tossWinner === setupData?.teamB?.name && styles.segmentBtnActive]}
                                        onPress={() => setTossWinner(setupData?.teamB?.name || '')}
                                    >
                                        <Text style={[styles.segmentBtnText, tossWinner === setupData?.teamB?.name && styles.segmentBtnTextActive]}>
                                            {setupData?.teamB?.name || 'Team B'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.label, { marginTop: 20 }]}>Decision</Text>
                                <View style={styles.customSegmented}>
                                    <TouchableOpacity
                                        style={[styles.segmentBtn, tossDecision === 'bat' && styles.segmentBtnActive]}
                                        onPress={() => setTossDecision('bat')}
                                    >
                                        <Text style={[styles.segmentBtnText, tossDecision === 'bat' && styles.segmentBtnTextActive]}>
                                            Batting
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.segmentBtn, tossDecision === 'bowl' && styles.segmentBtnActive]}
                                        onPress={() => setTossDecision('bowl')}
                                    >
                                        <Text style={[styles.segmentBtnText, tossDecision === 'bowl' && styles.segmentBtnTextActive]}>
                                            Bowling
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </View>

            <Button
                mode="contained"
                onPress={handleStartMatch}
                style={styles.startBtn}
                contentStyle={{ height: 60 }}
                loading={loading}
                disabled={loading || isFlipping}
                labelStyle={{ fontSize: 18, fontWeight: '700', letterSpacing: 1 }}
            >
                Start Match
            </Button>

            <Portal>
                <Dialog visible={showResultDialog} onDismiss={() => setShowResultDialog(false)} style={styles.dialog}>
                    <View style={styles.dialogHeader}>
                        <Dialog.Title style={styles.dialogTitle}>Toss Result</Dialog.Title>
                        <IconButton icon="close" size={24} onPress={() => setShowResultDialog(false)} />
                    </View>
                    <Dialog.Content style={styles.dialogContent}>
                        <View style={styles.resultIconContainer}>
                            <Trophy size={48} color={COLORS.primary} />
                        </View>
                        <Text style={styles.resultText}>
                            Congratulations!
                        </Text>
                        <Text style={styles.resultWinnerName}>
                            {tossWinner}
                        </Text>
                        <Text style={styles.resultSubtext}>
                            Won the toss. Please select the decision below.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            mode="contained"
                            onPress={() => setShowResultDialog(false)}
                            style={styles.dialogBtn}
                            buttonColor={COLORS.primary}
                        >
                            Select Decision
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 16 },
    teamCard: {
        marginBottom: 16,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.surfaceContainerLow,
        overflow: 'hidden',
        elevation: 0
    },
    teamHeader: {
        padding: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceContainerHigh
    },
    teamTitle: { fontSize: 18, fontWeight: '800', color: COLORS.onBackground },
    teamSubtitle: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '600' },
    teamContent: { padding: 16 },
    rolesRow: { flexDirection: 'row', justifyContent: 'space-between' },
    roleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    roleLabel: { fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '600', textTransform: 'uppercase' },
    roleName: { fontSize: 12, fontWeight: '700', color: COLORS.onBackground },
    playersTitle: { fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.2 },
    playersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    playerNameContainer: {
        backgroundColor: COLORS.surfaceContainerLowest,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.md,
        width: '48%',
    },
    playerName: { fontSize: 13, color: COLORS.onBackground, fontWeight: '500' },
    tossCard: {
        marginBottom: 24,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.surfaceContainerLow,
        overflow: 'hidden'
    },
    tossCardContent: { padding: 20 },
    tossHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    tossTitle: { fontSize: 20, fontWeight: '800', color: COLORS.onBackground, marginLeft: 10 },
    resultBanner: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    resultBannerText: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    flipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: BORDER_RADIUS.lg,
        elevation: 2
    },
    flipBtnDisabled: { opacity: 0.6 },
    flipBtnText: { color: 'white', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
    oversBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceContainerLowest,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: 18,
        paddingVertical: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.surfaceContainerHigh
    },
    oversLabel: { fontSize: 14, color: COLORS.onSurfaceVariant, fontWeight: '700', flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
    oversValue: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
    oversValue: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
    tossStatusBox: {
        backgroundColor: COLORS.surfaceContainerLowest,
        borderRadius: BORDER_RADIUS.lg,
        padding: 12,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary + '20',
    },
    tossStatusText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
        textAlign: 'center',
    },
    tossControls: { marginTop: 10 },
    label: { fontSize: 12, fontWeight: '800', color: COLORS.onSurfaceVariant, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    customSegmented: {
        flexDirection: 'row',
        backgroundColor: COLORS.surfaceContainerHigh,
        borderRadius: BORDER_RADIUS.lg,
        padding: 5,
        gap: 5
    },
    segmentBtn: {
        flex: 1,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.md
    },
    segmentBtnActive: {
        backgroundColor: COLORS.surfaceContainerLowest,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3
    },
    segmentBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.onSurfaceVariant
    },
    segmentBtnTextActive: {
        color: COLORS.primary,
        fontWeight: '900'
    },
    flipAnimationZone: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceContainerHigh,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 2,
        borderColor: COLORS.surfaceContainerLow,
        borderStyle: 'dashed'
    },
    coin: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.surfaceContainerLowest,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        borderWidth: 4,
        borderColor: COLORS.primary + '20'
    },
    flippingText: {
        marginTop: 24,
        fontSize: 14,
        color: COLORS.onSurfaceVariant,
        fontWeight: '600',
        letterSpacing: 0.5
    },
    startBtn: {
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.primary,
        marginBottom: 30,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    dialog: {
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.surfaceContainerLowest,
    },
    dialogHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 8,
    },
    dialogTitle: {
        fontWeight: '800',
        color: COLORS.onBackground,
    },
    dialogContent: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    resultIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    resultText: {
        fontSize: 16,
        color: COLORS.onSurfaceVariant,
        fontWeight: '600',
    },
    resultWinnerName: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.primary,
        marginVertical: 4,
    },
    resultSubtext: {
        fontSize: 13,
        color: COLORS.onSurfaceVariant,
        textAlign: 'center',
        marginTop: 8,
    },
    dialogBtn: {
        flex: 1,
        borderRadius: BORDER_RADIUS.lg,
        height: 48,
        justifyContent: 'center',
    }
});

export default MatchSummaryScreen;
