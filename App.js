import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/theme/theme';
import { MatchProvider } from './src/context/MatchContext';
import { initDatabase } from './src/database/database';

import HomeScreen from './src/screens/HomeScreen';
import CreateMatchScreen from './src/screens/CreateMatchScreen';
import ScoringScreen from './src/screens/ScoringScreen';
import ScoreboardScreen from './src/screens/ScoreboardScreen';
import PlayersScreen from './src/screens/PlayersScreen';
import AddPlayerScreen from './src/screens/AddPlayerScreen';
import PlayerStatsScreen from './src/screens/PlayerStatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MatchTypeScreen from './src/screens/MatchTypeScreen.js';
import TeamSetupScreen from './src/screens/TeamSetupScreen.js';
import PlayingXISelectionScreen from './src/screens/PlayingXISelectionScreen.js';
import MatchSummaryScreen from './src/screens/MatchSummaryScreen.js';
import AllMatchesScreen from './src/screens/AllMatchesScreen.js';
import { DefaultTheme } from '@react-navigation/native';

const Stack = createStackNavigator();

const navTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.primary,
        text: '#ffffff',
    },
};

export default function App() {
    const [dbInitialized, setDbInitialized] = React.useState(false);

    React.useEffect(() => {
        initDatabase()
            .then(() => setDbInitialized(true))
            .catch(err => console.error("Failed to init DB", err));
    }, []);

    if (!dbInitialized) return null;

    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <MatchProvider>
                    <NavigationContainer theme={navTheme}>
                        <Stack.Navigator
                            initialRouteName="Home"
                            screenOptions={{
                                headerStyle: { backgroundColor: theme.colors.primary },
                                headerTintColor: '#fff',
                                headerTitleStyle: { fontWeight: '700' },
                            }}
                        >
                            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Cricket Scorer Pro' }} />
                            <Stack.Screen name="CreateMatch" component={CreateMatchScreen} options={{ title: 'Create New Match' }} />
                            <Stack.Screen name="Scoring" component={ScoringScreen} options={{ title: 'Live Scoring' }} />
                            <Stack.Screen name="Scoreboard" component={ScoreboardScreen} options={{ title: 'Match Scoreboard' }} />
                            <Stack.Screen name="Players" component={PlayersScreen} options={{ title: 'Players' }} />
                            <Stack.Screen name="AddPlayer" component={AddPlayerScreen} options={({ route }) => ({ title: route.params?.player ? 'Edit Player' : 'Add New Player' })} />
                            <Stack.Screen name="PlayerStats" component={PlayerStatsScreen} options={({ route }) => ({ title: `${route.params?.player?.name || 'Player'} — Stats` })} />
                            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings & Backup' }} />
                            <Stack.Screen name="MatchType" component={MatchTypeScreen} options={{ title: 'Select Match Type' }} />
                            <Stack.Screen name="TeamSetup" component={TeamSetupScreen} options={{ title: 'Team Setup' }} />
                            <Stack.Screen name="PlayingXISelection" component={PlayingXISelectionScreen} options={{ title: 'Select Playing XI' }} />
                            <Stack.Screen name="MatchSummary" component={MatchSummaryScreen} options={{ title: 'Match Summary' }} />
                            <Stack.Screen name="AllMatches" component={AllMatchesScreen} options={{ title: 'All Matches' }} />
                        </Stack.Navigator>
                    </NavigationContainer>
                </MatchProvider>
            </PaperProvider>
        </SafeAreaProvider>
    );
}
