const screenW = 840; 
const screenH = 840;
const cardW = 340;   
const cardH = 430;
const imgSize = 340;

const ambientCanvas = document.getElementById('ambientCanvas');
const ambientCtx = ambientCanvas.getContext('2d');
ambientCtx.imageSmoothingEnabled = false; 

const AMBER_BACK = '#1a1206'; 
const AMBER_TINT = '#ff8c00'; 

const vidBuffer = document.createElement('canvas');
vidBuffer.width = cardW; vidBuffer.height = cardH;
const vidCtx = vidBuffer.getContext('2d');

// Strict Data-Driven Media Database Queue 
let mediaQueue = [
    { src: 'images/vid1.mp4', title: 'TRAIN WINDOW', type: 'video' },
    { src: 'images/img1.jpg', title: 'CITY SKYLINE', type: 'image' },
    { src: 'images/img2.jpg', title: 'DESK SETUP', type: 'image' },
    { src: 'images/img3.jpg', title: 'LAKE VACATION', type: 'image' },
    { src: 'images/img4.jpg', title: 'TICKET STUB', type: 'image' },
    { src: 'images/img5.jpg', title: 'COFFEE SHOP', type: 'image' },
    { src: 'images/img6.jpg', title: 'FAVORITE MEAL', type: 'image' },
    { src: 'images/img7.jpg', title: 'ROAD TRIP', type: 'image' },
    { src: 'images/img8.jpg', title: 'FRIENDS', type: 'image' },
    { src: 'images/img9.jpg', title: 'WIKASITHA PEM', type: 'image' }
];

let items = [];
let appState = 'IDLE'; 
let focusTargetIndex = -1;
let focusProgress = 0; 
let shufflePhase = 0; 

let hardwareInteractionEnabled = false;
let audioEnabled = false; 

const sfxVolumes = {
    'boot': 0.6,
    'greet': 0.5,
    'glitch': 0.7,
    'click': 0.8,
    'type': 0.3
};

function unlockAudio() {
    if (audioEnabled) return;
    audioEnabled = true;

    ['greet', 'type', 'glitch', 'click'].forEach(id => {
        let aud = document.getElementById('sfx-'+id);
        if(aud) {
            let origVol = sfxVolumes[id] || 0.5;
            aud.volume = 0; 
            let p = aud.play();
            if (p !== undefined) {
                p.then(() => {
                    aud.pause();
                    aud.currentTime = 0;
                    aud.volume = origVol;
                }).catch(e => console.warn(`[Audio Core] Native hardware skip - ${id}`));
            }
        }
    });
}

function playSfx(id, durationMs = null) {
    if (!audioEnabled) return;
    
    const sound = document.getElementById('sfx-' + id);
    if(sound) {
        sound.volume = sfxVolumes[id] || 1.0;
        sound.currentTime = 0; 
        
        let p = sound.play();
        if (p !== undefined) {
            p.then(() => {
                if (durationMs) {
                    setTimeout(() => {
                        sound.pause();
                        sound.currentTime = 0;
                    }, durationMs);
                }
            }).catch(e => console.warn(`[Audio ERR] Blocked playback: ${id}`));
        }
    }
}

function playTypeSound() {
    if (!audioEnabled) return;
    
    const sound = document.getElementById('sfx-type');
    if (sound) {
        sound.volume = sfxVolumes['type'] || 0.3;
        sound.currentTime = 0; 
        sound.play().catch(e => {}); 
        setTimeout(() => {
            sound.pause();
            sound.currentTime = 0;
        }, 45);
    }
}

function stopSfx(id) {
    const sound = document.getElementById('sfx-' + id);
    if(sound) {
        sound.pause();
    }
}

async function typeText(text, element) {
    element.innerText = "";
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        element.innerText += char;
        if (char !== " ") {
            playTypeSound();
        }
        await new Promise(resolve => setTimeout(resolve, 70 + Math.random() * 20)); 
    }
}

