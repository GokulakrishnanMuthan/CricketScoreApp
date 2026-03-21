import React from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { Button, Card, Text, DataTable, useTheme, Divider, Title } from 'react-native-paper';
import { useMatch } from '../context/MatchContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Share2, Play, Home } from 'lucide-react-native';

const ScoreboardScreen = ({ navigation }) => {
    const theme = useTheme();
    const {
        inningsDetails, currentMatch, matchResult, isMatchOver, resetMatch, getYetToBat, updateSetupData
    } = useMatch();

    const teamA = currentMatch?.teamA || 'Team A';
    const teamB = currentMatch?.teamB || 'Team B';
    const tossWinner = currentMatch?.tossWinner;
    const tossDecision = currentMatch?.tossDecision;

    const defaultInning = {
        score: { runs: 0, wickets: 0, overs: 0, balls: 0 },
        batsmenOrder: [],
        batsmenStats: {},
        bowlers: [],
        bowlerStats: {},
        extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
        fallOfWickets: [],
        overHistory: []
    };

    const inning1 = inningsDetails?.[1] || defaultInning;
    const inning2 = inningsDetails?.[2] || defaultInning;

    const getInningTeams = (inningNum) => {
        let battingTeam = teamA;
        let bowlingTeam = teamB;

        if (tossWinner === teamA) {
            if (tossDecision === 'bat') {
                battingTeam = inningNum === 1 ? teamA : teamB;
                bowlingTeam = inningNum === 1 ? teamB : teamA;
            } else {
                battingTeam = inningNum === 1 ? teamB : teamA;
                bowlingTeam = inningNum === 1 ? teamA : teamB;
            }
        } else {
            if (tossDecision === 'bat') {
                battingTeam = inningNum === 1 ? teamB : teamA;
                bowlingTeam = inningNum === 1 ? teamA : teamB;
            } else {
                battingTeam = inningNum === 1 ? teamA : teamB;
                bowlingTeam = inningNum === 1 ? teamB : teamA;
            }
        }
        return { battingTeam, bowlingTeam };
    };

    const generatePDF = async () => {
        const createInningHTML = (num) => {
            const data = inningsDetails?.[num] || defaultInning;
            const { battingTeam, bowlingTeam } = getInningTeams(num);
            if (!data || !data.score || (data.score.runs === 0 && data.score.wickets === 0 && data.score.overs === 0)) return '';

            return `
                <div class="inning-section">
                    <h3>${battingTeam} Innings</h3>
                    <table>
                        <thead><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
                        <tbody>
                            ${data.batsmenOrder.map(name => {
                const b = data.batsmenStats[name];
                return `<tr><td>${name}</td><td>${b.runs}</td><td>${b.balls}</td><td>${b.fours}</td><td>${b.sixes}</td><td>${(b.balls > 0 ? (b.runs / b.balls) * 100 : 0).toFixed(1)}</td></tr>`;
            }).join('')}
                        </tbody>
                    </table>
                    <p><b>Extras: </b>${data.extras.wide + data.extras.noBall + data.extras.bye + data.extras.legBye} (wd ${data.extras.wide}, nb ${data.extras.noBall}, b ${data.extras.bye}, lb ${data.extras.legBye})</p>
                    <p><b>Total: </b>${data.score.runs}/${data.score.wickets} (${data.score.overs}.${data.score.balls} Overs)</p>
                    <p><b>Run Rate: </b>${(data.score.runs / (data.score.overs + data.score.balls / 6) || 0).toFixed(2)}</p>

                    <h4>Yet to Bat</h4>
                    <p>${getYetToBat(num).map(p => p.name).join(', ') || 'N/A'}</p>

                    <h4>${bowlingTeam} Bowling</h4>
                    <table>
                        <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Eco</th></tr></thead>
                        <tbody>
                            ${data.bowlers.map(bName => {
                const b = data.bowlerStats?.[bName] || { overs: 0, balls: 0, runs: 0, wickets: 0 };
                const overValue = b.overs != null ? b.overs : 0;
                const ballValue = b.balls != null ? b.balls : 0;
                const economy = overValue + ballValue / 6 ? (b.runs / (overValue + ballValue / 6)) : 0;
                return `<tr><td>${bName}</td><td>${overValue}.${ballValue}</td><td>${b.runs}</td><td>${b.wickets}</td><td>${economy.toFixed(2)}</td></tr>`;
            }).join('')}
                        </tbody>
                    </table>

                    ${data.overHistory && data.overHistory.length > 0 ? `
                    <h4>Over-wise Runs</h4>
                    <table>
                        <thead><tr><th>Over</th><th>Bowler</th><th>Batsmen</th><th>Runs</th></tr></thead>
                        <tbody>
                            ${data.overHistory.map((overData, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${overData.bowler || 'N/A'}</td>
                                    <td>${(overData.batsmen || []).join(' & ')}</td>
                                    <td>${(overData.balls || []).join(', ')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ` : ''}
                </div>
            `;
        };

        const htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica'; padding: 20px; color: #333; }
                        h1, h2 { text-align: center; color: #1B4D3E; }
                        .result-header { background: #1B4D3E; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
                        .inning-section { margin-bottom: 30px; border-top: 2px solid #1B4D3E; padding-top: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                        th { background-color: #f2f2f2; }
                        .match-details { font-size: 14px; margin-bottom: 15px; }
                        .match-details p { margin: 4px 0; }
                    </style>
                </head>
                <body>
                    <h1>Cricket Match Summary</h1>
                    <div class="result-header">
                        <h2>${teamA} vs ${teamB}</h2>
                        <div class="match-details">
                            <p><b>Ground:</b> ${currentMatch?.ground || 'N/A'} | <b>Date:</b> ${currentMatch?.date || new Date().toLocaleString()}</p>
                            <p><b>Toss:</b> ${tossWinner} opted to ${tossDecision}</p>
                        </div>
                        <h3 style="color: #7CFC00">${matchResult || 'Match in Progress'}</h3>
                        <p>${teamA}: ${inning1.score.runs}/${inning1.score.wickets} (${inning1.score.overs}.${inning1.score.balls})</p>
                        <p>${teamB}: ${inning2.score.runs}/${inning2.score.wickets} (${inning2.score.overs}.${inning2.score.balls})</p>
                    </div>
                    ${createInningHTML(1)}
                    ${createInningHTML(2)}
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });

            const FileSystem = require('expo-file-system/legacy');
            const safeTeamA = teamA.replace(/[^a-zA-Z0-9]/g, '');
            const safeTeamB = teamB.replace(/[^a-zA-Z0-9]/g, '');

            let dateStr = 'Date';
            try {
                if (currentMatch?.date) {
                    const parsed = new Date(currentMatch.date);
                    if (!isNaN(parsed.getTime())) {
                        dateStr = parsed.toISOString().split('T')[0];
                    }
                } else {
                    dateStr = new Date().toISOString().split('T')[0];
                }
            } catch (e) { }

            const newFileName = `${safeTeamA}_vs_${safeTeamB}_${dateStr}.pdf`;
            const newUri = uri.substring(0, uri.lastIndexOf('/') + 1) + newFileName;

            await FileSystem.moveAsync({
                from: uri,
                to: newUri
            });
            await Sharing.shareAsync(newUri);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate or share PDF.');
        }
    };

    const renderInningCard = (num) => {
        const data = inningsDetails?.[num] || defaultInning;
        const { battingTeam, bowlingTeam } = getInningTeams(num);
        if (!data || !data.score || (num === 2 && data.score.runs === 0 && data.score.wickets === 0 && data.score.overs === 0)) return null;

        return (
            <Card style={styles.inningCard}>
                <Card.Content>
                    <Title style={styles.inningTitle}>{battingTeam} Innings</Title>
                    <ScrollView horizontal>
                        <DataTable>
                            <DataTable.Header>
                                <DataTable.Title style={{ width: 100 }}>Batsman</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 30 }}>R</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 30 }}>B</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 20 }}>4s</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 20 }}>6s</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 50 }}>SR</DataTable.Title>
                            </DataTable.Header>

                            {data.batsmenOrder.map((name, idx) => {
                                const b = data.batsmenStats[name];
                                return (
                                    <DataTable.Row key={idx}>
                                        <DataTable.Cell style={{ width: 100 }}>{name}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 30, fontWeight: 'bold' }}>{b.runs}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 30 }}>{b.balls}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 20 }}>{b.fours}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 20 }}>{b.sixes}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 50 }}>{(b.balls > 0 ? (b.runs / b.balls) * 100 : 0).toFixed(1)}</DataTable.Cell>
                                    </DataTable.Row>
                                );
                            })}
                            <DataTable.Row style={styles.extrasRow}>
                                <DataTable.Cell style={{ width: 140 }}>Extras</DataTable.Cell>
                                <DataTable.Cell numeric style={{ width: 50 }}>{data.extras.wide + data.extras.noBall + data.extras.bye + data.extras.legBye}</DataTable.Cell>
                                <DataTable.Cell style={{ width: 50 }} />
                                <DataTable.Cell style={{ width: 40 }} />
                                <DataTable.Cell style={{ width: 40 }} />
                                <DataTable.Cell style={{ width: 70 }} />
                            </DataTable.Row>
                        </DataTable>
                    </ScrollView>

                    <View style={styles.totalRow}>
                        <View>
                            <Text variant="titleMedium" style={styles.totalText}>Total</Text>
                            <Text variant="headlineSmall" style={styles.totalScore}>
                                {data.score.runs}/{data.score.wickets} ({data.score.overs}.{data.score.balls} Overs)
                            </Text>
                        </View>
                        <Text style={styles.runRate}>RR: {(data.score.runs / (data.score.overs + data.score.balls / 6) || 0).toFixed(2)}</Text>
                    </View>

                    {getYetToBat(num).length > 0 && (
                        <View style={{ marginTop: 15 }}>
                            <Divider style={{ marginBottom: 15 }} />
                            <Title style={styles.innerTitle}>Yet to Bat</Title>
                            <View style={styles.yetToBatContainer}>
                                {getYetToBat(num).map((p, idx) => (
                                    <View key={idx} style={styles.yetToBatItem}>
                                        <Text style={styles.yetToBatName}>{p.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <Divider style={{ marginVertical: 15 }} />

                    <Title style={styles.innerTitle}>{bowlingTeam} Bowling</Title>
                    <ScrollView horizontal>
                        <DataTable>
                            <DataTable.Header>
                                <DataTable.Title style={{ width: 140 }}>Bowler</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 50 }}>O</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 50 }}>R</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 50 }}>W</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 70 }}>Eco</DataTable.Title>
                            </DataTable.Header>
                            {data.bowlers.map((bName, idx) => {
                                const b = data.bowlerStats?.[bName] || { overs: 0, balls: 0, runs: 0, wickets: 0 };
                                const overValue = b.overs != null ? b.overs : 0;
                                const ballValue = b.balls != null ? b.balls : 0;
                                const bowlEco = overValue + ballValue / 6 ? (b.runs / (overValue + ballValue / 6)) : 0;
                                return (
                                    <DataTable.Row key={idx}>
                                        <DataTable.Cell style={{ width: 140 }}>{bName}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 50 }}>{overValue}.{ballValue}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 50 }}>{b.runs}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 50, fontWeight: 'bold' }}>{b.wickets}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 70 }}>{bowlEco.toFixed(2)}</DataTable.Cell>
                                    </DataTable.Row>
                                );
                            })}
                        </DataTable>
                    </ScrollView>

                    {(data.fallOfWickets?.length || 0) > 0 && (
                        <>
                            <Divider style={{ marginVertical: 15 }} />
                            <Title style={styles.innerTitle}>Fall Of Wickets</Title>
                            <View style={styles.fowContainer}>
                                {data.fallOfWickets.map((w, idx) => (
                                    <View key={idx} style={styles.fowItem}>
                                        <Text style={styles.fowName}>{w.batsman}</Text>
                                        <Text style={styles.fowScore}>{w.score} ({w.over})</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {(data.overHistory?.length || 0) > 0 && (
                        <View style={{ marginTop: 15 }}>
                            <Divider style={{ marginBottom: 15 }} />
                            <Title style={styles.innerTitle}>Over-wise Runs</Title>
                            <View style={{ padding: 12, backgroundColor: '#EDF1F0', borderRadius: 8 }}>
                                {data.overHistory.map((overData, idx) => (
                                    <View key={idx} style={{ marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 14, color: '#1B4D3E', fontWeight: 'bold' }}>Over {idx + 1}</Text>
                                                <Text style={{ fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 2 }}>
                                                    By: {overData.bowler || 'N/A'} {overData.batsmen?.length > 0 ? `to ${overData.batsmen.join(' & ')}` : ''}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            {overData.balls?.map((ball, bIdx) => {
                                                const getBallStyles = (val) => {
                                                    const sVal = String(val).toLowerCase();
                                                    let bgColor = 'white';
                                                    let textColor = '#333';
                                                    let borderColor = '#ddd';

                                                    if (sVal.includes('w')) { bgColor = '#E53935'; textColor = 'white'; borderColor = '#E53935'; }
                                                    else if (sVal === '4') { bgColor = '#FB8C00'; textColor = 'white'; borderColor = '#FB8C00'; }
                                                    else if (sVal === '6') { bgColor = '#43A047'; textColor = 'white'; borderColor = '#43A047'; }
                                                    else if (sVal.includes('wd')) { bgColor = '#1E88E5'; textColor = 'white'; borderColor = '#1E88E5'; }
                                                    else if (sVal.includes('nb')) { bgColor = '#8E24AA'; textColor = 'white'; borderColor = '#8E24AA'; }

                                                    return { bgColor, textColor, borderColor };
                                                };
                                                const styles = getBallStyles(ball);
                                                return (
                                                    <View key={bIdx} style={{
                                                        backgroundColor: styles.bgColor,
                                                        borderRadius: 15,
                                                        minWidth: 28,
                                                        height: 28,
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        marginRight: 6,
                                                        marginBottom: 6,
                                                        borderWidth: 1,
                                                        borderColor: styles.borderColor,
                                                        paddingHorizontal: 4
                                                    }}>
                                                        <Text style={{
                                                            fontSize: 12,
                                                            fontWeight: 'bold',
                                                            color: styles.textColor
                                                        }}>
                                                            {ball}
                                                        </Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Main Result Card */}
                <Card style={styles.resultCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.vsText}>{teamA} vs {teamB}</Text>
                        <Text variant="headlineMedium" style={styles.matchResultText}>{matchResult || 'Live'}</Text>

                        <View style={styles.summaryScoresRow}>
                            <View style={styles.teamScoreBox}>
                                <Text style={styles.summaryTeamName}>{teamA}</Text>
                                <Text style={styles.summaryScoreValue}>
                                    {inning1.score.runs}/{inning1.score.wickets}
                                </Text>
                                <Text style={styles.summaryOversValue}>({inning1.score.overs})</Text>
                            </View>
                            <View style={styles.teamScoreBox}>
                                <Text style={styles.summaryTeamName}>{teamB}</Text>
                                <Text style={styles.summaryScoreValue}>
                                    {inning2.score.runs}/{inning2.score.wickets}
                                </Text>
                                <Text style={styles.summaryOversValue}>({inning2.score.overs})</Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {renderInningCard(1)}
                {renderInningCard(2)}

                <View style={styles.footerActions}>
                    <Button
                        mode="contained"
                        icon={() => <Share2 size={18} color="white" />}
                        onPress={generatePDF}
                        style={styles.actionBtn}
                        contentStyle={{ height: 50 }}
                    >
                        Share Scorecard
                    </Button>
                    {!isMatchOver && (
                        <Button
                            mode="outlined"
                            icon={() => <Play size={18} color="#1B4D3E" />}
                            onPress={() => navigation.navigate('Scoring')}
                            style={[styles.actionBtn, { borderColor: '#1B4D3E' }]}
                            labelStyle={{ color: '#1B4D3E' }}
                            contentStyle={{ height: 50 }}
                        >
                            Back to Match
                        </Button>
                    )}
                    {isMatchOver && (
                        <Button
                            mode="contained"
                            icon={() => <Play size={18} color="white" />}
                            onPress={() => {
                                const teamAData = currentMatch?.teamAData || { name: currentMatch?.teamA || 'Team A', players: [] };
                                const teamBData = currentMatch?.teamBData || { name: currentMatch?.teamB || 'Team B', players: [] };
                                const overs = currentMatch?.overs || 10;
                                const playersPerTeam = currentMatch?.playersPerTeam || 11;
                                const ground = currentMatch?.ground || '';

                                resetMatch();

                                // Batch the update setup data
                                setTimeout(() => {
                                    updateSetupData({
                                        matchType: 'local',
                                        teamA: teamAData,
                                        teamB: teamBData,
                                        overs,
                                        playersPerTeam,
                                        ground,
                                        date: new Date().toLocaleString()
                                    });
                                    navigation.replace('TeamSetup');
                                }, 0);
                            }}
                            style={[styles.actionBtn, { backgroundColor: '#4C8C4A' }]}
                            contentStyle={{ height: 50 }}
                        >
                            Start Next Match
                        </Button>
                    )}

                    <Button
                        mode="contained"
                        icon={() => <Home size={18} color="white" />}
                        onPress={() => {
                            resetMatch();
                            navigation.replace('Home');
                        }}
                        style={[styles.actionBtn, { backgroundColor: '#4C8C4A' }]}
                        contentStyle={{ height: 50 }}
                    >
                        Back to Home
                    </Button>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EDF1F0' },
    header: { padding: 20, paddingTop: 40, backgroundColor: 'white' },
    headerTitle: { fontWeight: 'bold', color: '#1B4D3E', textAlign: 'center' },
    scrollContent: { padding: 15 },
    resultCard: { backgroundColor: '#1B4D3E', borderRadius: 12, marginBottom: 20, elevation: 6 },
    vsText: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 5 },
    matchResultText: { color: '#7CFC00', fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    summaryScoresRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 },
    teamScoreBox: { alignItems: 'center' },
    summaryTeamName: { color: 'white', fontSize: 14, fontWeight: '500' },
    summaryScoreValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    summaryOversValue: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
    inningCard: { borderRadius: 12, marginBottom: 20, elevation: 4, backgroundColor: 'white' },
    inningTitle: { color: '#1B4D3E', fontWeight: 'bold', borderLeftWidth: 4, borderLeftColor: '#1B4D3E', paddingLeft: 10, marginBottom: 10 },
    innerTitle: { color: '#444', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    extrasRow: { backgroundColor: '#f9f9f9' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 15, padding: 10, backgroundColor: '#EDF1F0', borderRadius: 8 },
    totalText: { color: '#666' },
    totalScore: { fontWeight: 'bold', color: '#1B4D3E' },
    runRate: { color: '#4C8C4A', fontWeight: 'bold' },
    fowContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    fowItem: { width: '33%', marginBottom: 10, paddingRight: 10 },
    fowName: { fontSize: 13, fontWeight: 'bold', color: '#333' },
    fowScore: { fontSize: 12, color: '#666' },
    overHistoryBox: { alignItems: 'center', backgroundColor: '#EDF1F0', padding: 10, borderRadius: 8, marginRight: 10, minWidth: 70 },
    overHistoryLabel: { fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 'bold' },
    ballsContainer: { flexDirection: 'row', marginBottom: 6 },
    smallBall: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#9e9e9e', justifyContent: 'center', alignItems: 'center', marginHorizontal: 2 },
    smallBallText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    overHistoryRuns: { fontSize: 14, fontWeight: 'bold', color: '#1B4D3E' },
    footerActions: { marginTop: 10, marginBottom: 30 },
    actionBtn: { marginBottom: 12, borderRadius: 8 },
    yetToBatContainer: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#f8f8f8', padding: 10, borderRadius: 8 },
    yetToBatItem: { backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
    yetToBatName: { fontSize: 13, color: '#555' }
});

export default ScoreboardScreen;
