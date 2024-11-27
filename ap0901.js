//
// 応用プログラミング 第9,10回 自由課題 (ap0901.js)
// G384532023 鈴木卓弥
//
"use strict"; // 厳格モード

import * as THREE from "three";

// 定数の定義
const PARAMS = {
  axes: true,
  colors: {
    sky: 0x87CEEB,
    ground: 0x228B22,
    mario: 0xFF0000,
    coin: 0xFFD700,
    block: 0xA0522D,
    goal: 0xC0C0C0,
    pipe: 0x00FF00
  },
  sizes: {
    mario: { width: 0.5, height: 1 },
    ground: { width: 100, height: 2 },
    coin: { radius: 0.2 },
    block: { size: 0.5 },
    goal: { height: 5, width: 0.3 },
    pipe: { height: 1.5, width: 1, thickness: 0.2, topHeight: 0.5 }
  },
  physics: {
    gravity: 0.04,
    jumpForce: 0.5,
    moveSpeed: 0.10
  },
  camera: {
    followDistance: 10,
    height: 5,
    smoothness: 0.3
  },
  game: {
    totalCoins: 10,
    goalPosition: 30
  }
};

// ゲームの状態を管理する列挙型
const GameState = {
  START: 'start',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
  CLEAR: 'clear'
};

// コインクラス
class Coin {
  constructor(position) {
    this.mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        PARAMS.sizes.coin.radius,
        PARAMS.sizes.coin.radius,
        0.1,
        32
      ),
      new THREE.MeshPhongMaterial({ color: PARAMS.colors.coin })
    );
    this.mesh.position.copy(position);
    this.mesh.rotation.x = Math.PI / 2;
  }

  update() {
    this.mesh.rotation.y += 0.02;
  }
<<<<<<< HEAD
}

// ブロッククラス
class Block {
  constructor(position, isQuestionBlock = false) {
      // テクスチャの設定
      let texture;
      if (isQuestionBlock) {
          texture = new THREE.TextureLoader().load('img/locky.png');
      } else {
          texture = new THREE.TextureLoader().load('img/block.png');
      }

      this.mesh = new THREE.Mesh(
          new THREE.BoxGeometry(
              PARAMS.sizes.block.size,
              PARAMS.sizes.block.size,
              PARAMS.sizes.block.size
          ),
          new THREE.MeshPhongMaterial({ map: texture })
      );
      this.mesh.position.copy(position);
      this.isQuestionBlock = isQuestionBlock;
      if (isQuestionBlock) {
          this.originalY = position.y;
          this.bounceTime = 0;
          this.bounceHeight = 0.1;
          this.hasItem = true;
      }
  }
  break() {
    if (!this.broken) {
        if (this.isQuestionBlock && this.hasItem) {
            // はてなブロックの場合、テクスチャを変更
            this.hasItem = false;
            const emptyTexture = new THREE.TextureLoader().load('img/re.jpg');
            this.mesh.material.map = emptyTexture;
            this.mesh.material.needsUpdate = true;
        } else if (!this.isQuestionBlock) {
            // 通常のブロックは非表示に
            this.broken = true;
            this.mesh.visible = false;
        }
    }
}
}




class Pipe {
  constructor(position) {
    this.mesh = new THREE.Group();

    // メインの筒部分
    const mainGeometry = new THREE.CylinderGeometry(
      PARAMS.sizes.pipe.width / 2,           // 上部の半径
      PARAMS.sizes.pipe.width / 2,           // 下部の半径
      PARAMS.sizes.pipe.height,              // 高さ
      32,                                    // 分割数
      1,                                     // 高さ方向の分割数
      true                                   // 開いた円柱（上下が空洞）
    );
    const mainMaterial = new THREE.MeshPhongMaterial({
      color: PARAMS.colors.pipe,
      side: THREE.DoubleSide                 // 内側も描画
    });
    const mainPipe = new THREE.Mesh(mainGeometry, mainMaterial);

    // 上部の縁
    const topGeometry = new THREE.CylinderGeometry(
      (PARAMS.sizes.pipe.width / 2) + PARAMS.sizes.pipe.thickness,  // 上部の半径（メインより太い）
      (PARAMS.sizes.pipe.width / 2) + PARAMS.sizes.pipe.thickness,  // 下部の半径
      PARAMS.sizes.pipe.topHeight,           // 高さ
      32                                     // 分割数
    );
    const topPipe = new THREE.Mesh(topGeometry, mainMaterial);

    // 位置調整
    mainPipe.position.y = PARAMS.sizes.pipe.height / 2;
    topPipe.position.y = PARAMS.sizes.pipe.height;

    // グループに追加
    this.mesh.add(mainPipe);
    this.mesh.add(topPipe);

    // 全体の位置を設定
    this.mesh.position.copy(position);

  }
}



