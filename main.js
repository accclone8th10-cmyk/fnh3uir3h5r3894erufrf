const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ==========================================
// 1. CẤU HÌNH HỆ THỐNG & THẾ GIỚI
// ==========================================
const WORLD = {
    width: 2000,
    height: 2000,
    baseRate: 10
};

const LINH_CAN_MULT = 1.7; // Thiên Linh Căn
const realms = [
    { name: "Luyện Khí", need: 100, absorb: 1.0, color: "#4facfe" },
    { name: "Trúc Cơ", need: 500, absorb: 1.3, color: "#00ff88" },
    { name: "Kim Đan", need: 2000, absorb: 1.8, color: "#f6d365" }
];

// Load ảnh bản đồ (Đảm bảo file map.png nằm cùng thư mục trên GitHub)
const mapImg = new Image();
mapImg.src = 'map.png'; 

// ==========================================
// 2. KHỞI TẠO NHÂN VẬT & CAMERA
// ==========================================
let player = {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    size: 36,
    speed: 250,
    linhKhi: 0,
    realm: 0,
    angle: 0,
    state: "idle" // idle | move | cultivate
};

const camera = { x: 0, y: 0 };
const keys = {};

// ==========================================
// 3. XỬ LÝ SỰ KIỆN (INPUT)
// ==========================================
window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.code === "Space") tryBreakthrough();
});
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// Click chuột để ngồi thiền
canvas.addEventListener("mousedown", () => {
    if (player.state !== "move") player.state = "cultivate";
});
canvas.addEventListener("mouseup", () => {
    if (player.state === "cultivate") player.state = "idle";
});

// ==========================================
// 4. LOGIC GAME
// ==========================================
function update(dt) {
    // Di chuyển
    let dx = 0, dy = 0;
    if (keys["w"]) dy--; if (keys["s"]) dy++;
    if (keys["a"]) dx--; if (keys["d"]) dx++;

    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        player.x = Math.max(0, Math.min(WORLD.width, player.x + (dx / len) * player.speed * dt));
        player.y = Math.max(0, Math.min(WORLD.height, player.y + (dy / len) * player.speed * dt));
        player.state = "move";
    } else if (player.state !== "cultivate") {
        player.state = "idle";
    }

    // Tu luyện
    const realm = realms[player.realm] || realms[realms.length - 1];
    let gain = 0;
    if (player.state === "cultivate") {
        gain = WORLD.baseRate * LINH_CAN_MULT * realm.absorb * 2; // Bonus x2 khi thiền
    } else {
        gain = WORLD.baseRate * LINH_CAN_MULT * realm.absorb * 0.2; // Tu bị động
    }
    player.linhKhi += dt * gain;
    player.angle += dt * (player.state === "cultivate" ? 3 : 1);

    // Cập nhật Camera (Giữ nhân vật ở giữa màn hình)
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    updateUI(gain, realm);
}

function updateUI(gain, realm) {
    document.getElementById("level-display").innerText = `Cảnh giới: ${realm.name}`;
    document.getElementById("spirit-count").innerText = Math.floor(player.linhKhi);
    document.getElementById("speed-tag").innerText = `Linh tốc: +${gain.toFixed(1)}/s`;
    document.getElementById("progress").style.width = Math.min((player.linhKhi / realm.need) * 100, 100) + "%";
}

function tryBreakthrough() {
    const realm = realms[player.realm];
    if (realm && player.linhKhi >= realm.need) {
        player.linhKhi = 0;
        player.realm++;
        // Hiệu ứng lóe sáng
        canvas.style.filter = "brightness(2)";
        setTimeout(() => canvas.style.filter = "brightness(1)", 150);
    }
}

// ==========================================
// 5. VẼ ĐỒ HỌA
// ==========================================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const realm = realms[player.realm] || realms[realms.length - 1];

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Vẽ Bản đồ (Ảnh map.png)
    if (mapImg.complete) {
        ctx.drawImage(mapImg, 0, 0, WORLD.width, WORLD.height);
    } else {
        // Nếu ảnh chưa load thì vẽ nền tạm
        ctx.fillStyle = "#1a2635";
        ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    }

    // Vẽ nhân vật
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Aura xoay
    ctx.rotate(player.angle);
    ctx.strokeStyle = realm.color;
    ctx.lineWidth = 2;
    ctx.setLineDash(player.state === "cultivate" ? [] : [5, 10]);
    ctx.strokeRect(-player.size/2 - 5, -player.size/2 - 5, player.size + 10, player.size + 10);
    
    // Body nhân vật
    ctx.rotate(-player.angle * 1.5);
    ctx.fillStyle = "white";
    ctx.shadowBlur = 15;
    ctx.shadowColor = realm.color;
    ctx.fillRect(-player.size/2, -player.size/2, player.size, player.size);
    ctx.restore();

    ctx.restore();
}

// ==========================================
// 6. VÒNG LẶP GAME (GAME LOOP)
// ==========================================
let lastTime = 0;
function loop(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    if (dt < 0.1) { 
        update(dt);
        draw();
    }
    requestAnimationFrame(loop);
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
requestAnimationFrame(loop);
window.addEventListener('mousedown', () => { window.focus(); });
