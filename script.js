// 캔버스 설정 (그림을 그리는 곳)
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

// 게임판 크기 (가로 12칸, 세로 20칸)
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 20;

// 화면 크기에 맞게 캔버스 크기 설정
function setCanvasSize() {
    const maxWidth = Math.min(300, window.innerWidth - 40);
    const blockSize = Math.floor(maxWidth / BOARD_WIDTH);

    canvas.width = blockSize * BOARD_WIDTH;
    canvas.height = blockSize * BOARD_HEIGHT;

    return blockSize;
}

// 한 칸의 크기 (동적으로 계산)
let BLOCK_SIZE = setCanvasSize();

// 게임판 배열 만들기 (0은 비어있음, 1은 블록이 있음)
let board = [];
for (let y = 0; y < BOARD_HEIGHT; y++) {
    board[y] = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
        board[y][x] = 0;
    }
}

// 점수, 레벨, 줄 개수
let score = 0;
let level = 1;
let lines = 0;

// 게임 상태
let gameRunning = false;
let gamePaused = false;
let gameLoop = null;

// 현재 떨어지는 블록
let currentPiece = null;
let currentX = 0;
let currentY = 0;

// 블록의 색깔들 (클래식 테트리스!)
const COLORS = [
    null,
    '#00FFFF',  // 시안 (I)
    '#FFFF00',  // 노랑 (O)
    '#FF00FF',  // 마젠타 (T)
    '#00FF00',  // 녹색 (S)
    '#FF0000',  // 빨강 (Z)
    '#0000FF',  // 파랑 (J)
    '#FFA500'   // 주황 (L)
];

// 테트리스 블록 모양들
const PIECES = [
    // I 모양 (긴 막대기)
    [[1, 1, 1, 1]],

    // O 모양 (정사각형)
    [[2, 2],
     [2, 2]],

    // T 모양
    [[0, 3, 0],
     [3, 3, 3]],

    // S 모양
    [[0, 4, 4],
     [4, 4, 0]],

    // Z 모양
    [[5, 5, 0],
     [0, 5, 5]],

    // J 모양
    [[6, 0, 0],
     [6, 6, 6]],

    // L 모양
    [[0, 0, 7],
     [7, 7, 7]]
];

// 게임판 그리기
function drawBoard() {
    // 배경을 검은색으로 칠하기
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 게임판의 각 칸 그리기
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x]) {
                // 블록이 있는 칸은 색깔로 칠하기
                ctx.fillStyle = COLORS[board[y][x]];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        }
    }
}

// 현재 블록 그리기
function drawPiece() {
    if (!currentPiece) return;

    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x]) {
                ctx.fillStyle = COLORS[currentPiece[y][x]];
                ctx.fillRect(
                    (currentX + x) * BLOCK_SIZE,
                    (currentY + y) * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        }
    }
}

// 새로운 블록 만들기
function newPiece() {
    const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
    currentPiece = piece;
    currentX = Math.floor((BOARD_WIDTH - piece[0].length) / 2);
    currentY = 0;

    // 새 블록을 놓을 수 없으면 게임 오버
    if (collision()) {
        gameOver();
    }
}

// 충돌 검사 (블록이 벽이나 다른 블록에 부딪히는지)
function collision(newX = currentX, newY = currentY, newPiece = currentPiece) {
    for (let y = 0; y < newPiece.length; y++) {
        for (let x = 0; x < newPiece[y].length; x++) {
            if (newPiece[y][x]) {
                const boardX = newX + x;
                const boardY = newY + y;

                // 벽 밖으로 나가는지 체크
                if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                    return true;
                }

                // 바닥에 닿았거나 다른 블록과 부딪히는지 체크
                if (boardY >= 0 && board[boardY][boardX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 블록을 게임판에 고정시키기
function merge() {
    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x]) {
                board[currentY + y][currentX + x] = currentPiece[y][x];
            }
        }
    }
}

// 블록 회전하기
function rotate() {
    const newPiece = [];
    const N = currentPiece.length;
    const M = currentPiece[0].length;

    // 90도 회전
    for (let x = 0; x < M; x++) {
        newPiece[x] = [];
        for (let y = N - 1; y >= 0; y--) {
            newPiece[x][N - 1 - y] = currentPiece[y][x];
        }
    }

    // 회전한 블록이 벽에 부딪히지 않으면 회전 적용
    if (!collision(currentX, currentY, newPiece)) {
        currentPiece = newPiece;
    }
}

// 꽉 찬 줄 제거하기
function removeLines() {
    let linesRemoved = 0;

    // 아래부터 위로 검사
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        let isFull = true;

        // 한 줄이 꽉 찼는지 확인
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (!board[y][x]) {
                isFull = false;
                break;
            }
        }

        // 꽉 찬 줄이 있으면 제거
        if (isFull) {
            board.splice(y, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesRemoved++;
            y++; // 다시 같은 줄 검사
        }
    }

    // 점수 계산
    if (linesRemoved > 0) {
        lines += linesRemoved;
        score += linesRemoved * 100 * level;

        // 레벨 올리기 (10줄마다)
        level = Math.floor(lines / 10) + 1;

        // 화면에 표시
        updateScore();
    }
}

