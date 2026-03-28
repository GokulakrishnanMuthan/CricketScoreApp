import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Card, Text, Title, IconButton, useTheme, Divider, Avatar, Button, Searchbar, Portal, Dialog } from 'react-native-paper';
import { Shield, Users, History, ChevronRight, Trophy, TrendingUp } from 'lucide-react-native';
import { getOtherTeams, getPlayersByTeam, getAllMatches, deleteTeam } from '../database/database';
import { useIsFocused } from '@react-navigation/native';

const OtherTeamsScreen = ({ navigation }) => {
    const theme = useTheme();
    const isFocused = useIsFocused();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);

    useEffect(() => {
        if (isFocused) {
            loadTeamsData();
        }
    }, [isFocused]);

    const loadTeamsData = async () => {
        try {
            setLoading(true);
            const teamNames = await getOtherTeams();
            const allMatches = await getAllMatches();

            const teamsWithStats = await Promise.all(teamNames.map(async (name) => {
                const players = await getPlayersByTeam(name);
                const teamMatches = allMatches.filter(m => m.teamA === name || m.teamB === name);

                // Simple win counting if available in state_json
                let wins = 0;
                teamMatches.forEach(m => {
                    if (m.state_json) {
                        try {
                            const state = JSON.parse(m.state_json);
                            if (state.isMatchOver && state.matchResult && state.matchResult.includes(name)) {
                                wins++;
                            }
                        } catch (e) { }
                    }
                });

                return {
                    name,
                    playerCount: players.length,
                    matchCount: teamMatches.length,
                    wins
                };
            }));

            setTeams(teamsWithStats);
        } catch (error) {
            console.error('Failed to load other teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (name) => {
        setTeamToDelete(name);
        setDeleteDialogVisible(true);
    };

    const confirmDelete = async () => {
        if (!teamToDelete) return;
        try {
            await deleteTeam(teamToDelete);
            setDeleteDialogVisible(false);
            setTeamToDelete(null);
            loadTeamsData();
        } catch (error) {
            console.error('Delete team failed:', error);
            Alert.alert('Error', 'Failed to delete the team.');
        }
    };

    const TeamCard = ({ team }) => (
        <Card style={styles.teamCard}>
            <View style={styles.cardMain}>
                <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                        <View style={styles.iconContainer}>
                            <Shield size={24} color="#4C8C4A" />
                        </View>
                        <View style={styles.titleContainer}>
                            <Title style={styles.teamName}>{team.name}</Title>
                            <Text style={styles.teamType}>External Opponent</Text>
                        </View>
                    </View>
                    <IconButton 
                        icon="trash-can-outline" 
                        iconColor="#EF5350" 
                        size={22} 
                        onPress={() => handleDeleteClick(team.name)} 
                    />
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{team.playerCount}</Text>
                        <Text style={styles.statLabel}>Players</Text>
                    </View>
                    <Divider style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{team.matchCount}</Text>
                        <Text style={styles.statLabel}>Matches</Text>
                    </View>
                    <Divider style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{team.wins}</Text>
                        <Text style={styles.statLabel}>Wins</Text>
                    </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('Players', { filterTeam: team.name })}
                    >
                        <Users size={20} color="#4C8C4A" />
                        <Text style={styles.actionText}>View Players</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnOutline]}
                        onPress={() => navigation.navigate('AllMatches', { filterTeam: team.name })}
                    >
                        <History size={20} color="#1B4D3E" />
                        <Text style={[styles.actionText, { color: '#1B4D3E' }]}>View Matches</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Searchbar
                        placeholder="Search teams..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchbar}
                        inputStyle={{ fontSize: 13, color: '#1B4D3E' }}
                        iconColor="#4C8C4A"
                        placeholderTextColor="#A0A0A0"
                    />
                    <IconButton 
                        icon="plus" 
                        mode="contained" 
                        containerColor="white" 
                        iconColor="#1B4D3E" 
                        size={26} 
                        onPress={() => navigation.navigate('AddTeam')} 
                        style={styles.addIconButton}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {teams.length === 0 && !loading ? (
                    <Card style={styles.emptyCard}>
                        <Card.Content style={styles.centered}>
                            <Shield size={64} color="#ccc" />
                            <Title style={styles.emptyTitle}>No Other Teams</Title>
                            <Text style={styles.emptySubtitle}>Teams other than 'Striker XI' will appear here once you add players or play matches with them.</Text>
                            <Button
                                mode="contained"
                                onPress={() => navigation.navigate('AddPlayer')}
                                style={styles.addBtn}
                            >
                                Add a Player to New Team
                            </Button>
                        </Card.Content>
                    </Card>
                ) : (
                    filteredTeams.map((team, index) => <TeamCard key={index} team={team} />)
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            <Portal>
                <Dialog
                    visible={deleteDialogVisible}
                    onDismiss={() => setDeleteDialogVisible(false)}
                    style={styles.deleteDialog}
                >
                    <IconButton
                        icon="close"
                        size={20}
                        onPress={() => setDeleteDialogVisible(false)}
                        style={{ position: 'absolute', right: 8, top: 8, zIndex: 10 }}
                    />
                    <Dialog.Title style={styles.deleteDialogTitle}>Delete Team?</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.deleteDialogBody}>
                            Are you sure you want to delete <Text style={{ fontWeight: 'bold', color: '#1B4D3E' }}>{teamToDelete}</Text>? 
                            All associated players and their stats will be removed. This cannot be undone.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions style={styles.deleteDialogActions}>
                        <Button 
                            mode="outlined" 
                            onPress={() => setDeleteDialogVisible(false)} 
                            style={styles.cancelBtn}
                            labelStyle={{ color: '#666' }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            mode="contained" 
                            onPress={confirmDelete} 
                            style={styles.deleteBtn}
                            buttonColor="#EF5350"
                        >
                            Delete
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF9' },
    header: { 
        paddingHorizontal: 16, 
        paddingVertical: 18, 
        backgroundColor: '#1B4D3E', 
        borderBottomLeftRadius: 25, 
        borderBottomRightRadius: 25,
        elevation: 10,
        zIndex: 10
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchbar: { 
        backgroundColor: 'white', 
        elevation: 5, 
        borderRadius: 15, 
        height: 52,
        flex: 1
    },
    addIconButton: { margin: 0, borderRadius: 15, height: 52, width: 52, elevation: 5 },
    headerSubtitle: { color: '#B0C4B1', fontSize: 13, marginTop: 4 },
    scrollContent: { padding: 16, paddingTop: 24, paddingBottom: 100 },
    teamCard: { marginBottom: 20, borderRadius: 20, elevation: 4, backgroundColor: 'white', overflow: 'hidden' },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#4C8C4A',
        borderRadius: 16,
        elevation: 6
    },
    cardMain: { padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    deleteDialog: { borderRadius: 24, padding: 8 },
    deleteDialogTitle: { textAlign: 'center', fontWeight: '900', color: '#1B4D3E' },
    deleteDialogBody: { textAlign: 'center', color: '#666', lineHeight: 22, marginTop: 8 },
    deleteDialogActions: { justifyContent: 'space-around', paddingBottom: 16, marginTop: 8 },
    cancelBtn: { borderRadius: 12, flex: 1, marginRight: 8, borderColor: '#ddd' },
    deleteBtn: { borderRadius: 12, flex: 1, marginLeft: 8 },
    iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
    titleContainer: { marginLeft: 16 },
    teamName: { fontSize: 20, fontWeight: '800', color: '#1B4D3E', lineHeight: 24 },
    teamType: { fontSize: 12, color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#F9FBF9', borderRadius: 12 },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: '800', color: '#1B4D3E' },
    statLabel: { fontSize: 11, color: '#666', fontWeight: '600' },
    statDivider: { width: 1, height: '60%', backgroundColor: '#E0EAE0', alignSelf: 'center' },
    divider: { marginVertical: 16, backgroundColor: '#f0f0f0' },
    actionRow: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#E8F5E9', gap: 8 },
    actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#1B4D3E' },
    actionText: { fontWeight: '700', fontSize: 14, color: '#4C8C4A' },
    emptyCard: { padding: 32, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#4C8C4A', backgroundColor: '#F0F4F1' },
    centered: { alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { marginTop: 16, color: '#1B4D3E', fontWeight: '800' },
    emptySubtitle: { textAlign: 'center', color: '#666', marginTop: 8, lineHeight: 20 },
    addBtn: { marginTop: 24, backgroundColor: '#4C8C4A', borderRadius: 12, paddingHorizontal: 16 }
});

export default OtherTeamsScreen;