async function runCinematicBoot() {
    const overlay = document.getElementById('bootSequence');
    const step1 = document.getElementById('bootStep1');
    const step2 = document.getElementById('bootStep2');
    const glitch = document.getElementById('glitchFX');
    const hardwareBtn = document.getElementById('actionBtn');

    const bootL1 = document.getElementById('bootLine1');
    const bootL2 = document.getElementById('bootLine2');
    const greetLine = document.getElementById('greetLine');

    overlay.classList.remove('hidden');

    playSfx('boot');
    document.getElementById('sfx-boot').volume = sfxVolumes['boot']; 

    bootL1.classList.add('typed-cursor');
    await typeText("INITIALIZING MEMORY...", bootL1);
    bootL1.classList.remove('typed-cursor');
    
    await new Promise(r => setTimeout(r, 600));

    bootL2.classList.add('typed-cursor');
    await typeText("LOADING MODULES...", bootL2);
    
    await new Promise(r => setTimeout(r, 4000));

    step1.classList.add('hidden');
    step2.classList.remove('hidden');
    
    stopSfx('boot');
    playSfx('greet');

    greetLine.classList.add('typed-cursor');
    await typeText("HELLO LAKSHAN", greetLine);
    
    await new Promise(r => setTimeout(r, 4000));

    stopSfx('greet');
    greetLine.classList.remove('typed-cursor'); 
    
    glitch.classList.remove('hidden');
    glitch.classList.add('glitch-active');
    overlay.classList.add('glitch-screen-effect');
    
    playSfx('glitch');

    await new Promise(r => setTimeout(r, 2000));
    overlay.style.opacity = '0';
    
    await new Promise(r => setTimeout(r, 2000));
    
    stopSfx('glitch');
    overlay.classList.add('hidden');
    hardwareBtn.style.opacity = '1';
    hardwareBtn.style.pointerEvents = 'auto'; 
    hardwareInteractionEnabled = true;
}

function startSystem() {
    const pw = document.getElementById('powerWall');
    if (pw.classList.contains('hidden')) return; 

    pw.classList.add('hidden');

    unlockAudio(); 
    console.log("[System] Powering sequence initialized...");

    runCinematicBoot();
    loadMedia();
}

document.getElementById('powerWall').addEventListener('click', startSystem, { once: true });

function loadMedia() {
    let promises = mediaQueue.map(m => {
        return new Promise((resolve) => {
            if (m.type === 'image') {
                let img = new Image();
                img.src = m.src;
                img.onload = () => resolve({ ...m, element: img, loaded: true });
                img.onerror = () => resolve({ ...m, loaded: false });
            } else {
                let vid = document.createElement('video');
                vid.src = m.src; vid.muted = true; vid.loop = true; vid.playsInline = true;
                vid.oncanplay = () => { vid.oncanplay = null; resolve({ ...m, element: vid, loaded: true }); };
                vid.onerror = () => resolve({ ...m, loaded: false });
                setTimeout(() => resolve({ ...m, loaded: false }), 2000); 
            }
        });
    });

    Promise.all(promises).then(results => {
        let valid = results.filter(r => r.loaded).slice(0, 9);
        
        valid.forEach(m => {
            if (m.type === 'image') m.cardCanvas = createStaticCard(m.element, m.title);
        });

        items = valid.map((m, i) => {
            return {
                id: i, media: m,
                x: screenW/2, y: screenH/2, rot: 0,
                targetX: screenW/2, targetY: screenH/2, targetRot: 0,
                sineOffset: Math.random() * 100 
            };
        });

        assignGridPositions();
        items.forEach(item => { item.x = item.targetX; item.y = item.targetY; item.rot = item.targetRot; });

        requestAnimationFrame(renderLoop);
    });
}

