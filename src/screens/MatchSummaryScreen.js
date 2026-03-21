import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, Card, useTheme, Divider, Avatar } from 'react-native-paper';
import { Shield, Star, Trophy } from 'lucide-react-native';
import { useMatch } from '../context/MatchContext';
import { createMatch, addAppPlayer } from '../database/database';

const MatchSummaryScreen = ({ navigation }) => {
    const theme = useTheme();
    const { setupData = {}, startMatch } = useMatch();

    const [tossWinner, setTossWinner] = useState(setupData?.teamA?.name || '');
    const [tossDecision, setTossDecision] = useState('bat');
    const [loading, setLoading] = useState(false);

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
        <Card style={styles.teamCard}>
            <Card.Title
                title={team?.name || ''}
                subtitle={`${team?.players?.length || 0} Players`}
                left={(props) => <Avatar.Icon {...props} icon="shield" color="white" style={{ backgroundColor: side === 'A' ? '#4C8C4A' : '#EF5350' }} />}
            />
            <Card.Content>
                <View style={styles.rolesRow}>
                    <View style={styles.roleItem}>
                        <Star size={16} color="#4C8C4A" fill="#4C8C4A" />
                        <Text style={styles.roleLabel}>Captain:</Text>
                        <Text style={styles.roleName}>{team.captain?.name}</Text>
                    </View>
                    <View style={styles.roleItem}>
                        <Shield size={16} color="#2196F3" fill="#2196F3" />
                        <Text style={styles.roleLabel}>WK:</Text>
                        <Text style={styles.roleName}>{team.wicketkeeper?.name}</Text>
                    </View>
                </View>
                <Divider style={{ marginVertical: 8 }} />
                <Text style={styles.playersTitle}>Playing XI:</Text>
                <View style={styles.playersGrid}>
                    {(team.players || []).map((p, index) => (
                        <Text key={p.id} style={styles.playerName}>
                            {index + 1}. {p.name}
                        </Text>
                    ))}
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            <TeamSummary team={setupData.teamA} side="A" />
            <TeamSummary team={setupData.teamB} side="B" />

            <Card style={styles.tossCard}>
                <Card.Content>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Trophy size={20} color="#4C8C4A" />
                        <Text style={styles.tossTitle}>Toss Details</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, color: '#666', fontWeight: '600', flex: 1 }}>Total Overs</Text>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#1B4D3E' }}>{setupData?.overs || 10}</Text>
                    </View>

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

                    <Text style={[styles.label, { marginTop: 16 }]}>Decision</Text>
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
                </Card.Content>
            </Card>

            <Button
                mode="contained"
                onPress={handleStartMatch}
                style={styles.startBtn}
                contentStyle={{ height: 56 }}
                loading={loading}
                disabled={loading}
            >
                Start Match
            </Button>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF9' },
    content: { padding: 16 },
    title: { fontSize: 24, fontWeight: '800', color: '#1B4D3E', marginBottom: 16, marginLeft: 8 },
    teamCard: { marginBottom: 16, borderRadius: 16, elevation: 2, backgroundColor: 'white' },
    rolesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    roleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    roleLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
    roleName: { fontSize: 13, fontWeight: '700', color: '#1B4D3E' },
    playersTitle: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 4 },
    playersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    playerName: { fontSize: 12, color: '#1B4D3E', width: '45%' },
    tossCard: { marginBottom: 24, borderRadius: 16, elevation: 2, backgroundColor: 'white' },
    tossTitle: { fontSize: 18, fontWeight: '700', color: '#1B4D3E', marginLeft: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
    customSegmented: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 4,
        gap: 4
    },
    segmentBtn: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10
    },
    segmentBtnActive: {
        backgroundColor: 'white',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    segmentBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666'
    },
    segmentBtnTextActive: {
        color: '#4C8C4A',
        fontWeight: '700'
    },
    startBtn: { borderRadius: 12, backgroundColor: '#4C8C4A', elevation: 4 }
});

export default MatchSummaryScreen;
