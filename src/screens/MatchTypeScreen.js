import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, RadioButton, Button, Card, useTheme } from 'react-native-paper';
import { Users, Globe } from 'lucide-react-native';
import { useMatch } from '../context/MatchContext';

const MatchTypeScreen = ({ navigation }) => {
    const theme = useTheme();
    const { setupData = {}, updateSetupData, clearSetupData } = useMatch();
    const [value, setValue] = React.useState(setupData?.matchType || 'local');

    const handleNext = () => {
        clearSetupData();
        updateSetupData({ matchType: value });
        navigation.navigate('TeamSetup');
    };

    const Option = ({ id, label, icon: Icon, description }) => (
        <TouchableOpacity 
            style={[styles.option, value === id && { borderColor: '#4C8C4A', backgroundColor: '#F0F4F1' }]} 
            onPress={() => setValue(id)}
        >
            <View style={styles.optionHeader}>
                <View style={[styles.iconContainer, value === id && { backgroundColor: '#4C8C4A' }]}>
                    <Icon size={24} color={value === id ? 'white' : '#666'} />
                </View>
                <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{label}</Text>
                    <Text style={styles.optionDesc}>{description}</Text>
                </View>
                <RadioButton value={id} color="#4C8C4A" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Select Match Type</Text>
                <Text style={styles.subtitle}>Choose how you want to set up your teams</Text>

                <RadioButton.Group onValueChange={newValue => setValue(newValue)} value={value}>
                    <Option 
                        id="local" 
                        label="Local Match" 
                        icon={Users} 
                        description="Playing within your club or common group"
                    />
                    <Option 
                        id="other" 
                        label="Other Team Match" 
                        icon={Globe} 
                        description="Professional match against an external team"
                    />
                </RadioButton.Group>

                <Button 
                    mode="contained" 
                    onPress={handleNext}
                    style={styles.nextBtn}
                    contentStyle={{ height: 56 }}
                >
                    Continue
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF9' },
    content: { padding: 24, flex: 1 },
    title: { fontSize: 24, fontWeight: '800', color: '#1B4D3E', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#666', marginBottom: 32 },
    option: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#eee',
        backgroundColor: 'white',
        marginBottom: 16,
        elevation: 2
    },
    optionHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    optionText: { flex: 1 },
    optionLabel: { fontSize: 18, fontWeight: '700', color: '#1B4D3E' },
    optionDesc: { fontSize: 13, color: '#666', marginTop: 2 },
    nextBtn: { 
        marginTop: 'auto', 
        borderRadius: 12, 
        backgroundColor: '#4C8C4A',
        elevation: 4
    }
});

export default MatchTypeScreen;
