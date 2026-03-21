import React, { useState, useEffect, useRef } from 'react';
import {
    View, TextInput as RNTextInput, TouchableOpacity,
    FlatList, StyleSheet, Keyboard
} from 'react-native';
import { Text } from 'react-native-paper';
import { getAppPlayers } from '../database/database';

/**
 * PlayerAutoComplete
 *
 * A TextInput that shows a live-filtered dropdown of players from
 * the app_players database. Each item shows "Name (#jersey)".
 *
 * Props:
 *   label          — placeholder / label string
 *   value          — controlled text value
 *   onChangeText   — (text) => void  called as user types
 *   onSelect       — (player) => void  called when dropdown item tapped
 *   autoFocus      — boolean
 *   style          — extra container style
 */
const PlayerAutoComplete = ({
    label,
    value,
    onChangeText,
    onSelect,
    autoFocus = false,
    style,
}) => {
    const [allPlayers, setAllPlayers] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef(null);

    // Load players once on mount
    useEffect(() => {
        getAppPlayers()
            .then(setAllPlayers)
            .catch(() => setAllPlayers([]));
    }, []);

    const handleChange = (text) => {
        onChangeText(text);
        if (text.trim().length === 0) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }
        const q = text.toLowerCase();
        const filtered = allPlayers.filter(p =>
            p.name.toLowerCase().includes(q)
        );
        setSuggestions(filtered);
        setShowDropdown(filtered.length > 0);
    };

    const handleSelect = (player) => {
        onChangeText(player.name);
        setSuggestions([]);
        setShowDropdown(false);
        Keyboard.dismiss();
        if (onSelect) onSelect(player);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
        >
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            {item.jersey_number ? (
                <View style={[styles.jerseyBadge, { marginRight: 8 }]}>
                    <Text style={styles.jerseyText}>#{item.jersey_number}</Text>
                </View>
            ) : null}
            {item.team_name ? (
                <View style={styles.teamBadge}>
                    <Text style={styles.teamText}>{item.team_name}</Text>
                </View>
            ) : null}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, style]}>
            <RNTextInput
                ref={inputRef}
                placeholder={label}
                placeholderTextColor="#999"
                value={value}
                onChangeText={handleChange}
                autoFocus={autoFocus}
                style={styles.input}
                onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                }}
                onBlur={() => {
                    // small delay so item tap registers before hiding
                    setTimeout(() => setShowDropdown(false), 150);
                }}
            />
            {showDropdown && (
                <View style={styles.dropdown}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        keyboardShouldPersistTaps="handled"
                        style={styles.list}
                        // max 4 items visible without scrolling
                        getItemLayout={(_, index) => ({
                            length: ITEM_HEIGHT,
                            offset: ITEM_HEIGHT * index,
                            index,
                        })}
                    />
                </View>
            )}
        </View>
    );
};

const ITEM_HEIGHT = 44;

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 10,
        marginBottom: 12,
    },
    input: {
        height: 50,
        borderWidth: 1.5,
        borderColor: '#4C8C4A',
        borderRadius: 8,
        paddingHorizontal: 14,
        fontSize: 15,
        color: '#1B4D3E',
        backgroundColor: 'white',
        fontWeight: '500',
    },
    dropdown: {
        position: 'absolute',
        top: 52,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 10,
        elevation: 12,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        maxHeight: ITEM_HEIGHT * 4 + 8,
        zIndex: 999,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    list: {
        flexGrow: 0,
    },
    item: {
        height: ITEM_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    itemName: {
        fontSize: 14,
        color: '#1B4D3E',
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    jerseyBadge: {
        backgroundColor: '#E8F5E9',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    jerseyText: {
        fontSize: 12,
        color: '#4C8C4A',
        fontWeight: '700',
    },
    teamBadge: {
        backgroundColor: '#F0F4F1',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    teamText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '600',
    },
});

export default PlayerAutoComplete;