// マリオクラス
class Mario {
  constructor() {
    this.mesh = new THREE.Group();
    this.velocity = new THREE.Vector3();
    this.isJumping = false;
    this.createMario();
  }

  createMario() {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(
        PARAMS.sizes.mario.width,
        PARAMS.sizes.mario.height,
        PARAMS.sizes.mario.width
      ),
      new THREE.MeshPhongMaterial({ color: PARAMS.colors.mario })
    );
    body.castShadow = true;
    body.receiveShadow = true;
    this.mesh.add(body);
    this.mesh.position.y = PARAMS.sizes.mario.height / 2;
  }

  update() {
    this.velocity.y -= PARAMS.physics.gravity;
    this.mesh.position.add(this.velocity);

    if (this.mesh.position.y <= PARAMS.sizes.mario.height / 2) {
      this.mesh.position.y = PARAMS.sizes.mario.height / 2;
      this.velocity.y = 0;
      this.isJumping = false;
    }
  }

  jump() {
    if (!this.isJumping) {
      this.velocity.y = PARAMS.physics.jumpForce;
      this.isJumping = true;
    }
  }

  moveLeft() {
    this.velocity.x = -PARAMS.physics.moveSpeed;
  }

  moveRight() {
    this.velocity.x = PARAMS.physics.moveSpeed;
  }

  stop() {
    this.velocity.x = 0;
  }
}

// ワールドクラス
class World {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PARAMS.colors.sky);
    this.setupLighting();
    this.createGround();
    this.createGoal();
    this.coins = [];
    this.blocks = [];
    this.createLevel();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  createGround() {
    const groundGeometry = new THREE.BoxGeometry(
      PARAMS.sizes.ground.width,
      PARAMS.sizes.ground.height,
      PARAMS.sizes.ground.width
    );
    const groundMaterial = new THREE.MeshPhongMaterial({ color: PARAMS.colors.ground });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.position.y = -PARAMS.sizes.ground.height / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  createGoal() {
    const goalGeometry = new THREE.BoxGeometry(
      PARAMS.sizes.goal.width,
      PARAMS.sizes.goal.height,
      PARAMS.sizes.goal.width
    );
    const goalMaterial = new THREE.MeshPhongMaterial({ color: PARAMS.colors.goal });
    this.goal = new THREE.Mesh(goalGeometry, goalMaterial);
    this.goal.position.set(
      PARAMS.game.goalPosition,
      PARAMS.sizes.goal.height / 2,
      0
    );
    this.scene.add(this.goal);
  }

  createLevel() {
    // コインを配置
    const coinPosition = [
      new THREE.Vector3(6, 4, 0)
    ];

    coinPosition.forEach(position => {
      const coin = new Coin(position);
      this.coins.push(coin);
      this.scene.add(coin.mesh);
    }
    )

    // 没
    const pipe = new Pipe(new THREE.Vector3(10, -10, 0));
    this.scene.add(pipe.mesh);


    const blockPositions = [
      { pos: new THREE.Vector3(2.5, 2, 0), isQuestion: true }, // はてなブロック

      { pos: new THREE.Vector3(5, 2, 0), isQuestion: false },
      { pos: new THREE.Vector3(5.5, 2, 0), isQuestion: true }, // はてなブロック
      { pos: new THREE.Vector3(6, 2, 0), isQuestion: false },
      { pos: new THREE.Vector3(6.5, 2, 0), isQuestion: true },  // はてなブロック
      { pos: new THREE.Vector3(7, 2, 0), isQuestion: false },

      { pos: new THREE.Vector3(6, 4, 0), isQuestion: true },  // はてなブロック
    ];
    blockPositions.forEach(({ pos, isQuestion }) => {
      const block = new Block(pos, isQuestion);
      this.blocks.push(block);
      this.scene.add(block.mesh);
    })
  }


  update() {
    this.coins.forEach(coin => coin.update());

    // はてなブロックのアニメーション
    this.blocks.forEach(block => {
      if (block.isQuestionBlock) {
        block.bounceTime += 0.05;
      }
    });
  }
}

