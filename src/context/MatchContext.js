import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { updateMatchState } from '../database/database';

const MatchContext = createContext();

const initialState = {
    matchId: null,
    currentMatch: null,
    score: {
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
    },
    batsmen: [
        { name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: true },
        { name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: false },
    ],
    bowler: { name: 'Bowler', overs: 0, balls: 0, runs: 0, wickets: 0 },
    bowlers: [], // List of all bowlers who have bowled in this match
    thisOver: [],
    history: [],
    isOverComplete: false,
    isMatchStarted: false,
    lastBowlerName: null, 
    batsmenThisOver: [],
    innings: 1,
    target: null,
    isInningsOver: false,
    isMatchOver: false,
    matchResult: '',
    extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
    bowlerStats: {}, // { bowlerName: { overs: 0, balls: 0, runs: 0, wickets: 0 } }
    fallOfWickets: [], // [ { wicketNum: 1, batsman: 'Name', score: '50-1', over: '5.2' } ]
    inningsDetails: {
        1: { score: { runs: 0, wickets: 0, overs: 0, balls: 0 }, batsmenStats: {}, batsmenOrder: [], bowlers: [], bowlerStats: {}, extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 }, fallOfWickets: [], overHistory: [] },
        2: { score: { runs: 0, wickets: 0, overs: 0, balls: 0 }, batsmenStats: {}, batsmenOrder: [], bowlers: [], bowlerStats: {}, extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 }, fallOfWickets: [], overHistory: [] }
    },
    setupData: {
        matchType: 'local', // 'local' or 'other'
        teamA: { name: '', players: [], captain: null, wicketkeeper: null },
        teamB: { name: '', players: [], captain: null, wicketkeeper: null },
        overs: 10,
        playersPerTeam: 11,
        ground: '',
        date: ''
    }
};

function stateSnapshot(state) {
    const { history, ...snapshot } = state;
    return JSON.parse(JSON.stringify(snapshot));
}

