import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Card, Text, Title, Paragraph, FAB, useTheme, TouchableRipple, Divider, Button } from 'react-native-paper';
import { Play, Plus, History, Trophy, TrendingUp, Settings, Trash2, User } from 'lucide-react-native';
import { getRecentMatches, clearAllData, deleteMatch } from '../database/database';
import { useMatch } from '../context/MatchContext';
import { useIsFocused } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
    const theme = useTheme();
    const isFocused = useIsFocused();
    const { resumeMatch } = useMatch();
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        if (isFocused) {
            loadMatches();
        }
    }, [isFocused]);

    const loadMatches = async () => {
        try {
            const data = await getRecentMatches();
            setMatches(data);
        } catch (error) {
            console.error('Failed to load matches:', error);
        }
    };

    const handleClearData = async () => {
        Alert.alert(
            'Clear All Data',
            'Are you sure you want to clear all match history? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearAllData();
                            loadMatches();
                            Alert.alert('Success', 'All data cleared successfully.');
                        } catch (error) {
                            console.error('Failed to clear data:', error);
                            Alert.alert('Error', 'Failed to clear data.');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteMatch = (matchId) => {
        Alert.alert(
            'Delete Match',
            'Are you sure you want to delete this match?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMatch(matchId);
                            loadMatches();
                        } catch (error) {
                            console.error('Failed to delete match:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleResumeMatch = (match) => {
        if (match.state_json) {
            try {
                const savedState = JSON.parse(match.state_json);
                resumeMatch(savedState);
                navigation.navigate('Scoring');
            } catch (error) {
                console.error('Failed to parse match state:', error);
                alert('Error resuming match. State might be corrupted.');
            }
        } else {
            // If no state exists but match record does, treat as new start with meta
            resumeMatch({
                matchId: match.id,
                currentMatch: {
                    teamA: match.teamA,
                    teamB: match.teamB,
                    overs: match.overs,
                    tossWinner: match.tossWinner,
                    tossDecision: match.tossDecision
                },
                score: { runs: 0, wickets: 0, overs: 0, balls: 0 },
                batsmen: [
                    { name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: true },
                    { name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: false },
                ],
                bowler: { name: 'Bowler', overs: 0, balls: 0, runs: 0, wickets: 0 },
                thisOver: [],
                history: [],
                isOverComplete: false,
                isMatchStarted: false,
            });
            navigation.navigate('Scoring');
        }
    };

    const QuickAction = ({ icon: Icon, label, color, onPress }) => (
        <Card style={[styles.actionCard, { borderBottomColor: color, borderBottomWidth: 3 }]}>
            <TouchableRipple onPress={onPress} style={styles.actionContent}>
                <View style={styles.actionInner}>
                    <Icon size={32} color={color} />
                    <Text variant="labelLarge" style={styles.actionLabel}>{label}</Text>
                </View>
            </TouchableRipple>
        </Card>
    );

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>


                {/* Quick Actions Grid */}
                <View style={styles.section}>
                    <View style={styles.actionGrid}>
                        <QuickAction icon={Plus} label="New Match" color="#4C8C4A" onPress={() => navigation.navigate('CreateMatch')} />
                        <QuickAction icon={User} label="Players" color="#2196F3" onPress={() => navigation.navigate('Players')} />
                        <QuickAction icon={Settings} label="Clear Data" color="#757575" onPress={handleClearData} />
                    </View>
                </View>

                {/* Recent Matches */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Title style={styles.sectionTitle}>Recent Matches</Title>
                        <TouchableOpacity><Text style={{ color: '#4C8C4A', fontWeight: 'bold' }}>See All</Text></TouchableOpacity>
                    </View>

                    {matches.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Card.Content style={styles.centered}>
                                <History size={48} color="#ccc" />
                                <Paragraph style={{ marginTop: 10 }}>No recent matches found</Paragraph>
                                <Button mode="outlined" onPress={() => navigation.navigate('CreateMatch')} style={{ marginTop: 10 }}>Start your first match</Button>
                            </Card.Content>
                        </Card>
                    ) : (
                        matches.map((item) => (
                            <Card key={item.id} style={styles.matchCard} onPress={() => handleResumeMatch(item)}>
                                <Card.Content style={{ padding: 16 }}>
                                    <View style={styles.matchTop}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                                            <Text variant="labelSmall" style={styles.matchDate}>{item.date}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'LIVE' ? '#E8F5E9' : '#F5F5F5' }]}>
                                            <Text style={[styles.statusText, { color: item.status === 'LIVE' ? '#4C8C4A' : '#757575' }]}>{item.status}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.matchMain}>
                                        <View style={styles.teamInfo}>
                                            <Text style={styles.teamName}>{item.teamA}</Text>
                                            <Text style={styles.vs}>v/s</Text>
                                            <Text style={styles.teamName}>{item.teamB}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleResumeMatch(item)} style={styles.resumeBtn}>
                                            <Play size={24} color="white" fill="white" />
                                        </TouchableOpacity>
                                    </View>

                                    <Divider style={{ marginVertical: 12, backgroundColor: '#eee' }} />
                                    
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ flex: 1, fontSize: 12, color: '#777', fontWeight: '500' }}>
                                            {item.overs} Overs • {item.tossWinner} chose to {item.tossDecision}
                                        </Text>
                                        <TouchableOpacity onPress={() => handleDeleteMatch(item.id)} style={{ padding: 8 }}>
                                            <Trash2 size={20} color="#EF5350" />
                                        </TouchableOpacity>
                                    </View>

                                </Card.Content>
                            </Card>
                        ))
                    )}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF9' },
    hero: { padding: 24, paddingTop: 48, backgroundColor: '#1B4D3E' },
    heroTitle: { color: 'white', fontSize: 28, fontWeight: 'bold' },
    heroSubtitle: { color: '#B0C4B1', fontSize: 16 },
    section: { paddingHorizontal: 16, paddingTop: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1B4D3E' },
    actionGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    actionCard: { flex: 1, borderRadius: 16, overflow: 'hidden', elevation: 3, backgroundColor: 'white' },
    actionContent: { height: 90, justifyContent: 'center', alignItems: 'center' },
    actionInner: { alignItems: 'center', justifyContent: 'center' },
    actionLabel: { marginTop: 8, fontSize: 13, fontWeight: '700', color: '#333' },
    matchCard: { marginBottom: 12, borderRadius: 16, elevation: 4, backgroundColor: 'white', overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: '#4C8C4A' },
    matchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    matchDate: { color: '#888', fontSize: 11, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    statusText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    matchMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    teamInfo: { flex: 1 },
    teamName: { fontSize: 18, fontWeight: '800', color: '#1B4D3E', letterSpacing: -0.5 },
    vs: { fontSize: 11, color: '#999', marginVertical: 1, fontWeight: 'bold', textTransform: 'uppercase' },
    resumeBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#4C8C4A', justifyContent: 'center', alignItems: 'center', elevation: 4 },
    emptyCard: { padding: 32, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#4C8C4A', backgroundColor: '#F0F4F1' },
    centered: { alignItems: 'center', justifyContent: 'center' },
});

export default HomeScreen;
