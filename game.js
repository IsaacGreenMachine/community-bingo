// Game State
let db;
let playerId;
let playerName;
let gameConfig = null;
let currentPlayerData = null;

// Constants
const GAME_ID = 'main';
const GAME_REF = `games/${GAME_ID}`;

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
db = firebase.database();

// Initialize Game
document.addEventListener('DOMContentLoaded', () => {
    // Check if player has existing ID
    playerId = localStorage.getItem('playerId');
    playerName = localStorage.getItem('playerName');

    if (playerId && playerName) {
        // Existing player - join game directly
        document.getElementById('nameModal').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        document.getElementById('currentPlayerName').textContent = playerName;
        initializeGame();
    } else {
        // New player - show name entry modal
        showNameModal();
    }

    // Setup admin controls
    document.getElementById('configUpload').addEventListener('change', handleConfigUpload);
});

// Name Modal Handler
function showNameModal() {
    const modal = document.getElementById('nameModal');
    const input = document.getElementById('playerNameInput');
    const btn = document.getElementById('joinGameBtn');

    modal.style.display = 'flex';

    const joinGame = () => {
        const name = input.value.trim();
        if (name) {
            playerId = generatePlayerId();
            playerName = name;

            localStorage.setItem('playerId', playerId);
            localStorage.setItem('playerName', playerName);

            modal.style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
            document.getElementById('currentPlayerName').textContent = playerName;

            initializeGame();
        }
    };

    btn.addEventListener('click', joinGame);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });
}

function generatePlayerId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initialize Game
function initializeGame() {
    // Initialize player in database
    db.ref(`${GAME_REF}/players/${playerId}`).set({
        name: playerName,
        score: 0,
        checkedSquares: [],
        completions: {
            rows: [],
            columns: [],
            diagonals: [],
            fullBoard: false
        },
        lastActive: firebase.database.ServerValue.TIMESTAMP
    });

    // Listen for config changes
    db.ref(`${GAME_REF}/config`).on('value', (snapshot) => {
        const config = snapshot.val();
        if (config) {
            gameConfig = config;
            renderBoard();
        }
    });

    // Listen for all players updates
    db.ref(`${GAME_REF}/players`).on('value', (snapshot) => {
        updateLeaderboard(snapshot.val());
    });

    // Listen for current player updates
    db.ref(`${GAME_REF}/players/${playerId}`).on('value', (snapshot) => {
        currentPlayerData = snapshot.val();
        if (currentPlayerData) {
            document.getElementById('currentPlayerScore').textContent = currentPlayerData.score + ' pts';
            updateBoardCheckedStates();
        }
    });
}

// Render Bingo Board
function renderBoard() {
    if (!gameConfig) return;

    const board = document.getElementById('bingoBoard');
    board.innerHTML = '';

    const { rows, columns } = gameConfig.boardSize;
    const totalSquares = rows * columns;

    // Set grid layout
    board.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Create squares
    for (let i = 0; i < totalSquares; i++) {
        const squareData = gameConfig.squares[i];
        if (!squareData) continue;

        const square = document.createElement('div');
        square.className = 'bingo-square';
        square.dataset.index = i;
        square.style.backgroundColor = gameConfig.rarityColors[squareData.rarity] || '#808080';

        const nameEl = document.createElement('div');
        nameEl.className = 'square-name';
        nameEl.textContent = squareData.name;

        const pointsEl = document.createElement('div');
        pointsEl.className = 'square-points';
        pointsEl.textContent = `${squareData.points} pts`;

        square.appendChild(nameEl);
        square.appendChild(pointsEl);

        square.addEventListener('click', () => handleSquareClick(i));

        board.appendChild(square);
    }

    // Update checked states
    updateBoardCheckedStates();
}

// Handle Square Click
async function handleSquareClick(index) {
    if (!currentPlayerData || !gameConfig) return;

    const square = document.querySelector(`[data-index="${index}"]`);
    const squareData = gameConfig.squares[index];

    // Check if already checked by current player
    if (currentPlayerData.checkedSquares.includes(index)) {
        return;
    }

    // Check if exclusive mode is enabled
    if (gameConfig.exclusiveSquares) {
        const isExclusive = await isSquareExclusive(index);
        if (isExclusive) {
            return;
        }
    }

    // Add square to checked list
    const newCheckedSquares = [...currentPlayerData.checkedSquares, index];

    // Update Firebase
    await db.ref(`${GAME_REF}/players/${playerId}/checkedSquares`).set(newCheckedSquares);

    // Check for completions
    await checkCompletions(newCheckedSquares);

    // Recalculate score
    await calculateAndUpdateScore();
}

