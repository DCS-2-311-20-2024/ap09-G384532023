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
    mario: { width: 0.4, height: 1 },
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
    goalPosition: 33
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
}

// ブロッククラス
class Block {
  constructor(position, isQuestionBlock = false) {
    // 色の定義
    const blockColors = {
      question: 0xFFD700, // 金色 (はてなブロック)
      normal: 0x8B4513,  // 茶色 (通常ブロック)
      empty: 0x808080    // グレー (使用済みはてなブロック)
    };

    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        PARAMS.sizes.block.size,
        PARAMS.sizes.block.size,
        PARAMS.sizes.block.size
      ),
      new THREE.MeshPhongMaterial({ 
        color: isQuestionBlock ? blockColors.question : blockColors.normal,
        shininess: isQuestionBlock ? 100 : 30 // はてなブロックは光沢を強く
      })
    );
    
    this.mesh.position.copy(position);
    this.isQuestionBlock = isQuestionBlock;
    if (isQuestionBlock) {
      this.originalY = position.y;
      this.bounceTime = 0;
      this.bounceHeight = 0.1;
      this.hasItem = true;
      
      // はてなブロックのエッジを強調
      this.mesh.material.metalness = 0.7;
      this.mesh.material.roughness = 0.2;
    }
  }

  break() {
    if (!this.broken) {
      if (this.isQuestionBlock && this.hasItem) {
        this.hasItem = false;
        // 使用済みはてなブロックの色に変更
        this.mesh.material.color.setHex(0x808080);
        this.mesh.material.shininess = 10;
        this.mesh.material.metalness = 0;
        this.mesh.material.roughness = 0.9;
        this.mesh.material.needsUpdate = true;
      } else if (!this.isQuestionBlock) {
        this.broken = true;
        this.mesh.visible = false;
      }
    }
  }
}





class Pipe {
  constructor(position) {
    this.mesh = new THREE.Group();

    const mainGeometry = new THREE.CylinderGeometry(
      PARAMS.sizes.pipe.width / 2,
      PARAMS.sizes.pipe.width / 2,
      PARAMS.sizes.pipe.height,
      32,
      1,
      true
    );
    const mainMaterial = new THREE.MeshPhongMaterial({
      color: PARAMS.colors.pipe,
      side: THREE.DoubleSide
    });
    const mainPipe = new THREE.Mesh(mainGeometry, mainMaterial);

    const topGeometry = new THREE.CylinderGeometry(
      (PARAMS.sizes.pipe.width / 2) + PARAMS.sizes.pipe.thickness,
      (PARAMS.sizes.pipe.width / 2) + PARAMS.sizes.pipe.thickness,
      PARAMS.sizes.pipe.topHeight,
      32
    );
    const topPipe = new THREE.Mesh(topGeometry, mainMaterial);

    mainPipe.position.y = PARAMS.sizes.pipe.height / 2;
    topPipe.position.y = PARAMS.sizes.pipe.height/1.1;

    this.mesh.add(mainPipe);
    this.mesh.add(topPipe);
    this.mesh.position.copy(position);
  }
}



