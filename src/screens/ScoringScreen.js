import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Easing, Dimensions } from 'react-native';
import { Button, Card, Text, Title, IconButton, useTheme, Checkbox, TextInput, Portal, Dialog, Divider, Appbar, SegmentedButtons, List, Avatar } from 'react-native-paper';
import { useMatch } from '../context/MatchContext';
import { LayoutList } from 'lucide-react-native';
import PlayerAutoComplete from '../components/PlayerAutoComplete';

const ScoringScreen = ({ navigation }) => {
    const theme = useTheme();
    const {
        score, batsmen, bowler, lastBowlerName, bowlers, thisOver, addBall, undoBall,
        currentMatch, swapStrike, isOverComplete, isMatchStarted,
        startWithPlayers, setNewBowler, retireBatsman, declareInnings,
        innings, target, isInningsOver, isMatchOver, matchResult, startSecondInnings, resetMatch,
        getBowlingTeamPlayers, getBowlingTeamWK, getAvailableBatsmen, getBattingTeamPlayers
    } = useMatch();

    const [extras, setExtras] = useState({ WIDE: false, NB: false, BYE: false, LB: false, WICKET: false });

    // Initial Players State
    const [showStartModal, setShowStartModal] = useState(!isMatchStarted);
    const [initPlayers, setInitPlayers] = useState({ striker: '', nonStriker: '', bowler: '' });

    // New Bowler State
    const [showBowlerModal, setShowBowlerModal] = useState(false);
    const [nextBowler, setNextBowler] = useState('');

    // Duck Animation State
    const [showDuck, setShowDuck] = useState(false);
    const [showNextBatsmanModal, setShowNextBatsmanModal] = useState(false);
    const [pendingWicketData, setPendingWicketData] = useState(null);

    // Retire Modal State
    const [showRetireModal, setShowRetireModal] = useState(false);
    const [retireName, setRetireName] = useState('');

    // Wicket Modal State
    const [showWicketModal, setShowWicketModal] = useState(false);
    const [newBatsman, setNewBatsman] = useState('');
    const [wicketRuns, setWicketRuns] = useState('0');
    const [runOutStriker, setRunOutStriker] = useState(true);
    const [isRunOut, setIsRunOut] = useState(false);
    const [showFinishDialog, setShowFinishDialog] = useState(false);

    // New Wicket Detail State
    const [wicketType, setWicketType] = useState('Bowled');
    const [fielderName, setFielderName] = useState('');
    const [showFielderPicker, setShowFielderPicker] = useState(false);

    // Celebration State
    const [celebration, setCelebration] = useState(null);

    const bowlingPlayers = getBowlingTeamPlayers();
    const bowlingWK = getBowlingTeamWK();

    useEffect(() => {
        if (!isMatchStarted && !isMatchOver && currentMatch) {
            setShowStartModal(true);
            // Clear names if it's the start of an innings (especially 2nd)
            if (score.runs === 0 && score.overs === 0 && score.balls === 0) {
                setInitPlayers({ striker: '', nonStriker: '', bowler: '' });
            }
        } else {
            setShowStartModal(false);
        }
    }, [isMatchStarted, isMatchOver, currentMatch, score.runs, score.overs, score.balls]);

    useEffect(() => {
        if (isOverComplete && !isInningsOver && !isMatchOver) {
            setNextBowler(''); // Reset previous selection every time a new over starts
            setShowBowlerModal(true);
        }
    }, [isOverComplete, isInningsOver, isMatchOver]);

    const handleRunPress = (runs) => {
        let extraType = null;
        if (extras.WIDE) extraType = 'WIDE';
        else if (extras.NB) extraType = 'NB';
        else if (extras.BYE) extraType = 'BYE';
        else if (extras.LB) extraType = 'LB';

        addBall({ runs, extraType, isWicket: false });

        // Trigger celebration only for clean boundaries
        if (!extraType && (runs === 4 || runs === 6)) {
            setCelebration(runs.toString());
        }

        setExtras({ WIDE: false, NB: false, BYE: false, LB: false });
    };

    const handleWicketPress = (runOut = false) => {
        setIsRunOut(runOut);
        setWicketRuns('0');
        setRunOutStriker(true);
        if (runOut) {
            setWicketType('Run Out');
            setFielderName('');
        } else {
            setWicketType('Bowled');
            setFielderName(bowler.name);
        }
        setShowWicketModal(true);
    };

    const submitWicket = () => {
        if (!newBatsman) return showAlert('Please select the next batsman.');
        if ((wicketType === 'Bowled' || wicketType === 'Catch' || wicketType === 'Stumped') && !fielderName) {
            return showAlert('Please select a fielder.');
        }

        const striker = batsmen?.find(b => b.isStriker);
        const nonStriker = batsmen?.find(b => !b.isStriker);
        const outBatsman = (isRunOut && !runOutStriker) ? nonStriker : striker;
        const isDuck = outBatsman && (outBatsman.runs === 0 || outBatsman.runs === '0');

        const wicketData = {
            runs: isRunOut ? parseInt(wicketRuns) || 0 : 0,
            extraType: null,
            isWicket: true,
            newBatsmanName: newBatsman,
            wicketType: wicketType,
            fielderName: fielderName,
            runOutStriker
        };

        setShowWicketModal(false);

        if (isDuck) {
            setPendingWicketData(wicketData);
            setShowDuck(true);
        } else {
            addBall(wicketData);
            resetWicketState();
        }
    };

    const resetWicketState = () => {
        setNewBatsman('');
        setFielderName('');
        setIsRunOut(false);
        setPendingWicketData(null);
    };


    // Error Dialog State
    const [errorVisible, setErrorVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const showAlert = (msg) => {
        setErrorMessage(msg);
        setErrorVisible(true);
    };

    const submitInitialPlayers = () => {
        if (!initPlayers.striker || !initPlayers.nonStriker || !initPlayers.bowler) {
            return showAlert('Please fill all player names.');
        }
        startWithPlayers(initPlayers);
        setShowStartModal(false);
    };

    const submitNewBowler = (directName = null) => {
        const nameToSubmit = typeof directName === 'string' ? directName : nextBowler;
        if (!nameToSubmit) return showAlert('Please enter or select the next bowler name.');
        setNewBowler(nameToSubmit);
        setNextBowler('');
        setShowBowlerModal(false);
    };

    const submitRetire = () => {
        if (!retireName) return showAlert('Please enter the name of the new batsman.');
        retireBatsman(true, retireName); // Retiring striker
        setRetireName('');
        setShowRetireModal(false);
    };

    const calculateRate = (runs, overs, balls) => {
        const totalOvers = (overs || 0) + (balls || 0) / 6;
        return totalOvers > 0 ? (runs / totalOvers).toFixed(2) : "0.00";
    };

    const getBattingTeam = () => {
        const teamA = currentMatch?.teamA || 'Team A';
        const teamB = currentMatch?.teamB || 'Team B';
        const tossWinner = currentMatch?.tossWinner;
        const tossDecision = currentMatch?.tossDecision;

        if (innings === 1) {
            if (tossWinner === teamA) {
                return tossDecision === 'bat' ? teamA : teamB;
            } else {
                return tossDecision === 'bat' ? teamB : teamA;
            }
        } else {
            if (tossWinner === teamA) {
                return tossDecision === 'bat' ? teamB : teamA;
            } else {
                return tossDecision === 'bat' ? teamA : teamB;
            }
        }
    };

    const getBallColor = (ball) => {
        if (ball.includes('W')) return { backgroundColor: '#B00020' };
        if (ball.includes('wd')) return { backgroundColor: '#2196F3' }; // Blue for wide
        if (ball.includes('4')) return { backgroundColor: '#FF8C00' };
        if (ball.includes('6')) return { backgroundColor: '#1B4D3E' };
        return { backgroundColor: '#9e9e9e' };
    };

    return (
        <View style={styles.container}>
            <Celebration type={celebration} onFinish={() => setCelebration(null)} />
            <Portal>
                {/* Match Start Modal */}
                <Dialog visible={showStartModal} dismissable={false} style={styles.boxDialog}>
                    <Dialog.Title style={styles.boxTitle}>Select Starting Players</Dialog.Title>
                    <Dialog.ScrollArea style={{ paddingHorizontal: 0, maxHeight: 420 }}>
                        <ScrollView>
                            <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                                <Text style={styles.chipSectionLabel}>Striker</Text>
                                <View style={styles.chipGrid}>
                                    {getBattingTeamPlayers().map(p => (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={[styles.playerChip, initPlayers.striker === p.name && styles.playerChipActive]}
                                            onPress={() => setInitPlayers(prev => ({ ...prev, striker: p.name }))}
                                        >
                                            <Text style={[styles.playerChipText, initPlayers.striker === p.name && styles.playerChipTextActive]} numberOfLines={1}>
                                                {p.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.chipSectionLabel}>Non-Striker</Text>
                                <View style={styles.chipGrid}>
                                    {getBattingTeamPlayers()
                                        .filter(p => p.name !== initPlayers.striker)
                                        .map(p => (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={[styles.playerChip, initPlayers.nonStriker === p.name && styles.playerChipActive]}
                                            onPress={() => setInitPlayers(prev => ({ ...prev, nonStriker: p.name }))}
                                        >
                                            <Text style={[styles.playerChipText, initPlayers.nonStriker === p.name && styles.playerChipTextActive]} numberOfLines={1}>
                                                {p.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Divider style={{ marginVertical: 12 }} />

                                <Text style={styles.chipSectionLabel}>Opening Bowler</Text>
                                <View style={styles.chipGrid}>
                                    {getBowlingTeamPlayers().map(p => (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={[styles.playerChip, initPlayers.bowler === p.name && styles.playerChipActive]}
                                            onPress={() => setInitPlayers(prev => ({ ...prev, bowler: p.name }))}
                                        >
                                            <Text style={[styles.playerChipText, initPlayers.bowler === p.name && styles.playerChipTextActive]} numberOfLines={1}>
                                                {p.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 15 }}>
                        <Button mode="contained" buttonColor="#4C8C4A" onPress={submitInitialPlayers} style={{ flex: 1, borderRadius: 8 }} labelStyle={{ color: 'white', fontWeight: 'bold' }}>Start Scoring</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Error Dialog */}
                <Dialog visible={errorVisible} onDismiss={() => setErrorVisible(false)} style={styles.boxDialog}>
                    <Dialog.Title style={styles.boxTitle}>Missing Information</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">{errorMessage}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button mode="contained" buttonColor="#4C8C4A" onPress={() => setErrorVisible(false)} labelStyle={{ color: 'white', fontWeight: 'bold' }}>OK</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* New Bowler Modal */}
                <Dialog visible={showBowlerModal} dismissable={false} style={styles.boxDialog}>
                    <Dialog.Title style={styles.boxTitle}>Over Complete! New Bowler</Dialog.Title>
                    <Dialog.Content style={{ overflow: 'visible' }}>
                        <View style={{ marginBottom: 15 }}>
                            <View style={styles.bowlerGrid}>
                                {getBowlingTeamPlayers().map((player) => {
                                    const isLastBowler = player.name === lastBowlerName;
                                    const isCurrentlySelected = nextBowler === player.name;
                                    return (
                                        <TouchableOpacity
                                            key={player.id}
                                            style={[
                                                styles.bowlerCard,
                                                isCurrentlySelected && styles.bowlerCardActive,
                                                isLastBowler && styles.lastBowlerCard
                                            ]}
                                            onPress={() => setNextBowler(player.name)}
                                            activeOpacity={0.7}
                                            disabled={isLastBowler}
                                        >
                                            <Text style={[
                                                styles.bowlerCardText,
                                                isCurrentlySelected && styles.bowlerCardTextActive,
                                                isLastBowler && { color: '#D32F2F' }
                                            ]} numberOfLines={1}>
                                                {player.name}
                                            </Text>
                                            {isLastBowler && (
                                                <View style={styles.lastIndicator}>
                                                    <Text style={styles.lastIndicatorText}>LAST</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <Divider style={{ marginTop: 15 }} />
                        </View>
                        <PlayerAutoComplete
                            label="Next Bowler Name"
                            value={nextBowler}
                            onChangeText={setNextBowler}
                            onSelect={p => { setNextBowler(p.name); }}
                            autoFocus
                            style={{ zIndex: 10, marginBottom: 0 }}
                        />
                    </Dialog.Content>
                    <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 15 }}>
                        <Button mode="contained" buttonColor="#4C8C4A" onPress={() => submitNewBowler()} style={{ flex: 1, borderRadius: 8 }} labelStyle={{ color: 'white', fontWeight: 'bold' }}>Continue</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Retire Modal */}
                <Dialog visible={showRetireModal} onDismiss={() => setShowRetireModal(false)} style={styles.boxDialog}>
                    <Dialog.Title style={styles.boxTitle}>Retire Batsman</Dialog.Title>
                    <Dialog.Content style={{ overflow: 'visible' }}>
                        <Text variant="bodyMedium" style={{ marginBottom: 10 }}>Enter name of the new batsman replacing {batsmen?.[0]?.isStriker ? batsmen[0]?.name : batsmen?.[1]?.name}:</Text>
                        <PlayerAutoComplete
                            label="New Batsman Name"
                            value={retireName}
                            onChangeText={setRetireName}
                            onSelect={p => setRetireName(p.name)}
                            autoFocus
                            style={{ zIndex: 10, marginBottom: 0 }}
                        />
                    </Dialog.Content>
                    <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 15 }}>
                        <Button mode="outlined" onPress={() => setShowRetireModal(false)} textColor="#d32f2f" style={{ flex: 1, marginRight: 10, borderColor: '#d32f2f', borderRadius: 8 }}>Cancel</Button>
                        <Button mode="contained" buttonColor="#4C8C4A" onPress={submitRetire} style={{ flex: 1, borderRadius: 8 }} labelStyle={{ color: 'white', fontWeight: 'bold' }}>Done</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Wicket Modal */}
                <Dialog visible={showWicketModal} onDismiss={() => setShowWicketModal(false)} style={styles.boxDialog}>
                    <Dialog.Title style={styles.boxTitle}>{isRunOut ? 'Run Out Details' : 'Wicket!'}</Dialog.Title>
                    <Dialog.Content style={{ overflow: 'visible' }}>
                        {isRunOut ? (
                            <View style={{ marginBottom: 20 }}>
                                <Text variant="labelMedium" style={styles.formLabel}>Runs completed before Run Out:</Text>
                                <View style={styles.choiceGroup}>
                                    {['0', '1', '2', '3'].map((r) => (
                                        <Button
                                            key={r}
                                            mode={wicketRuns === r ? 'contained' : 'outlined'}
                                            buttonColor={wicketRuns === r ? '#4C8C4A' : undefined}
                                            textColor={wicketRuns === r ? 'white' : '#666'}
                                            style={[styles.choiceBtn, wicketRuns === r && { borderWidth: 0 }, { flex: 1, marginHorizontal: 4, paddingVertical: 5 }]}
                                            labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
                                            onPress={() => setWicketRuns(r)}
                                        >
                                            {r}
                                        </Button>
                                    ))}
                                </View>

                                <Text variant="labelMedium" style={styles.formLabel}>Who got out?</Text>
                                <View style={styles.choiceGroup}>
                                    <Button
                                        mode={runOutStriker ? 'contained' : 'outlined'}
                                        buttonColor={runOutStriker ? '#4C8C4A' : undefined}
                                        textColor={runOutStriker ? 'white' : '#666'}
                                        style={[styles.choiceBtn, { flex: 1, marginRight: 8 }, runOutStriker && { borderWidth: 0 }]}
                                        onPress={() => setRunOutStriker(true)}
                                    >
                                        Striker
                                    </Button>
                                    <Button
                                        mode={!runOutStriker ? 'contained' : 'outlined'}
                                        buttonColor={!runOutStriker ? '#4C8C4A' : undefined}
                                        textColor={!runOutStriker ? 'white' : '#666'}
                                        style={[styles.choiceBtn, { flex: 1 }, !runOutStriker && { borderWidth: 0 }]}
                                        onPress={() => setRunOutStriker(false)}
                                    >
                                        Non-Striker
                                    </Button>
                                </View>
                            </View>
                        ) : (
                            <View style={{ marginBottom: 20 }}>
                                <Text variant="labelMedium" style={styles.formLabel}>Wicket Type:</Text>
                                <View style={styles.customSegmented}>
                                    {['Bowled', 'Catch', 'Stumped'].map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.segmentBtn, wicketType === type && styles.segmentBtnActive]}
                                            onPress={() => {
                                                setWicketType(type);
                                                if (type === 'Stumped' && bowlingWK) {
                                                    setFielderName(bowlingWK.name);
                                                } else if (type === 'Bowled') {
                                                    setFielderName(bowler.name);
                                                }
                                            }}
                                        >
                                            <Text style={[styles.segmentBtnText, wicketType === type && styles.segmentBtnTextActive]}>
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={{ marginTop: 16 }}>
                                    <Text style={styles.fielderSelectLabel}>Selected Fielder</Text>
                                    <TouchableOpacity
                                        style={styles.fielderSelectBtn}
                                        onPress={() => setShowFielderPicker(true)}
                                    >
                                        <View>
                                            <Text style={styles.fielderValue}>{fielderName || 'Choose Fielder'}</Text>
                                            {wicketType === 'Stumped' && fielderName === bowlingWK?.name && (
                                                <Text style={{ fontSize: 10, color: '#4C8C4A' }}>(Default Wicketkeeper)</Text>
                                            )}
                                        </View>
                                        <IconButton icon="chevron-right" iconColor="#4C8C4A" size={20} style={{ margin: 0 }} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <Divider style={{ marginVertical: 15 }} />
                        <Text variant="bodyMedium" style={{ marginBottom: 10, fontWeight: 'bold' }}>Select New Batsman:</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.batsmanChipsContainer}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        >
                            {getAvailableBatsmen().map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.batsmanChip, newBatsman === p.name && styles.batsmanChipActive]}
                                    onPress={() => setNewBatsman(p.name)}
                                >
                                    <Text style={[styles.batsmanChipText, newBatsman === p.name && styles.batsmanChipTextActive]}>
                                        {p.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <PlayerAutoComplete
                            label="Or Enter Manual Name"
                            value={newBatsman}
                            onChangeText={setNewBatsman}
                            onSelect={p => setNewBatsman(p.name)}
                            style={{ zIndex: 10, marginTop: 10 }}
                        />
                    </Dialog.Content>
                    <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 15 }}>
                        <Button mode="outlined" onPress={() => setShowWicketModal(false)} textColor="#d32f2f" style={{ flex: 1, marginRight: 10, borderColor: '#d32f2f', borderRadius: 8 }}>Cancel</Button>
                        <Button mode="contained" buttonColor="#4C8C4A" onPress={submitWicket} style={{ flex: 1, borderRadius: 8 }} labelStyle={{ color: 'white', fontWeight: 'bold' }}>Done</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Fielder Picker Dialog */}
                <Dialog visible={showFielderPicker} onDismiss={() => setShowFielderPicker(false)} style={[styles.boxDialog, { maxHeight: '80%' }]}>
                    <Dialog.Title style={styles.boxTitle}>Select Fielder</Dialog.Title>
                    <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
                        <ScrollView>
                            {bowlingPlayers.map((player) => (
                                <List.Item
                                    key={player.id}
                                    title={player.name}
                                    left={props => <Avatar.Text {...props} label={player.name.substring(0, 1)} size={40} style={{ backgroundColor: '#4C8C4A' }} />}
                                    onPress={() => {
                                        setFielderName(player.name);
                                        setShowFielderPicker(false);
                                    }}
                                    right={props => fielderName === player.name ? <List.Icon {...props} icon="check" color="#4C8C4A" /> : null}
                                />
                            ))}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setShowFielderPicker(false)} textColor="#4C8C4A">Close</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Confirm Innings Finish Dialog */}
                <Dialog visible={showFinishDialog} onDismiss={() => setShowFinishDialog(false)} style={styles.boxDialog}>
                    <Dialog.Title style={styles.boxTitle}>Finish Innings</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">Are you sure you want to finish this innings?</Text>
                    </Dialog.Content>
                    <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 15 }}>
                        <Button mode="outlined" onPress={() => setShowFinishDialog(false)} textColor="#666" style={{ flex: 1, marginRight: 10, borderColor: '#ccc', borderRadius: 8 }}>Cancel</Button>
                        <Button mode="contained" buttonColor="#d32f2f" onPress={() => {
                            declareInnings();
                            setShowFinishDialog(false);
                        }} style={{ flex: 1, borderRadius: 8 }} labelStyle={{ color: 'white', fontWeight: 'bold' }}>Finish</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <ScrollView style={styles.scrollContainer}>
                {/* In-Line Result Cards (Replacing Modals) */}
                {isInningsOver && (
                    <Card style={[styles.resultCard, { borderLeftColor: '#2196F3' }]}>
                        <Card.Content>
                            <Title style={{ color: '#2196F3' }}>First Innings Over</Title>
                            <Text variant="titleLarge" style={styles.resultMainText}>
                                {getBattingTeam()} set a target of {target}
                            </Text>
                            <Button
                                mode="contained"
                                onPress={() => {
                                    setInitPlayers({ striker: '', nonStriker: '', bowler: '' });
                                    startSecondInnings();
                                }}
                                style={[styles.greenBtn, { marginTop: 15 }]}
                            >
                                Start Second Innings
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                {isMatchOver && (
                    <Card style={[styles.resultCard, { borderLeftColor: '#4C8C4A' }]}>
                        <Card.Content>
                            <Title style={{ color: '#4C8C4A' }}>Match Completed</Title>
                            <Text variant="headlineSmall" style={styles.resultMainText}>
                                {matchResult}
                            </Text>
                            <View style={styles.resultBtnRow}>
                                <Button
                                    mode="contained"
                                    onPress={() => navigation.navigate('Scoreboard')}
                                    style={[styles.resultBtn, { backgroundColor: '#1B4D3E' }]}
                                >
                                    View Scoreboard
                                </Button>
                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        resetMatch();
                                        navigation.navigate('Home');
                                    }}
                                    style={styles.resultBtn}
                                    labelStyle={{ color: '#1B4D3E' }}
                                >
                                    Finish
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>
                )}

                {/* Top Scoreboard Card */}
                <Card style={styles.mainScoreCard}>
                    <Card.Content>
                        <View style={styles.scoreTopRow}>
                            <Text style={styles.inningsText}>{getBattingTeam()}, {innings}{innings === 1 ? 'st' : 'nd'} inning</Text>
                            {innings === 2 && (
                                <Text style={styles.crrLabel}>Target: {target}</Text>
                            )}
                            <Text style={styles.crrLabel}>CRR: {calculateRate(score?.runs, score?.overs, score?.balls)}</Text>
                        </View>
                        <View style={styles.scoreMainRow}>
                            <View style={styles.scoreLeft}>
                                <Text style={styles.totalRuns}>{score?.runs || 0} - {score?.wickets || 0}</Text>
                                <Text style={styles.totalOvers}>({score?.overs || 0}.{score?.balls || 0})</Text>
                            </View>
                            <View style={styles.scoreRight}>
                                {innings === 2 ? (
                                    <View>
                                        <Text style={styles.crrValue}>Need {(target || 0) - (score?.runs || 0)} runs</Text>
                                        <Text style={styles.crrLabel}>Off {((currentMatch?.overs || 0) * 6) - ((score?.overs || 0) * 6 + (score?.balls || 0))} balls</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.crrValue}>1st Innings</Text>
                                )}
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Players Stats Table */}
                <Card style={styles.statsCard}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerText, { flex: 3.5 }]}>Batsman</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>R</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>B</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>4s</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>6s</Text>
                        <Text style={[styles.headerText, { flex: 1.5, textAlign: 'center' }]}>SR</Text>
                    </View>
                    <Divider />
                    {batsmen?.map((b, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text
                                style={[styles.playerText, { flex: 3.5, color: b.isStriker ? '#4C8C4A' : '#333' }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {b.name}{b.isStriker ? '*' : ''}
                            </Text>
                            <Text style={[styles.statText, { flex: 1 }]}>{b?.runs || 0}</Text>
                            <Text style={[styles.statText, { flex: 1 }]}>{b?.balls || 0}</Text>
                            <Text style={[styles.statText, { flex: 1 }]}>{b?.fours || 0}</Text>
                            <Text style={[styles.statText, { flex: 1 }]}>{b?.sixes || 0}</Text>
                            <Text style={[styles.statText, { flex: 1.5 }]}>{(b?.balls > 0 ? (b.runs / b.balls) * 100 : 0).toFixed(2)}</Text>
                        </View>
                    ))}

                    <View style={[styles.tableHeader, { marginTop: 10 }]}>
                        <Text style={[styles.headerText, { flex: 3.5 }]}>Bowler</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>O</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>M</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>R</Text>
                        <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>W</Text>
                        <Text style={[styles.headerText, { flex: 1.5, textAlign: 'center' }]}>ER</Text>
                    </View>
                    <Divider />
                    <View style={styles.tableRow}>
                        <Text
                            style={[styles.playerText, { flex: 3.5 }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {bowler?.name || 'Bowler'}
                        </Text>
                        <Text style={[styles.statText, { flex: 1 }]}>{bowler?.overs || 0}.{bowler?.balls || 0}</Text>
                        <Text style={[styles.statText, { flex: 1 }]}>0</Text>
                        <Text style={[styles.statText, { flex: 1 }]}>{bowler?.runs || 0}</Text>
                        <Text style={[styles.statText, { flex: 1 }]}>{bowler?.wickets || 0}</Text>
                        <Text style={[styles.statText, { flex: 1.5 }]}>{((bowler?.runs || 0) / ((bowler?.overs || 0) + (bowler?.balls || 0) / 6) || 0).toFixed(2)}</Text>
                    </View>
                </Card>

                {/* This Over Section */}
                <Card style={styles.overCard}>
                    <Text style={styles.overTitle}>This over:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.overSummaryScroll}>
                        {thisOver?.map((ball, idx) => (
                            <View key={idx} style={[styles.ballCircle, getBallColor(ball)]}>
                                <Text style={styles.ballText}>{ball}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </Card>

                {/* Extras & Action Row 1 */}
                <View style={styles.controlsRow}>
                    <View style={styles.extrasRow}>
                        <CheckboxItem label="Wide" value={extras.WIDE} onPress={() => setExtras({ ...extras, WIDE: !extras.WIDE })} />
                        <CheckboxItem label="No Ball" value={extras.NB} onPress={() => setExtras({ ...extras, NB: !extras.NB })} />
                        <CheckboxItem label="Byes" value={extras.BYE} onPress={() => setExtras({ ...extras, BYE: !extras.BYE })} />
                        <CheckboxItem label="Leg Byes" value={extras.LB} onPress={() => setExtras({ ...extras, LB: !extras.LB })} />
                    </View>
                    <View style={[styles.actionMainRow, { gap: 8 }]}>
                        <Button mode="contained" onPress={() => handleWicketPress(false)} style={[styles.greenBtn, { backgroundColor: theme.colors.error, flex: 1 }]}>Wicket</Button>
                        <Button mode="contained" onPress={() => setShowRetireModal(true)} style={[styles.greenBtn, { flex: 1 }]}>Retire</Button>
                    </View>
                    <View style={[styles.actionMainRow, { marginTop: 8, gap: 8 }]}>
                        <Button mode="contained" onPress={swapStrike} style={[styles.greenBtn, { flex: 1 }]}>Swap Batsman</Button>
                        <Button mode="contained" onPress={() => { setNextBowler(''); setShowBowlerModal(true); }} style={[styles.greenBtn, { flex: 1 }]}>Change Bowler</Button>
                    </View>
                </View>

                {/* Final Control Section */}
                <View style={styles.bottomSection}>
                    <View style={styles.leftActions}>
                        <Button mode="contained" onPress={undoBall} style={styles.sideBtn}>Undo</Button>
                        <Button mode="contained" onPress={() => setShowFinishDialog(true)} style={styles.sideBtn} labelStyle={{ fontSize: 13 }}>Innings Finish</Button>
                        <Button mode="contained" onPress={() => handleWicketPress(true)} style={[styles.sideBtn, { backgroundColor: theme.colors.error }]}>Run Out</Button>
                    </View>
                    <View style={styles.runGridContainer}>
                        {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                            <TouchableOpacity key={run} style={styles.runCircle} onPress={() => handleRunPress(run)}>
                                <Text style={[styles.runText, (run === 4 || run === 6) && { color: '#4C8C4A' }]}>{run}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.runCircle} onPress={() => navigation.navigate('Scoreboard')}>
                            <LayoutList size={24} color="#4C8C4A" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <Celebration type={celebration} onFinish={() => setCelebration(null)} />
            <DuckAnimation visible={showDuck} onFinish={() => {
                if (pendingWicketData) {
                    addBall(pendingWicketData);
                    resetWicketState();
                }
                setShowDuck(false);
            }} />
        </View>
    );
};

const CheckboxItem = ({ label, value, onPress }) => (
    <TouchableOpacity style={styles.checkItem} onPress={onPress}>
        <Checkbox status={value ? 'checked' : 'unchecked'} onPress={onPress} color="#4C8C4A" />
        <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EDF1F0' },
    scrollContainer: { padding: 12 },
    mainScoreCard: { borderRadius: 16, elevation: 4, marginBottom: 12, overflow: 'hidden' },
    scoreTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    inningsText: { color: '#666', fontSize: 13 },
    crrLabel: { color: '#666', fontSize: 13 },
    scoreMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scoreLeft: { flexDirection: 'row', alignItems: 'baseline' },
    totalRuns: { fontSize: 36, fontWeight: '700', color: '#111' },
    totalOvers: { fontSize: 20, color: '#888', marginLeft: 8 },
    scoreRight: { alignItems: 'flex-end' },
    crrValue: { fontSize: 18, fontWeight: '700', color: '#333' },
    statsCard: { padding: 10, borderRadius: 16, marginBottom: 12, elevation: 2 },
    tableHeader: { flexDirection: 'row', paddingVertical: 5 },
    headerText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', paddingVertical: 8, alignItems: 'center' },
    playerText: { fontSize: 15, fontWeight: '500' },
    statText: { textAlign: 'center', fontSize: 14, color: '#333' },
    overCard: { padding: 12, borderRadius: 16, marginBottom: 12, elevation: 2 },
    overTitle: { fontSize: 14, color: '#333', marginBottom: 10 },
    overSummaryScroll: { flexDirection: 'row' },
    ballCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    ballText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    controlsRow: { backgroundColor: 'white', borderRadius: 16, padding: 10, marginBottom: 12, elevation: 2 },
    extrasRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    actionMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    checkItem: { flexDirection: 'row', alignItems: 'center', width: '25%' },
    checkLabel: { fontSize: 12, color: '#333' },
    greenBtn: { backgroundColor: '#4C8C4A', height: 40, borderRadius: 8 },
    bottomSection: { flexDirection: 'row', marginTop: 5 },
    leftActions: { width: '30%', justifyContent: 'space-between' },
    sideBtn: { backgroundColor: '#4C8C4A', height: 45, marginBottom: 10, borderRadius: 8 },
    runGridContainer: { width: '70%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: 'white', borderRadius: 12, padding: 10, marginLeft: 10, elevation: 3 },
    runCircle: { width: 45, height: 45, borderRadius: 25, borderWidth: 1.5, borderColor: '#4C8C4A', justifyContent: 'center', alignItems: 'center', margin: 8 },
    runText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    modalInput: { marginBottom: 16, backgroundColor: 'white' },
    boxDialog: { borderRadius: 12, backgroundColor: 'white', borderLeftWidth: 6, borderLeftColor: '#4C8C4A', position: 'absolute', top: 0, margin: 0, width: '100%', alignSelf: 'center', elevation: 10 },
    boxTitle: { fontWeight: 'bold', color: '#1B4D3E', fontSize: 20 },
    boxActionText: { fontWeight: 'bold', color: '#4C8C4A' },
    chipSectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1B4D3E',
        marginBottom: 8,
        marginTop: 4,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    playerChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F1',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
    },
    playerChipActive: {
        backgroundColor: '#4C8C4A',
        borderColor: '#4C8C4A',
    },
    playerChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
    },
    playerChipTextActive: {
        color: 'white',
    },
    formLabel: { marginBottom: 8, color: '#444', fontWeight: '600' },
    choiceGroup: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    choiceBtn: { borderRadius: 8, borderColor: '#ccc', borderWidth: 1 },
    resultCard: {
        marginBottom: 15,
        borderRadius: 0,
        backgroundColor: 'white',
        borderLeftWidth: 6,
        elevation: 4,
    },
    resultMainText: {
        textAlign: 'center',
        marginVertical: 10,
        fontWeight: '700',
    },
    resultBtnRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    resultBtn: {
        flex: 1,
        marginHorizontal: 5,
        borderRadius: 8,
    },
    customSegmented: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 4,
        marginVertical: 8
    },
    segmentBtn: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10
    },
    segmentBtnActive: {
        backgroundColor: '#4C8C4A',
    },
    segmentBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666'
    },
    segmentBtnTextActive: {
        color: 'white',
        fontWeight: 'bold'
    },
    fielderSelectBtn: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        padding: 8,
        marginTop: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fielderSelectLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2
    },
    fielderValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1B4D3E'
    },
    batsmanChipsContainer: {
        flexDirection: 'row',
        marginBottom: 10
    },
    batsmanChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0'
    },
    batsmanChipActive: {
        backgroundColor: '#4C8C4A',
        borderColor: '#4C8C4A'
    },
    batsmanChipText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600'
    },
    batsmanChipTextActive: {
        color: 'white',
        fontWeight: 'bold'
    },
    bowlerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingVertical: 4
    },
    bowlerCard: {
        width: '31%',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderRadius: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        position: 'relative'
    },
    bowlerCardActive: {
        backgroundColor: '#4C8C4A',
        borderColor: '#4C8C4A',
        elevation: 2,
    },
    bowlerCardText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center'
    },
    bowlerCardTextActive: {
        color: 'white'
    },
    lastBowlerCard: {
        borderColor: '#EF5350',
        opacity: 0.6
    },
    lastIndicator: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#EF5350',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        zIndex: 1
    },
    lastIndicatorText: {
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold'
    },
    celebrationOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.4)',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none'
    },
    celebrationBox: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    celebrationCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 8,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    celebrationText: {
        fontSize: 80,
        fontWeight: '900'
    },
    celebrationSubText: {
        fontSize: 32,
        fontWeight: '900',
        marginTop: 10,
        textShadowColor: 'rgba(255,255,255,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    },
    particle: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        zIndex: 9998
    },
    duckOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    duckText: { color: '#FFEB3B', fontSize: 32, fontWeight: 'bold', marginTop: 20, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
});