function createStaticCard(img, title) {
    let c = document.createElement('canvas');
    c.width = cardW; c.height = cardH;
    let ctx = c.getContext('2d');
    
    // Fill image bg
    ctx.fillStyle = AMBER_BACK;
    ctx.fillRect(0,0,cardW,imgSize);
    
    // Apply retro falipper monochrome amber tint
    ctx.filter = 'grayscale(1) sepia(1) hue-rotate(-25deg) saturate(4) contrast(150%)';
    
    let scale = Math.max(imgSize / img.naturalWidth, imgSize / img.naturalHeight);
    let dw = img.naturalWidth * scale;
    let dh = img.naturalHeight * scale;
    let dx = (imgSize - dw)/2;
    let dy = (imgSize - dh)/2;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    
    // Title bar - bold solid amber block
    ctx.fillStyle = AMBER_TINT;
    ctx.fillRect(0, imgSize, cardW, cardH - imgSize);
    
    // Explicit UI hierarchy rules: Black Pure Title Control Typography
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px monospace';
    if (ctx.letterSpacing !== undefined) {
        ctx.letterSpacing = '2px';
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.toUpperCase(), cardW/2, imgSize + 45);

    // Inner subtle drop-shadow banding replicating inset CRT box-shadow limits
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeRect(3, 3, cardW - 6, cardH - 6);

    // Hardware Black Outward Casing
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, cardW, cardH);

    return c;
}

function assignGridPositions() {
    const cols = Math.ceil(Math.sqrt(items.length));
    const cellW = screenW / cols;
    const cellH = screenH / cols;
    let slots = items.map((_, i) => i).sort(() => Math.random() - 0.5);
    
    items.forEach((item, i) => {
        const slot = slots[i];
        const row = Math.floor(slot / cols);
        const col = slot % cols;
        const baseX = (col * cellW) + (cellW/2);
        const baseY = (row * cellH) + (cellH/2);
        item.targetX = baseX + (Math.random() * 40 - 20); 
        item.targetY = baseY + (Math.random() * 40 - 20);
        item.targetRot = (Math.random() * 10 - 5) * (Math.PI / 180);
    });
}

const triggerInteraction = () => {
    if (!hardwareInteractionEnabled) return;

    playSfx('click');

    if (appState === 'IDLE') {
        appState = 'SHUFFLING';
        shufflePhase = 0;
    } else if (appState === 'FOCUSED') {
        appState = 'TRANSITIONS_TO_IDLE';
        let focusedItem = items[focusTargetIndex];
        if (focusedItem.media.type === 'video') focusedItem.media.element.pause();
        assignGridPositions(); 
    }
};

document.addEventListener('keydown', (e) => { 
    if (e.code === 'Space') { 
        if (!audioEnabled || !hardwareInteractionEnabled) {
            startSystem(); 
        } else {
            triggerInteraction();
        }
        e.preventDefault(); 
    }
});

document.getElementById('actionBtn').addEventListener('mousedown', triggerInteraction);

let time = 0;
function lerp(start, end, factor) { return start + (end - start) * factor; }