// ゲームクラス
class Game {
  constructor() {
    this.state = GameState.START;
    this.score = 0;
    this.setupRenderer();
    this.setupCamera();
    this.world = new World();
    this.mario = new Mario();
    this.world.scene.add(this.mario.mesh);
    this.setupUI();
    this.setupControls();
    this.animate();
    this.lastTime = 0;
    this.frameRate = 1000 / 60; // 60 FPS
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.getElementById("output").appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(
      0,
      PARAMS.camera.height,
      PARAMS.camera.followDistance
    );
    this.camera.lookAt(0, 0, 0);
  }

  setupUI() {
    this.uiContainer = document.createElement('div');
    this.uiContainer.style.position = 'fixed';
    this.uiContainer.style.top = '20px';
    this.uiContainer.style.left = '20px';
    this.uiContainer.style.right = '20px';
    this.uiContainer.style.display = 'grid';
    this.uiContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
    this.uiContainer.style.gap = '20px';
    this.uiContainer.style.color = 'white';
    this.uiContainer.style.fontFamily = 'Arial';
    this.uiContainer.style.fontSize = '24px';
    this.uiContainer.style.textAlign = 'left';
    this.uiContainer.style.background = 'rgba(0, 0, 0, 0.5)';
    this.uiContainer.style.padding = '10px';
    this.uiContainer.style.borderRadius = '8px';
    document.body.appendChild(this.uiContainer);

    this.menuContainer = document.createElement('div');
    this.menuContainer.style.position = 'fixed';
    this.menuContainer.style.top = '50%';
    this.menuContainer.style.left = '50%';
    this.menuContainer.style.transform = 'translate(-50%, -50%)';
    this.menuContainer.style.textAlign = 'center';
    this.menuContainer.style.color = 'white';
    this.menuContainer.style.fontFamily = 'Arial';
    this.menuContainer.style.fontSize = '36px';
    document.body.appendChild(this.menuContainer);

    this.updateUI();
  }

  updateUI() {
    // UIの設定はここ
    this.uiContainer.innerHTML = `
        <div>MARIO<br>${this.score}</div>
        <div><br>COINS: ${this.world.coins.length}</div>
        <div>WORLD<br>1-1</div>
        <div>TIME<br>${this.timeLeft}</div>`;

    switch (this.state) {
      case GameState.START:
        this.menuContainer.innerHTML = `
                    <h1>Super Mario Clone</h1>
                    <p>スペースキーでスタート</p>
                    <p>←→: 移動<br>スペース: ジャンプ</p>
                `;
        this.menuContainer.style.display = 'block';
        break;
      case GameState.PLAYING:
        this.menuContainer.style.display = 'none';
        break;
      case GameState.CLEAR:
        this.menuContainer.innerHTML = `
                    <h1>ゲームクリア!</h1>
                    <p>スコア: ${this.score}</p>
                    <p>スペースキーでリスタート</p>
                `;
        this.menuContainer.style.display = 'block';
        break;
      case GameState.GAMEOVER:
        this.menuContainer.innerHTML = `
                    <h1>ゲームオーバー</h1>
                    <p>スペースキーでリスタート</p>
                `;
        this.menuContainer.style.display = 'block';
        break;
    }
  }