export default ScoringScreen;

// Celebration Component
const Celebration = ({ type, onFinish }) => {
    const scale = React.useRef(new Animated.Value(0)).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    // Particle animations
    const particles = React.useRef([...Array(12)].map(() => ({
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.5 + Math.random() * 0.5)
    }))).current;

    React.useEffect(() => {
        if (type) {
            // Reset particle values
            particles.forEach(p => {
                p.x.setValue(0);
                p.y.setValue(0);
                p.opacity.setValue(0);
            });

            // Text sequence
            const textAnim = Animated.sequence([
                Animated.parallel([
                    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 40, friction: 5 }),
                    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true })
                ]),
                Animated.delay(1000),
                Animated.parallel([
                    Animated.timing(scale, { toValue: 2, duration: 400, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true })
                ])
            ]);

            // Particles burst
            const particleAnims = particles.map((p, i) => {
                const angle = (i / particles.length) * Math.PI * 2;
                const dist = 100 + Math.random() * 100;
                return Animated.parallel([
                    Animated.timing(p.x, {
                        toValue: Math.cos(angle) * dist,
                        duration: 800,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.back(1))
                    }),
                    Animated.timing(p.y, {
                        toValue: Math.sin(angle) * dist,
                        duration: 800,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.back(1))
                    }),
                    Animated.sequence([
                        Animated.timing(p.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
                        Animated.timing(p.opacity, { toValue: 0, duration: 700, useNativeDriver: true })
                    ])
                ]);
            });

            Animated.parallel([textAnim, ...particleAnims]).start(() => onFinish());
        }
    }, [type]);

    if (!type) return null;

    const isSix = type === '6';
    const color = isSix ? '#1B4D3E' : '#4C8C4A';
    const subText = isSix ? 'SIXER!' : 'FOUR!';

    return (
        <View style={styles.celebrationOverlay}>
            {particles.map((p, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.particle,
                        {
                            backgroundColor: i % 2 === 0 ? '#FFD700' : color,
                            transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
                            opacity: p.opacity
                        }
                    ]}
                />
            ))}
            <Animated.View style={[styles.celebrationBox, { transform: [{ scale }], opacity }]}>
                <View style={[styles.celebrationCircle, { borderColor: color }]}>
                    <Text style={[styles.celebrationText, { color }]}>{type}</Text>
                </View>
                <Text style={[styles.celebrationSubText, { color }]}>{subText}</Text>
            </Animated.View>
        </View>
    );
};

