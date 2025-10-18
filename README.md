# Galactic Breakout

Galactic Breakout is a browser-based arcade game inspired by the classic brick breaker formula. It is built with [Phaser 3](https://phaser.io/), renders entirely on a canvas, and generates all textures dynamically at runtime.

## Features
- **Fast-paced brick breaking** with smooth paddle controls and responsive physics powered by Phaser's arcade engine.
- **Vibrant procedurally generated visuals** for the paddle, ball, and bricks—no external art assets required.
- **Score, lives, and status HUD** that keeps you informed as you chase the high score.
- **Keyboard-first experience** tuned for desktop play.

## Play the game
1. Clone the repository.
2. Open `index.html` in any modern desktop browser (tested with Chromium-based browsers and Firefox).
3. Use the **left** and **right arrow keys** to move the paddle.
4. Press **space** to launch the ball and to restart after winning or losing.

## Project structure
```
├── index.html   # HTML bootstrapper that loads Phaser and the game script
├── js/
│   └── game.js  # Main Phaser scene with gameplay logic and rendering
└── README.md    # Project overview and instructions (this file)
```

## Development
- The project relies on the Phaser CDN, so no build step is required.
- To iterate locally with live reload, serve the directory with any static file server (for example `npx serve .`) and refresh the browser.
- Contributions are welcome—feel free to open an issue or submit a pull request with improvements or new features.

Enjoy smashing bricks among the stars!
