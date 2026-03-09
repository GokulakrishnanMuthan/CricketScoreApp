import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Card, Text, Title, Paragraph, FAB, useTheme, TouchableRipple, Divider, Button } from 'react-native-paper';
import { Play, Plus, History, Trophy, TrendingUp, Settings } from 'lucide-react-native';
import { getRecentMatches, clearAllData } from '../database/database';
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
                        <QuickAction icon={History} label="My Matches" color="#FF8C00" onPress={() => { }} />
                        <QuickAction icon={TrendingUp} label="Stats" color="#2196F3" onPress={() => { }} />
                        <QuickAction icon={Settings} label="Clear Data" color="#757575" onPress={handleClearData} />
                    </View>
                </View>

                {/* Recent Matches */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Title style={styles.sectionTitle}>Recent Matches</Title>
                        <TouchableOpacity><Text style={{ color: '#4C8C4A' }}>See All</Text></TouchableOpacity>
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
                                <Card.Content>
                                    <View style={styles.matchTop}>
                                        <Text variant="labelSmall" style={styles.matchDate}>{item.date}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'LIVE' ? '#E8F5E9' : '#F5F5F5' }]}>
                                            <Text style={[styles.statusText, { color: item.status === 'LIVE' ? '#4C8C4A' : '#757575' }]}>{item.status}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.matchMain}>
                                        <View style={styles.teamInfo}>
                                            <Text style={styles.teamName}>{item.teamA}</Text>
                                            <Text style={styles.vs}>vs</Text>
                                            <Text style={styles.teamName}>{item.teamB}</Text>
                                        </View>
                                        <TouchableRipple onPress={() => handleResumeMatch(item)} style={styles.resumeBtn}>
                                            <Play size={20} color="white" fill="white" />
                                        </TouchableRipple>
                                    </View>
                                    <Divider style={{ marginVertical: 8 }} />
                                    <Paragraph style={{ fontSize: 12, color: '#666' }}>{item.overs} Overs Match • {item.tossWinner} won toss & elected to {item.tossDecision}</Paragraph>
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
    container: { flex: 1, backgroundColor: '#F5F7F6' },
    hero: { padding: 24, paddingTop: 48, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroTitle: { color: 'white', fontSize: 28, fontWeight: 'bold' },
    heroSubtitle: { color: '#B0C4B1', fontSize: 16 },
    section: { padding: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, color: '#333' },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    actionCard: { width: '47%', marginBottom: 16, borderRadius: 0, overflow: 'hidden', elevation: 2, backgroundColor: 'white' },
    actionContent: { height: 100, justifyContent: 'center', alignItems: 'center' },
    actionInner: { alignItems: 'center', justifyContent: 'center' },
    actionLabel: { marginTop: 8, fontWeight: 'bold', color: '#444' },
    matchCard: { marginBottom: 12, borderRadius: 0, elevation: 2, backgroundColor: 'white' },
    matchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    matchDate: { color: '#888' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    matchMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    teamInfo: { flex: 1, flexDirection: 'column' },
    teamName: { fontSize: 17, fontWeight: 'bold', color: '#1B4D3E' },
    vs: { fontSize: 12, color: '#999', marginVertical: 2 },
    resumeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4C8C4A', justifyContent: 'center', alignItems: 'center' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, borderRadius: 0 },
    emptyCard: { padding: 32, borderRadius: 0, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc', backgroundColor: 'transparent' },
    centered: { alignItems: 'center', justifyContent: 'center' },
});

export default HomeScreen;
