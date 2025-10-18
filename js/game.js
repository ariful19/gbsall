const GAME_WIDTH = 960;
const GAME_HEIGHT = 720;
const BRICK_COLUMNS = 30;
const BRICK_ROWS = 6;
const BRICK_WIDTH = 28;
const BRICK_HEIGHT = 18;
const BRICK_PADDING_X = 4;
const BRICK_PADDING_Y = 4;
const BRICK_TOP_OFFSET = 70;
const BALL_RADIUS = 8;
const BALL_SPEED = 380;
const PADDLE_RADIUS = 120;

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: "game-container",
    backgroundColor: "#000000",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

new Phaser.Game(config);

function preload() {
    // No assets to load; textures generated at runtime.
}

function create() {
    this.score = 0;
    this.lives = 3;
    this.gameState = "ready"; // ready, active, victory, over
    this.ballLockedToPaddle = true;

    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    buildTextures.call(this);
    buildBricks.call(this);
    buildHUD.call(this);
    buildPaddle.call(this);
    buildBall.call(this);

    this.physics.world.setBoundsCollision(true, true, true, false);
    this.physics.add.collider(this.ball, this.bricks, onBallHitBrick, null, this);

    lockBallToPaddle.call(this, true);
}

function update() {
    handlePaddleMovement.call(this);

    if (this.gameState === "victory" || this.gameState === "over") {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.restart();
        }
        return;
    }

    if (this.ballLockedToPaddle) {
        positionBallOnPaddle.call(this);
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            launchBall.call(this);
        }
    } else {
        handlePaddleBounce.call(this);

        if (this.ball.y > GAME_HEIGHT + BALL_RADIUS) {
            loseLife.call(this);
        }
    }
}

function buildTextures() {
    if (!this.textures.exists("ball")) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1);
        g.fillCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);
        g.generateTexture("ball", BALL_RADIUS * 2, BALL_RADIUS * 2);
        g.destroy();
    }

    if (!this.textures.exists("paddle")) {
        const width = PADDLE_RADIUS * 2;
        const height = PADDLE_RADIUS;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x2979ff, 1);
        g.beginPath();
        g.moveTo(0, height);
        g.arc(PADDLE_RADIUS, height, PADDLE_RADIUS, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
        g.closePath();
        g.fillPath();

        g.lineStyle(4, 0x5ab1ff, 0.7);
        g.beginPath();
        g.arc(PADDLE_RADIUS, height, PADDLE_RADIUS - 3, Phaser.Math.DegToRad(185), Phaser.Math.DegToRad(355), false);
        g.strokePath();
        g.generateTexture("paddle", width, height);
        g.destroy();
    }

    const colors = [0xff595e, 0xffca3a, 0x8ac926, 0x1982c4, 0x6a4c93, 0xf15bb5];
    this.brickTextures = [];
    colors.forEach((color, index) => {
        const key = `brick-${index}`;
        this.brickTextures.push(key);
        if (this.textures.exists(key)) {
            return;
        }
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(color, 1);
        g.fillRoundedRect(0, 0, BRICK_WIDTH, BRICK_HEIGHT, 4);
        g.lineStyle(2, 0xffffff, 0.2);
        g.strokeRoundedRect(0, 0, BRICK_WIDTH, BRICK_HEIGHT, 4);
        g.generateTexture(key, BRICK_WIDTH, BRICK_HEIGHT);
        g.destroy();
    });
}

function buildBricks() {
    this.bricks = this.physics.add.staticGroup();
    const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_PADDING_X;
    const leftOffset = (GAME_WIDTH - totalWidth) / 2;

    for (let row = 0; row < BRICK_ROWS; row += 1) {
        for (let col = 0; col < BRICK_COLUMNS; col += 1) {
            const textureKey = this.brickTextures[(row * BRICK_COLUMNS + col) % this.brickTextures.length];
            const x = leftOffset + col * (BRICK_WIDTH + BRICK_PADDING_X) + BRICK_WIDTH / 2;
            const y = BRICK_TOP_OFFSET + row * (BRICK_HEIGHT + BRICK_PADDING_Y) + BRICK_HEIGHT / 2;
            const brick = this.bricks.create(x, y, textureKey);
            brick.refreshBody();
        }
    }

    this.totalBricks = BRICK_COLUMNS * BRICK_ROWS;
}

function buildHUD() {
    this.scoreText = this.add.text(16, 16, "Score: 0", {
        font: "20px Arial",
        fill: "#ffffff"
    });

    this.livesText = this.add.text(GAME_WIDTH - 16, 16, "Lives: 3", {
        font: "20px Arial",
        fill: "#ffffff"
    }).setOrigin(1, 0);

    this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "", {
        font: "32px Arial",
        fill: "#ffffff"
    }).setOrigin(0.5);
}

function buildPaddle() {
    this.paddle = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 40, "paddle");
    this.paddle.setOrigin(0.5, 1);
    this.paddle.setCollideWorldBounds(true);
    this.paddle.setImmovable(true);
    this.paddle.body.allowGravity = false;

    const collisionHeight = Math.max(18, this.paddle.displayHeight * 0.45);
    const collisionWidth = this.paddle.displayWidth * 0.9;
    this.paddle.body.setSize(collisionWidth, collisionHeight);
    this.paddle.body.setOffset((this.paddle.displayWidth - collisionWidth) / 2, 0);
}