// Check if square is already claimed (exclusive mode)
async function isSquareExclusive(index) {
    const snapshot = await db.ref(`${GAME_REF}/players`).once('value');
    const players = snapshot.val();

    for (const pid in players) {
        if (pid !== playerId && players[pid].checkedSquares.includes(index)) {
            return true;
        }
    }

    return false;
}

// Check for Row/Column/Diagonal Completions
async function checkCompletions(checkedSquares) {
    if (!gameConfig) return;

    const { rows, columns } = gameConfig.boardSize;
    const completions = {
        rows: [],
        columns: [],
        diagonals: [],
        fullBoard: false
    };

    // Check rows
    for (let r = 0; r < rows; r++) {
        let rowComplete = true;
        for (let c = 0; c < columns; c++) {
            const index = r * columns + c;
            if (!checkedSquares.includes(index)) {
                rowComplete = false;
                break;
            }
        }
        if (rowComplete) {
            completions.rows.push(r);
        }
    }

    // Check columns
    for (let c = 0; c < columns; c++) {
        let colComplete = true;
        for (let r = 0; r < rows; r++) {
            const index = r * columns + c;
            if (!checkedSquares.includes(index)) {
                colComplete = false;
                break;
            }
        }
        if (colComplete) {
            completions.columns.push(c);
        }
    }

    // Check diagonals (only for square boards)
    if (rows === columns) {
        // Top-left to bottom-right
        let diag1Complete = true;
        for (let i = 0; i < rows; i++) {
            const index = i * columns + i;
            if (!checkedSquares.includes(index)) {
                diag1Complete = false;
                break;
            }
        }
        if (diag1Complete) {
            completions.diagonals.push(0);
        }

        // Top-right to bottom-left
        let diag2Complete = true;
        for (let i = 0; i < rows; i++) {
            const index = i * columns + (columns - 1 - i);
            if (!checkedSquares.includes(index)) {
                diag2Complete = false;
                break;
            }
        }
        if (diag2Complete) {
            completions.diagonals.push(1);
        }
    }

    // Check full board
    if (checkedSquares.length === rows * columns) {
        completions.fullBoard = true;
    }

    // Update completions in Firebase
    await db.ref(`${GAME_REF}/players/${playerId}/completions`).set(completions);
}

// Calculate and Update Score
async function calculateAndUpdateScore() {
    if (!currentPlayerData || !gameConfig) return;

    let totalScore = 0;

    // Add points from checked squares
    for (const index of currentPlayerData.checkedSquares) {
        const squareData = gameConfig.squares[index];
        if (squareData) {
            totalScore += squareData.points;
        }
    }

    // Add completion bonuses
    const bonuses = gameConfig.completionBonuses;
    const completions = currentPlayerData.completions;

    // Check if only first player gets bonus
    if (bonuses.onlyFirstPlayerGetsBonus) {
        // Check if current player is first for each completion
        const isFirstForRows = await checkFirstForCompletions('rows', completions.rows);
        const isFirstForColumns = await checkFirstForCompletions('columns', completions.columns);
        const isFirstForDiagonals = await checkFirstForCompletions('diagonals', completions.diagonals);
        const isFirstForFullBoard = await checkFirstForCompletion('fullBoard', completions.fullBoard);

        totalScore += isFirstForRows.length * (bonuses.row || 0);
        totalScore += isFirstForColumns.length * (bonuses.column || 0);
        totalScore += isFirstForDiagonals.length * (bonuses.diagonal || 0);
        if (isFirstForFullBoard) {
            totalScore += bonuses.fullBoard || 0;
        }
    } else {
        // Everyone gets bonuses
        totalScore += completions.rows.length * (bonuses.row || 0);
        totalScore += completions.columns.length * (bonuses.column || 0);
        totalScore += completions.diagonals.length * (bonuses.diagonal || 0);
        if (completions.fullBoard) {
            totalScore += bonuses.fullBoard || 0;
        }
    }

    // Update score in Firebase
    await db.ref(`${GAME_REF}/players/${playerId}/score`).set(totalScore);
}

// Check if current player is first for specific completions
async function checkFirstForCompletions(type, completedIndices) {
    if (completedIndices.length === 0) return [];

    const snapshot = await db.ref(`${GAME_REF}/players`).once('value');
    const players = snapshot.val();

    const firstCompletions = [];

    for (const idx of completedIndices) {
        let isFirst = true;
        for (const pid in players) {
            if (pid !== playerId) {
                const otherCompletions = players[pid].completions[type] || [];
                if (otherCompletions.includes(idx)) {
                    isFirst = false;
                    break;
                }
            }
        }
        if (isFirst) {
            firstCompletions.push(idx);
        }
    }

    return firstCompletions;
}