function matchReducer(state, action) {
    switch (action.type) {
        case 'INIT_MATCH':
            return {
                ...initialState,
                matchId: action.payload.id,
                currentMatch: action.payload.data,
                setupData: {
                    ...state.setupData,
                    ...action.payload.data,
                    ground: action.payload.data.ground || '',
                    date: action.payload.data.date || ''
                },
                isMatchStarted: false
            };
        case 'RESUME_MATCH':
            return {
                ...initialState,
                ...action.payload,
                score: { ...initialState.score, ...(action.payload.score || {}) },
                batsmen: action.payload.batsmen || initialState.batsmen,
                bowler: action.payload.bowler || initialState.bowler,
                bowlers: action.payload.bowlers || [],
                thisOver: action.payload.thisOver || [],
                history: []
            };
        case 'START_MATCH_WITH_PLAYERS': {
            const newState = JSON.parse(JSON.stringify(state));
            const syncId = newState.innings || 1;
            
            newState.batsmen = [
                { name: action.payload.striker, runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: true },
                { name: action.payload.nonStriker, runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: false },
            ];
            newState.bowler = { name: action.payload.bowler, overs: 0, balls: 0, runs: 0, wickets: 0 };
            newState.bowlers = [action.payload.bowler];
            newState.isMatchStarted = true;
            newState.score = { runs: 0, wickets: 0, overs: 0, balls: 0 };
            newState.thisOver = [];
            newState.history = [];

            // Initialize/Reset inningsDetails for this start
            if (!newState.inningsDetails) newState.inningsDetails = JSON.parse(JSON.stringify(initialState.inningsDetails));
            
            newState.inningsDetails[syncId] = {
                score: { runs: 0, wickets: 0, overs: 0, balls: 0 },
                batsmenStats: {
                    [action.payload.striker]: { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
                    [action.payload.nonStriker]: { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }
                },
                batsmenOrder: [action.payload.striker, action.payload.nonStriker],
                bowlers: [action.payload.bowler],
                bowlerStats: {
                    [action.payload.bowler]: { overs: 0, balls: 0, runs: 0, wickets: 0 }
                },
                extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
                fallOfWickets: [],
                overHistory: []
            };

            return newState;
        }
        case 'SET_NEW_BOWLER': {
            const bowlerName = action.payload;
            const newState = JSON.parse(JSON.stringify(state));

            const updatedBowlers = (newState.bowlers || []).includes(bowlerName)
                ? (newState.bowlers || [])
                : [...(newState.bowlers || []), bowlerName];

            if (!newState.bowlerStats) newState.bowlerStats = {};
            if (!newState.bowlerStats[bowlerName]) {
                newState.bowlerStats[bowlerName] = { overs: 0, balls: 0, runs: 0, wickets: 0 };
            }

            const syncId = newState.innings;
            if (newState.inningsDetails && newState.inningsDetails[syncId]) {
                if (!newState.inningsDetails[syncId].bowlers) newState.inningsDetails[syncId].bowlers = [];
                if (!newState.inningsDetails[syncId].bowlerStats) newState.inningsDetails[syncId].bowlerStats = {};
                
                if (!newState.inningsDetails[syncId].bowlers.includes(bowlerName)) {
                    newState.inningsDetails[syncId].bowlers.push(bowlerName);
                }
                if (!newState.inningsDetails[syncId].bowlerStats[bowlerName]) {
                    newState.inningsDetails[syncId].bowlerStats[bowlerName] = { overs: 0, balls: 0, runs: 0, wickets: 0 };
                }
            }

            return {
                ...newState,
                bowler: { name: bowlerName, ...newState.bowlerStats[bowlerName] },
                bowlers: updatedBowlers,
                thisOver: [],
                batsmenThisOver: [],
                isOverComplete: false,
                lastBowlerName: state.bowler?.name // Keep the one who JUST finished as restricted
            };
        }
        case 'RETIRE_BATSMAN': {
            const newState = JSON.parse(JSON.stringify(state));
            newState.history = [...(state.history || []), stateSnapshot(state)].slice(-50); // Keep last 50

            const index = newState.batsmen.findIndex(b => b.isStriker === action.payload.isStriker);
            if (index !== -1) {
                newState.batsmen[index] = {
                    name: action.payload.newName,
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    isStriker: action.payload.isStriker
                };
            }

            // Sync to InningsDetails
            const syncIdR = newState.innings;
            newState.inningsDetails[syncIdR] = {
                ...newState.inningsDetails[syncIdR],
                score: { ...newState.score },
                batsmenStats: { ...newState.inningsDetails[syncIdR].batsmenStats },
                batsmenOrder: [...newState.inningsDetails[syncIdR].batsmenOrder],
                bowlers: [...newState.bowlers],
                bowlerStats: { ...newState.bowlerStats },
                extras: { ...newState.extras },
                fallOfWickets: [...newState.fallOfWickets],
                overHistory: [...(newState.inningsDetails[syncIdR].overHistory || [])]
            };

            return newState;
        }
        case 'ADD_BALL': {
            const { runs, extraType, isWicket, newBatsmanName, wicketType, fielderName, runOutStriker } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));
            newState.history = [...(state.history || []), stateSnapshot(state)].slice(-50);

            // Ensure inningsDetails exist for the current inning
            const syncId = newState.innings;
            if (!newState.inningsDetails) newState.inningsDetails = JSON.parse(JSON.stringify(initialState.inningsDetails));
            if (!newState.inningsDetails[syncId]) {
                newState.inningsDetails[syncId] = JSON.parse(JSON.stringify(initialState.inningsDetails[1] || { 
                    score: { runs: 0, wickets: 0, overs: 0, balls: 0 }, 
                    batsmenStats: {}, batsmenOrder: [], bowlers: [], bowlerStats: {}, 
                    extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 }, fallOfWickets: [], overHistory: [] 
                }));
            }
            const currentInningData = newState.inningsDetails[syncId];

            let totalRuns = runs;
            if (extraType === 'WIDE' || extraType === 'NB') {
                totalRuns += 1;
            }
            newState.score.runs += totalRuns;

            // Track Extras
            if (extraType === 'WIDE') newState.extras.wide += 1;
            else if (extraType === 'NB') newState.extras.noBall += 1;
            else if (extraType === 'BYE') newState.extras.bye += runs;
            else if (extraType === 'LEG_BYE') newState.extras.legBye += runs;

            const strikerIndex = newState.batsmen.findIndex(b => b.isStriker);
            const nonStrikerIndex = newState.batsmen.findIndex(b => !b.isStriker);
            const strikerName = strikerIndex !== -1 ? newState.batsmen[strikerIndex].name : 'Unknown';

            if (isWicket && newBatsmanName) {
                // If there are runs before wicket (like a Run Out where they completed 1 run)
                if (runs > 0) {
                   if (strikerIndex !== -1) {
                        newState.batsmen[strikerIndex].runs += runs;
                        newState.batsmen[strikerIndex].balls += 1;
                   }
                } else if (!isWicket || wicketType !== 'Run Out') {
                    // Normal ball increment for wicket
                    if (strikerIndex !== -1 && extraType !== 'WIDE') {
                         newState.batsmen[strikerIndex].balls += 1;
                    }
                } else if (wicketType === 'Run Out' && strikerIndex !== -1 && extraType !== 'WIDE') {
                     // 0 run run-out still counts as a ball faced for striker
                     newState.batsmen[strikerIndex].balls += 1;
                }

                // Fall of Wicket tracking
                const wicketNum = newState.score.wickets + 1;
                // Determine who got out for FoW display
                let outBatsmanName = strikerName;
                let replaceIndex = strikerIndex;

                if (wicketType === 'Run Out' && !runOutStriker) {
                    outBatsmanName = nonStrikerIndex !== -1 ? newState.batsmen[nonStrikerIndex].name : 'Unknown';
                    replaceIndex = nonStrikerIndex;
                }

                newState.fallOfWickets.push({
                    wicketNum,
                    batsman: outBatsmanName,
                    score: `${newState.score.runs}-${wicketNum}`,
                    over: `${newState.score.overs}.${newState.score.balls}`,
                    wicketType: wicketType || (isWicket ? 'Wicket' : null),
                    fielder: fielderName || null
                });

                if (replaceIndex !== -1) {
                     const outBatsman = newState.batsmen[replaceIndex];
                     if (outBatsman && outBatsman.name) {
                         currentInningData.batsmenStats[outBatsman.name] = {
                             runs: outBatsman.runs,
                             balls: outBatsman.balls,
                             fours: outBatsman.fours,
                             sixes: outBatsman.sixes,
                             isOut: true,
                             wicketType: wicketType || 'Wicket',
                             fielder: fielderName || null,
                             bowler: newState.bowler.name,
                             wicketNum: wicketNum
                         };
                     }

                     newState.batsmen[replaceIndex] = {
                         name: newBatsmanName,
                         runs: 0,
                         balls: 0,
                         fours: 0,
                         sixes: 0,
                         isStriker: replaceIndex === strikerIndex // keep striker status of the replaced position
                     };
                }
                
                newState.score.wickets += 1;
                // Note: Run outs typically do not count towards bowler's wickets, but keep simple for now or adjust based on rules. If needed, only add if not run out.
                if (wicketType !== 'Run Out') {
                   newState.bowler.wickets += 1;
                }
            } else if (!isWicket && strikerIndex !== -1) {
                if (extraType !== 'WIDE' && extraType !== 'BYE' && extraType !== 'LEG_BYE') {
                    newState.batsmen[strikerIndex].runs += runs;
                    newState.batsmen[strikerIndex].balls += 1;
                    if (runs === 4) newState.batsmen[strikerIndex].fours += 1;
                    if (runs === 6) newState.batsmen[strikerIndex].sixes += 1;
                }
            }

            // Sync Batting Stats for the current Innings
            newState.batsmen.forEach(b => {
                if (b.name && b.name !== 'Striker' && b.name !== 'Non-Striker') {
                    if (!currentInningData.batsmenOrder.includes(b.name)) {
                        currentInningData.batsmenOrder.push(b.name);
                    }
                    // Only update if not already marked as out (this loop is for current batsmen)
                    if (!currentInningData.batsmenStats[b.name]?.isOut) {
                        currentInningData.batsmenStats[b.name] = {
                            runs: b.runs,
                            balls: b.balls,
                            fours: b.fours,
                            sixes: b.sixes,
                            isOut: false
                        };
                    }
                }
            });

            let ballResult = runs.toString();
            if (isWicket) {
                if (runs > 0) ballResult = `${runs}+W`;
                else ballResult = 'W';
            } else if (extraType === 'WIDE') ballResult = 'wd';
            else if (extraType) ballResult = extraType[0] + runs;

            if (extraType !== 'WIDE' && extraType !== 'NB') {
                newState.bowler.balls += 1;
                newState.score.balls += 1;

                if (newState.score.balls === 6) {
                    newState.score.overs += 1;
                    newState.score.balls = 0;
                    newState.bowler.overs += 1;
                    newState.bowler.balls = 0;
                    newState.isOverComplete = true;

                    // Push over history
                    const currentInningData = newState.inningsDetails[newState.innings];
                    if (!currentInningData.overHistory) {
                        currentInningData.overHistory = [];
                    }
                    const runsThisOver = newState.thisOver.reduce((acc, curr) => {
                         if (curr === 'W') return acc;
                         if (curr.includes('+W')) {
                             return acc + parseInt(curr.split('+')[0] || 0);
                         }
                         if (curr === 'wd' || String(curr).startsWith('w')) return acc + 1 + (parseInt(curr.replace(/\D/g, '')) || 0);
                         if (curr === 'nb' || String(curr).startsWith('n')) return acc + 1 + (parseInt(curr.replace(/\D/g, '')) || 0);
                         if (String(curr).startsWith('b') || String(curr).startsWith('l')) return acc + (parseInt(curr.replace(/\D/g, '')) || 0);
                         return acc + (parseInt(curr) || 0);
                    }, 0);
                    
                    const bowlerName = newState.bowler.name || (state.bowler.name !== 'Bowler' ? state.bowler.name : 'N/A');
                    currentInningData.overHistory.push({
                        runs: runsThisOver + totalRuns,
                        balls: [...newState.thisOver, ballResult],
                        bowler: bowlerName,
                        batsmen: [...newState.batsmenThisOver]
                    });
                    newState.batsmenThisOver = [];
                    newState.lastBowlerName = newState.bowler.name;

                    // Swap ends at end of over
                    if (newState.batsmen.length >= 2) {
                        newState.batsmen[0].isStriker = !newState.batsmen[0].isStriker;
                        newState.batsmen[1].isStriker = !newState.batsmen[1].isStriker;
                    }
                }
            }
            newState.bowler.runs += totalRuns;

            // Sync Bowler Stats map
            if (newState.bowler.name) {
                newState.bowlerStats[newState.bowler.name] = {
                    overs: newState.bowler.overs,
                    balls: newState.bowler.balls,
                    runs: newState.bowler.runs,
                    wickets: newState.bowler.wickets
                };
            }

            newState.thisOver.push(ballResult);
            
            // Track batsman who faced this ball
            const facesBallStriker = newState.batsmen.find(b => b.isStriker);
            if (facesBallStriker && !newState.batsmenThisOver.includes(facesBallStriker.name)) {
                newState.batsmenThisOver.push(facesBallStriker.name);
            }

            // Swap ends for odd runs
            if (runs % 2 !== 0) {
                if (newState.batsmen.length >= 2) {
                    newState.batsmen[0].isStriker = !newState.batsmen[0].isStriker;
                    newState.batsmen[1].isStriker = !newState.batsmen[1].isStriker;
                }
            }

            // --- Innings & Match Completion Logic ---
            const maxOvers = newState.currentMatch?.overs || 10;
            const maxWickets = (newState.currentMatch?.playersPerTeam || 11) - 1;
            const isAllOut = newState.score.wickets >= maxWickets;
            const isOversDone = newState.score.overs >= maxOvers;

            if (newState.innings === 1) {
                if (isAllOut || isOversDone) {
                    newState.isInningsOver = true;
                    newState.target = newState.score.runs + 1;
                }
            } else {
                // Second Innings
                const teamA = newState.currentMatch?.teamA || 'Team A';
                const teamB = newState.currentMatch?.teamB || 'Team B';
                const tossWinner = newState.currentMatch?.tossWinner;
                const tossDecision = newState.currentMatch?.tossDecision;

                // Determine who is batting in 2nd innings
                let battingTeam2 = teamB;
                let bowlingTeam2 = teamA;
                if (tossWinner === teamA) {
                    if (tossDecision === 'bat') {
                        battingTeam2 = teamB;
                        bowlingTeam2 = teamA;
                    } else {
                        battingTeam2 = teamA;
                        bowlingTeam2 = teamB;
                    }
                } else {
                    if (tossDecision === 'bat') {
                        battingTeam2 = teamA;
                        bowlingTeam2 = teamB;
                    } else {
                        battingTeam2 = teamB;
                        bowlingTeam2 = teamA;
                    }
                }

                if (newState.score.runs >= (newState.target || 0)) {
                    newState.isMatchOver = true;
                    newState.matchResult = `${battingTeam2} won by ${maxWickets - newState.score.wickets} wickets`;
                } else if (isAllOut || isOversDone) {
                    newState.isMatchOver = true;
                    if (newState.score.runs === (newState.target || 0) - 1) {
                        newState.matchResult = "Match Tied";
                    } else {
                        newState.matchResult = `${bowlingTeam2} won by ${(newState.target || 0) - 1 - newState.score.runs} runs`;
                    }
                }
            }

            // Handle terminal over push if match/innings ended mid-over
            if (newState.isInningsOver || newState.isMatchOver) {
                const currentInningDataEnd = newState.inningsDetails[syncId];
                const lastOverInHistory = currentInningDataEnd.overHistory?.[currentInningDataEnd.overHistory.length - 1];
                // If the last over in history is not this one (over count match)
                // And explicitly check if current over is incomplete (balls > 0)
                if (newState.thisOver.length > 0 && newState.score.balls > 0 && (!lastOverInHistory || newState.score.overs > (currentInningDataEnd.overHistory.length - 1))) {
                    if (!currentInningDataEnd.overHistory) currentInningDataEnd.overHistory = [];
                    currentInningDataEnd.overHistory.push({
                        runs: newState.thisOver.reduce((acc, curr) => {
                             if (curr === 'W') return acc;
                             if (curr.includes('+W')) return acc + parseInt(curr.split('+')[0] || 0);
                             if (curr === 'wd' || String(curr).startsWith('w')) return acc + 1 + (parseInt(curr.replace(/\D/g, '')) || 0);
                             if (curr === 'nb' || String(curr).startsWith('n')) return acc + 1 + (parseInt(curr.replace(/\D/g, '')) || 0);
                             if (String(curr).startsWith('b') || String(curr).startsWith('l')) return acc + (parseInt(curr.replace(/\D/g, '')) || 0);
                             return acc + (parseInt(curr) || 0);
                        }, 0),
                        balls: [...newState.thisOver],
                        bowler: newState.bowler.name || 'N/A',
                        batsmen: [...newState.batsmenThisOver]
                    });
                }
            }

            // Sync all current data to InningsDetails
            newState.inningsDetails[syncId] = {
                score: { ...newState.score },
                batsmenStats: { ...newState.inningsDetails[syncId].batsmenStats },
                batsmenOrder: [...newState.inningsDetails[syncId].batsmenOrder],
                bowlers: [...newState.bowlers],
                bowlerStats: { ...newState.bowlerStats },
                extras: { ...newState.extras },
                fallOfWickets: [...newState.fallOfWickets],
                overHistory: [...(newState.inningsDetails[syncId].overHistory || [])]
            };

            return newState;
        }
        case 'START_SECOND_INNINGS':
            return {
                ...state,
                score: { runs: 0, wickets: 0, overs: 0, balls: 0 },
                batsmen: [
                    { name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: true },
                    { name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isStriker: false },
                ],
                bowler: { name: 'Bowler', overs: 0, balls: 0, runs: 0, wickets: 0 },
                bowlers: [],
                bowlerStats: {},
                fallOfWickets: [],
                extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
                thisOver: [],
                innings: 2,
                isInningsOver: false,
                isMatchStarted: false,
                isOverComplete: false,
            };
        case 'DECLARE_INNINGS': {
             const newState = JSON.parse(JSON.stringify(state));
             newState.history = [...(state.history || []), stateSnapshot(state)].slice(-50);

             if (newState.innings === 1) {
                 newState.isInningsOver = true;
                 newState.target = newState.score.runs + 1;
             } else {
                 newState.isMatchOver = true;
                 const teamA = newState.currentMatch?.teamA || 'Team A';
                 const teamB = newState.currentMatch?.teamB || 'Team B';
                 const tossWinner = newState.currentMatch?.tossWinner;
                 const tossDecision = newState.currentMatch?.tossDecision;

                 let bowlingTeam2 = teamA;
                 if (tossWinner === teamA && tossDecision === 'bat') bowlingTeam2 = teamA;
                 else if (tossWinner === teamB && tossDecision === 'bowl') bowlingTeam2 = teamA;
                 else bowlingTeam2 = teamB;
                 
                 newState.matchResult = `${bowlingTeam2} won by ${(newState.target || 0) - 1 - newState.score.runs} runs`;
             }
             
             const decSyncId = newState.innings;
             if (!newState.inningsDetails[decSyncId].overHistory) newState.inningsDetails[decSyncId].overHistory = [];
             
             // Push final over if it has balls and wasn't already pushed
             if (newState.thisOver.length > 0) {
                 const currentHist = newState.inningsDetails[decSyncId].overHistory;
                 const lastOverHist = currentHist[currentHist.length - 1];
                 // Simple check: if balls faced in summary > actual balls in hist, might need push.
                 // But safer to just check if thisOver contents match the last balls.
                 // For DECLARE, we assume we need to push the current progress.
                 currentHist.push({
                     runs: newState.thisOver.reduce((acc, curr) => {
                          if (curr === 'W') return acc;
                          if (curr.includes('+W')) return acc + parseInt(curr.split('+')[0] || 0);
                          if (curr === 'wd' || String(curr).startsWith('w')) return acc + 1 + (parseInt(curr.replace(/\D/g, '')) || 0);
                          if (curr === 'nb' || String(curr).startsWith('n')) return acc + 1 + (parseInt(curr.replace(/\D/g, '')) || 0);
                          if (String(curr).startsWith('b') || String(curr).startsWith('l')) return acc + (parseInt(curr.replace(/\D/g, '')) || 0);
                          return acc + (parseInt(curr) || 0);
                     }, 0),
                     balls: [...newState.thisOver],
                     bowler: newState.bowler.name || 'N/A'
                 });
             }

             newState.inningsDetails[decSyncId] = {
                 ...newState.inningsDetails[decSyncId],
                 score: { ...newState.score },
                 batsmenStats: { ...newState.inningsDetails[decSyncId].batsmenStats },
                 batsmenOrder: [...newState.inningsDetails[decSyncId].batsmenOrder],
                 overHistory: [...(newState.inningsDetails[decSyncId].overHistory || [])]
             };

             return newState;
        }
        case 'RESET_MATCH':
            return JSON.parse(JSON.stringify(initialState));
        case 'UNDO':
            if (!state.history || state.history.length === 0) return state;
            return state.history[state.history.length - 1];
        case 'SWAP_STRIKE': {
            const newState = JSON.parse(JSON.stringify(state));
            if (newState.batsmen.length >= 2) {
                newState.batsmen[0].isStriker = !newState.batsmen[0].isStriker;
                newState.batsmen[1].isStriker = !newState.batsmen[1].isStriker;
            }
            return newState;
        }
        case 'UPDATE_SETUP_DATA':
            return {
                ...state,
                setupData: {
                    ...state.setupData,
                    ...action.payload
                }
            };
        case 'CLEAR_SETUP':
            return {
                ...state,
                setupData: JSON.parse(JSON.stringify(initialState.setupData))
            };
        default:
            return state;
    }
}

