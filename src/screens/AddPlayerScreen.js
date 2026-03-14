import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Image } from 'react-native';
import { TextInput, Button, Text, IconButton, Portal, Dialog, useTheme, Avatar } from 'react-native-paper';
import { User, Plus, Camera, Instagram, Facebook, Phone, Contact, Hash, ChevronDown, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { addAppPlayer, updateAppPlayer } from '../database/database';

const AddPlayerScreen = ({ navigation, route }) => {
    const theme = useTheme();
    const editingPlayer = route.params?.player || null;

    const [name, setName] = useState(editingPlayer?.name || '');
    const [jersey, setJersey] = useState(editingPlayer?.jersey_number || '');
    const [role, setRole] = useState(editingPlayer?.role || 'All-Rounder');
    const [battingStyle, setBattingStyle] = useState(editingPlayer?.batting_style || 'Right Hand');
    const [bowlingStyle, setBowlingStyle] = useState(editingPlayer?.bowling_style || 'Right Arm Medium');
    const [isWK, setIsWK] = useState(editingPlayer?.is_wicket_keeper === 1);
    const [phone, setPhone] = useState(editingPlayer?.phone || '');
    const [insta, setInsta] = useState(editingPlayer?.insta_id || '');
    const [fb, setFb] = useState(editingPlayer?.fb_id || '');
    const [image, setImage] = useState(editingPlayer?.image_uri || null);

    const [roleVisible, setRoleVisible] = useState(false);
    const [battingVisible, setBattingVisible] = useState(false);
    const [bowlingVisible, setBowlingVisible] = useState(false);

    const roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'];
    const battingStyles = ['Right Hand', 'Left Hand'];
    const bowlingStyles = [
        'Right Arm Fast', 'Right Arm Medium', 'Off Break', 'Leg Break',
        'Left Arm Fast', 'Left Arm Medium', 'Slow Left Arm', 'Left Arm Unorthodox'
    ];

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name) return Alert.alert('Error', 'Player name is required');

        try {
            if (editingPlayer) {
                await updateAppPlayer(editingPlayer.id, name, jersey, role, phone, image, insta, battingStyle, bowlingStyle, isWK, fb);
            } else {
                await addAppPlayer(name, jersey, role, phone, image, insta, battingStyle, bowlingStyle, isWK, fb);
            }
            navigation.goBack();
        } catch (error) {
            console.error('Failed to save player:', error);
            Alert.alert('Error', 'Failed to save player');
        }
    };

    const DropdownItem = ({ label, value, options, visible, setVisible, onSelect }) => (
        <View style={styles.dropdownContainer}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity 
                style={styles.dropdown} 
                onPress={() => setVisible(true)}
            >
                <Text style={styles.dropdownText}>{value}</Text>
                <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            <Portal>
                <Dialog visible={visible} onDismiss={() => setVisible(false)} style={styles.dialog}>
                    <Dialog.Title>Select {label}</Dialog.Title>
                    <Dialog.Content>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {options.map((option) => (
                                <TouchableOpacity 
                                    key={option} 
                                    onPress={() => {
                                        onSelect(option);
                                        setVisible(false);
                                    }}
                                    style={styles.optionItem}
                                >
                                    <Text style={[styles.optionText, value === option && styles.activeOptionText]}>{option}</Text>
                                    {value === option && <View style={styles.activeDot} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Dialog.Content>
                </Dialog>
            </Portal>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.imageSection}>
                <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <User size={60} color="#A5D6A7" />
                        </View>
                    )}
                    <View style={styles.cameraBtn}>
                        <Camera size={20} color="white" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.imageHint}>Tap to upload profile photo</Text>
            </View>

            <View style={styles.formSection}>
                <TextInput
                    label="Player Name *"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                    outlineStyle={{ borderRadius: 12 }}
                    activeOutlineColor="#4C8C4A"
                />

                <TextInput
                    label="Jersey Number"
                    value={jersey}
                    onChangeText={setJersey}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                    outlineStyle={{ borderRadius: 12 }}
                    activeOutlineColor="#4C8C4A"
                />

                <DropdownItem 
                    label="Player Role" 
                    value={role} 
                    options={roles} 
                    visible={roleVisible} 
                    setVisible={setRoleVisible} 
                    onSelect={setRole} 
                />

                <DropdownItem 
                    label="Batting Style" 
                    value={battingStyle} 
                    options={battingStyles} 
                    visible={battingVisible} 
                    setVisible={setBattingVisible} 
                    onSelect={setBattingStyle} 
                />

                <DropdownItem 
                    label="Bowling Style" 
                    value={bowlingStyle} 
                    options={bowlingStyles} 
                    visible={bowlingVisible} 
                    setVisible={setBowlingVisible} 
                    onSelect={setBowlingStyle} 
                />

                <View style={styles.switchContainer}>
                    <View>
                        <Text style={styles.label}>Wicket Keeper</Text>
                        <Text style={styles.subLabel}>Is this player a specialist WK?</Text>
                    </View>
                    <Switch
                        value={isWK}
                        onValueChange={setIsWK}
                        trackColor={{ false: '#ddd', true: '#A5D6A7' }}
                        thumbColor={isWK ? '#4C8C4A' : '#f4f3f4'}
                    />
                </View>

                <TextInput
                    label="Mobile Number"
                    value={phone}
                    onChangeText={setPhone}
                    mode="outlined"
                    keyboardType="phone-pad"
                    left={<TextInput.Icon icon={() => <Phone size={20} color="#666" />} />}
                    style={styles.input}
                    outlineStyle={{ borderRadius: 12 }}
                    activeOutlineColor="#4C8C4A"
                />

                <TextInput
                    label="Instagram"
                    value={insta}
                    onChangeText={setInsta}
                    mode="outlined"
                    placeholder="@username"
                    left={<TextInput.Icon icon={() => <Instagram size={20} color="#D81B60" />} />}
                    style={styles.input}
                    outlineStyle={{ borderRadius: 12 }}
                    activeOutlineColor="#D81B60"
                />

                <TextInput
                    label="Facebook"
                    value={fb}
                    onChangeText={setFb}
                    mode="outlined"
                    placeholder="profile link"
                    left={<TextInput.Icon icon={() => <Facebook size={20} color="#1877F2" />} />}
                    style={styles.input}
                    outlineStyle={{ borderRadius: 12 }}
                    activeOutlineColor="#1877F2"
                />
            </View>

            <Button 
                mode="contained" 
                onPress={handleSave}
                style={styles.saveBtn}
                contentStyle={{ height: 56 }}
                icon={() => <Save size={20} color="white" />}
            >
                {editingPlayer ? 'Update Player' : 'Save Player'}
            </Button>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF9' },
    content: { padding: 20 },
    imageSection: { alignItems: 'center', marginBottom: 24 },
    avatarContainer: { width: 120, height: 120, borderRadius: 60, position: 'relative' },
    avatarImage: { width: 120, height: 120, borderRadius: 60 },
    avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#A5D6A7', borderStyle: 'dashed' },
    cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4C8C4A', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    imageHint: { marginTop: 8, color: '#666', fontSize: 13 },
    formSection: { gap: 16, marginBottom: 32 },
    input: { backgroundColor: 'white' },
    label: { fontSize: 14, fontWeight: '600', color: '#1B4D3E', marginBottom: 8 },
    subLabel: { fontSize: 12, color: '#666' },
    dropdownContainer: { marginBottom: 4 },
    dropdown: { 
        height: 56, 
        borderWidth: 1, 
        borderColor: '#ccc', 
        borderRadius: 12, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16,
        backgroundColor: 'white'
    },
    dropdownText: { fontSize: 16, color: '#333' },
    switchContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee'
    },
    saveBtn: { borderRadius: 12, backgroundColor: '#4C8C4A', elevation: 4 },
    dialog: { borderRadius: 20, backgroundColor: 'white' },
    optionItem: { 
        paddingVertical: 14, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    optionText: { fontSize: 16, color: '#444' },
    activeOptionText: { color: '#4C8C4A', fontWeight: 'bold' },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4C8C4A' }
});

export default AddPlayerScreen;
