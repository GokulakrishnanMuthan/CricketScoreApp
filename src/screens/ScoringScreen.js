import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { Button, Card, Text, Title, IconButton, useTheme, Checkbox, TextInput, Portal, Dialog, Divider } from 'react-native-paper';
import { useMatch } from '../context/MatchContext';

const ScoringScreen = ({ navigation }) => {
    const theme = useTheme();
    const {
        score, batsmen, bowler, bowlers, thisOver, addBall, undoBall,
        currentMatch, swapStrike, isOverComplete, isMatchStarted,
        startWithPlayers, setNewBowler, retireBatsman,
        innings, target, isInningsOver, isMatchOver, matchResult, startSecondInnings, resetMatch
    } = useMatch();

    const [extras, setExtras] = useState({ WIDE: false, NB: false, BYE: false, LB: false, WICKET: false });

    // Initial Players State
    const [showStartModal, setShowStartModal] = useState(!isMatchStarted);
    const [initPlayers, setInitPlayers] = useState({ striker: '', nonStriker: '', bowler: '' });

    // New Bowler State
    const [showBowlerModal, setShowBowlerModal] = useState(false);
    const [nextBowler, setNextBowler] = useState('');

    // Retire Modal State
    const [showRetireModal, setShowRetireModal] = useState(false);
    const [retireName, setRetireName] = useState('');

    // Wicket Modal State
    const [showWicketModal, setShowWicketModal] = useState(false);
    const [newBatsman, setNewBatsman] = useState('');

    useEffect(() => {
        setShowStartModal(!isMatchStarted);
    }, [isMatchStarted]);

    useEffect(() => {
        if (isOverComplete) {
            setShowBowlerModal(true);
        }
    }, [isOverComplete]);

    const handleRunPress = (runs) => {
        let extraType = null;
        if (extras.WIDE) extraType = 'WIDE';
        else if (extras.NB) extraType = 'NB';
        else if (extras.BYE) extraType = 'BYE';
        else if (extras.LB) extraType = 'LB';

        addBall({ runs, extraType, isWicket: false });
        setExtras({ WIDE: false, NB: false, BYE: false, LB: false });
    };

    const handleWicketPress = () => {
        setShowWicketModal(true);
    };

    const submitWicket = () => {
        if (!newBatsman) return showAlert('Please enter the name of the new batsman.');
        addBall({ runs: 0, extraType: null, isWicket: true, newBatsmanName: newBatsman });
        setNewBatsman('');
        setShowWicketModal(false);
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

    const submitNewBowler = () => {
        if (!nextBowler) return showAlert('Please enter the next bowler name.');
        setNewBowler(nextBowler);
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

    return (
        <View style={styles.container}>
            <Portal>
                {/* Match Start Modal */}
                <Dialog visible={showStartModal} dismissable={false} style={styles.boxDialog}>
                    <Dialog.Title style={styles.boxTitle}>Select Starting Players</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Striker Name" value={initPlayers.striker} onChangeText={t => setInitPlayers({ ...initPlayers, striker: t })} mode="outlined" style={styles.modalInput} />
                        <TextInput label="Non-Striker Name" value={initPlayers.nonStriker} onChangeText={t => setInitPlayers({ ...initPlayers, nonStriker: t })} mode="outlined" style={styles.modalInput} />
                        <TextInput label="Opening Bowler" value={initPlayers.bowler} onChangeText={t => setInitPlayers({ ...initPlayers, bowler: t })} mode="outlined" style={styles.modalInput} />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={submitInitialPlayers} labelStyle={styles.boxActionText}>Start Scoring</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Error Dialog */}
                <Dialog visible={errorVisible} onDismiss={() => setErrorVisible(false)} style={styles.boxDialog}>
                    <Dialog.Title style={styles.boxTitle}>Missing Information</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">{errorMessage}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setErrorVisible(false)} labelStyle={styles.boxActionText}>OK</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* New Bowler Modal */}
                <Dialog visible={showBowlerModal} dismissable={false} style={styles.boxDialog}>
                    <Dialog.Title style={styles.boxTitle}>Over Complete! New Bowler</Dialog.Title>
                    <Dialog.Content>
                        {(bowlers?.length || 0) > 0 && (
                            <View style={{ marginBottom: 15 }}>
                                <Text variant="labelSmall" style={{ marginBottom: 5 }}>Select Previous Bowler:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {bowlers?.map((b, idx) => (
                                        <Button
                                            key={idx}
                                            mode="outlined"
                                            onPress={() => setNextBowler(b)}
                                            style={{ marginRight: 8, borderRadius: 0 }}
                                            labelStyle={{ fontSize: 12 }}
                                        >
                                            {b}
                                        </Button>
                                    ))}
                                </ScrollView>
                                <Divider style={{ marginTop: 15 }} />
                            </View>
                        )}
                        <TextInput label="Next Bowler Name" value={nextBowler} onChangeText={setNextBowler} mode="outlined" />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={submitNewBowler} labelStyle={styles.boxActionText}>Continue</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Retire Modal */}
                <Dialog visible={showRetireModal} onDismiss={() => setShowRetireModal(false)} style={styles.boxDialog}>
                    <Dialog.Title style={styles.boxTitle}>Retire Batsman</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">Enter name of the new batsman replacing {batsmen?.[0]?.isStriker ? batsmen[0]?.name : batsmen?.[1]?.name}:</Text>
                        <TextInput label="New Batsman Name" value={retireName} onChangeText={setRetireName} mode="outlined" style={{ marginTop: 10 }} />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowRetireModal(false)} labelStyle={styles.boxActionText}>Cancel</Button>
                        <Button onPress={submitRetire} labelStyle={styles.boxActionText}>Done</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Wicket Modal */}
                <Dialog visible={showWicketModal} onDismiss={() => setShowWicketModal(false)} style={styles.boxDialog}>
                    <Dialog.Title style={styles.boxTitle}>Wicket!</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">Enter name of the new batsman:</Text>
                        <TextInput label="New Batsman Name" value={newBatsman} onChangeText={setNewBatsman} mode="outlined" style={{ marginTop: 10 }} />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowWicketModal(false)} labelStyle={styles.boxActionText}>Cancel</Button>
                        <Button onPress={submitWicket} labelStyle={styles.boxActionText}>Done</Button>
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
                                onPress={startSecondInnings}
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
                    <View style={styles.actionMainRow}>
                        <Button mode="contained" onPress={handleWicketPress} style={[styles.greenBtn, { backgroundColor: theme.colors.error }]}>Wicket</Button>
                        <Button mode="contained" onPress={() => setShowRetireModal(true)} style={styles.greenBtn}>Retire</Button>
                        <Button mode="contained" onPress={swapStrike} style={styles.greenBtn}>Swap Batsman</Button>
                    </View>
                </View>

                {/* Final Control Section */}
                <View style={styles.bottomSection}>
                    <View style={styles.leftActions}>
                        <Button mode="contained" onPress={undoBall} style={styles.sideBtn}>Undo</Button>
                        <Button mode="contained" onPress={() => { }} style={styles.sideBtn}>Partnerships</Button>
                        <Button mode="contained" onPress={() => navigation.navigate('Scoreboard')} style={styles.sideBtn}>Extras</Button>
                    </View>
                    <View style={styles.runGridContainer}>
                        {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                            <TouchableOpacity key={run} style={styles.runCircle} onPress={() => handleRunPress(run)}>
                                <Text style={[styles.runText, (run === 4 || run === 6) && { color: '#4C8C4A' }]}>{run}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.runCircle}>
                            <Text style={styles.runText}>...</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const CheckboxItem = ({ label, value, onPress }) => (
    <TouchableOpacity style={styles.checkItem} onPress={onPress}>
        <Checkbox status={value ? 'checked' : 'unchecked'} onPress={onPress} color="#4C8C4A" />
        <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
);