function buildBall() {
    this.ball = this.physics.add.image(this.paddle.x, 0, "ball");
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(1);
    this.ball.setMaxVelocity(600, 600);
    this.ball.body.setCircle(BALL_RADIUS);
    this.ball.body.onWorldBounds = true;
}

function lockBallToPaddle(firstLaunch) {
    this.ballLockedToPaddle = true;
    this.gameState = firstLaunch ? "ready" : "preparing";
    this.ball.setVelocity(0);
    positionBallOnPaddle.call(this);
    showStatus.call(this, firstLaunch ? "Get Ready" : "Life Lost");

    const delay = firstLaunch ? 800 : 1000;
    this.time.delayedCall(delay, () => {
        if (this.gameState === "victory" || this.gameState === "over") {
            return;
        }
        launchBall.call(this);
    });
}

function positionBallOnPaddle() {
    const paddleTop = this.paddle.y - this.paddle.displayHeight;
    this.ball.setPosition(this.paddle.x, paddleTop - BALL_RADIUS - 2);
}

function launchBall() {
    if (!this.ballLockedToPaddle || this.gameState === "victory" || this.gameState === "over") {
        return;
    }
    const angle = Phaser.Math.DegToRad(Phaser.Math.Between(-50, 50));
    const velocityX = BALL_SPEED * Math.sin(angle);
    const velocityY = -BALL_SPEED * Math.cos(angle);

    this.ballLockedToPaddle = false;
    this.gameState = "active";
    this.ball.setVelocity(velocityX, velocityY);
    showStatus.call(this, "");
}

function handlePaddleMovement() {
    const paddleSpeed = 420;
    if (this.cursorKeys.left.isDown) {
        this.paddle.setVelocityX(-paddleSpeed);
    } else if (this.cursorKeys.right.isDown) {
        this.paddle.setVelocityX(paddleSpeed);
    } else {
        this.paddle.setVelocityX(0);
    }
}

function onBallHitBrick(ball, brick) {
    brick.disableBody(true, true);
    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.bricks.countActive() === 0) {
        handleVictory.call(this);
    }
}

function handlePaddleBounce() {
    if (this.gameState !== "active") {
        return;
    }

    const body = this.ball.body;
    if (!body || body.velocity.y <= 0) {
        return;
    }

    const circleCenterX = this.paddle.x;
    const circleCenterY = this.paddle.y;
    const circleRadius = PADDLE_RADIUS;

    if (this.ball.y >= circleCenterY) {
        return;
    }

    const dx = this.ball.x - circleCenterX;
    const dy = this.ball.y - circleCenterY;
    const distanceSq = dx * dx + dy * dy;
    const contactDistance = circleRadius + BALL_RADIUS;
    const detectionDistance = contactDistance - 2;

    if (distanceSq > detectionDistance * detectionDistance) {
        return;
    }

    const distance = Math.max(Math.sqrt(distanceSq), 0.0001);
    const normalX = dx / distance;
    const normalY = dy / distance;

    const incomingX = body.velocity.x;
    const incomingY = body.velocity.y;
    const dot = incomingX * normalX + incomingY * normalY;

    let reflectedX = incomingX - 2 * dot * normalX;
    let reflectedY = incomingY - 2 * dot * normalY;

    const outgoingSpeed = Math.sqrt(reflectedX * reflectedX + reflectedY * reflectedY) || 1;
    const targetSpeed = Math.max(BALL_SPEED, outgoingSpeed);
    const scale = targetSpeed / outgoingSpeed;
    reflectedX *= scale;
    reflectedY *= scale;

    if (reflectedY >= 0) {
        reflectedY = -Math.abs(reflectedY || targetSpeed * 0.4);
        const horizontalSq = Math.max(0, targetSpeed * targetSpeed - reflectedY * reflectedY);
        const horizontal = Math.sqrt(horizontalSq);
        reflectedX = reflectedX >= 0 ? horizontal : -horizontal;
    }

    this.ball.setVelocity(reflectedX, reflectedY);

    this.ball.x = circleCenterX + normalX * contactDistance;
    this.ball.y = circleCenterY + normalY * contactDistance;
}

function loseLife() {
    if (this.gameState !== "active") {
        return;
    }

    this.lives -= 1;
    this.livesText.setText(`Lives: ${this.lives}`);

    if (this.lives <= 0) {
        handleGameOver.call(this);
    } else {
        lockBallToPaddle.call(this, false);
    }
}

function handleVictory() {
    this.gameState = "victory";
    this.ball.setVelocity(0);
    this.ballLockedToPaddle = true;
    showStatus.call(this, "You Win! Press Space to Restart");
    this.physics.pause();
}

function handleGameOver() {
    this.gameState = "over";
    this.ball.setVelocity(0);
    this.ballLockedToPaddle = true;
    showStatus.call(this, "Game Over. Press Space to Restart");
    this.physics.pause();
}

function showStatus(message) {
    this.statusText.setText(message);
}

