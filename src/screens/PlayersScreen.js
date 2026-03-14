import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Button, Card, Text, useTheme, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { User, Plus, Trash2, Hash, Phone, Contact, Edit2, Instagram, Facebook, Shield } from 'lucide-react-native';
import { getAppPlayers, deleteAppPlayer } from '../database/database';

const PlayersScreen = ({ navigation }) => {
    const theme = useTheme();
    const [players, setPlayers] = useState([]);

    useFocusEffect(
        React.useCallback(() => {
            loadPlayers();
        }, [])
    );

    const loadPlayers = async () => {
        try {
            const data = await getAppPlayers();
            // Sort by name case-insensitively
            const sortedData = data.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
            setPlayers(sortedData);
        } catch (error) {
            console.error('Failed to load players:', error);
        }
    };

    const handleEdit = (player) => {
        navigation.navigate('AddPlayer', { player });
    };

    const handleDeletePlayer = (id) => {
        Alert.alert(
            'Delete Player',
            'Are you sure you want to delete this player?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAppPlayer(id);
                            loadPlayers();
                        } catch (error) {
                            console.error('Failed to delete player:', error);
                        }
                    }
                }
            ]
        );
    };

    const renderPlayerItem = ({ item }) => (
        <Card style={styles.playerCard}>
            <View style={styles.cardContent}>
                <View style={styles.playerInfo}>
                    <View style={styles.avatar}>
                        {item.image_uri ? (
                            <Avatar.Image size={48} source={{ uri: item.image_uri }} />
                        ) : (
                            <User size={24} color="#4C8C4A" />
                        )}
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.playerName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.badgeRow}>
                            <View style={styles.badge}>
                                <Hash size={12} color="#666" />
                                <Text style={styles.badgeText}>{item.jersey_number || 'N/A'}</Text>
                            </View>
                            {item.role && (
                                <View style={styles.badge}>
                                    <Contact size={12} color="#666" />
                                    <Text style={styles.badgeText}>{item.role}</Text>
                                </View>
                            )}
                            {item.phone && (
                                <View style={styles.badge}>
                                    <Phone size={12} color="#666" />
                                    <Text style={styles.badgeText}>{item.phone}</Text>
                                </View>
                            )}
                            {item.insta_id && (
                                <View style={[styles.badge, { backgroundColor: '#FCE4EC' }]}>
                                    <Instagram size={12} color="#D81B60" />
                                    <Text style={[styles.badgeText, { color: '#D81B60' }]}>{item.insta_id}</Text>
                                </View>
                            )}
                            {item.fb_id && (
                                <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
                                    <Facebook size={12} color="#1877F2" />
                                    <Text style={[styles.badgeText, { color: '#1877F2' }]}>FB</Text>
                                </View>
                            )}
                            {item.is_wicket_keeper === 1 && (
                                <View style={[styles.badge, { backgroundColor: '#FFF3E0' }]}>
                                    <Shield size={12} color="#EF6C00" />
                                    <Text style={[styles.badgeText, { color: '#EF6C00' }]}>WK</Text>
                                </View>
                            )}
                            {item.batting_style && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{item.batting_style === 'Right Hand' ? 'RHB' : 'LHB'}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                        <Edit2 size={20} color="#4C8C4A" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePlayer(item.id)} style={styles.deleteBtn}>
                        <Trash2 size={20} color="#EF5350" />
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerSubtitle}>{players.length} Players Registered</Text>
            </View>

            <FlatList
                data={players}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPlayerItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <User size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No players added yet</Text>
                        <Button mode="outlined" style={{ marginTop: 12 }} onPress={() => navigation.navigate('AddPlayer')}>Click + to add your first player</Button>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddPlayer')}
            >
                <Plus size={30} color="white" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF9' },
    header: { padding: 20, backgroundColor: '#1B4D3E' },
    headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 24 },
    headerSubtitle: { color: '#B0C4B1', fontSize: 14 },
    listContainer: { padding: 16, paddingBottom: 100 },
    playerCard: { marginBottom: 12, borderRadius: 16, elevation: 3, backgroundColor: 'white' },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    playerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    textContainer: { marginLeft: 12, flex: 1 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
    playerName: { fontSize: 18, fontWeight: '700', color: '#1B4D3E' },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, color: '#666', marginLeft: 3, fontWeight: 'bold' },
    deleteBtn: { padding: 8, marginLeft: 8 },
    editBtn: { padding: 8 },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#4C8C4A',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 5
    },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#999', marginTop: 12, fontSize: 16 },
});

export default PlayersScreen;
