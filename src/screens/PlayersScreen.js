import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, FlatList, Linking } from 'react-native';
import { Button, Card, Text, useTheme, Avatar, Portal, Dialog } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { User, Plus, Trash2, Hash, Phone, Contact, Edit2, Instagram, Facebook, Shield, Star, BarChart2 } from 'lucide-react-native';
import { getAppPlayers, deleteAppPlayer } from '../database/database';

const PlayersScreen = ({ navigation, route }) => {
    const theme = useTheme();
    const [players, setPlayers] = useState([]);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const filterTeam = route?.params?.filterTeam;

    React.useLayoutEffect(() => {
        if (filterTeam) {
            navigation.setOptions({ title: filterTeam });
        }
    }, [navigation, filterTeam]);

    useFocusEffect(
        React.useCallback(() => {
            loadPlayers();
        }, [])
    );

    const loadPlayers = async () => {
        try {
            const data = await getAppPlayers();
            // Sort by name case-insensitively
            let sortedData = data.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

            if (filterTeam) {
                sortedData = sortedData.filter(p => p.team_name === filterTeam);
            }

            setPlayers(sortedData);
        } catch (error) {
            console.error('Failed to load players:', error);
        }
    };

    const handleEdit = (player) => {
        navigation.navigate('AddPlayer', { player });
    };

    const handleDeletePlayer = (id) => {
        setPendingDeleteId(id);
        setDeleteDialogVisible(true);
    };

    const confirmDelete = async () => {
        setDeleteDialogVisible(false);
        if (pendingDeleteId) {
            try {
                await deleteAppPlayer(pendingDeleteId);
                loadPlayers();
            } catch (error) {
                console.error('Failed to delete player:', error);
            }
            setPendingDeleteId(null);
        }
    };

    const openLink = async (url) => {
        if (!url) return;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', "Don't know how to open this URL: " + url);
            }
        } catch (error) {
            console.error('An error occurred', error);
        }
    };

    const getHandle = (url, prefix = '@') => {
        if (!url) return '';

        // If user entered only username (ex: prakash9047 or @prakash9047)
        if (!url.startsWith('http')) {
            return prefix + url.replace(/^@/, '');
        }

        try {
            // Remove query parameters
            const cleanUrl = url.split('?')[0];

            // Split URL
            const parts = cleanUrl.split('/').filter(Boolean);

            // Get last part (username)
            const username = parts[parts.length - 1];

            return prefix + username;
        } catch (error) {
            return prefix + url;
        }
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                            <Text style={styles.playerName} numberOfLines={1}>{item.name}</Text>
                            {item.is_captain === 1 && (
                                <View style={styles.nameBadgeC}>
                                    <Text style={styles.nameBadgeTextC}>C</Text>
                                </View>
                            )}
                            {item.is_wicket_keeper === 1 && (
                                <View style={styles.nameBadgeWK}>
                                    <Text style={styles.nameBadgeTextWK}>WK</Text>
                                </View>
                            )}
                        </View>
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
                                <TouchableOpacity 
                                    style={[styles.badge, styles.instaBadge]}
                                    onPress={() => openLink(item.insta_id)}
                                >
                                    <View style={styles.instaCircle}>
                                        <Instagram size={10} color="white" />
                                    </View>
                                    <Text style={styles.instaText}>{getHandle(item.insta_id, '@')}</Text>
                                </TouchableOpacity>
                            )}
                            {item.fb_id && (
                                <TouchableOpacity 
                                    style={[styles.badge, styles.fbBadge]}
                                    onPress={() => openLink(item.fb_id)}
                                >
                                    <Facebook size={12} color="white" />
                                    <Text style={styles.fbText}>Facebook</Text>
                                </TouchableOpacity>
                            )}
                            {item.batting_style && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{item.batting_style === 'Right Hand' ? 'RHB' : 'LHB'}</Text>
                                </View>
                            )}
                            {item.team_name && (
                                <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
                                    <Shield size={12} color="#4C8C4A" />
                                    <Text style={[styles.badgeText, { color: '#4C8C4A' }]}>{item.team_name}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </View>
            <View style={{ height: 1, backgroundColor: '#f0f0f0' }} />
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => navigation.navigate('PlayerStats', { player: item })} style={styles.actionItem}>
                    <BarChart2 size={18} color="#1565C0" />
                    <Text style={[styles.actionLabel, { color: '#1565C0' }]}>Stats</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionItem}>
                    <Edit2 size={18} color="#4C8C4A" />
                    <Text style={[styles.actionLabel, { color: '#4C8C4A' }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeletePlayer(item.id)} style={styles.actionItem}>
                    <Trash2 size={18} color="#EF5350" />
                    <Text style={[styles.actionLabel, { color: '#EF5350' }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <Portal>
                <Dialog
                    visible={deleteDialogVisible}
                    onDismiss={() => setDeleteDialogVisible(false)}
                    style={styles.deleteDialog}
                >
                    <View style={styles.deleteDialogIcon}>
                        <Trash2 size={32} color="#EF5350" />
                    </View>
                    <Dialog.Title style={styles.deleteDialogTitle}>Delete Player?</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.deleteDialogBody}>
                            Are you sure you want to remove this player? This action cannot be undone.
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

            <View style={styles.header}>
                <Text style={styles.headerSubtitle}>{players.length} {filterTeam ? 'Players' : 'Players Registered'}</Text>
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
    cardContent: { padding: 16 },
    playerInfo: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
    textContainer: { marginLeft: 12, flex: 1 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    playerName: { fontSize: 18, fontWeight: '700', color: '#1B4D3E' },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, color: '#666', marginLeft: 3, fontWeight: 'bold' },
    instaBadge: { 
        backgroundColor: '#E1306C', 
        paddingLeft: 4, 
        paddingRight: 10,
        height: 24,
        borderRadius: 12
    },
    instaCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4
    },
    instaText: { color: 'white', fontSize: 11, fontWeight: '800' },
    fbBadge: { 
        backgroundColor: '#1877F2', 
        paddingHorizontal: 8,
        height: 24,
        borderRadius: 12
    },
    fbText: { color: 'white', fontSize: 11, fontWeight: '800', marginLeft: 4 },
    statsBtn: { padding: 8 },
    deleteBtn: { flex: 1, borderRadius: 10 },
    editBtn: { padding: 8, marginLeft: 4 },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        backgroundColor: '#FCFCFC',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    actionLabel: {
        marginLeft: 6,
        fontWeight: '700',
        fontSize: 13,
    },
    nameBadgeC: {
        backgroundColor: '#FFF9C4',
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
        marginLeft: 6,
        borderWidth: 1,
        borderColor: '#FBC02D'
    },
    nameBadgeTextC: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#F9A825'
    },
    nameBadgeWK: {
        backgroundColor: '#FFF3E0',
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
        marginLeft: 4,
        borderWidth: 1,
        borderColor: '#EF6C00'
    },
    nameBadgeTextWK: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#E65100'
    },
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

    deleteDialog: {
        borderRadius: 20,
        backgroundColor: 'white',
        paddingTop: 8,
        overflow: 'hidden',
        borderTopWidth: 5,
        borderTopColor: '#EF5350',
    },
    deleteDialogIcon: { alignItems: 'center', marginTop: 20, marginBottom: 4 },
    deleteDialogTitle: { textAlign: 'center', fontWeight: '800', fontSize: 20, color: '#1B4D3E' },
    deleteDialogBody: { textAlign: 'center', color: '#666', fontSize: 14, lineHeight: 20 },
    deleteDialogActions: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
    cancelBtn: { flex: 1, borderRadius: 10, borderColor: '#4C8C4A' },
    cancelBtnLabel: { color: '#4C8C4A', fontWeight: '700' },
    deleteBtn: { flex: 1, borderRadius: 10 },
    deleteBtnLabel: { color: 'white', fontWeight: '700' },
});

export default PlayersScreen;
