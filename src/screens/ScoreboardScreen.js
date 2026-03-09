import React from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { Button, Card, Text, DataTable, useTheme, Divider, Title } from 'react-native-paper';
import { useMatch } from '../context/MatchContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Share2, History, Home } from 'lucide-react-native';

const ScoreboardScreen = ({ navigation }) => {
    const theme = useTheme();
    const {
        inningsDetails, currentMatch, matchResult, isMatchOver, resetMatch
    } = useMatch();

    const teamA = currentMatch?.teamA || 'Team A';
    const teamB = currentMatch?.teamB || 'Team B';
    const tossWinner = currentMatch?.tossWinner;
    const tossDecision = currentMatch?.tossDecision;

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
            const data = inningsDetails[num];
            const { battingTeam, bowlingTeam } = getInningTeams(num);
            if (!data || data.score.runs === 0 && data.score.wickets === 0 && data.score.overs === 0) return '';

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

                    <h4>${bowlingTeam} Bowling</h4>
                    <table>
                        <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Eco</th></tr></thead>
                        <tbody>
                            ${data.bowlers.map(bName => {
                const b = data.bowlerStats[bName];
                return `<tr><td>${bName}</td><td>${b.overs}.${b.balls}</td><td>${b.runs}</td><td>${b.wickets}</td><td>${(b.runs / (b.overs + b.balls / 6) || 0).toFixed(2)}</td></tr>`;
            }).join('')}
                        </tbody>
                    </table>
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
                    </style>
                </head>
                <body>
                    <h1>Cricket Match Summary</h1>
                    <div class="result-header">
                        <h2>${teamA} vs ${teamB}</h2>
                        <h3 style="color: #7CFC00">${matchResult || 'Match in Progress'}</h3>
                        <p>${teamA}: ${inningsDetails[1].score.runs}/${inningsDetails[1].score.wickets} (${inningsDetails[1].score.overs}.${inningsDetails[1].score.balls})</p>
                        <p>${teamB}: ${inningsDetails[2].score.runs}/${inningsDetails[2].score.wickets} (${inningsDetails[2].score.overs}.${inningsDetails[2].score.balls})</p>
                    </div>
                    ${createInningHTML(1)}
                    ${createInningHTML(2)}
                </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri);
    };

    const renderInningCard = (num) => {
        const data = inningsDetails[num];
        const { battingTeam, bowlingTeam } = getInningTeams(num);
        if (!data || (num === 2 && data.score.runs === 0 && data.score.wickets === 0 && data.score.overs === 0)) return null;

        return (
            <Card style={styles.inningCard}>
                <Card.Content>
                    <Title style={styles.inningTitle}>{battingTeam} Innings</Title>
                    <ScrollView horizontal>
                        <DataTable>
                            <DataTable.Header>
                                <DataTable.Title style={{ width: 140 }}>Batsman</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 50 }}>R</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 50 }}>B</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 40 }}>4s</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 40 }}>6s</DataTable.Title>
                                <DataTable.Title numeric style={{ width: 70 }}>SR</DataTable.Title>
                            </DataTable.Header>

                            {data.batsmenOrder.map((name, idx) => {
                                const b = data.batsmenStats[name];
                                return (
                                    <DataTable.Row key={idx}>
                                        <DataTable.Cell style={{ width: 140 }}>{name}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 50, fontWeight: 'bold' }}>{b.runs}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 50 }}>{b.balls}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 40 }}>{b.fours}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 40 }}>{b.sixes}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 70 }}>{(b.balls > 0 ? (b.runs / b.balls) * 100 : 0).toFixed(1)}</DataTable.Cell>
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
                                const b = data.bowlerStats[bName];
                                return (
                                    <DataTable.Row key={idx}>
                                        <DataTable.Cell style={{ width: 140 }}>{bName}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 50 }}>{b.overs}.{b.balls}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 50 }}>{b.runs}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 50, fontWeight: 'bold' }}>{b.wickets}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ width: 70 }}>{(b.runs / (b.overs + b.balls / 6) || 0).toFixed(2)}</DataTable.Cell>
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
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.headerTitle}>Match Summary</Text>
            </View>

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
                                    {inningsDetails[1].score.runs}/{inningsDetails[1].score.wickets}
                                </Text>
                                <Text style={styles.summaryOversValue}>({inningsDetails[1].score.overs})</Text>
                            </View>
                            <View style={styles.teamScoreBox}>
                                <Text style={styles.summaryTeamName}>{teamB}</Text>
                                <Text style={styles.summaryScoreValue}>
                                    {inningsDetails[2].score.runs}/{inningsDetails[2].score.wickets}
                                </Text>
                                <Text style={styles.summaryOversValue}>({inningsDetails[2].score.overs})</Text>
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
                    <Button
                        mode="outlined"
                        icon={() => <History size={18} color="#1B4D3E" />}
                        onPress={() => { }}
                        style={[styles.actionBtn, { borderColor: '#1B4D3E' }]}
                        labelStyle={{ color: '#1B4D3E' }}
                        contentStyle={{ height: 50 }}
                    >
                        View Over History
                    </Button>
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
    footerActions: { marginTop: 10, marginBottom: 30 },
    actionBtn: { marginBottom: 12, borderRadius: 8 },
});

export default ScoreboardScreen;