  setupControls() {
    window.addEventListener('keydown', (event) => {
      switch (this.state) {
        case GameState.START:
          if (event.code === 'Space') {
            this.state = GameState.PLAYING;
            this.updateUI();
          }
          break;
        case GameState.PLAYING:
          switch (event.code) {
            case 'Space':
              this.mario.jump();
              break;
            case 'ArrowLeft':
              this.mario.moveLeft();
              break;
            case 'ArrowRight':
              this.mario.moveRight();
              break;
          }
          break;
        case GameState.CLEAR:
        case GameState.GAMEOVER:
          if (event.code === 'Space') {
            window.location.reload();
          }
          break;
      }
    });

    window.addEventListener('keyup', (event) => {
      if (this.state === GameState.PLAYING) {
        if (['ArrowLeft', 'ArrowRight'].includes(event.code)) {
          this.mario.stop();
        }
      }
    });
  }

  checkCollisions() {
    // 左型の境界
    if (this.mario.mesh.position.x < 0) {
      this.mario.mesh.position.x = 0;
      this.mario.velocity.x = 0;
    }
    // コインとの衝突判定
    this.world.coins.forEach((coin, index) => {
      const distance = this.mario.mesh.position.distanceTo(coin.mesh.position);
      if (distance < PARAMS.sizes.coin.radius + PARAMS.sizes.mario.width) {
        this.world.scene.remove(coin.mesh);
        this.world.coins.splice(index, 1);
        this.score += 100;
        this.updateUI();
      }
    });

    // ブロックとの衝突判定
    this.world.blocks.forEach(block => {
      if (!block.broken || block.isQuestionBlock) {
        const blockBox = new THREE.Box3().setFromObject(block.mesh);
        const marioBox = new THREE.Box3().setFromObject(this.mario.mesh);

        if (blockBox.intersectsBox(marioBox)) {
          // 上からの衝突
          if (this.mario.velocity.y < 0 &&
            this.mario.mesh.position.y > block.mesh.position.y) {
            this.mario.mesh.position.y = block.mesh.position.y +
              PARAMS.sizes.block.size + PARAMS.sizes.mario.height / 5;
            this.mario.velocity.y = 0;
            this.mario.isJumping = false;
          }
          // 下からの衝突
          else if (this.mario.velocity.y > 0 && 
            this.mario.mesh.position.y < block.mesh.position.y) {
            if (block.isQuestionBlock && block.hasItem) {
                this.score += 100;
            } else if (!block.isQuestionBlock) {
                this.score += 50;
            }
            block.break();
            this.mario.velocity.y = 0;
          }
          // 横からの衝突
          else if (Math.abs(this.mario.mesh.position.y - block.mesh.position.y) <
            PARAMS.sizes.block.size) {
            if (this.mario.mesh.position.x < block.mesh.position.x) {
              this.mario.mesh.position.x = block.mesh.position.x -
                PARAMS.sizes.block.size - PARAMS.sizes.mario.width / 6;
            } else {
              this.mario.mesh.position.x = block.mesh.position.x +
                PARAMS.sizes.block.size + PARAMS.sizes.mario.width / 6;
            }
            this.mario.velocity.x = 0;
          }
        }
      }
    });





    // ゴールとの衝突判定
    const distanceToGoal = this.mario.mesh.position.distanceTo(this.world.goal.position);
    if (distanceToGoal < PARAMS.sizes.goal.width + PARAMS.sizes.mario.width) {
      this.state = GameState.CLEAR;
      this.updateUI();
    }

    // 落下判定
    if (this.mario.mesh.position.y < -5) {
      this.state = GameState.GAMEOVER;
      this.updateUI();
    }
  }

  updateCamera() {
    const targetPosition = new THREE.Vector3(
      this.mario.mesh.position.x,
      this.mario.mesh.position.y + PARAMS.camera.height,
      this.mario.mesh.position.z + PARAMS.camera.followDistance
    );
    this.camera.position.lerp(targetPosition, PARAMS.camera.smoothness);
    this.camera.lookAt(
      this.mario.mesh.position.x,
      this.mario.mesh.position.y,
      this.mario.mesh.position.z
    );
  }

