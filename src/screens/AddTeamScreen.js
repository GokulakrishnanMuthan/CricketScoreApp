import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { TextInput, Button, Text, Card, useTheme, IconButton, Title } from 'react-native-paper';
import { Shield, Plus, Trash2, Save, User, Users } from 'lucide-react-native';
import { addAppPlayer } from '../database/database';

const AddTeamScreen = ({ navigation }) => {
    const theme = useTheme();
    const [teamName, setTeamName] = useState('');
    const [playerNames, setPlayerNames] = useState(['']); // Start with one empty player
    const inputRefs = useRef([]);
    const [shouldFocusLast, setShouldFocusLast] = useState(false);

    useEffect(() => {
        if (shouldFocusLast && inputRefs.current[playerNames.length - 1]) {
            inputRefs.current[playerNames.length - 1].focus();
            setShouldFocusLast(false);
        }
    }, [playerNames.length, shouldFocusLast]);

    const handleAddPlayerInput = () => {
        setPlayerNames([...playerNames, '']);
        setShouldFocusLast(true);
    };

    const handleRemovePlayerInput = (index) => {
        if (playerNames.length === 1) {
            setPlayerNames(['']);
            return;
        }
        const newPlayers = [...playerNames];
        newPlayers.splice(index, 1);
        setPlayerNames(newPlayers);
    };

    const handlePlayerNameChange = (text, index) => {
        const newPlayers = [...playerNames];
        newPlayers[index] = text;
        setPlayerNames(newPlayers);
    };

    const handleSave = async () => {
        if (!teamName.trim()) {
            return Alert.alert('Required', 'Please enter a team name');
        }
        
        const validPlayers = playerNames.filter(p => p.trim() !== '');
        if (validPlayers.length === 0) {
            return Alert.alert('Required', 'Please enter at least one player name');
        }

        try {
            // Add each player to the database with the team name
            for (const playerName of validPlayers) {
                await addAppPlayer(
                    playerName.trim(), 
                    '', // jersey
                    'All-Rounder', // role
                    '', // phone
                    null, // image
                    '', // insta
                    'Right Hand', // batting
                    'Right Arm Medium', // bowling
                    false, // isWK
                    '', // fb
                    false, // isCaptain
                    teamName.trim()
                );
            }
            
            Alert.alert('Success', `Team ${teamName} created with ${validPlayers.length} players!`, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Failed to create team:', error);
            Alert.alert('Error', 'Failed to save the team and players.');
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <IconButton icon="arrow-left" iconColor="white" onPress={() => navigation.goBack()} />
                <Title style={styles.headerTitle}>Create New Team</Title>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label="Opponent Team Name"
                            value={teamName}
                            onChangeText={setTeamName}
                            mode="outlined"
                            outlineStyle={{ borderRadius: 12 }}
                            activeOutlineColor="#4C8C4A"
                            left={<TextInput.Icon icon={() => <Shield size={20} color="#4C8C4A" />} />}
                            style={styles.input}
                            placeholder="Ex: Chennai Lions"
                        />
                    </Card.Content>
                </Card>

                <View style={styles.playerHeader}>
                    <Title style={styles.sectionTitle}>Squad List</Title>
                    <Text style={styles.playerCount}>{playerNames.filter(p => p.trim()).length} Players Added</Text>
                </View>

                {playerNames.map((name, index) => (
                    <View key={index} style={styles.playerRow}>
                        <TextInput
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            label={`Player ${index + 1}`}
                            value={name}
                            onChangeText={(text) => handlePlayerNameChange(text, index)}
                            mode="outlined"
                            outlineStyle={{ borderRadius: 12 }}
                            activeOutlineColor="#4C8C4A"
                            left={<TextInput.Icon icon={() => <User size={18} color="#666" />} />}
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            placeholder="Enter player name"
                        />
                        <IconButton 
                            icon="delete-outline" 
                            iconColor="#EF5350" 
                            onPress={() => handleRemovePlayerInput(index)} 
                            style={styles.deleteBtn}
                        />
                    </View>
                ))}

                <Button 
                    mode="outlined" 
                    onPress={handleAddPlayerInput}
                    icon="plus"
                    style={styles.addPlayerBtn}
                    labelStyle={{ color: '#4C8C4A' }}
                >
                    Add More Players
                </Button>

                <Button 
                    mode="contained" 
                    onPress={handleSave}
                    icon="content-save"
                    style={styles.saveBtn}
                    contentStyle={{ height: 50 }}
                >
                    Save Team & Squad
                </Button>
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF9' },
    header: { padding: 16, paddingTop: 40, backgroundColor: '#1B4D3E', flexDirection: 'row', alignItems: 'center' },
    headerTitle: { color: 'white', marginLeft: 8, fontSize: 20 },
    content: { padding: 16 },
    card: { borderRadius: 16, elevation: 4, marginBottom: 20, backgroundColor: 'white' },
    input: { backgroundColor: 'white', marginBottom: 12 },
    playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 18, color: '#1B4D3E', fontWeight: 'bold' },
    playerCount: { color: '#666', fontSize: 12, fontWeight: '700' },
    playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 4 },
    deleteBtn: { marginTop: 4 },
    addPlayerBtn: { marginBottom: 30, borderColor: '#4C8C4A', borderStyle: 'dashed', borderWidth: 1.5, borderRadius: 12 },
    saveBtn: { borderRadius: 12, backgroundColor: '#4C8C4A' }
});

export default AddTeamScreen;
