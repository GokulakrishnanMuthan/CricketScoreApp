import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Card, useTheme, Menu } from 'react-native-paper';
import { Shield, Target, Users } from 'lucide-react-native';
import { useMatch } from '../context/MatchContext';
import { getOtherTeams } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';

const TeamSetupScreen = ({ navigation }) => {
    const theme = useTheme();
    const { setupData = {}, updateSetupData } = useMatch();
    
    const [teamA, setTeamA] = useState(setupData.teamA?.name || 'Striker XI');
    const [teamB, setTeamB] = useState(setupData.teamB?.name || '');
    const [overs, setOvers] = useState(setupData.overs?.toString() || '10');
    const [playersPerTeam, setPlayersPerTeam] = useState(setupData.playersPerTeam?.toString() || '11');
    const [ground, setGround] = useState(setupData.ground || '');
    const [matchDate, setMatchDate] = useState(setupData.date || new Date().toLocaleString());

    useEffect(() => {
        if (setupData.teamA?.name) setTeamA(setupData.teamA.name);
        if (setupData.teamB?.name) setTeamB(setupData.teamB.name);
        if (setupData.overs) setOvers(setupData.overs.toString());
        if (setupData.playersPerTeam) setPlayersPerTeam(setupData.playersPerTeam.toString());
        if (setupData.ground) setGround(setupData.ground);
        if (setupData.date) setMatchDate(setupData.date);
    }, [setupData]);

    const isOtherTeam = setupData.matchType === 'other';

    const [otherTeams, setOtherTeams] = useState([]);
    const [showMenu, setShowMenu] = useState(false);
    const [teamBFocused, setTeamBFocused] = useState(false);

    useEffect(() => {
        if (isOtherTeam) {
            getOtherTeams().then(setOtherTeams);
        }
    }, [isOtherTeam]);

    const filteredTeams = otherTeams.filter(t => t.toLowerCase().includes(teamB.toLowerCase()) && t.toLowerCase() !== teamB.toLowerCase());

    const handleNext = () => {
        if (!teamA || !teamB) return alert('Please enter both team names');
        
        updateSetupData({
            teamA: { ...setupData.teamA, name: teamA },
            teamB: { ...setupData.teamB, name: teamB },
            overs: parseInt(overs) || 10,
            playersPerTeam: parseInt(playersPerTeam) || 11,
            ground,
            date: matchDate
        });
        
        navigation.navigate('PlayingXISelection');
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Match Settings</Text>
                <Text style={styles.subtitle}>
                    {isOtherTeam ? 'Setup match against an external team' : 'Setup match between local teams'}
                </Text>

                <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>
                        <TextInput
                            label={isOtherTeam ? "Your Team Name" : "Team A Name"}
                            value={teamA}
                            onChangeText={setTeamA}
                            mode="outlined"
                            left={<TextInput.Icon icon={() => <Shield size={20} color="#4C8C4A" />} />}
                            style={styles.input}
                            outlineStyle={{ borderRadius: 12 }}
                            activeOutlineColor="#4C8C4A"
                        />

                        {isOtherTeam ? (
                            <View style={{ position: 'relative', zIndex: 10 }}>
                                <TextInput
                                    label="Opponent Team Name"
                                    value={teamB}
                                    onChangeText={(text) => {
                                        setTeamB(text);
                                        setShowMenu(true);
                                    }}
                                    onFocus={() => { setTeamBFocused(true); setShowMenu(true); }}
                                    onBlur={() => setTimeout(() => setTeamBFocused(false), 250)}
                                    mode="outlined"
                                    left={<TextInput.Icon icon={() => <Target size={20} color="#EF5350" />} />}
                                    style={styles.input}
                                    outlineStyle={{ borderRadius: 12 }}
                                    activeOutlineColor="#4C8C4A"
                                />
                                {teamBFocused && filteredTeams.length > 0 && (
                                    <View style={styles.suggestionsContainer}>
                                        <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                                            {filteredTeams.map((t, i) => (
                                                <TouchableOpacity 
                                                    key={i} 
                                                    style={styles.suggestionItem}
                                                    onPress={() => {
                                                        setTeamB(t);
                                                        setTeamBFocused(false);
                                                        setShowMenu(false);
                                                        Keyboard.dismiss();
                                                    }}
                                                >
                                                    <Shield size={16} color="#4C8C4A" />
                                                    <Text style={styles.suggestionText}>{t}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <TextInput
                                label="Team B Name"
                                value={teamB}
                                onChangeText={setTeamB}
                                mode="outlined"
                                left={<TextInput.Icon icon={() => <Target size={20} color="#EF5350" />} />}
                                style={styles.input}
                                outlineStyle={{ borderRadius: 12 }}
                                activeOutlineColor="#4C8C4A"
                            />
                        )}

                        <TextInput
                            label="Ground/Venue"
                            value={ground}
                            onChangeText={setGround}
                            mode="outlined"
                            left={<TextInput.Icon icon={() => <Shield size={20} color="#666" />} />}
                            style={styles.input}
                            outlineStyle={{ borderRadius: 12 }}
                            activeOutlineColor="#4C8C4A"
                        />

                        <TextInput
                            label="Match Date & Time"
                            value={matchDate}
                            onChangeText={setMatchDate}
                            mode="outlined"
                            style={styles.input}
                            outlineStyle={{ borderRadius: 12 }}
                            activeOutlineColor="#4C8C4A"
                        />

                        <View style={styles.row}>
                            <TextInput
                                label="Total Overs"
                                value={overs}
                                onChangeText={setOvers}
                                mode="outlined"
                                keyboardType="numeric"
                                style={[styles.input, { flex: 1 }]}
                                outlineStyle={{ borderRadius: 12 }}
                                activeOutlineColor="#4C8C4A"
                            />
                            <View style={{ width: 16 }} />
                            <TextInput
                                label="Players/Team"
                                value={playersPerTeam}
                                onChangeText={setPlayersPerTeam}
                                mode="outlined"
                                keyboardType="numeric"
                                style={[styles.input, { flex: 1 }]}
                                outlineStyle={{ borderRadius: 12 }}
                                activeOutlineColor="#4C8C4A"
                            />
                        </View>
                    </Card.Content>
                </Card>

                <Button 
                    mode="contained" 
                    onPress={handleNext}
                    style={styles.nextBtn}
                    contentStyle={{ height: 56 }}
                >
                    Select Playing XI
                </Button>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF9' },
    content: { padding: 24, flexGrow: 1 },
    title: { fontSize: 24, fontWeight: '800', color: '#1B4D3E', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#666', marginBottom: 24 },
    card: { borderRadius: 16, elevation: 2, backgroundColor: 'white', marginBottom: 24 },
    cardContent: { gap: 8 },
    input: { backgroundColor: 'white', marginBottom: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    nextBtn: { 
        marginTop: 'auto', 
        borderRadius: 12, 
        backgroundColor: '#4C8C4A',
        elevation: 4,
        marginBottom: 20
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 8,
        zIndex: 1000,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E8F5E9',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        backgroundColor: '#FCFCFC'
    },
    suggestionText: {
        marginLeft: 12,
        fontSize: 15,
        color: '#1B4D3E',
        fontWeight: '600'
    }
});

export default TeamSetupScreen;