// 점수 화면에 표시하기
function updateScore() {
    // 아케이드 스타일 점수 표시 (000000 형식)
    document.getElementById('score').textContent = String(score).padStart(6, '0');
    document.getElementById('level').textContent = String(level).padStart(2, '0');
    document.getElementById('lines').textContent = String(lines).padStart(3, '0');
}

// 블록 아래로 이동
function moveDown() {
    if (!collision(currentX, currentY + 1)) {
        currentY++;
    } else {
        // 블록이 바닥에 닿으면 고정
        merge();
        removeLines();
        newPiece();
    }
}

// 블록 왼쪽 이동
function moveLeft() {
    if (!collision(currentX - 1, currentY)) {
        currentX--;
    }
}

// 블록 오른쪽 이동
function moveRight() {
    if (!collision(currentX + 1, currentY)) {
        currentX++;
    }
}

// 블록 한번에 떨어뜨리기
function drop() {
    while (!collision(currentX, currentY + 1)) {
        currentY++;
    }
    merge();
    removeLines();
    newPiece();
}

// 키보드 입력 처리
document.addEventListener('keydown', (e) => {
    if (!gameRunning || gamePaused) return;

    switch (e.key) {
        case 'ArrowLeft':   // 왼쪽 화살표
            moveLeft();
            break;
        case 'ArrowRight':  // 오른쪽 화살표
            moveRight();
            break;
        case 'ArrowDown':   // 아래 화살표
            moveDown();
            score += 1;  // 빨리 내리면 보너스 점수
            updateScore();
            break;
        case 'ArrowUp':     // 위 화살표
            rotate();
            break;
        case ' ':           // 스페이스바
            drop();
            break;
    }

    draw();
});

// 게임 화면 그리기
function draw() {
    drawBoard();
    drawPiece();
}

// 게임 업데이트 (일정 시간마다 블록 아래로)
function update() {
    if (!gameRunning || gamePaused) return;

    moveDown();
    draw();
}

// 게임 시작
function startGame() {
    // 게임판 초기화
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            board[y][x] = 0;
        }
    }

    // 점수 초기화
    score = 0;
    level = 1;
    lines = 0;
    updateScore();

    // 게임 시작
    gameRunning = true;
    gamePaused = false;

    // 첫 블록 만들기
    newPiece();

    // 게임 루프 시작 (레벨에 따라 속도 조절)
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 1000 - (level - 1) * 50);

    draw();
}

// 게임 멈춤/계속
function pauseGame() {
    if (!gameRunning) return;

    gamePaused = !gamePaused;
    const pauseBtn = document.getElementById('pauseBtn');

    if (gamePaused) {
        pauseBtn.innerHTML = '<span class="btn-icon">▶</span><span class="btn-text">RESUME</span>';
    } else {
        pauseBtn.innerHTML = '<span class="btn-icon">⏸</span><span class="btn-text">PAUSE</span>';
    }
}

// 게임 오버
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);

    // 게임 오버 메시지
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff00';
    ctx.font = '30px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '20px "Courier New"';
    ctx.fillText('SCORE: ' + score, canvas.width / 2, canvas.height / 2 + 20);

    alert('GAME OVER! SCORE: ' + score);
}

// 처음 화면 그리기
draw();

// 모바일 터치 컨트롤 버튼 이벤트
document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning && !gamePaused) {
        moveLeft();
        draw();
    }
});

document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning && !gamePaused) {
        moveRight();
        draw();
    }
});

document.getElementById('downBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning && !gamePaused) {
        moveDown();
        score += 1;
        updateScore();
        draw();
    }
});

document.getElementById('rotateBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning && !gamePaused) {
        rotate();
        draw();
    }
});

document.getElementById('dropBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning && !gamePaused) {
        drop();
        draw();
    }
});

// 마우스 클릭도 지원
document.getElementById('leftBtn').addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        moveLeft();
        draw();
    }
});

document.getElementById('rightBtn').addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        moveRight();
        draw();
    }
});

document.getElementById('downBtn').addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        moveDown();
        score += 1;
        updateScore();
        draw();
    }
});

document.getElementById('rotateBtn').addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        rotate();
        draw();
    }
});

document.getElementById('dropBtn').addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        drop();
        draw();
    }
});

// 화면 크기 변경시 캔버스 크기 재조정
window.addEventListener('resize', () => {
    BLOCK_SIZE = setCanvasSize();
    draw();
});
