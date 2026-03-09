import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Card, Text, Title, RadioButton } from 'react-native-paper';
import { useMatch } from '../context/MatchContext';
import { createMatch } from '../database/database';

const CreateMatchScreen = ({ navigation }) => {
    const [teamA, setTeamA] = useState('');
    const [teamB, setTeamB] = useState('');
    const [overs, setOvers] = useState('10');
    const [tossWinner, setTossWinner] = useState('teamA');
    const [tossDecision, setTossDecision] = useState('bat');
    const { startMatch } = useMatch();

    const handleStartMatch = async () => {
        if (!teamA || !teamB) return alert('Please enter team names');

        const matchData = {
            teamA,
            teamB,
            overs: parseInt(overs),
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
                    <Title>Match Setup</Title>
                    <TextInput
                        label="Team A Name"
                        value={teamA}
                        onChangeText={setTeamA}
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Team B Name"
                        value={teamB}
                        onChangeText={setTeamB}
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Total Overs"
                        value={overs}
                        onChangeText={setOvers}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                    />

                    <Text variant="titleMedium" style={styles.label}>Toss Winner</Text>
                    <RadioButton.Group onValueChange={value => setTossWinner(value)} value={tossWinner}>
                        <View style={styles.radioRow}>
                            <RadioButton.Item label={teamA || "Team A"} value="teamA" />
                            <RadioButton.Item label={teamB || "Team B"} value="teamB" />
                        </View>
                    </RadioButton.Group>

                    <Text variant="titleMedium" style={styles.label}>Decision</Text>
                    <RadioButton.Group onValueChange={value => setTossDecision(value)} value={tossDecision}>
                        <View style={styles.radioRow}>
                            <RadioButton.Item label="Bat" value="bat" />
                            <RadioButton.Item label="Bowl" value="bowl" />
                        </View>
                    </RadioButton.Group>

                    <Button
                        mode="contained"
                        onPress={handleStartMatch}
                        style={styles.button}
                        contentStyle={{ height: 50 }}
                    >
                        Start Match
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
    card: { padding: 8, elevation: 4, borderRadius: 0 },
    input: { marginBottom: 16 },
    label: { marginTop: 8, marginBottom: 4 },
    radioRow: { flexDirection: 'row', justifyContent: 'space-around' },
    button: { marginTop: 24, backgroundColor: '#1B4D3E', borderRadius: 0 },
});

export default CreateMatchScreen;