function renderLoop() {
    ambientCtx.globalCompositeOperation = 'source-over';
    ambientCtx.fillStyle = AMBER_BACK;
    ambientCtx.fillRect(0, 0, screenW, screenH);
    time += 0.02;

    if (appState === 'SHUFFLING') {
        shufflePhase += 0.015; 
        if (shufflePhase < 1) {
            items.forEach(item => {
                if (shufflePhase < 0.5) {
                    const easeIn = shufflePhase * 2;
                    item.x = lerp(item.x, screenW/2, easeIn * 0.08);
                    item.y = lerp(item.y, screenH/2, easeIn * 0.08);
                    item.rot = lerp(item.rot, 0, easeIn * 0.08);
                } else {
                    const easeOut = (shufflePhase - 0.5) * 2;
                    if (Math.abs(shufflePhase - 0.5) < 0.01) assignGridPositions(); 
                    item.x = lerp(item.x, item.targetX, easeOut * 0.08);
                    item.y = lerp(item.y, item.targetY, easeOut * 0.08);
                    item.rot = lerp(item.rot, item.targetRot, easeOut * 0.08);
                }
            });
        } else {
            appState = 'TRANSITION_TO_FOCUS';
            shufflePhase = 1; focusProgress = 0;
            focusTargetIndex = Math.floor(Math.random() * items.length);
            
            // Screen flash effect
            const flash = document.getElementById('flashOverlay');
            if(flash) {
                flash.classList.remove('flash-active');
                void flash.offsetWidth; // force css reflow trigger
                flash.classList.add('flash-active');
            }

            let focusedItem = items[focusTargetIndex];
            if (focusedItem.media.type === 'video') focusedItem.media.element.play();
        }
    } else if (appState === 'TRANSITION_TO_FOCUS') {
        focusProgress += 0.03;
        if (focusProgress >= 1) { focusProgress = 1; appState = 'FOCUSED'; }
    } else if (appState === 'TRANSITIONS_TO_IDLE') {
        focusProgress -= 0.04;
        if (focusProgress <= 0) { focusProgress = 0; appState = 'IDLE'; }
    } else if (appState === 'IDLE') {
        items.forEach(item => {
            item.x = lerp(item.x, item.targetX, 0.05);
            item.y = lerp(item.y, item.targetY, 0.05);
            item.rot = lerp(item.rot, item.targetRot, 0.05);
        });
    }

    const baseScale = 0.5;

    items.forEach((item, i) => {
        let drawX = item.x + Math.sin(time + item.sineOffset) * 4;
        let drawY = item.y + Math.cos(time + item.sineOffset) * 4;
        let drawRot = item.rot;
        let scale = baseScale;
        let alpha = 1;

        if (appState === 'TRANSITION_TO_FOCUS' || appState === 'FOCUSED' || appState === 'TRANSITIONS_TO_IDLE') {
            if (i === focusTargetIndex) {
                const fullScale = 2.0; 
                drawX = lerp(drawX, screenW / 2, focusProgress);
                drawY = lerp(drawY, screenH / 2, focusProgress);
                drawRot = lerp(drawRot, 0, focusProgress);
                scale = lerp(baseScale, fullScale, focusProgress);
            } else {
                alpha = 1 - focusProgress;
                drawY += (drawY > screenH/2 ? 100 : -100) * focusProgress;
            }
        }

        if (alpha <= 0) return;

        ambientCtx.save();
        ambientCtx.globalAlpha = alpha;
        ambientCtx.translate(drawX, drawY);
        ambientCtx.rotate(drawRot);
        ambientCtx.scale(scale, scale);

        ambientCtx.globalCompositeOperation = 'source-over';

        // Bind interactive feedback directly to rendering canvas context during Focus frames
        if (i === focusTargetIndex && focusProgress > 0) {
            ambientCtx.filter = `brightness(${1 + (focusProgress * 0.4)})`;
        }

        if (item.media.type === 'image') {
            ambientCtx.drawImage(item.media.cardCanvas, -cardW/2, -cardH/2);
        } else {
            vidCtx.globalCompositeOperation = 'source-over';
            vidCtx.fillStyle = AMBER_BACK;
            vidCtx.fillRect(0, 0, cardW, imgSize);
            
            let vid = item.media.element;
            vidCtx.save();
            vidCtx.beginPath();
            vidCtx.rect(0, 0, imgSize, imgSize);
            vidCtx.clip(); 
            
            vidCtx.filter = 'grayscale(1) sepia(1) hue-rotate(-25deg) saturate(4) contrast(150%)';
            let vScale = Math.max(imgSize / vid.videoWidth, imgSize / vid.videoHeight);
            let dw = vid.videoWidth * vScale;
            let dh = vid.videoHeight * vScale;
            vidCtx.drawImage(vid, (imgSize-dw)/2, (imgSize-dh)/2, dw, dh);
            vidCtx.restore();

            vidCtx.fillStyle = AMBER_TINT;
            vidCtx.fillRect(0, imgSize, cardW, cardH - imgSize);
            
            vidCtx.fillStyle = '#000000';
            vidCtx.font = 'bold 36px monospace';
            if (vidCtx.letterSpacing !== undefined) { vidCtx.letterSpacing = '2px'; }
            vidCtx.textAlign = 'center';
            vidCtx.textBaseline = 'middle';
            vidCtx.fillText(item.media.title.toUpperCase(), cardW/2, imgSize + 45);

            vidCtx.lineWidth = 6;
            vidCtx.strokeStyle = 'rgba(0,0,0,0.5)';
            vidCtx.strokeRect(3, 3, cardW - 6, cardH - 6);

            vidCtx.lineWidth = 4;
            vidCtx.strokeStyle = '#000000';
            vidCtx.strokeRect(0, 0, cardW, cardH);
            
            ambientCtx.drawImage(vidBuffer, -cardW/2, -cardH/2);
        }

        ambientCtx.restore();
    });

    requestAnimationFrame(renderLoop);
}
