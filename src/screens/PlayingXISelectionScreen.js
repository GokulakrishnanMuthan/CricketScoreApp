import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Text, Button, Card, useTheme, Checkbox, Searchbar, SegmentedButtons, List, Avatar, Divider, TextInput, IconButton, Portal, Dialog } from 'react-native-paper';
import { User, Shield, Star, Plus, Trash2, Check, AlertCircle } from 'lucide-react-native';
import { useMatch } from '../context/MatchContext';
import { getAppPlayers, getPlayersByTeam } from '../database/database';

const PlayingXISelectionScreen = ({ navigation }) => {
    const theme = useTheme();
    const { setupData = {}, updateSetupData } = useMatch();
    
    const [players, setPlayers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTab, setCurrentTab] = useState('teamA');
    
    // Selection state
    const [teamAPlayers, setTeamAPlayers] = useState(setupData?.teamA?.players || []);
    const [teamBPlayers, setTeamBPlayers] = useState(setupData?.teamB?.players || []);
    
    const [teamACaptain, setTeamACaptain] = useState(setupData?.teamA?.captain);
    const [teamAWK, setTeamAWK] = useState(setupData?.teamA?.wicketkeeper);
    
    const [teamBCaptain, setTeamBCaptain] = useState(setupData?.teamB?.captain);
    const [teamBWK, setTeamBWK] = useState(setupData?.teamB?.wicketkeeper);

    // Manual entry for Other Team
    const [manualPlayerName, setManualPlayerName] = useState('');
    const [saveTeam, setSaveTeam] = useState(true);

    useEffect(() => {
        loadPlayers();
    }, []);

    useEffect(() => {
        if (isTeamBManual && setupData.teamB?.name && teamBPlayers.length === 0) {
            const loadTeamB = async () => {
                const teamPlayers = await getPlayersByTeam(setupData.teamB.name);
                if (teamPlayers.length > 0) {
                    setTeamBPlayers(teamPlayers);
                    const captain = teamPlayers.find(p => p.is_captain === 1);
                    if (captain) setTeamBCaptain(captain);
                    const wk = teamPlayers.find(p => p.is_wicket_keeper === 1);
                    if (wk) setTeamBWK(wk);
                }
            };
            loadTeamB();
        }
    }, [isTeamBManual, setupData.teamB?.name]);

    const loadPlayers = async () => {
        const data = await getAppPlayers();
        setPlayers(data);
    };

    const isOtherTeam = setupData.matchType === 'other';
    const isTeamBManual = isOtherTeam && currentTab === 'teamB';

    const getSelectedPlayers = () => currentTab === 'teamA' ? teamAPlayers : teamBPlayers;
    const setSelectedPlayers = (val) => currentTab === 'teamA' ? setTeamAPlayers(val) : setTeamBPlayers(val);

    const togglePlayer = (player) => {
        const currentSelected = getSelectedPlayers();
        const exists = currentSelected.find(p => p.id === player.id);
        
        if (exists) {
            setSelectedPlayers(currentSelected.filter(p => p.id !== player.id));
            // Reset roles if they were removed
            if (currentTab === 'teamA') {
                if (teamACaptain?.id === player.id) setTeamACaptain(null);
                if (teamAWK?.id === player.id) setTeamAWK(null);
            } else {
                if (teamBCaptain?.id === player.id) setTeamBCaptain(null);
                if (teamBWK?.id === player.id) setTeamBWK(null);
            }
        } else {
            if (currentSelected.length >= setupData.playersPerTeam) {
                return alert(`You can only select ${setupData.playersPerTeam} players`);
            }
            setSelectedPlayers([...currentSelected, player]);
        }
    };

    const addManualPlayer = () => {
        if (!manualPlayerName.trim()) return;
        const newPlayer = {
            id: Date.now().toString(), // Temporary ID
            name: manualPlayerName.trim(),
            isManual: true
        };
        setTeamBPlayers([...teamBPlayers, newPlayer]);
        setManualPlayerName('');
    };

    const removeManualPlayer = (id) => {
        setTeamBPlayers(teamBPlayers.filter(p => p.id !== id));
        if (teamBCaptain?.id === id) setTeamBCaptain(null);
        if (teamBWK?.id === id) setTeamBWK(null);
    };

    const currentTeamName = currentTab === 'teamA' ? setupData.teamA?.name : setupData.teamB?.name;
    
    const availablePlayers = players.filter(p => {
        if (!isOtherTeam) {
            // Local Match: both teams are internal — only Striker XI players
            return !p.team_name || p.team_name === 'Striker XI';
        }
        // Other Match: filter by the team name for the active tab
        const expectedTeam = currentTeamName || 'Striker XI';
        if (expectedTeam === 'Striker XI') {
            return !p.team_name || p.team_name === 'Striker XI';
        }
        return p.team_name === expectedTeam;
    });

    const filteredPlayers = availablePlayers.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pCount = setupData.playersPerTeam || 11;
    const isTeamAReady = teamAPlayers.length === pCount && teamACaptain && teamAWK;
    const isTeamBReady = teamBPlayers.length === pCount && teamBCaptain && teamBWK;
    const isReady = isTeamAReady && isTeamBReady;

    const handleNext = () => {
        if (!isReady) {
            let msg = '';
            if (!isTeamAReady) msg += `Check ${setupData.teamA.name} selections. `;
            if (!isTeamBReady) msg += `Check ${setupData.teamB.name} selections. `;
            return Alert.alert('Incomplete Setup', msg);
        }

        updateSetupData({
            teamA: { ...setupData.teamA, players: teamAPlayers, captain: teamACaptain, wicketkeeper: teamAWK },
            teamB: { ...setupData.teamB, players: teamBPlayers, captain: teamBCaptain, wicketkeeper: teamBWK },
            saveTeamB: isTeamBManual ? saveTeam : false
        });

        navigation.navigate('MatchSummary');
    };

    const renderPlayerItem = ({ item }) => {
        const isSelected = getSelectedPlayers().find(p => p.id === item.id);
        const isCaptain = (currentTab === 'teamA' ? teamACaptain : teamBCaptain)?.id === item.id;
        const isWK = (currentTab === 'teamA' ? teamAWK : teamBWK)?.id === item.id;

        return (
            <List.Item
                title={(
                    <View style={styles.playerNameRow}>
                        <Text style={[styles.playerName, isSelected && { fontWeight: '700' }]}>{item.name}</Text>
                        {isCaptain && <View style={styles.badgeContainer}><Star size={12} color="#FBC02D" fill="#FBC02D" /></View>}
                        {isWK && <View style={styles.badgeContainer}><Shield size={12} color="#4FC3F7" fill="#4FC3F7" /></View>}
                    </View>
                )}
                description={item.team_name || 'Individual'}
                left={props => (
                    <View style={styles.avatarContainer}>
                        {item.image_uri ? (
                            <Avatar.Image size={40} source={{ uri: item.image_uri }} />
                        ) : (
                            <Avatar.Icon size={40} icon="account" style={{ backgroundColor: '#E8F5E9' }} color="#4C8C4A" />
                        )}
                    </View>
                )}
                right={props => (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Checkbox
                            status={isSelected ? 'checked' : 'unchecked'}
                            onPress={() => togglePlayer(item)}
                            color="#4C8C4A"
                        />
                    </View>
                )}
                onPress={() => togglePlayer(item)}
                style={[styles.playerItem, isSelected && { backgroundColor: '#F0F4F1' }]}
            />
        );
    };

    const [roleDialogVisible, setRoleDialogVisible] = useState(false);
    const [roleToAssign, setRoleToAssign] = useState(null); // 'captain' or 'wk'

    const openRoleDialog = (role) => {
        setRoleToAssign(role);
        setRoleDialogVisible(true);
    };

    const assignRole = (player) => {
        if (currentTab === 'teamA') {
            if (roleToAssign === 'captain') setTeamACaptain(player);
            else setTeamAWK(player);
        } else {
            if (roleToAssign === 'captain') setTeamBCaptain(player);
            else setTeamBWK(player);
        }
        setRoleDialogVisible(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.customTabs}>
                <TouchableOpacity 
                    style={[styles.segmentBtn, currentTab === 'teamA' && styles.segmentBtnActive]} 
                    onPress={() => setCurrentTab('teamA')}
                >
                    <Text style={[styles.segmentBtnText, currentTab === 'teamA' && styles.segmentBtnTextActive]}>
                        {setupData.teamA.name || 'Team A'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.segmentBtn, currentTab === 'teamB' && styles.segmentBtnActive]} 
                    onPress={() => setCurrentTab('teamB')}
                >
                    <Text style={[styles.segmentBtnText, currentTab === 'teamB' && styles.segmentBtnTextActive]}>
                        {setupData.teamB.name || 'Team B'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.counterRow}>
                <Text style={styles.counterText}>
                    Selected: {getSelectedPlayers().length} / {setupData.playersPerTeam}
                </Text>
                <View style={styles.rolesRow}>
                    <TouchableOpacity 
                        style={[styles.roleBtn, (currentTab === 'teamA' ? teamACaptain : teamBCaptain) && styles.roleBtnActive]}
                        onPress={() => openRoleDialog('captain')}
                    >
                        <Star size={14} color={(currentTab === 'teamA' ? teamACaptain : teamBCaptain) ? 'white' : '#666'} />
                        <Text style={[styles.roleBtnText, (currentTab === 'teamA' ? teamACaptain : teamBCaptain) && { color: 'white' }]}>Capt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.roleBtn, (currentTab === 'teamA' ? teamAWK : teamBWK) && styles.roleBtnActive]}
                        onPress={() => openRoleDialog('wk')}
                    >
                        <Shield size={14} color={(currentTab === 'teamA' ? teamAWK : teamBWK) ? 'white' : '#666'} />
                        <Text style={[styles.roleBtnText, (currentTab === 'teamA' ? teamAWK : teamBWK) && { color: 'white' }]}>WK</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {isTeamBManual ? (
                <View style={styles.manualContainer}>
                    <View style={styles.manualInputRow}>
                        <TextInput
                            label="Add Player Name"
                            value={manualPlayerName}
                            onChangeText={setManualPlayerName}
                            mode="outlined"
                            style={styles.manualInput}
                            outlineStyle={{ borderRadius: 12 }}
                            activeOutlineColor="#4C8C4A"
                        />
                        <IconButton 
                            icon="plus" 
                            mode="contained" 
                            containerColor="#4C8C4A" 
                            iconColor="white" 
                            size={32}
                            onPress={addManualPlayer}
                            style={styles.addBtn}
                        />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Checkbox.Android 
                            status={saveTeam ? 'checked' : 'unchecked'} 
                            onPress={() => setSaveTeam(!saveTeam)}
                            color="#4C8C4A"
                        />
                        <Text style={{ fontSize: 14, color: '#333' }}>Save Team for Future Matches</Text>
                    </View>
                    <FlatList
                        data={teamBPlayers}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => {
                            const isCaptain = teamBCaptain?.id === item.id;
                            const isWK = teamBWK?.id === item.id;
                            return (
                                <List.Item
                                    title={(
                                        <View style={styles.playerNameRow}>
                                            <Text style={styles.playerName}>{item.name}</Text>
                                            {isCaptain && <View style={styles.badgeContainer}><Star size={12} color="#FBC02D" fill="#FBC02D" /></View>}
                                            {isWK && <View style={styles.badgeContainer}><Shield size={12} color="#4FC3F7" fill="#4FC3F7" /></View>}
                                        </View>
                                    )}
                                    left={props => <Avatar.Text size={40} label={item.name[0]} style={{ backgroundColor: '#EF5350' }} color="white" />}
                                    right={props => <IconButton icon="trash-can-outline" iconColor="#EF5350" onPress={() => removeManualPlayer(item.id)} />}
                                    style={styles.manualItem}
                                />
                            );
                        }}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <Searchbar
                        placeholder="Search players..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchbar}
                        inputStyle={{ fontSize: 14 }}
                    />
                    <FlatList
                        data={filteredPlayers}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderPlayerItem}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                </View>
            )}

            <View style={styles.bottomBar}>
                {!isReady && (
                    <View style={styles.statusInfo}>
                        <View style={styles.statusItem}>
                            <AlertCircle size={14} color={isTeamAReady ? '#4C8C4A' : '#EF5350'} />
                            <Text style={[styles.statusText, { color: isTeamAReady ? '#4C8C4A' : '#EF5350' }]}>
                                {setupData.teamA.name || 'Team A'}: {isTeamAReady ? 'Ready' : 'Incomplete'}
                            </Text>
                        </View>
                        <View style={styles.statusItem}>
                            <AlertCircle size={14} color={isTeamBReady ? '#4C8C4A' : '#EF5350'} />
                            <Text style={[styles.statusText, { color: isTeamBReady ? '#4C8C4A' : '#EF5350' }]}>
                                {setupData.teamB.name || 'Team B'}: {isTeamBReady ? 'Ready' : 'Incomplete'}
                            </Text>
                        </View>
                    </View>
                )}
                <Button 
                    mode="contained" 
                    onPress={handleNext}
                    style={[styles.nextBtn, !isReady && { backgroundColor: '#E0E0E0' }]}
                    contentStyle={{ height: 50 }}
                    labelStyle={!isReady && { color: '#888' }}
                >
                    Continue
                </Button>
            </View>

            <Portal>
                <Dialog visible={roleDialogVisible} onDismiss={() => setRoleDialogVisible(false)} style={styles.dialog}>
                    <Dialog.Title>Select {roleToAssign === 'captain' ? 'Captain' : 'Wicketkeeper'}</Dialog.Title>
                    <Dialog.Content>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {getSelectedPlayers().length === 0 ? (
                                <Text>Please select players first</Text>
                            ) : (
                                getSelectedPlayers().map(p => (
                                    <TouchableOpacity 
                                        key={p.id} 
                                        style={styles.roleOption}
                                        onPress={() => assignRole(p)}
                                    >
                                        <Text style={styles.roleOptionText}>{p.name}</Text>
                                        {(currentTab === 'teamA' ? (roleToAssign === 'captain' ? teamACaptain : teamAWK) : (roleToAssign === 'captain' ? teamBCaptain : teamBWK))?.id === p.id && (
                                            <Check size={20} color="#4C8C4A" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </Dialog.Content>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF9' },
    customTabs: { 
        flexDirection: 'row', 
        backgroundColor: 'white', 
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    segmentBtn: { 
        flex: 1, 
        paddingVertical: 14, 
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent'
    },
    segmentBtnActive: { 
        borderBottomColor: '#4C8C4A'
    },
    segmentBtnText: { 
        fontSize: 14, 
        fontWeight: '700', 
        color: '#888' 
    },
    segmentBtnTextActive: { 
        color: '#4C8C4A'
    },
    counterRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16,
        paddingBottom: 12,
        marginTop: 12,
        borderBottomWidth:1,
        borderBottomColor: '#eee'
    },
    counterText: { fontSize: 15, fontWeight: '700', color: '#1B4D3E' },
    rolesRow: { flexDirection: 'row', gap: 8 },
    roleBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#eee', 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderRadius: 20,
        gap: 4
    },
    roleBtnActive: { backgroundColor: '#4C8C4A' },
    roleBtnText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
    searchbar: { margin: 16, height: 48, backgroundColor: 'white', elevation: 2 },
    playerItem: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    avatarContainer: { marginLeft: 8 },
    bottomBar: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: 'white', 
        padding: 16,
        elevation: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    nextBtn: { borderRadius: 12, backgroundColor: '#4C8C4A' },
    statusInfo: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    statusItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusText: { fontSize: 12, fontWeight: '600' },
    manualContainer: { flex: 1, padding: 16 },
    manualInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    manualInput: { flex: 1, backgroundColor: 'white' },
    addBtn: { borderRadius: 12, backgroundColor: '#4C8C4A' },
    manualItem: { backgroundColor: 'white', borderRadius: 12, marginBottom: 8, elevation: 1 },
    dialog: { borderRadius: 20, backgroundColor: 'white' },
    roleOption: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    roleOptionText: { fontSize: 16, color: '#333' },
    playerNameRow: { flexDirection: 'row', alignItems: 'center' },
    playerName: { fontSize: 16, color: '#333' },
    badgeContainer: { 
        marginLeft: 6, 
        backgroundColor: '#fff', 
        borderRadius: 10, 
        padding: 2,
        borderWidth: 0.5,
        borderColor: '#ddd'
    }
});

export default PlayingXISelectionScreen;
