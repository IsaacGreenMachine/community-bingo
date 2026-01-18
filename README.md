# Community Bingo

A real-time multiplayer bingo game for friends, featuring objective-based squares, customizable scoring, and live leaderboards. Built with vanilla JavaScript and Firebase, hosted for free on GitHub Pages.

## Features

- **Real-time Multiplayer**: See other players' progress as they check off squares
- **Customizable Boards**: Configure board size, objectives, rarities, and scoring
- **Dynamic Scoring**: Points per square + bonuses for completing rows, columns, diagonals, and full board
- **Live Leaderboard**: Track all players' scores in real-time
- **Rarity System**: Color-coded squares based on rarity (common, uncommon, rare, epic, legendary)
- **Exclusive Mode**: Optional setting where only one player can claim each square
- **Easy Configuration**: Upload new game configs through the web interface
- **Mobile Friendly**: Responsive design works on all devices

## Quick Start

### 1. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. In the project overview, click "Add app" and select the Web platform (</>)
4. Register your app with a nickname (e.g., "Community Bingo")
5. Copy the Firebase configuration object

### 2. Enable Firebase Realtime Database

1. In the Firebase Console, go to "Build" > "Realtime Database"
2. Click "Create Database"
3. Choose a location (doesn't matter for small projects)
4. Start in **test mode** for easy setup (we'll set simple rules next)
5. Go to the "Rules" tab and paste the following rules:

```json
{
  "rules": {
    "games": {
      ".read": true,
      ".write": true
    }
  }
}
```

6. Click "Publish"

> **Note**: These rules allow anyone to read and write. This is fine for friend groups, but you can tighten security later if needed.

### 3. Configure the Project

1. Clone or download this repository
2. Copy `firebase-config.example.js` to `firebase-config.js`:
   ```bash
   cp firebase-config.example.js firebase-config.js
   ```
3. Open `firebase-config.js` and replace the placeholder values with your Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyAbc123...",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123..."
   };
   ```

### 4. Deploy to GitHub Pages

1. Commit all files to your repository:
   ```bash
   git add .
   git commit -m "Initial community bingo setup"
   git push origin main
   ```

2. Enable GitHub Pages:
   - Go to your repository on GitHub
   - Click "Settings" > "Pages"
   - Under "Source", select "Deploy from a branch"
   - Select "main" branch and "/ (root)" directory
   - Click "Save"

3. Your game will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### 5. Start Playing!

1. Share the game URL with your friends
2. Everyone enters their name to join
3. Upload a game configuration using the "Upload New Config" button
4. Start checking off squares and competing for the highest score!

## Local Testing

Before deploying, you can test locally:

1. Make sure you've set up `firebase-config.js`
2. Start a local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Or use any local server like Live Server in VS Code
   ```
3. Open `http://localhost:8000` in multiple browser tabs to simulate multiple players

## Configuration Guide

### JSON Structure

Create a JSON file with the following structure:

```json
{
  "boardSize": {
    "rows": 5,
    "columns": 5
  },
  "squares": [
    {
      "name": "Complete an objective",
      "rarity": "common",
      "points": 1
    }
    // ... more squares (must equal rows × columns)
  ],
  "rarityColors": {
    "common": "#808080",
    "uncommon": "#1eff00",
    "rare": "#0070dd",
    "epic": "#a335ee",
    "legendary": "#ff8000"
  },
  "completionBonuses": {
    "row": 10,
    "column": 10,
    "diagonal": 15,
    "fullBoard": 50,
    "onlyFirstPlayerGetsBonus": true
  },
  "exclusiveSquares": false
}
```

### Configuration Options

#### Board Size
- `rows`: Number of rows (e.g., 3, 5, 7)
- `columns`: Number of columns (e.g., 3, 5, 7)
- Total squares must equal `rows × columns`

#### Squares
Each square requires:
- `name`: Description of the objective (string)
- `rarity`: Rarity tier (string) - must match a key in `rarityColors`
- `points`: Points awarded for checking this square (number)

#### Rarity Colors
Define colors for each rarity tier:
- Use hex color codes (e.g., `#ff8000`)
- You can add custom rarity tiers (e.g., `"mythic": "#ff0000"`)

#### Completion Bonuses
- `row`: Bonus points for completing any horizontal row
- `column`: Bonus points for completing any vertical column
- `diagonal`: Bonus points for completing either diagonal (only works on square boards)
- `fullBoard`: Bonus points for completing the entire board
- `onlyFirstPlayerGetsBonus`: If `true`, only the first player to complete each row/column/diagonal/board gets the bonus. If `false`, everyone gets bonuses.

#### Exclusive Squares
- `true`: Only one player can check each square (first come, first served)
- `false`: Multiple players can check the same square

### Example Configurations

#### Small 3×3 Board
Perfect for quick games:
```json
{
  "boardSize": { "rows": 3, "columns": 3 },
  "squares": [
    // ... 9 squares total
  ]
}
```

#### Large 7×7 Board
For longer, more complex games:
```json
{
  "boardSize": { "rows": 7, "columns": 7 },
  "squares": [
    // ... 49 squares total
  ]
}
```

#### Competitive Mode
Enable exclusive squares and first-player-only bonuses:
```json
{
  "exclusiveSquares": true,
  "completionBonuses": {
    "row": 20,
    "column": 20,
    "diagonal": 30,
    "fullBoard": 100,
    "onlyFirstPlayerGetsBonus": true
  }
}
```

#### Casual Mode
Everyone gets bonuses, no exclusive squares:
```json
{
  "exclusiveSquares": false,
  "completionBonuses": {
    "row": 5,
    "column": 5,
    "diagonal": 10,
    "fullBoard": 25,
    "onlyFirstPlayerGetsBonus": false
  }
}
```

## How to Play

### Joining a Game
1. Open the game URL
2. Enter your name when prompted
3. Wait for the host to upload a game configuration

### Checking Squares
1. Click any square on the board to check it off
2. Your score updates automatically
3. Other players see your progress in real-time

### Scoring
- You earn points for each square you check
- Complete a full row, column, or diagonal for bonus points
- Complete the entire board for a mega bonus
- Watch the leaderboard to see how you rank!

### Starting a New Game
1. Create or modify a JSON configuration file
2. Click "Upload New Config" in the Admin Controls section
3. Select your JSON file
4. The game resets immediately for all players

## Customization Tips

### Creating Themed Games
Design squares around a theme:
- Video game challenges
- Movie/TV show trivia
- Real-world scavenger hunts
- Party game objectives

### Balancing Difficulty
- Use rarity tiers to indicate difficulty
- Award more points for harder objectives
- Adjust completion bonuses to encourage different strategies

### Custom Color Schemes
Change rarity colors to match your theme:
```json
"rarityColors": {
  "easy": "#90EE90",
  "medium": "#FFD700",
  "hard": "#FF6347",
  "extreme": "#FF1493"
}
```

## Troubleshooting

### Game Won't Load
- Check that `firebase-config.js` exists and has valid credentials
- Check browser console for errors (F12)
- Ensure Firebase Realtime Database is enabled

### Config Upload Fails
- Validate your JSON syntax (use [JSONLint](https://jsonlint.com/))
- Ensure number of squares matches `rows × columns`
- Check that all rarities have corresponding colors

### Players Can't See Each Other
- Check Firebase rules allow read/write
- Ensure all players are on the same game URL
- Check Firebase usage hasn't exceeded free tier limits

### GitHub Pages Not Working
- Wait 5-10 minutes after enabling Pages
- Check that repository is public (or you have GitHub Pro for private pages)
- Verify Pages is set to deploy from `main` branch, root directory

## Firebase Free Tier Limits

The Firebase free tier is very generous:
- **Storage**: 1 GB
- **Bandwidth**: 10 GB/month
- **Simultaneous Connections**: 100

This is more than enough for friend groups playing intermittently!

## Project Structure

```
/
├── index.html                 # Main game page
├── styles.css                 # All styling
├── game.js                    # Game logic and Firebase integration
├── config-example.json        # Example configuration
├── firebase-config.js         # Your Firebase config (gitignored)
├── firebase-config.example.js # Firebase config template
├── .gitignore                 # Git ignore file
└── README.md                  # This file
```

## Security Considerations

For friend groups, the open Firebase rules are fine. If you want to tighten security:

### Option 1: Add Basic Validation
```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        "players": {
          "$playerId": {
            ".write": true
          }
        },
        "config": {
          ".write": true
        }
      }
    }
  }
}
```

### Option 2: Add Admin Authentication
For more control over who can upload configs, you could:
1. Enable Firebase Authentication
2. Restrict config writes to authenticated admins
3. Update `game.js` to require sign-in for config uploads

## Contributing

Feel free to fork this project and customize it for your needs! Some ideas:
- Add sound effects
- Implement animations
- Add game timer
- Create multiple game rooms
- Add dark mode
- Store game history

## License

MIT License - feel free to use this project however you like!

## Credits

Built with vanilla JavaScript, Firebase Realtime Database, and GitHub Pages.

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Verify your Firebase configuration
3. Check browser console for errors
4. Create an issue in this repository

Happy Bingo! 🎉
