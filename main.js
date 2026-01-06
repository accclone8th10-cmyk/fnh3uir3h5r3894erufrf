const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Cấu hình ảnh (Bạn hãy đảm bảo file này tồn tại trong thư mục)
const mapImg = new Image();
mapImg.src = 'the-gioi.jpg'; 

const realms = [
    { name: "Luyện Khí", need: 100, absorb: 1, color: "#4facfe", atk: 20 },
    { name: "Trúc Cơ", need: 600, absorb: 2.2, color: "#00ff88", atk: 55 },
    { name: "Kim Đan", need: 2500, absorb: 4.5, color: "#f6d365", atk: 120 }
];

let player = {
    x: 0, y: 0, size: 40, speed: 280,
    linhKhi: 0, realm: 0, hp: 100, maxHp: 100,
    state: "idle"
};

let currentMode = "BE_QUAN";
let mobs = [];
let bullets = []; 
const keys = {};

// 1. CHUYỂN CHẾ ĐỘ
function switchMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;

    // Cập nhật giao diện nút
    document.getElementById('tab-be-quan').classList.toggle('active', mode === 'BE_QUAN');
    document.getElementById('tab-hanh-tau').classList.toggle('active', mode === 'HANH_TAU');
    document.getElementById('display-state').innerText = (mode === 'BE_QUAN' ? "Đang tọa thiền" : "Đang hành tẩu");

    // Reset vị trí & hiệu ứng
    player.x = (mode === 'BE_QUAN') ? canvas.width/2 : 1000;
    player.y = (mode === 'BE_QUAN') ? canvas.height/2 : 1000;
    
    if (mode === "HANH_TAU") { 
        mobs = []; for(let i=0; i<12; i++) spawnMob(); 
    } else mobs = [];
    
    canvas.style.filter = "brightness(2)";
    setTimeout(() => canvas.style.filter = "brightness(1)", 200);
}

function spawnMob() {
    mobs.push({
        x: Math.random() * 2000, y: Math.random() * 2000,
        hp: 60 + player.realm * 100, maxHp: 60 + player.realm * 100,
        size: 30, speed: 100 + Math.random() * 50
    });
}

// 2. XỬ LÝ CHIÊU THỨC (CLICK CHUỘT)
canvas.addEventListener("mousedown", (e) => {
    if (currentMode === "HANH_TAU") {
        const rect = canvas.getBoundingClientRect();
        // Tính hướng bắn dựa trên trung tâm màn hình (vị trí người chơi)
        const angle = Math.atan2(e.clientY - canvas.height/2, e.clientX - canvas.width/2);
        bullets.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * 1000, vy: Math.sin(angle) * 1000,
            life: 50
        });
    }
});

function update(dt) {
    // Di chuyển
    let dx = 0, dy = 0;
    if (keys["w"]) dy--; if (keys["s"]) dy++;
    if (keys["a"]) dx--; if (keys["d"]) dx++;

    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        player.x += (dx/len) * player.speed * dt;
        player.y += (dy/len) * player.speed * dt;
    }

    // Logic vệt sáng
    bullets.forEach((b, i) => {
        b.x += b.vx * dt; b.y += b.vy * dt; b.life--;
        if (b.life <= 0) bullets.splice(i, 1);

        mobs.forEach((m, mi) => {
            if (Math.hypot(b.x - m.x, b.y - m.y) < m.size) {
                m.hp -= realms[player.realm].atk;
                bullets.splice(i, 1);
                if (m.hp <= 0) { mobs.splice(mi, 1); player.linhKhi += 30; spawnMob(); }
            }
        });
    });

    // Linh khí & UI
    let modeMult = (currentMode === "BE_QUAN") ? 6.0 : 0.5;
    let gain = realms[player.realm].absorb * 15 * modeMult;
    player.linhKhi += gain * dt;
    
    // Hồi máu khi bế quan
    if (currentMode === "BE_QUAN" && player.hp < player.maxHp) player.hp += 5 * dt;

    updateUI(gain);
}

function updateUI(gain) {
    const r = realms[player.realm];
    document.getElementById("display-realm").innerText = r.name;
    document.getElementById("progress-bar").style.width = Math.min(100, (player.linhKhi/r.need)*100) + "%";
    document.getElementById("hp-bar").style.width = Math.max(0, (player.hp/player.maxHp)*100) + "%";
    document.getElementById("speed-tag").innerText = `Tốc độ nạp: +${gain.toFixed(1)}/s`;
}

function tryBreakthrough() {
    if (player.linhKhi >= realms[player.realm].need) {
        player.linhKhi = 0;
        player.realm = Math.min(player.realm + 1, realms.length - 1);
        player.maxHp += 100; player.hp = player.maxHp;
    }
}

window.addEventListener("keydown", e => { 
    keys[e.key.toLowerCase()] = true; 
    if(e.code === "Space") tryBreakthrough(); 
});
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// 3. VẼ ĐỒ HỌA
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Camera đuổi theo ở chế độ Hành Tẩu
    if (currentMode === "HANH_TAU") {
        ctx.translate(-player.x + canvas.width/2, -player.y + canvas.height/2);
        if (mapImg.complete) ctx.drawImage(mapImg, 0, 0, 2000, 2000);
        else { ctx.fillStyle = "#1a2635"; ctx.fillRect(0, 0, 2000, 2000); }
    } else {
        // Vẽ Động Phủ (Nền tối + Trận pháp)
        ctx.fillStyle = "#050a0f"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = realms[player.realm].color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 100 + Math.sin(Date.now()/200)*5, 0, Math.PI*2);
        ctx.stroke();
    }

    // Vẽ Vệt sáng chiêu thức
    bullets.forEach(b => {
        ctx.shadowBlur = 10; ctx.shadowColor = realms[player.realm].color;
        ctx.strokeStyle = "white"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.vx*0.04, b.y - b.vy*0.04); ctx.stroke();
        ctx.shadowBlur = 0;
    });

    // Vẽ Quái (Đốm đỏ)
    mobs.forEach(m => {
        ctx.fillStyle = "#ff4757";
        ctx.beginPath(); ctx.arc(m.x, m.y, m.size, 0, Math.PI*2); ctx.fill();
    });

    // Vẽ Nhân vật (Hình vuông đại diện)
    ctx.fillStyle = "white";
    ctx.shadowBlur = 15; ctx.shadowColor = realms[player.realm].color;
    ctx.fillRect(player.x - 20, player.y - 20, 40, 40);
    ctx.restore();

    requestAnimationFrame(draw);
}

// Khởi động
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
});
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
setInterval(() => update(1/60), 1000/60);
draw();