// Duck Animation Component
const DuckAnimation = ({ visible, onFinish }) => {
    const xPos = React.useRef(new Animated.Value(-150)).current;
    const waddle = React.useRef(new Animated.Value(0)).current;
    const screenWidth = Dimensions.get('window').width;

    React.useEffect(() => {
        if (visible) {
            xPos.setValue(-150);
            waddle.setValue(0);

            // Horizontal movement (determines completion)
            const mainAnim = Animated.timing(xPos, {
                toValue: screenWidth + 150,
                duration: 3500,
                useNativeDriver: true,
                easing: Easing.linear
            });

            // Waddle loop (runs in background)
            const waddleAnim = Animated.loop(
                Animated.sequence([
                    Animated.timing(waddle, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
                    Animated.timing(waddle, { toValue: -1, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) })
                ])
            );

            waddleAnim.start();
            mainAnim.start(() => {
                waddleAnim.stop();
                onFinish();
            });
        }
    }, [visible]);

    if (!visible) return null;

    const rotation = waddle.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });
    const bounce = waddle.interpolate({ inputRange: [-1, 1], outputRange: [0, -15] });

    return (
        <View style={styles.duckOverlay}>
            <Animated.View style={{ transform: [{ translateX: xPos }, { rotate: rotation }, { translateY: bounce }], alignItems: 'center' }}>
                <Text style={{ fontSize: 100 }}>🦆</Text>
            </Animated.View>
            <Animated.Text style={[styles.duckText, { opacity: waddle.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.7, 1, 0.7] }) }]}>
                OUT FOR A DUCK!
            </Animated.Text>
        </View>
    );
};