// マリオクラス
class Mario {
  constructor() {
    this.mesh = new THREE.Group();
    this.velocity = new THREE.Vector3();
    this.isJumping = false;
    this.isMoving = false;
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
    this.pipes = [];
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
    const CoinInstances = [];
    const coinPosition = [
      new THREE.Vector3(11, 2, 0),
      new THREE.Vector3(13, 2, 0),

      new THREE.Vector3(19, 3.75, 0),
      new THREE.Vector3(19.5, 3.75, 0),
      new THREE.Vector3(20, 3.75, 0),
      new THREE.Vector3(20.5, 3.75, 0),
      new THREE.Vector3(21, 3.75, 0),
      new THREE.Vector3(21.5, 3.75, 0),
      new THREE.Vector3(19, 4.25, 0),
      new THREE.Vector3(19.5, 4.25, 0),
      new THREE.Vector3(20, 4.25, 0),
      new THREE.Vector3(20.5, 4.25, 0),
      new THREE.Vector3(21, 4.25, 0),
      new THREE.Vector3(21.5, 4.25, 0),
    ];

    coinPosition.forEach(position => {
      const coin = new Coin(position);
      this.coins.push(coin);
      this.scene.add(coin.mesh);
    });

    this.scene.add(...CoinInstances);
    

    // 没
    const pipePositions = [
      new THREE.Vector3(12, -0.15, 0)
      
    ];
  
    pipePositions.forEach(position => {
      const pipe = new Pipe(position);
      this.pipes.push(pipe);
      this.scene.add(pipe.mesh);
    });

    const blockInstances = [];
    const blockPositions = [
      { pos: new THREE.Vector3(2.5, 2.25, 0), isQuestion: true }, // はてなブロック

      { pos: new THREE.Vector3(5, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(5.5, 2.25, 0), isQuestion: true }, // はてなブロック
      { pos: new THREE.Vector3(6, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(6.5, 2.25, 0), isQuestion: true },  // はてなブロック
      { pos: new THREE.Vector3(7, 2.25, 0), isQuestion: false },

      { pos: new THREE.Vector3(6, 4.25, 0), isQuestion: true },  // はてなブロック

      { pos: new THREE.Vector3(10, 0.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(10.5, 0.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(11, 0.25, 0), isQuestion: false },

      { pos: new THREE.Vector3(10.5, 0.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(11, 0.75, 0), isQuestion: false },

      { pos: new THREE.Vector3(11, 1.25, 0), isQuestion: false },

      { pos: new THREE.Vector3(13, 0.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(13.5, 0.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(14, 0.25, 0), isQuestion: false },

      { pos: new THREE.Vector3(13, 0.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(13.5, 0.75, 0), isQuestion: false },

      { pos: new THREE.Vector3(13, 1.25, 0), isQuestion: false },

      { pos: new THREE.Vector3(18.5, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(19, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(19.5, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(20, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(20.5, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(21, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(21.5, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(22, 2.25, 0), isQuestion: false },

      { pos: new THREE.Vector3(25, 0.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(25.5, 0.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(26, 0.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(26.5, 0.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(27, 0.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(27.5, 0.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(28, 0.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(28.5, 0.25, 0), isQuestion: false },

      { pos: new THREE.Vector3(25.5, 0.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(26, 0.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(26.5, 0.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(27, 0.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(27.5, 0.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(28, 0.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(28.5, 0.75, 0), isQuestion: false },

      { pos: new THREE.Vector3(26, 1.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(26.5, 1.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(27, 1.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(27.5, 1.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(28, 1.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(28.5, 1.25, 0), isQuestion: false },

      { pos: new THREE.Vector3(26.5, 1.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(27, 1.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(27.5, 1.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(28, 1.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(28.5, 1.75, 0), isQuestion: false },
      
      { pos: new THREE.Vector3(27, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(27.5, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(28, 2.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(28.5, 2.25, 0), isQuestion: false },

      { pos: new THREE.Vector3(27.5, 2.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(28, 2.75, 0), isQuestion: false },
      { pos: new THREE.Vector3(28.5, 2.75, 0), isQuestion: false },

      { pos: new THREE.Vector3(28, 3.25, 0), isQuestion: false },
      { pos: new THREE.Vector3(28.5, 3.25, 0), isQuestion: false },

      { pos: new THREE.Vector3(28.5, 3.75, 0), isQuestion: false },


    ];
    blockPositions.forEach(({ pos, isQuestion }) => {
      const block = new Block(pos, isQuestion);
      this.blocks.push(block);
      this.scene.add(block.mesh);
    })

    this.scene.add(...blockInstances);
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
        <div>Your<br>${this.score}</div>
        <div><br>COINS: ${this.world.coins.length}</div>
        <div>WORLD<br>1-1</div>
        <div>TIME<br>${this.timeLeft}</div>`;

    switch (this.state) {
      case GameState.START:
        this.menuContainer.innerHTML = `
                    <h1>Super adventure</h1>
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

    // ブロックとの衝突判定（優先度高）
  let blockCollisionOccurred = false;
  this.world.blocks.forEach(block => {
    if (!block.broken || block.isQuestionBlock) {
      const blockBox = new THREE.Box3().setFromObject(block.mesh);
      const marioBox = new THREE.Box3().setFromObject(this.mario.mesh);

      if (blockBox.intersectsBox(marioBox)) {
        blockCollisionOccurred = true;
        const marioPos = this.mario.mesh.position;
        const blockPos = block.mesh.position;

        // 上下の衝突判定を優先
        if (this.mario.velocity.y < 0 && marioPos.y > blockPos.y) {
          // 上からの衝突
          marioPos.y = blockPos.y + PARAMS.sizes.block.size + PARAMS.sizes.mario.height / 5;
          this.mario.velocity.y = 0;
          this.mario.isJumping = false;
        } else if (this.mario.velocity.y > 0 && marioPos.y < blockPos.y) {
          // 下からの衝突
          if (block.isQuestionBlock && block.hasItem) {
            this.score += 100;
          } else if (!block.isQuestionBlock) {
            this.score += 50;
          }
          block.break();
          this.mario.velocity.y = 0;
        } else if (Math.abs(marioPos.y - blockPos.y) < PARAMS.sizes.block.size / 1.5) {
          // 横からの衝突
          const fromLeft = marioPos.x < blockPos.x;
          marioPos.x = blockPos.x + (fromLeft ? -1 : 1) * 
            (PARAMS.sizes.block.size + PARAMS.sizes.mario.width / 100);
          this.mario.velocity.x = 0;
        }
        this.updateUI();
      }
    }
  });

  // パイプとの衝突判定（ブロックとの衝突がない場合のみ処理）
  if (!blockCollisionOccurred) {
    this.world.pipes.forEach(pipe => {
      const pipeBox = new THREE.Box3().setFromObject(pipe.mesh);
      const marioBox = new THREE.Box3().setFromObject(this.mario.mesh);

      if (pipeBox.intersectsBox(marioBox)) {
        const marioPos = this.mario.mesh.position;
        const pipePos = pipe.mesh.position;

        // 上からの衝突を優先
        if (this.mario.velocity.y < 0 && 
            marioPos.y > pipePos.y + PARAMS.sizes.pipe.height) {
          marioPos.y = pipePos.y + PARAMS.sizes.pipe.height + 
            PARAMS.sizes.mario.height / 2;
          this.mario.velocity.y = 0;
          this.mario.isJumping = false;
        } else {
          // 横からの衝突
          const fromLeft = marioPos.x < pipePos.x;
          const offset = PARAMS.sizes.pipe.width / 2 + PARAMS.sizes.mario.width / 2;
          marioPos.x = pipePos.x + (fromLeft ? -offset : offset);
          this.mario.velocity.x = 0;
        }
      }
    });
  }


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