const getBallColor = (ball) => {
    if (ball.includes('W')) return { backgroundColor: '#B00020' };
    if (ball.includes('wd')) return { backgroundColor: '#2196F3' }; // Blue for wide
    if (ball.includes('4')) return { backgroundColor: '#FF8C00' };
    if (ball.includes('6')) return { backgroundColor: '#1B4D3E' };
    return { backgroundColor: '#9e9e9e' };
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EDF1F0' },
    scrollContainer: { padding: 10 },
    mainScoreCard: { borderRadius: 0, elevation: 4, marginBottom: 12 },
    scoreTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    inningsText: { color: '#666', fontSize: 13 },
    crrLabel: { color: '#666', fontSize: 13 },
    scoreMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scoreLeft: { flexDirection: 'row', alignItems: 'baseline' },
    totalRuns: { fontSize: 36, fontWeight: '700', color: '#111' },
    totalOvers: { fontSize: 20, color: '#888', marginLeft: 8 },
    scoreRight: { alignItems: 'flex-end' },
    crrValue: { fontSize: 18, fontWeight: '700', color: '#333' },
    statsCard: { padding: 10, borderRadius: 0, marginBottom: 12 },
    tableHeader: { flexDirection: 'row', paddingVertical: 5 },
    headerText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', paddingVertical: 8, alignItems: 'center' },
    playerText: { fontSize: 15, fontWeight: '500' },
    statText: { textAlign: 'center', fontSize: 14, color: '#333' },
    overCard: { padding: 12, borderRadius: 0, marginBottom: 12 },
    overTitle: { fontSize: 14, color: '#333', marginBottom: 10 },
    overSummaryScroll: { flexDirection: 'row' },
    ballCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    ballText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    controlsRow: { backgroundColor: 'white', borderRadius: 0, padding: 10, marginBottom: 12, elevation: 2 },
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
    modalInput: { marginBottom: 12 },
    boxDialog: { borderRadius: 0, backgroundColor: 'white', borderLeftWidth: 5, borderLeftColor: '#4C8C4A', position: 'absolute', top: 0, margin: 0, width: '100%', alignSelf: 'center' },
    boxTitle: { fontWeight: 'bold', color: '#1B4D3E' },
    boxActionText: { fontWeight: 'bold', color: '#4C8C4A' },
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
});

export default ScoringScreen;