  animate = (currentTime) => {
    requestAnimationFrame(this.animate);

    // フレームレートの制御
    if (currentTime - this.lastTime < this.frameRate) {
      return;
    }
    this.lastTime = currentTime;

    if (this.state === GameState.PLAYING) {
      this.mario.update();
      this.world.update();
      this.checkCollisions();
      this.updateCamera();
    }

    this.renderer.render(this.world.scene, this.camera);
  };

  dispose() {
    // メモリリーク防止のためのクリーンアップ
    this.world.scene.traverse(object => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    this.world.scene.clear();
  };
}

// 初期化
function init() {
  new Game();
=======
>>>>>>> 96c60e9424d85f1ee0c0277df4135df62e989e9d
}

// ブロッククラス
class Block {
  constructor(position, isQuestionBlock = false) {
      // テクスチャの設定
      let texture;
      if (isQuestionBlock) {
          texture = new THREE.TextureLoader().load('img/locky.png');
      } else {
          texture = new THREE.TextureLoader().load('img/block.png');
      }

      this.mesh = new THREE.Mesh(
          new THREE.BoxGeometry(
              PARAMS.sizes.block.size,
              PARAMS.sizes.block.size,
              PARAMS.sizes.block.size
          ),
          new THREE.MeshPhongMaterial({ map: texture })
      );
      this.mesh.position.copy(position);
      this.isQuestionBlock = isQuestionBlock;
      if (isQuestionBlock) {
          this.originalY = position.y;
          this.bounceTime = 0;
          this.bounceHeight = 0.1;
          this.hasItem = true;
      }
  }
  break() {
    if (!this.broken) {
        if (this.isQuestionBlock && this.hasItem) {
            // はてなブロックの場合、テクスチャを変更
            this.hasItem = false;
            const emptyTexture = new THREE.TextureLoader().load('img/re.jpg');
            this.mesh.material.map = emptyTexture;
            this.mesh.material.needsUpdate = true;
        } else if (!this.isQuestionBlock) {
            // 通常のブロックは非表示に
            this.broken = true;
            this.mesh.visible = false;
        }
    }
}
}




class Pipe {
  constructor(position) {
    this.mesh = new THREE.Group();

    // メインの筒部分
    const mainGeometry = new THREE.CylinderGeometry(
      PARAMS.sizes.pipe.width / 2,           // 上部の半径
      PARAMS.sizes.pipe.width / 2,           // 下部の半径
      PARAMS.sizes.pipe.height,              // 高さ
      32,                                    // 分割数
      1,                                     // 高さ方向の分割数
      true                                   // 開いた円柱（上下が空洞）
    );
    const mainMaterial = new THREE.MeshPhongMaterial({
      color: PARAMS.colors.pipe,
      side: THREE.DoubleSide                 // 内側も描画
    });
    const mainPipe = new THREE.Mesh(mainGeometry, mainMaterial);

    // 上部の縁
    const topGeometry = new THREE.CylinderGeometry(
      (PARAMS.sizes.pipe.width / 2) + PARAMS.sizes.pipe.thickness,  // 上部の半径（メインより太い）
      (PARAMS.sizes.pipe.width / 2) + PARAMS.sizes.pipe.thickness,  // 下部の半径
      PARAMS.sizes.pipe.topHeight,           // 高さ
      32                                     // 分割数
    );
    const topPipe = new THREE.Mesh(topGeometry, mainMaterial);

    // 位置調整
    mainPipe.position.y = PARAMS.sizes.pipe.height / 2;
    topPipe.position.y = PARAMS.sizes.pipe.height;

    // グループに追加
    this.mesh.add(mainPipe);
    this.mesh.add(topPipe);

    // 全体の位置を設定
    this.mesh.position.copy(position);

  }
}



// マリオクラス
class Mario {
  constructor() {
    this.mesh = new THREE.Group();
    this.velocity = new THREE.Vector3();
    this.isJumping = false;
    this.createMario();
  }

