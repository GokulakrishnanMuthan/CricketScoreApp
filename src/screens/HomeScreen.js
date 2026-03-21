import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Card, Text, Title, Paragraph, FAB, useTheme, TouchableRipple, Divider, Button, Portal, Dialog, Menu } from 'react-native-paper';
import { Play, Plus, History, Trophy, TrendingUp, Settings, Trash2, User, FileText, List, Shield } from 'lucide-react-native';
import { getRecentMatches, clearAllData, deleteMatch, getOtherTeams } from '../database/database';
import { useMatch } from '../context/MatchContext';
import { useIsFocused } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
    const theme = useTheme();
    const isFocused = useIsFocused();
    const { resumeMatch, updateSetupData, resetMatch } = useMatch();
    const [matches, setMatches] = useState([]);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [otherTeams, setOtherTeams] = useState([]);
    const [otherTeamsMenuVisible, setOtherTeamsMenuVisible] = useState(false);

    useEffect(() => {
        if (isFocused) {
            loadMatches();
            loadOtherTeams();
        }
    }, [isFocused]);

    const loadOtherTeams = async () => {
        try {
            const teams = await getOtherTeams();
            setOtherTeams(teams);
        } catch (error) {
            console.error('Failed to load other teams:', error);
        }
    };

    const loadMatches = async () => {
        try {
            const data = await getRecentMatches(5);
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
        setPendingDeleteId(matchId);
        setDeleteDialogVisible(true);
    };

    const confirmDelete = async () => {
        setDeleteDialogVisible(false);
        try {
            await deleteMatch(pendingDeleteId);
            loadMatches();
        } catch (error) {
            console.error('Failed to delete match:', error);
        }
        setPendingDeleteId(null);
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

    const handleStartNextMatch = (item) => {
        let stateObj = null;
        if (item.state_json) {
            try { stateObj = JSON.parse(item.state_json); } catch (e) {}
        }
        
        const teamAData = stateObj?.currentMatch?.teamAData || { name: item.teamA || 'Team A', players: [] };
        const teamBData = stateObj?.currentMatch?.teamBData || { name: item.teamB || 'Team B', players: [] };
        const overs = stateObj?.currentMatch?.overs || item.overs || 10;
        const playersPerTeam = stateObj?.currentMatch?.playersPerTeam || 11;
        const ground = stateObj?.currentMatch?.ground || '';

        resetMatch();

        setTimeout(() => {
            updateSetupData({
                matchType: 'local',
                teamA: teamAData,
                teamB: teamBData,
                overs,
                playersPerTeam,
                ground,
                date: new Date().toLocaleString()
            });
            navigation.navigate('TeamSetup');
        }, 0);
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
            {/* ── Delete Confirmation Dialog ── */}
            <Portal>
                <Dialog
                    visible={deleteDialogVisible}
                    onDismiss={() => setDeleteDialogVisible(false)}
                    style={styles.deleteDialog}
                >
                    <View style={styles.deleteDialogIcon}>
                        <Trash2 size={32} color="#EF5350" />
                    </View>
                    <Dialog.Title style={styles.deleteDialogTitle}>Delete Match?</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.deleteDialogBody}>
                            This match and all its scoring data will be permanently removed.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions style={styles.deleteDialogActions}>
                        <Button
                            mode="outlined"
                            onPress={() => setDeleteDialogVisible(false)}
                            style={styles.cancelBtn}
                            labelStyle={styles.cancelBtnLabel}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={confirmDelete}
                            buttonColor="#EF5350"
                            style={styles.deleteBtn}
                            labelStyle={styles.deleteBtnLabel}
                        >
                            Delete
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <ScrollView showsVerticalScrollIndicator={false}>


                {/* Quick Actions Grid */}
                <View style={styles.section}>
                    <View style={[styles.actionGrid, { flexWrap: 'wrap' }]}>
                        <View style={{ width: '48%', marginBottom: 12 }}>
                            <QuickAction icon={Plus} label="New Match" color="#4C8C4A" onPress={() => navigation.navigate('MatchType')} />
                        </View>
                        <View style={{ width: '48%', marginBottom: 12 }}>
                            <QuickAction icon={User} label="Players" color="#2196F3" onPress={() => navigation.navigate('Players')} />
                        </View>
                        <View style={{ width: '48%' }}>
                            <Menu
                                visible={otherTeamsMenuVisible}
                                onDismiss={() => setOtherTeamsMenuVisible(false)}
                                anchor={
                                    <View>
                                        <QuickAction 
                                            icon={Shield} 
                                            label="Other Teams" 
                                            color="#FF9800" 
                                            onPress={() => setOtherTeamsMenuVisible(true)} 
                                        />
                                    </View>
                                }
                            >
                                {otherTeams.length === 0 ? (
                                    <Menu.Item title="No other teams found" disabled />
                                ) : (
                                    otherTeams.map((team, idx) => (
                                        <Menu.Item 
                                            key={idx} 
                                            onPress={() => {
                                                setOtherTeamsMenuVisible(false);
                                                navigation.navigate('Players', { filterTeam: team });
                                            }} 
                                            title={team} 
                                        />
                                    ))
                                )}
                            </Menu>
                        </View>
                        <View style={{ width: '48%' }}>
                            <QuickAction icon={Settings} label="Settings" color="#757575" onPress={() => navigation.navigate('Settings')} />
                        </View>
                    </View>
                </View>

                {/* Recent Matches */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Title style={styles.sectionTitle}>Recent Matches</Title>
                        <TouchableOpacity onPress={() => navigation.navigate('AllMatches')}>
                            <Text style={{ color: '#4C8C4A', fontWeight: 'bold' }}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {matches.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Card.Content style={styles.centered}>
                                <History size={48} color="#ccc" />
                                <Paragraph style={{ marginTop: 10 }}>No recent matches found</Paragraph>
                                <Button mode="outlined" onPress={() => navigation.navigate('MatchType')} style={{ marginTop: 10 }}>Start your first match</Button>
                            </Card.Content>
                        </Card>
                    ) : (
                        matches.map((item) => {
                            let isCompleted = false;
                            let matchResultText = '';
                            if (item.state_json) {
                                try {
                                    const stateObj = JSON.parse(item.state_json);
                                    isCompleted = stateObj.isMatchOver;
                                    matchResultText = stateObj.matchResult;
                                } catch (e) {}
                            }
                            
                            const statusLabel = isCompleted ? matchResultText || 'COMPLETED' : item.status;
                            const statusBgColor = isCompleted ? '#F5F5F5' : (item.status === 'LIVE' ? '#E8F5E9' : '#F5F5F5');
                            const statusTextColor = isCompleted ? '#757575' : (item.status === 'LIVE' ? '#4C8C4A' : '#757575');

                            return (
                                <Card key={item.id} style={styles.matchCard} onPress={() => handleResumeMatch(item)}>
                                    <Card.Content style={{ padding: 16 }}>
                                        <View style={styles.matchTop}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text variant="labelSmall" style={styles.matchDate}>{item.date}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                                                <Text style={[styles.statusText, { color: statusTextColor }]}>{statusLabel}</Text>
                                            </View>
                                        </View>
                                    <View style={styles.matchMain}>
                                        <View style={styles.teamInfo}>
                                            <Text style={styles.teamName}>{item.teamA}</Text>
                                            <Text style={styles.vs}>v/s</Text>
                                            <Text style={styles.teamName}>{item.teamB}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleResumeMatch(item)} style={styles.resumeBtn}>
                                            {isCompleted ? (
                                                <FileText size={22} color="white" />
                                            ) : (
                                                <Play size={24} color="white" fill="white" />
                                            )}
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
                                        
                                        {isCompleted && (
                                            <Button 
                                                mode="outlined" 
                                                onPress={() => handleStartNextMatch(item)} 
                                                style={{ marginTop: 16, borderColor: '#4C8C4A', alignSelf: 'center', borderRadius: 24, paddingHorizontal: 16 }}
                                                labelStyle={{ color: '#4C8C4A', fontWeight: 'bold' }}
                                                icon={() => <Play size={16} color="#4C8C4A" />}
                                                compact
                                            >
                                                Start Next Match
                                            </Button>
                                        )}

                                </Card.Content>
                            </Card>
                            );
                        })
                    )}
                    
                    {matches.length > 0 && (
                        <Button 
                            mode="outlined" 
                            style={styles.viewAllBtn} 
                            onPress={() => navigation.navigate('AllMatches')}
                            labelStyle={{ color: '#4C8C4A', fontWeight: 'bold' }}
                            icon={() => <List size={18} color="#4C8C4A" />}
                        >
                            View All Matches
                        </Button>
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

    // Delete dialog
    deleteDialog: {
        borderRadius: 20,
        backgroundColor: 'white',
        paddingTop: 8,
        overflow: 'hidden',
        borderTopWidth: 5,
        borderTopColor: '#EF5350',
    },
    deleteDialogIcon: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 4,
    },
    deleteDialogTitle: {
        textAlign: 'center',
        fontWeight: '800',
        fontSize: 20,
        color: '#1B4D3E',
    },
    deleteDialogBody: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        lineHeight: 20,
    },
    deleteDialogActions: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        borderRadius: 10,
        borderColor: '#4C8C4A',
    },
    cancelBtnLabel: {
        color: '#4C8C4A',
        fontWeight: '700',
    },
    deleteBtn: {
        flex: 1,
        borderRadius: 10,
    },
    deleteBtnLabel: {
        color: 'white',
        fontWeight: '700',
    },
    viewAllBtn: {
        marginTop: 16,
        borderColor: '#4C8C4A',
        borderRadius: 12,
        paddingVertical: 4
    }
});

export default HomeScreen;
