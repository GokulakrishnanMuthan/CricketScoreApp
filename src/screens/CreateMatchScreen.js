import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Card, Text, Title, RadioButton } from 'react-native-paper';
import { useMatch } from '../context/MatchContext';
import { createMatch } from '../database/database';

const CreateMatchScreen = ({ navigation }) => {
    const [teamA, setTeamA] = useState('');
    const [teamB, setTeamB] = useState('');
    const [overs, setOvers] = useState('10');
    const [playersPerTeam, setPlayersPerTeam] = useState('11');
    const [ground, setGround] = useState('');
    const [matchDate, setMatchDate] = useState(new Date().toLocaleString());
    const [tossWinner, setTossWinner] = useState('teamA');
    const [tossDecision, setTossDecision] = useState('bat');
    const { startMatch } = useMatch();

    const handleStartMatch = async () => {
        if (!teamA || !teamB) return alert('Please enter team names');

        const matchData = {
            teamA,
            teamB,
            overs: parseInt(overs),
            playersPerTeam: parseInt(playersPerTeam),
            ground,
            date: matchDate,
            tossWinner: tossWinner === 'teamA' ? teamA : teamB,
            tossDecision,
        };

        try {
            const matchId = await createMatch(matchData);
            startMatch(matchId, matchData);
            navigation.navigate('Scoring');
        } catch (error) {
            console.error('Failed to create match:', error);
            alert('Error creating match. Please try again.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.title}>Match Setup</Text>

                    <TextInput
                        label="Team A Name"
                        value={teamA}
                        onChangeText={setTeamA}
                        mode="outlined"
                        autoFocus={true}
                        outlineColor="#e0e0e0"
                        activeOutlineColor="#4C8C4A"
                        outlineStyle={{ borderRadius: 12 }}
                        style={styles.input}
                    />

                    <TextInput
                        label="Team B Name"
                        value={teamB}
                        onChangeText={setTeamB}
                        mode="outlined"
                        outlineColor="#e0e0e0"
                        activeOutlineColor="#4C8C4A"
                        outlineStyle={{ borderRadius: 12 }}
                        style={styles.input}
                    />

                    <TextInput
                        label="Ground/Venue"
                        value={ground}
                        onChangeText={setGround}
                        mode="outlined"
                        outlineColor="#e0e0e0"
                        activeOutlineColor="#4C8C4A"
                        outlineStyle={{ borderRadius: 12 }}
                        style={styles.input}
                    />

                    <TextInput
                        label="Match Date & Time"
                        value={matchDate}
                        onChangeText={setMatchDate}
                        mode="outlined"
                        outlineColor="#e0e0e0"
                        activeOutlineColor="#4C8C4A"
                        outlineStyle={{ borderRadius: 12 }}
                        style={styles.input}
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                        <TextInput
                            label="Overs"
                            value={overs}
                            onChangeText={setOvers}
                            keyboardType="numeric"
                            mode="outlined"
                            outlineColor="#e0e0e0"
                            activeOutlineColor="#4C8C4A"
                            outlineStyle={{ borderRadius: 12 }}
                            style={[styles.input, { flex: 1 }]}
                        />
                        <TextInput
                            label="Players"
                            value={playersPerTeam}
                            onChangeText={setPlayersPerTeam}
                            keyboardType="numeric"
                            mode="outlined"
                            outlineColor="#e0e0e0"
                            activeOutlineColor="#4C8C4A"
                            outlineStyle={{ borderRadius: 12 }}
                            style={[styles.input, { flex: 1 }]}
                        />
                    </View>

                    <Text style={styles.label}>Toss Winner</Text>
                    <RadioButton.Group onValueChange={value => setTossWinner(value)} value={tossWinner}>
                        <View style={styles.radioRow}>
                            <RadioButton.Item
                                label={teamA || "Team A"}
                                value="teamA"
                                style={styles.radioItem}
                                labelStyle={{ fontSize: 14 }}
                                color="#4C8C4A"
                            />
                            <RadioButton.Item
                                label={teamB || "Team B"}
                                value="teamB"
                                style={styles.radioItem}
                                labelStyle={{ fontSize: 14 }}
                                color="#4C8C4A"
                            />
                        </View>
                    </RadioButton.Group>

                    <Text style={styles.label}>Decision</Text>
                    <RadioButton.Group onValueChange={value => setTossDecision(value)} value={tossDecision}>
                        <View style={styles.radioRow}>
                            <RadioButton.Item
                                label="Batting"
                                value="bat"
                                style={styles.radioItem}
                                labelStyle={{ fontSize: 14 }}
                                color="#4C8C4A"
                            />
                            <RadioButton.Item
                                label="Bowling"
                                value="bowl"
                                style={styles.radioItem}
                                labelStyle={{ fontSize: 14 }}
                                color="#4C8C4A"
                            />
                        </View>
                    </RadioButton.Group>

                    <Button
                        mode="contained"
                        onPress={handleStartMatch}
                        style={styles.button}
                        contentStyle={{ height: 52 }}
                        labelStyle={{ fontSize: 16, fontWeight: '700' }}
                    >
                        Start Match
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF9' },
    card: {
        margin: 16,
        padding: 8,
        elevation: 6,
        borderRadius: 20,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1B4D3E',
        marginBottom: 20,
        textAlign: 'center'
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'white'
    },
    label: {
        marginTop: 12,
        marginBottom: 8,
        fontWeight: '700',
        color: '#444',
        fontSize: 14,
    },
    radioRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F0F4F1',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    radioItem: {
        flex: 1,
    },
    button: {
        marginTop: 24,
        backgroundColor: '#4C8C4A',
        borderRadius: 12,
        elevation: 4,
    },
});

export default CreateMatchScreen;