  createMario() {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(
        PARAMS.sizes.mario.width,
        PARAMS.sizes.mario.height,
        PARAMS.sizes.mario.width
      ),
      new THREE.MeshPhongMaterial({ color: PARAMS.colors.mario })
    );
    body.castShadow = true;
    body.receiveShadow = true;
    this.mesh.add(body);
    this.mesh.position.y = PARAMS.sizes.mario.height / 2;
  }

  update() {
    this.velocity.y -= PARAMS.physics.gravity;
    this.mesh.position.add(this.velocity);

    if (this.mesh.position.y <= PARAMS.sizes.mario.height / 2) {
      this.mesh.position.y = PARAMS.sizes.mario.height / 2;
      this.velocity.y = 0;
      this.isJumping = false;
    }
  }

  jump() {
    if (!this.isJumping) {
      this.velocity.y = PARAMS.physics.jumpForce;
      this.isJumping = true;
    }
  }

  moveLeft() {
    this.velocity.x = -PARAMS.physics.moveSpeed;
  }

  moveRight() {
    this.velocity.x = PARAMS.physics.moveSpeed;
  }

  stop() {
    this.velocity.x = 0;
  }
}

// ワールドクラス
class World {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PARAMS.colors.sky);
    this.setupLighting();
    this.createGround();
    this.createGoal();
    this.coins = [];
    this.blocks = [];
    this.createLevel();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  createGround() {
    const groundGeometry = new THREE.BoxGeometry(
      PARAMS.sizes.ground.width,
      PARAMS.sizes.ground.height,
      PARAMS.sizes.ground.width
    );
    const groundMaterial = new THREE.MeshPhongMaterial({ color: PARAMS.colors.ground });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.position.y = -PARAMS.sizes.ground.height / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  createGoal() {
    const goalGeometry = new THREE.BoxGeometry(
      PARAMS.sizes.goal.width,
      PARAMS.sizes.goal.height,
      PARAMS.sizes.goal.width
    );
    const goalMaterial = new THREE.MeshPhongMaterial({ color: PARAMS.colors.goal });
    this.goal = new THREE.Mesh(goalGeometry, goalMaterial);
    this.goal.position.set(
      PARAMS.game.goalPosition,
      PARAMS.sizes.goal.height / 2,
      0
    );
    this.scene.add(this.goal);
  }

  createLevel() {
    // コインを配置
    const coinPosition = [
      new THREE.Vector3(6, 4, 0)
    ];

    coinPosition.forEach(position => {
      const coin = new Coin(position);
      this.coins.push(coin);
      this.scene.add(coin.mesh);
    }
    )

    // 没
    const pipe = new Pipe(new THREE.Vector3(10, -10, 0));
    this.scene.add(pipe.mesh);


    const blockPositions = [
      { pos: new THREE.Vector3(2.5, 2, 0), isQuestion: true }, // はてなブロック

      { pos: new THREE.Vector3(5, 2, 0), isQuestion: false },
      { pos: new THREE.Vector3(5.5, 2, 0), isQuestion: true }, // はてなブロック
      { pos: new THREE.Vector3(6, 2, 0), isQuestion: false },
      { pos: new THREE.Vector3(6.5, 2, 0), isQuestion: true },  // はてなブロック
      { pos: new THREE.Vector3(7, 2, 0), isQuestion: false },

      { pos: new THREE.Vector3(6, 4, 0), isQuestion: true },  // はてなブロック
    ];
    blockPositions.forEach(({ pos, isQuestion }) => {
      const block = new Block(pos, isQuestion);
      this.blocks.push(block);
      this.scene.add(block.mesh);
    })
  }


  update() {
    this.coins.forEach(coin => coin.update());

    // はてなブロックのアニメーション
    this.blocks.forEach(block => {
      if (block.isQuestionBlock) {
        block.bounceTime += 0.05;
      }
    });
  }
}

