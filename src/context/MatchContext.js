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
    innings: 1,
    target: null,
    isInningsOver: false,
    isMatchOver: false,
    matchResult: '',
    extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
    bowlerStats: {}, // { bowlerName: { overs: 0, balls: 0, runs: 0, wickets: 0 } }
    fallOfWickets: [], // [ { wicketNum: 1, batsman: 'Name', score: '50-1', over: '5.2' } ]
    inningsDetails: {
        1: { score: { runs: 0, wickets: 0, overs: 0, balls: 0 }, batsmenStats: {}, batsmenOrder: [], bowlers: [], bowlerStats: {}, extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 }, fallOfWickets: [] },
        2: { score: { runs: 0, wickets: 0, overs: 0, balls: 0 }, batsmenStats: {}, batsmenOrder: [], bowlers: [], bowlerStats: {}, extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 }, fallOfWickets: [] }
    },
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
        case 'START_MATCH_WITH_PLAYERS':
            return {
                ...state,
                batsmen: [
                    { ...(state.batsmen?.[0] || initialState.batsmen[0]), name: action.payload.striker },
                    { ...(state.batsmen?.[1] || initialState.batsmen[1]), name: action.payload.nonStriker },
                ],
                bowler: { ...(state.bowler || initialState.bowler), name: action.payload.bowler },
                bowlers: [action.payload.bowler],
                isMatchStarted: true,
            };
        case 'SET_NEW_BOWLER': {
            const bowlerName = action.payload;
            const updatedBowlers = (state.bowlers || []).includes(bowlerName)
                ? (state.bowlers || [])
                : [...(state.bowlers || []), bowlerName];

            // Initialize bowler stats if not exists
            const newState = { ...state };
            if (!newState.bowlerStats) newState.bowlerStats = {};
            if (!newState.bowlerStats[bowlerName]) {
                newState.bowlerStats[bowlerName] = { overs: 0, balls: 0, runs: 0, wickets: 0 };
            }

            return {
                ...newState,
                bowler: { name: bowlerName, ...newState.bowlerStats[bowlerName] },
                bowlers: updatedBowlers,
                thisOver: [],
                isOverComplete: false,
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
                fallOfWickets: [...newState.fallOfWickets]
            };

            return newState;
        }
        case 'ADD_BALL': {
            const { runs, extraType, isWicket, newBatsmanName } = action.payload;
            const newState = JSON.parse(JSON.stringify(state));
            newState.history = [...(state.history || []), stateSnapshot(state)].slice(-50);

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
            const strikerName = strikerIndex !== -1 ? newState.batsmen[strikerIndex].name : 'Unknown';

            if (isWicket && newBatsmanName && strikerIndex !== -1) {
                // Fall of Wicket tracking
                const wicketNum = newState.score.wickets + 1;
                newState.fallOfWickets.push({
                    wicketNum,
                    batsman: strikerName,
                    score: `${newState.score.runs}-${wicketNum}`,
                    over: `${newState.score.overs}.${newState.score.balls}`
                });

                newState.batsmen[strikerIndex] = {
                    name: newBatsmanName,
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    isStriker: true
                };
                newState.score.wickets += 1;
                newState.bowler.wickets += 1;
            } else if (!isWicket && strikerIndex !== -1) {
                if (extraType !== 'WIDE' && extraType !== 'BYE' && extraType !== 'LEG_BYE') {
                    newState.batsmen[strikerIndex].runs += runs;
                    newState.batsmen[strikerIndex].balls += 1;
                    if (runs === 4) newState.batsmen[strikerIndex].fours += 1;
                    if (runs === 6) newState.batsmen[strikerIndex].sixes += 1;
                }
            }

            // Sync Batting Stats for the current Innings
            const currentInningData = newState.inningsDetails[newState.innings];
            newState.batsmen.forEach(b => {
                if (b.name && b.name !== 'Striker' && b.name !== 'Non-Striker') {
                    if (!currentInningData.batsmenOrder.includes(b.name)) {
                        currentInningData.batsmenOrder.push(b.name);
                    }
                    currentInningData.batsmenStats[b.name] = {
                        runs: b.runs,
                        balls: b.balls,
                        fours: b.fours,
                        sixes: b.sixes
                    };
                }
            });

            if (extraType !== 'WIDE' && extraType !== 'NB') {
                newState.bowler.balls += 1;
                newState.score.balls += 1;

                if (newState.score.balls === 6) {
                    newState.score.overs += 1;
                    newState.score.balls = 0;
                    newState.bowler.overs += 1;
                    newState.bowler.balls = 0;
                    newState.isOverComplete = true;

                    newState.batsmen[0].isStriker = !newState.batsmen[0].isStriker;
                    newState.batsmen[1].isStriker = !newState.batsmen[1].isStriker;
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

            let ballResult = runs.toString();
            if (isWicket) ballResult = 'W';
            if (extraType === 'WIDE') ballResult = 'wd';
            else if (extraType) ballResult = extraType[0] + runs;
            newState.thisOver.push(ballResult);

            if (runs % 2 !== 0 && extraType !== 'NB' && extraType !== 'WIDE' && !newState.isOverComplete) {
                newState.batsmen[0].isStriker = !newState.batsmen[0].isStriker;
                newState.batsmen[1].isStriker = !newState.batsmen[1].isStriker;
            }

            // --- Innings & Match Completion Logic ---
            const maxOvers = newState.currentMatch?.overs || 10;
            const isAllOut = newState.score.wickets >= 10;
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
                    newState.matchResult = `${battingTeam2} won by ${10 - newState.score.wickets} wickets`;
                } else if (isAllOut || isOversDone) {
                    newState.isMatchOver = true;
                    if (newState.score.runs === (newState.target || 0) - 1) {
                        newState.matchResult = "Match Tied";
                    } else {
                        newState.matchResult = `${bowlingTeam2} won by ${(newState.target || 0) - 1 - newState.score.runs} runs`;
                    }
                }
            }

            // Sync all current data to InningsDetails
            const syncId = newState.innings;
            newState.inningsDetails[syncId] = {
                score: { ...newState.score },
                batsmenStats: { ...newState.inningsDetails[syncId].batsmenStats },
                batsmenOrder: [...newState.inningsDetails[syncId].batsmenOrder],
                bowlers: [...newState.bowlers],
                bowlerStats: { ...newState.bowlerStats },
                extras: { ...newState.extras },
                fallOfWickets: [...newState.fallOfWickets]
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
            };
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
    const addBall = (ballData) => dispatch({ type: 'ADD_BALL', payload: ballData });
    const undoBall = () => dispatch({ type: 'UNDO' });
    const swapStrike = () => dispatch({ type: 'SWAP_STRIKE' });

    return (
        <MatchContext.Provider value={{
            ...state,
            startMatch,
            resumeMatch,
            startWithPlayers,
            setNewBowler,
            retireBatsman,
            addBall,
            undoBall,
            swapStrike,
            startSecondInnings,
            resetMatch
        }}>
            {children}
        </MatchContext.Provider>
    );
};

export const useMatch = () => useContext(MatchContext);