// Check if current player is first for full board completion
async function checkFirstForCompletion(type, completed) {
    if (!completed) return false;

    const snapshot = await db.ref(`${GAME_REF}/players`).once('value');
    const players = snapshot.val();

    for (const pid in players) {
        if (pid !== playerId) {
            if (players[pid].completions[type]) {
                return false;
            }
        }
    }

    return true;
}

// Update Board Checked States
function updateBoardCheckedStates() {
    if (!currentPlayerData) return;

    const squares = document.querySelectorAll('.bingo-square');
    squares.forEach((square, index) => {
        if (currentPlayerData.checkedSquares.includes(index)) {
            square.classList.add('checked');
        } else {
            square.classList.remove('checked');
        }
    });

    // If exclusive mode, mark squares checked by others
    if (gameConfig && gameConfig.exclusiveSquares) {
        updateExclusiveStates();
    }
}

// Update Exclusive States
async function updateExclusiveStates() {
    const snapshot = await db.ref(`${GAME_REF}/players`).once('value');
    const players = snapshot.val();

    const squares = document.querySelectorAll('.bingo-square');

    squares.forEach((square, index) => {
        let isExclusive = false;

        for (const pid in players) {
            if (pid !== playerId && players[pid].checkedSquares.includes(index)) {
                isExclusive = true;
                break;
            }
        }

        if (isExclusive && !currentPlayerData.checkedSquares.includes(index)) {
            square.classList.add('exclusive');
        } else {
            square.classList.remove('exclusive');
        }
    });
}

// Update Leaderboard
function updateLeaderboard(playersData) {
    if (!playersData) return;

    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';

    // Convert to array and sort by score
    const playersArray = Object.entries(playersData).map(([id, data]) => ({
        id,
        ...data
    }));

    playersArray.sort((a, b) => b.score - a.score);

    // Render player entries
    playersArray.forEach((player, index) => {
        const entry = document.createElement('div');
        entry.className = 'player-entry';

        if (player.id === playerId) {
            entry.classList.add('current-player');
        }

        if (index === 0) entry.classList.add('first-place');
        if (index === 1) entry.classList.add('second-place');
        if (index === 2) entry.classList.add('third-place');

        const rank = document.createElement('span');
        rank.className = 'rank';
        rank.textContent = `#${index + 1}`;

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = player.name;

        const score = document.createElement('span');
        score.className = 'player-score';
        score.textContent = `${player.score} pts`;

        entry.appendChild(rank);
        entry.appendChild(name);
        entry.appendChild(score);

        leaderboardList.appendChild(entry);
    });
}

// Handle Config Upload
async function handleConfigUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('uploadStatus');
    statusEl.textContent = 'Uploading...';
    statusEl.className = 'upload-status';

    try {
        const text = await file.text();
        const config = JSON.parse(text);

        // Validate config
        if (!validateConfig(config)) {
            throw new Error('Invalid configuration file');
        }

        // Upload to Firebase
        await db.ref(`${GAME_REF}/config`).set(config);

        // Reset all players
        await db.ref(`${GAME_REF}/players`).remove();

        // Re-initialize current player
        await db.ref(`${GAME_REF}/players/${playerId}`).set({
            name: playerName,
            score: 0,
            checkedSquares: [],
            completions: {
                rows: [],
                columns: [],
                diagonals: [],
                fullBoard: false
            },
            lastActive: firebase.database.ServerValue.TIMESTAMP
        });

        statusEl.textContent = 'Config uploaded successfully!';
        statusEl.className = 'upload-status success';

        setTimeout(() => {
            statusEl.textContent = '';
        }, 3000);
    } catch (error) {
        console.error('Config upload error:', error);
        statusEl.textContent = 'Error: ' + error.message;
        statusEl.className = 'upload-status error';
    }

    // Clear file input
    event.target.value = '';
}

// Validate Config
function validateConfig(config) {
    // Check required fields
    if (!config.boardSize || !config.squares || !config.rarityColors || !config.completionBonuses) {
        return false;
    }

    const { rows, columns } = config.boardSize;
    const totalSquares = rows * columns;

    // Check if number of squares matches board size
    if (config.squares.length !== totalSquares) {
        return false;
    }

    // Check if all squares have required fields
    for (const square of config.squares) {
        if (!square.name || !square.rarity || square.points === undefined) {
            return false;
        }

        // Check if rarity color exists
        if (!config.rarityColors[square.rarity]) {
            return false;
        }
    }

    return true;
}