// ゲームクラス
class Game {
  constructor() {
    this.state = GameState.START;
    this.score = 0;
    this.setupRenderer();
    this.setupCamera();
    this.world = new World();
    this.mario = new Mario();
    this.world.scene.add(this.mario.mesh);
    this.setupUI();
    this.setupControls();
    this.animate();
    this.lastTime = 0;
    this.frameRate = 1000 / 60; // 60 FPS
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.getElementById("output").appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(
      0,
      PARAMS.camera.height,
      PARAMS.camera.followDistance
    );
    this.camera.lookAt(0, 0, 0);
  }

  setupUI() {
    this.uiContainer = document.createElement('div');
    this.uiContainer.style.position = 'fixed';
    this.uiContainer.style.top = '20px';
    this.uiContainer.style.left = '20px';
    this.uiContainer.style.right = '20px';
    this.uiContainer.style.display = 'grid';
    this.uiContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
    this.uiContainer.style.gap = '20px';
    this.uiContainer.style.color = 'white';
    this.uiContainer.style.fontFamily = 'Arial';
    this.uiContainer.style.fontSize = '24px';
    this.uiContainer.style.textAlign = 'left';
    this.uiContainer.style.background = 'rgba(0, 0, 0, 0.5)';
    this.uiContainer.style.padding = '10px';
    this.uiContainer.style.borderRadius = '8px';
    document.body.appendChild(this.uiContainer);

    this.menuContainer = document.createElement('div');
    this.menuContainer.style.position = 'fixed';
    this.menuContainer.style.top = '50%';
    this.menuContainer.style.left = '50%';
    this.menuContainer.style.transform = 'translate(-50%, -50%)';
    this.menuContainer.style.textAlign = 'center';
    this.menuContainer.style.color = 'white';
    this.menuContainer.style.fontFamily = 'Arial';
    this.menuContainer.style.fontSize = '36px';
    document.body.appendChild(this.menuContainer);

    this.updateUI();
  }

  updateUI() {
    // UIの設定はここ
    this.uiContainer.innerHTML = `
        <div>MARIO<br>${this.score}</div>
        <div><br>COINS: ${this.world.coins.length}</div>
        <div>WORLD<br>1-1</div>
        <div>TIME<br>${this.timeLeft}</div>`;

    switch (this.state) {
      case GameState.START:
        this.menuContainer.innerHTML = `
                    <h1>Super Mario Clone</h1>
                    <p>スペースキーでスタート</p>
                    <p>←→: 移動<br>スペース: ジャンプ</p>
                `;
        this.menuContainer.style.display = 'block';
        break;
      case GameState.PLAYING:
        this.menuContainer.style.display = 'none';
        break;
      case GameState.CLEAR:
        this.menuContainer.innerHTML = `
                    <h1>ゲームクリア!</h1>
                    <p>スコア: ${this.score}</p>
                    <p>スペースキーでリスタート</p>
                `;
        this.menuContainer.style.display = 'block';
        break;
      case GameState.GAMEOVER:
        this.menuContainer.innerHTML = `
                    <h1>ゲームオーバー</h1>
                    <p>スペースキーでリスタート</p>
                `;
        this.menuContainer.style.display = 'block';
        break;
    }
  }

  setupControls() {
    window.addEventListener('keydown', (event) => {
      switch (this.state) {
        case GameState.START:
          if (event.code === 'Space') {
            this.state = GameState.PLAYING;
            this.updateUI();
          }
          break;
        case GameState.PLAYING:
          switch (event.code) {
            case 'Space':
              this.mario.jump();
              break;
            case 'ArrowLeft':
              this.mario.moveLeft();
              break;
            case 'ArrowRight':
              this.mario.moveRight();
              break;
          }
          break;
        case GameState.CLEAR:
        case GameState.GAMEOVER:
          if (event.code === 'Space') {
            window.location.reload();
          }
          break;
      }
    });

    window.addEventListener('keyup', (event) => {
      if (this.state === GameState.PLAYING) {
        if (['ArrowLeft', 'ArrowRight'].includes(event.code)) {
          this.mario.stop();
        }
      }
    });
  }

