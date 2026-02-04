/**
 * Stack & Crack - Система частиц и эффектов
 * Canvas-based particle effects for explosions and lightning
 */

const ParticleEffects = {
    canvas: null,
    ctx: null,
    particles: [],
    lightnings: [],
    animationId: null,
    isRunning: false,
    
    // Цветовая палитра
    colors: {
        cyan: '#00F3FF',
        magenta: '#FF00E6',
        red: '#FF005C',
        yellow: '#FFE135',
        white: '#FFFFFF'
    },
    
    /**
     * Инициализация canvas
     */
    init() {
        this.canvas = document.getElementById('effects-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        this.startLoop();
    },
    
    /**
     * Адаптация canvas под размер экрана
     */
    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.scale(dpr, dpr);
    },
    
    /**
     * Запуск цикла анимации
     */
    startLoop() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    },
    
    /**
     * Основной цикл анимации
     */
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Обновляем и рисуем частицы
        this.updateParticles();
        this.drawParticles();
        
        // Обновляем и рисуем молнии
        this.updateLightnings();
        this.drawLightnings();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    },
    
    /**
     * Создание взрыва частиц
     */
    explode(x, y, color = this.colors.cyan, count = 30) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 6;
            const size = 3 + Math.random() * 5;
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color,
                alpha: 1,
                decay: 0.02 + Math.random() * 0.02,
                gravity: 0.1,
                type: 'circle'
            });
        }
        
        // Добавляем несколько квадратных "осколков"
        for (let i = 0; i < count / 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 4;
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 6,
                color,
                alpha: 1,
                decay: 0.015 + Math.random() * 0.02,
                gravity: 0.15,
                rotation: Math.random() * Math.PI,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                type: 'square'
            });
        }
        
        // Добавляем светящиеся точки
        for (let i = 0; i < count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                color: this.colors.white,
                alpha: 1,
                decay: 0.03 + Math.random() * 0.02,
                gravity: 0.05,
                type: 'glow'
            });
        }
    },
    
    /**
     * Создание эффекта молнии
     */
    lightning(x1, y1, x2, y2) {
        const segments = [];
        const steps = 15;
        const offset = 30;
        
        let prevX = x1;
        let prevY = y1;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            let x = x1 + (x2 - x1) * t;
            let y = y1 + (y2 - y1) * t;
            
            // Добавляем случайное смещение
            if (i > 0 && i < steps) {
                x += (Math.random() - 0.5) * offset;
            }
            
            segments.push({ x1: prevX, y1: prevY, x2: x, y2: y });
            prevX = x;
            prevY = y;
        }
        
        this.lightnings.push({
            segments,
            alpha: 1,
            decay: 0.05,
            color: this.colors.yellow,
            width: 3
        });
        
        // Добавляем ответвления
        for (let i = 0; i < 5; i++) {
            const startIdx = Math.floor(Math.random() * segments.length);
            const start = segments[startIdx];
            const branchLength = 20 + Math.random() * 40;
            const angle = Math.random() * Math.PI - Math.PI / 2;
            
            const branchSegments = [{
                x1: start.x2,
                y1: start.y2,
                x2: start.x2 + Math.cos(angle) * branchLength,
                y2: start.y2 + Math.sin(angle) * branchLength
            }];
            
            this.lightnings.push({
                segments: branchSegments,
                alpha: 0.7,
                decay: 0.08,
                color: this.colors.yellow,
                width: 1.5
            });
        }
        
        // Добавляем частицы вдоль молнии
        segments.forEach(seg => {
            if (Math.random() > 0.7) {
                this.particles.push({
                    x: seg.x2,
                    y: seg.y2,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: 2 + Math.random() * 3,
                    color: this.colors.yellow,
                    alpha: 1,
                    decay: 0.05,
                    gravity: 0,
                    type: 'glow'
                });
            }
        });
    },
    
    /**
     * Создание искр
     */
    sparks(x, y, color = this.colors.cyan, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 1 + Math.random() * 2,
                color,
                alpha: 1,
                decay: 0.02 + Math.random() * 0.02,
                gravity: 0.1,
                type: 'spark',
                trail: []
            });
        }
    },
    
    /**
     * Создание эффекта числа (при получении очков)
     */
    scorePopup(x, y, text, color = this.colors.cyan) {
        this.particles.push({
            x,
            y,
            vx: 0,
            vy: -2,
            size: 20,
            color,
            alpha: 1,
            decay: 0.02,
            gravity: 0,
            type: 'text',
            text
        });
    },
    
    /**
     * Обновление состояния частиц
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Физика
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            
            // Затухание
            p.alpha -= p.decay;
            
            // Вращение для квадратов
            if (p.rotation !== undefined) {
                p.rotation += p.rotationSpeed;
            }
            
            // Trail для искр
            if (p.type === 'spark' && p.trail) {
                p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
                if (p.trail.length > 5) {
                    p.trail.shift();
                }
            }
            
            // Удаление мёртвых частиц
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },
    
    /**
     * Отрисовка частиц
     */
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            
            switch (p.type) {
                case 'circle':
                    this.drawCircle(p);
                    break;
                case 'square':
                    this.drawSquare(p);
                    break;
                case 'glow':
                    this.drawGlow(p);
                    break;
                case 'spark':
                    this.drawSpark(p);
                    break;
                case 'text':
                    this.drawText(p);
                    break;
                case 'confetti':
                    this.drawConfetti(p);
                    break;
            }
            
            this.ctx.restore();
        });
    },
    
    /**
     * Рисуем круглую частицу
     */
    drawCircle(p) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
    },
    
    /**
     * Рисуем квадратную частицу
     */
    drawSquare(p) {
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    },
    
    /**
     * Рисуем светящуюся частицу
     */
    drawGlow(p) {
        const gradient = this.ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, p.size * 2
        );
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.5, p.color + '80');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    },
    
    /**
     * Рисуем искру с хвостом
     */
    drawSpark(p) {
        // Рисуем хвост
        if (p.trail && p.trail.length > 1) {
            this.ctx.beginPath();
            this.ctx.moveTo(p.trail[0].x, p.trail[0].y);
            
            for (let i = 1; i < p.trail.length; i++) {
                this.ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            
            this.ctx.lineTo(p.x, p.y);
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = p.size / 2;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        }
        
        // Рисуем головку
        this.drawGlow(p);
    },
    
    /**
     * Рисуем текст (для очков)
     */
    drawText(p) {
        this.ctx.font = `bold ${p.size}px 'Share Tech Mono', monospace`;
        this.ctx.fillStyle = p.color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Свечение текста
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 10;
        
        this.ctx.fillText(p.text, p.x, p.y);
    },
    
    /**
     * Обновление молний
     */
    updateLightnings() {
        for (let i = this.lightnings.length - 1; i >= 0; i--) {
            const l = this.lightnings[i];
            l.alpha -= l.decay;
            
            if (l.alpha <= 0) {
                this.lightnings.splice(i, 1);
            }
        }
    },
    
    /**
     * Отрисовка молний
     */
    drawLightnings() {
        this.lightnings.forEach(l => {
            this.ctx.save();
            this.ctx.globalAlpha = l.alpha;
            this.ctx.strokeStyle = l.color;
            this.ctx.lineWidth = l.width;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            // Свечение
            this.ctx.shadowColor = l.color;
            this.ctx.shadowBlur = 15;
            
            // Основная линия
            this.ctx.beginPath();
            l.segments.forEach((seg, i) => {
                if (i === 0) {
                    this.ctx.moveTo(seg.x1, seg.y1);
                }
                this.ctx.lineTo(seg.x2, seg.y2);
            });
            this.ctx.stroke();
            
            // Внутренняя светлая линия
            this.ctx.strokeStyle = this.colors.white;
            this.ctx.lineWidth = l.width / 2;
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    },
    
    /**
     * Очистка всех эффектов
     */
    clear() {
        this.particles = [];
        this.lightnings = [];
    },
    
    /**
     * Остановка анимации
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isRunning = false;
    },
    
    /**
     * Конфетти для нового рекорда
     */
    confetti(x, y, count = 80) {
        const colors = ['#FF00E6', '#00F3FF', '#FFD700', '#00E5A0', '#FF005C', '#7B61FF'];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 8;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push({
                x: x + (Math.random() - 0.5) * 100,
                y,
                vx: Math.cos(angle) * speed * 0.5,
                vy: -Math.abs(Math.sin(angle) * speed) - 2,
                size: 6 + Math.random() * 6,
                color,
                alpha: 1,
                decay: 0.005 + Math.random() * 0.005,
                gravity: 0.12,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                type: 'confetti',
                wobble: Math.random() * 10
            });
        }
    },
    
    /**
     * След за падающим блоком
     */
    trail(x, y, color = this.colors.cyan) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 15,
                y: y + Math.random() * 5,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -0.5 - Math.random() * 0.5,
                size: 2 + Math.random() * 3,
                color,
                alpha: 0.6,
                decay: 0.03 + Math.random() * 0.02,
                gravity: -0.02,
                type: 'glow'
            });
        }
    },
    
    /**
     * Рисуем конфетти (переопределяем в drawParticles)
     */
    drawConfetti(p) {
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        
        // Колебания
        const wobbleX = Math.sin(p.wobble) * 2;
        p.vx += wobbleX * 0.01;
        p.wobble += 0.1;
        
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
    }
};