export const MatchProvider = ({ children }) => {
    const [state, dispatch] = useReducer(matchReducer, initialState);

    useEffect(() => {
        if (state?.matchId) {
            const { history, ...saveState } = state;
            updateMatchState(state.matchId, saveState).catch(console.error);
        }
    }, [state]);

    const startMatch = (id, matchData) => dispatch({ type: 'INIT_MATCH', payload: { id, data: matchData } });
    const resumeMatch = (savedState) => dispatch({ type: 'RESUME_MATCH', payload: savedState });
    const startWithPlayers = (players) => dispatch({ type: 'START_MATCH_WITH_PLAYERS', payload: players });
    const setNewBowler = (name) => dispatch({ type: 'SET_NEW_BOWLER', payload: name });
    const retireBatsman = (isStriker, newName) => dispatch({ type: 'RETIRE_BATSMAN', payload: { isStriker, newName } });
    const startSecondInnings = () => dispatch({ type: 'START_SECOND_INNINGS' });
    const resetMatch = () => dispatch({ type: 'RESET_MATCH' });
    const clearSetupData = () => dispatch({ type: 'CLEAR_SETUP' });
    const addBall = (ballData) => dispatch({ type: 'ADD_BALL', payload: ballData });
    const declareInnings = () => dispatch({ type: 'DECLARE_INNINGS' });
    const undoBall = () => dispatch({ type: 'UNDO' });
    const swapStrike = () => dispatch({ type: 'SWAP_STRIKE' });
    const getBowlingTeamPlayers = () => {
        if (!state.currentMatch || !state.currentMatch.teamAData) return [];
        const { teamAData, teamBData, tossWinner, tossDecision } = state.currentMatch;
        const isInnings1 = state.innings === 1;
        
        let battingTeamName;
        if (tossWinner === teamAData.name) {
            battingTeamName = tossDecision === 'bat' ? teamAData.name : teamBData.name;
        } else {
            battingTeamName = tossDecision === 'bat' ? teamBData.name : teamAData.name;
        }
        
        if (!isInnings1) {
            battingTeamName = (battingTeamName === teamAData.name) ? teamBData.name : teamAData.name;
        }
        
        const bowlingTeam = (battingTeamName === teamAData.name) ? teamBData : teamAData;
        return bowlingTeam.players || [];
    };

    const getBowlingTeamWK = () => {
        if (!state.currentMatch || !state.currentMatch.teamAData) return null;
        const { teamAData, teamBData, tossWinner, tossDecision } = state.currentMatch;
        const isInnings1 = state.innings === 1;
        
        let battingTeamName;
        if (tossWinner === teamAData.name) {
            battingTeamName = tossDecision === 'bat' ? teamAData.name : teamBData.name;
        } else {
            battingTeamName = tossDecision === 'bat' ? teamBData.name : teamAData.name;
        }
        
        if (!isInnings1) {
            battingTeamName = (battingTeamName === teamAData.name) ? teamBData.name : teamAData.name;
        }
        
        const bowlingTeam = (battingTeamName === teamAData.name) ? teamBData : teamAData;
        return bowlingTeam.wicketkeeper;
    };

    const getBattingTeamPlayers = (inningNum) => {
        if (!state.currentMatch || !state.currentMatch.teamAData) return [];
        const { teamAData, teamBData, tossWinner, tossDecision } = state.currentMatch;
        const targetInning = inningNum || state.innings;
        const isInnings1 = targetInning === 1;
        
        let battingTeam;
        if (tossWinner === teamAData.name) {
            battingTeam = tossDecision === 'bat' ? (isInnings1 ? teamAData : teamBData) : (isInnings1 ? teamBData : teamAData);
        } else {
            battingTeam = tossDecision === 'bat' ? (isInnings1 ? teamBData : teamAData) : (isInnings1 ? teamAData : teamBData);
        }
        
        return battingTeam.players || [];
    };

    const getYetToBat = (inningNum) => {
        const targetInning = inningNum || state.innings;
        const allPlayers = getBattingTeamPlayers(targetInning);
        const currentBatsmenNames = state.inningsDetails[targetInning]?.batsmenOrder || [];
        return allPlayers.filter(p => !currentBatsmenNames.includes(p.name));
    };

    const getAvailableBatsmen = () => {
        const allBatsmen = getBattingTeamPlayers();
        const currentBatsmenNames = state.batsmen.map(b => b.name);
        const outBatsmenStats = state.inningsDetails[state.innings]?.batsmenStats || {};
        
        return allBatsmen.filter(p => {
            const isAtCrease = currentBatsmenNames.includes(p.name);
            const isOut = outBatsmenStats[p.name]?.isOut === true;
            return !isAtCrease && !isOut;
        });
    };

    const updateSetupData = (data) => dispatch({ type: 'UPDATE_SETUP_DATA', payload: data });

    return (
        <MatchContext.Provider value={{
            ...initialState,
            ...state,
            startMatch,
            resumeMatch,
            startWithPlayers,
            setNewBowler,
            retireBatsman,
            addBall,
            declareInnings,
            undoBall,
            swapStrike,
            startSecondInnings,
            resetMatch,
            updateSetupData,
            clearSetupData,
            getBowlingTeamPlayers,
            getBowlingTeamWK,
            getBattingTeamPlayers,
            getYetToBat,
            getAvailableBatsmen
        }}>
            {children}
        </MatchContext.Provider>
    );
};

export const useMatch = () => useContext(MatchContext);