  checkCollisions() {
    // 左型の境界
    if (this.mario.mesh.position.x < 0) {
      this.mario.mesh.position.x = 0;
      this.mario.velocity.x = 0;
    }
    // コインとの衝突判定
    this.world.coins.forEach((coin, index) => {
      const distance = this.mario.mesh.position.distanceTo(coin.mesh.position);
      if (distance < PARAMS.sizes.coin.radius + PARAMS.sizes.mario.width) {
        this.world.scene.remove(coin.mesh);
        this.world.coins.splice(index, 1);
        this.score += 100;
        this.updateUI();
      }
    });

    // ブロックとの衝突判定
    this.world.blocks.forEach(block => {
      if (!block.broken || block.isQuestionBlock) {
        const blockBox = new THREE.Box3().setFromObject(block.mesh);
        const marioBox = new THREE.Box3().setFromObject(this.mario.mesh);

        if (blockBox.intersectsBox(marioBox)) {
          // 上からの衝突
          if (this.mario.velocity.y < 0 &&
            this.mario.mesh.position.y > block.mesh.position.y) {
            this.mario.mesh.position.y = block.mesh.position.y +
              PARAMS.sizes.block.size + PARAMS.sizes.mario.height / 5;
            this.mario.velocity.y = 0;
            this.mario.isJumping = false;
          }
          // 下からの衝突
          else if (this.mario.velocity.y > 0 && 
            this.mario.mesh.position.y < block.mesh.position.y) {
            if (block.isQuestionBlock && block.hasItem) {
                this.score += 100;
            } else if (!block.isQuestionBlock) {
                this.score += 50;
            }
            block.break();
            this.mario.velocity.y = 0;
          }
          // 横からの衝突
          else if (Math.abs(this.mario.mesh.position.y - block.mesh.position.y) <
            PARAMS.sizes.block.size) {
            if (this.mario.mesh.position.x < block.mesh.position.x) {
              this.mario.mesh.position.x = block.mesh.position.x -
                PARAMS.sizes.block.size - PARAMS.sizes.mario.width / 6;
            } else {
              this.mario.mesh.position.x = block.mesh.position.x +
                PARAMS.sizes.block.size + PARAMS.sizes.mario.width / 6;
            }
            this.mario.velocity.x = 0;
          }
        }
      }
    });





    // ゴールとの衝突判定
    const distanceToGoal = this.mario.mesh.position.distanceTo(this.world.goal.position);
    if (distanceToGoal < PARAMS.sizes.goal.width + PARAMS.sizes.mario.width) {
      this.state = GameState.CLEAR;
      this.updateUI();
    }

    // 落下判定
    if (this.mario.mesh.position.y < -5) {
      this.state = GameState.GAMEOVER;
      this.updateUI();
    }
  }

  updateCamera() {
    const targetPosition = new THREE.Vector3(
      this.mario.mesh.position.x,
      this.mario.mesh.position.y + PARAMS.camera.height,
      this.mario.mesh.position.z + PARAMS.camera.followDistance
    );
    this.camera.position.lerp(targetPosition, PARAMS.camera.smoothness);
    this.camera.lookAt(
      this.mario.mesh.position.x,
      this.mario.mesh.position.y,
      this.mario.mesh.position.z
    );
  }

  animate = (currentTime) => {
    requestAnimationFrame(this.animate);

    // フレームレートの制御
    if (currentTime - this.lastTime < this.frameRate) {
      return;
    }
    this.lastTime = currentTime;

    if (this.state === GameState.PLAYING) {
      this.mario.update();
      this.world.update();
      this.checkCollisions();
      this.updateCamera();
    }

    this.renderer.render(this.world.scene, this.camera);
  };

  dispose() {
    // メモリリーク防止のためのクリーンアップ
    this.world.scene.traverse(object => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    this.world.scene.clear();
  };
}

// 初期化
function init() {
  new Game();
}

init();