// Glitch эффект для перегрева

const GlitchEffect = {
    isActive: false,
    container: null,
    intervalId: null,
    
    init() {
        this.container = document.getElementById('game-container');
    },
    
    start() {
        if (this.isActive || !this.container) return;
        this.isActive = true;
        this.container.classList.add('glitch-active');
        
        // Периодические glitch импульсы
        this.intervalId = setInterval(() => {
            this.pulse();
        }, 200 + Math.random() * 300);
    },
    
    stop() {
        if (!this.container) return;
        this.isActive = false;
        this.container.classList.remove('glitch-active');
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },
    
    pulse() {
        if (!this.container) return;
        this.container.classList.add('glitch-pulse');
        setTimeout(() => {
            this.container.classList.remove('glitch-pulse');
        }, 100);
    }
};

// Пульсация фона

const BackgroundPulse = {
    container: null,
    
    init() {
        this.container = document.getElementById('game-container');
    },
    
    dualHack() {
        if (!this.container) return;
        this.container.classList.add('dual-hack-pulse');
        setTimeout(() => {
            this.container.classList.remove('dual-hack-pulse');
        }, 1000);
    },
    
    crack(side) {
        if (!this.container) return;
        const className = side === 'left' ? 'crack-pulse-left' : 'crack-pulse-right';
        this.container.classList.add(className);
        setTimeout(() => {
            this.container.classList.remove(className);
        }, 300);
    }
};

// Система следа за блоком

const BlockTrail = {
    isActive: false,
    intervalId: null,
    block: null,
    
    start(blockElement, getColorFn) {
        if (this.isActive) return;
        this.isActive = true;
        this.block = blockElement;
        
        this.intervalId = setInterval(() => {
            if (!this.block || this.block.classList.contains('hidden')) {
                this.stop();
                return;
            }
            
            const rect = this.block.getBoundingClientRect();
            const color = getColorFn ? getColorFn() : '#00F3FF';
            
            if (window.ParticleEffects) {
                ParticleEffects.trail(
                    rect.left + rect.width / 2,
                    rect.bottom,
                    color
                );
            }
        }, 40);
    },
    
    stop() {
        this.isActive = false;
        this.block = null;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
};

// Экспорт
window.ParticleEffects = ParticleEffects;
window.GlitchEffect = GlitchEffect;
window.BackgroundPulse = BackgroundPulse;
window.BlockTrail = BlockTrail;
