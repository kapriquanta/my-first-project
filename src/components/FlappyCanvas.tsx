import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, Difficulty, TimeOfDay, BirdSkinId, SKINS, DIFFICULTIES } from '../types/game';
import { sound } from '../utils/audio';

interface FlappyCanvasProps {
  gameState: GameState;
  difficulty: Difficulty;
  timeOfDay: TimeOfDay;
  skinId: BirdSkinId;
  onScoreUpdate: (score: number) => void;
  onCoinCollected: () => void;
  onGameOver: (finalScore: number) => void;
  onGameStart: () => void;
  score: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'feather' | 'spark' | 'smoke' | 'coin';
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  gap: number;
  passed: boolean;
  hasCoin: boolean;
  coinCollected: boolean;
  coinY: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  speed: number;
  opacity: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  twinkleSpeed: number;
  phase: number;
}

const CANVAS_WIDTH = 380;
const CANVAS_HEIGHT = 580;
const GROUND_HEIGHT = 80;

export const FlappyCanvas: React.FC<FlappyCanvasProps> = ({
  gameState,
  difficulty,
  timeOfDay,
  skinId,
  onScoreUpdate,
  onCoinCollected,
  onGameOver,
  onGameStart,
  score,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core physics & game loop state stored in refs for 60fps performance
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const skinRef = useRef(SKINS[skinId]);
  skinRef.current = SKINS[skinId];

  const diffConfigRef = useRef(DIFFICULTIES[difficulty]);
  diffConfigRef.current = DIFFICULTIES[difficulty];

  // Bird physical state
  const birdRef = useRef({
    x: 90,
    y: 260,
    radius: 14,
    velocity: 0,
    angle: 0,
    wingAngle: 0,
    flapTimer: 0,
    isDead: false,
    eyeBlink: 0,
  });

  // Entities
  const pipesRef = useRef<Pipe[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const frameCountRef = useRef(0);
  const groundOffsetRef = useRef(0);
  const screenShakeRef = useRef(0);

  // Background environment
  const cloudsRef = useRef<Cloud[]>([
    { x: 40, y: 80, width: 75, speed: 0.35, opacity: 0.8 },
    { x: 190, y: 140, width: 90, speed: 0.25, opacity: 0.7 },
    { x: 310, y: 60, width: 65, speed: 0.4, opacity: 0.85 },
  ]);

  const starsRef = useRef<Star[]>(
    Array.from({ length: 45 }, () => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * (CANVAS_HEIGHT - 180),
      radius: Math.random() * 1.5 + 0.6,
      twinkleSpeed: Math.random() * 0.05 + 0.02,
      phase: Math.random() * Math.PI * 2,
    }))
  );

  // Resolved dynamic theme
  const getResolvedTheme = useCallback(() => {
    if (timeOfDay !== 'auto') return timeOfDay;
    // Auto cycle every 15 points
    const cycle = Math.floor(scoreRef.current / 15) % 3;
    if (cycle === 0) return 'day';
    if (cycle === 1) return 'sunset';
    return 'night';
  }, [timeOfDay]);

  // Jump handler
  const performFlap = useCallback(() => {
    if (gameStateRef.current === 'START') {
      onGameStart();
      birdRef.current.velocity = diffConfigRef.current.jumpForce;
      sound.playFlap();
      spawnFlapParticles();
      return;
    }

    if (gameStateRef.current === 'PLAYING') {
      birdRef.current.velocity = diffConfigRef.current.jumpForce;
      birdRef.current.flapTimer = 14;
      sound.playFlap();
      spawnFlapParticles();
    }
  }, [onGameStart]);

  // Spawn flap feathers
  const spawnFlapParticles = () => {
    const b = birdRef.current;
    const skin = skinRef.current;
    for (let i = 0; i < 4; i++) {
      particlesRef.current.push({
        x: b.x - 8 + (Math.random() * 6 - 3),
        y: b.y + 6 + (Math.random() * 6 - 3),
        vx: -1.5 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 2,
        color: skin.particleColor,
        alpha: 0.9,
        life: 0,
        maxLife: 20 + Math.random() * 10,
        type: 'feather',
      });
    }
  };

  // Spawn death burst
  const spawnDeathParticles = () => {
    const b = birdRef.current;
    const skin = skinRef.current;
    screenShakeRef.current = 14;

    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1.5;
      particlesRef.current.push({
        x: b.x,
        y: b.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: i % 2 === 0 ? skin.primaryColor : skin.particleColor,
        alpha: 1,
        life: 0,
        maxLife: 35 + Math.random() * 15,
        type: 'feather',
      });
    }
  };

  // Spawn pipe
  const spawnPipe = () => {
    const cfg = diffConfigRef.current;
    const gap = cfg.gap;
    const playHeight = CANVAS_HEIGHT - GROUND_HEIGHT;
    const minTop = 60;
    const maxTop = playHeight - gap - 60;
    const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
    const bottomHeight = playHeight - (topHeight + gap);

    // 40% chance of spawning a bonus shiny coin in the middle of the gap
    const hasCoin = Math.random() < 0.45;
    const coinY = topHeight + gap / 2;

    pipesRef.current.push({
      x: CANVAS_WIDTH + 10,
      topHeight,
      bottomHeight,
      gap,
      passed: false,
      hasCoin,
      coinCollected: false,
      coinY,
    });
  };

  // Reset internal game state
  useEffect(() => {
    if (gameState === 'START' || (gameState === 'PLAYING' && birdRef.current.isDead)) {
      birdRef.current = {
        x: 90,
        y: 260,
        radius: 14,
        velocity: 0,
        angle: 0,
        wingAngle: 0,
        flapTimer: 0,
        isDead: false,
        eyeBlink: 0,
      };
      pipesRef.current = [];
      particlesRef.current = [];
      floatingTextsRef.current = [];
      frameCountRef.current = 0;
      groundOffsetRef.current = 0;
      screenShakeRef.current = 0;
    }
  }, [gameState]);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      frameCountRef.current++;
      const currentTheme = getResolvedTheme();
      const cfg = diffConfigRef.current;
      const b = birdRef.current;

      // Screen shake decay
      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        screenShakeRef.current *= 0.88;
        if (screenShakeRef.current < 0.4) screenShakeRef.current = 0;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Draw Sky & Celestial bodies
      drawBackground(ctx, currentTheme);

      // 2. State specific updates
      if (gameStateRef.current === 'START') {
        // Idle gentle bobbing
        b.y = 250 + Math.sin(frameCountRef.current * 0.08) * 8;
        b.angle = Math.sin(frameCountRef.current * 0.08) * 0.12;
        b.wingAngle = Math.sin(frameCountRef.current * 0.18) * 0.5;
        groundOffsetRef.current = (groundOffsetRef.current + cfg.speed) % 18;
      } else if (gameStateRef.current === 'PLAYING') {
        // Active Bird Physics
        b.velocity += cfg.gravity;
        b.y += b.velocity;

        // Angle rotation clamped to velocity
        const targetAngle = Math.min(Math.PI / 2.2, Math.max(-Math.PI / 4, b.velocity * 0.09));
        b.angle += (targetAngle - b.angle) * 0.2;

        // Wing flap flapping
        if (b.flapTimer > 0) {
          b.flapTimer--;
          b.wingAngle = -0.7 + Math.sin(frameCountRef.current * 0.8) * 0.4;
        } else {
          b.wingAngle = Math.min(0.5, Math.max(-0.2, b.velocity * 0.05));
        }

        // Ceiling hit
        if (b.y - b.radius <= 0) {
          b.y = b.radius;
          b.velocity = 0;
        }

        // Ground hit
        const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
        if (b.y + b.radius >= groundY) {
          b.y = groundY - b.radius;
          b.isDead = true;
          sound.playHit();
          sound.playDie();
          spawnDeathParticles();
          onGameOver(scoreRef.current);
        }

        // Pipes generation & movement
        if (frameCountRef.current % cfg.spawnFrames === 0) {
          spawnPipe();
        }

        // Move Ground
        groundOffsetRef.current = (groundOffsetRef.current + cfg.speed) % 18;

        // Update Pipes
        const pipeWidth = 54;
        for (let i = pipesRef.current.length - 1; i >= 0; i--) {
          const p = pipesRef.current[i];
          p.x -= cfg.speed;

          // Check score pass
          if (!p.passed && p.x + pipeWidth < b.x) {
            p.passed = true;
            const newScore = scoreRef.current + 1;
            sound.playScore();
            onScoreUpdate(newScore);

            // Floating "+1" point indicator
            floatingTextsRef.current.push({
              x: b.x,
              y: b.y - 18,
              text: '+1',
              color: '#FACC15',
              alpha: 1,
              vy: -1.8,
            });
          }

          // Check coin collection
          if (p.hasCoin && !p.coinCollected) {
            const coinX = p.x + pipeWidth / 2;
            const coinY = p.coinY;
            const dist = Math.hypot(b.x - coinX, b.y - coinY);
            if (dist < b.radius + 12) {
              p.coinCollected = true;
              sound.playCoin();
              onCoinCollected();

              // Sparkle particle burst
              for (let k = 0; k < 10; k++) {
                const angle = Math.random() * Math.PI * 2;
                particlesRef.current.push({
                  x: coinX,
                  y: coinY,
                  vx: Math.cos(angle) * (Math.random() * 3 + 1),
                  vy: Math.sin(angle) * (Math.random() * 3 + 1),
                  size: Math.random() * 3 + 2,
                  color: '#FDE047',
                  alpha: 1,
                  life: 0,
                  maxLife: 24,
                  type: 'coin',
                });
              }

              floatingTextsRef.current.push({
                x: coinX,
                y: coinY - 14,
                text: '+1 COIN',
                color: '#FEF08A',
                alpha: 1,
                vy: -1.6,
              });
            }
          }

          // Pipe collision check with forgiving circular radius
          const hitGrace = 3.5;
          const birdLeft = b.x - b.radius + hitGrace;
          const birdRight = b.x + b.radius - hitGrace;
          const birdTop = b.y - b.radius + hitGrace;
          const birdBottom = b.y + b.radius - hitGrace;

          if (birdRight > p.x && birdLeft < p.x + pipeWidth) {
            const topLimit = p.topHeight;
            const bottomLimit = CANVAS_HEIGHT - GROUND_HEIGHT - p.bottomHeight;
            if (birdTop < topLimit || birdBottom > bottomLimit) {
              b.isDead = true;
              sound.playHit();
              sound.playDie();
              spawnDeathParticles();
              onGameOver(scoreRef.current);
            }
          }

          // Cull offscreen pipes
          if (p.x + pipeWidth < -20) {
            pipesRef.current.splice(i, 1);
          }
        }
      } else if (gameStateRef.current === 'GAMEOVER') {
        // Falling bird corpse to ground
        const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
        if (b.y + b.radius < groundY) {
          b.velocity += cfg.gravity * 1.2;
          b.y += b.velocity;
          b.angle = Math.min(Math.PI / 2, b.angle + 0.15);
        } else {
          b.y = groundY - b.radius;
        }
      }

      // 3. Draw Pipes & Coins
      drawPipes(ctx, currentTheme);

      // 4. Draw Particles
      drawParticles(ctx);

      // 5. Draw Ground
      drawGround(ctx, currentTheme);

      // 6. Draw Bird
      drawBird(ctx, b, skinRef.current, gameStateRef.current);

      // 7. Draw Floating Texts
      drawFloatingTexts(ctx);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [getResolvedTheme, onScoreUpdate, onCoinCollected, onGameOver]);

  // Handle pointer & keyboard controls
  const handleInteraction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    performFlap();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        performFlap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performFlap]);

  // Background Renderer
  const drawBackground = (ctx: CanvasRenderingContext2D, theme: 'day' | 'sunset' | 'night') => {
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);

    if (theme === 'day') {
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(0.6, '#7dd3fc');
      grad.addColorStop(1, '#bae6fd');
    } else if (theme === 'sunset') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.35, '#581c87');
      grad.addColorStop(0.65, '#ea580c');
      grad.addColorStop(1, '#fde047');
    } else {
      // Night
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.4, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars at night
    if (theme === 'night') {
      ctx.save();
      starsRef.current.forEach((star) => {
        star.phase += star.twinkleSpeed;
        const alpha = 0.35 + Math.sin(star.phase) * 0.45;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, alpha)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // Celestial orb (Sun or Moon)
    ctx.save();
    if (theme === 'day') {
      // Glowing radiant sun
      const sunGrad = ctx.createRadialGradient(290, 75, 5, 290, 75, 45);
      sunGrad.addColorStop(0, 'rgba(255, 253, 231, 0.95)');
      sunGrad.addColorStop(0.4, 'rgba(254, 240, 138, 0.45)');
      sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(290, 75, 45, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(290, 75, 18, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme === 'sunset') {
      // Deep glowing sunset sun
      ctx.fillStyle = 'rgba(251, 146, 60, 0.7)';
      ctx.beginPath();
      ctx.arc(190, 180, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FED7AA';
      ctx.beginPath();
      ctx.arc(190, 180, 32, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Crescent Moon
      ctx.fillStyle = '#F8FAFC';
      ctx.shadowColor = '#E2E8F0';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(300, 75, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Dark overlay for crescent
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(310, 70, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Distant mountain/city skyline layer
    drawSkyline(ctx, theme);

    // Drifting puffy clouds
    drawClouds(ctx, theme);
  };

  // City / Mountain silhouettes
  const drawSkyline = (ctx: CanvasRenderingContext2D, theme: 'day' | 'sunset' | 'night') => {
    ctx.save();
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;

    if (theme === 'day') {
      // Rolling green/teal distant hills
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.bezierCurveTo(90, groundY - 45, 180, groundY - 20, 270, groundY - 55);
      ctx.bezierCurveTo(320, groundY - 40, 350, groundY - 30, CANVAS_WIDTH, groundY - 45);
      ctx.lineTo(CANVAS_WIDTH, groundY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.bezierCurveTo(70, groundY - 25, 140, groundY - 40, 220, groundY - 20);
      ctx.bezierCurveTo(300, groundY - 35, 340, groundY - 15, CANVAS_WIDTH, groundY - 30);
      ctx.lineTo(CANVAS_WIDTH, groundY);
      ctx.closePath();
      ctx.fill();
    } else if (theme === 'sunset') {
      // Silhouette mountains
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(60, groundY - 50);
      ctx.lineTo(130, groundY - 20);
      ctx.lineTo(210, groundY - 65);
      ctx.lineTo(290, groundY - 30);
      ctx.lineTo(350, groundY - 75);
      ctx.lineTo(CANVAS_WIDTH, groundY - 40);
      ctx.lineTo(CANVAS_WIDTH, groundY);
      ctx.closePath();
      ctx.fill();
    } else {
      // Cyber/Night city skyline with illuminated windows
      ctx.fillStyle = '#090d16';
      const buildings = [
        { x: 10, w: 35, h: 90 },
        { x: 50, w: 45, h: 130 },
        { x: 100, w: 30, h: 80 },
        { x: 135, w: 50, h: 150 },
        { x: 190, w: 40, h: 100 },
        { x: 235, w: 45, h: 125 },
        { x: 285, w: 35, h: 85 },
        { x: 325, w: 50, h: 140 },
      ];
      buildings.forEach((b) => {
        ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
        // Little window lights
        ctx.fillStyle = '#38bdf8';
        for (let wy = groundY - b.h + 12; wy < groundY - 15; wy += 22) {
          for (let wx = b.x + 8; wx < b.x + b.w - 10; wx += 12) {
            if ((wx + wy) % 5 === 0) {
              ctx.fillRect(wx, wy, 4, 6);
            }
          }
        }
        ctx.fillStyle = '#090d16';
      });
    }
    ctx.restore();
  };

  // Puffy clouds drifting
  const drawClouds = (ctx: CanvasRenderingContext2D, theme: 'day' | 'sunset' | 'night') => {
    ctx.save();
    cloudsRef.current.forEach((cloud) => {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.width < -20) {
        cloud.x = CANVAS_WIDTH + 20;
      }

      ctx.fillStyle =
        theme === 'night'
          ? `rgba(30, 41, 59, ${cloud.opacity * 0.4})`
          : theme === 'sunset'
          ? `rgba(254, 215, 170, ${cloud.opacity * 0.5})`
          : `rgba(255, 255, 255, ${cloud.opacity})`;

      // Cloud puffs using multiple overlapping circles
      const cx = cloud.x;
      const cy = cloud.y;
      const r = cloud.width * 0.25;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 1.2, cy - r * 0.4, r * 1.1, 0, Math.PI * 2);
      ctx.arc(cx + r * 2.4, cy, r * 0.9, 0, Math.PI * 2);
      ctx.arc(cx + r * 1.2, cy + r * 0.2, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  };

  // Pipes and Coins
  const drawPipes = (ctx: CanvasRenderingContext2D, theme: 'day' | 'sunset' | 'night') => {
    const pipeWidth = 54;
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;

    pipesRef.current.forEach((p) => {
      // Theme colors for pipes
      let bodyColor = '#22c55e';
      let shadowColor = '#15803d';
      let lightColor = '#86efac';
      let borderColor = '#14532d';

      if (theme === 'sunset') {
        bodyColor = '#ea580c';
        shadowColor = '#9a3412';
        lightColor = '#fdba74';
        borderColor = '#431407';
      } else if (theme === 'night') {
        bodyColor = '#0284c7';
        shadowColor = '#0369a1';
        lightColor = '#38bdf8';
        borderColor = '#0c4a6e';
      }

      // --- Top Pipe ---
      const topH = p.topHeight;
      // Body
      const topGrad = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
      topGrad.addColorStop(0, borderColor);
      topGrad.addColorStop(0.15, lightColor);
      topGrad.addColorStop(0.4, bodyColor);
      topGrad.addColorStop(0.85, shadowColor);
      topGrad.addColorStop(1, borderColor);

      ctx.fillStyle = topGrad;
      ctx.fillRect(p.x, 0, pipeWidth, topH);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(p.x, -2, pipeWidth, topH + 2);

      // Top Lip / Cap
      const capHeight = 24;
      const capOverhang = 4;
      ctx.fillRect(p.x - capOverhang, topH - capHeight, pipeWidth + capOverhang * 2, capHeight);
      ctx.strokeRect(p.x - capOverhang, topH - capHeight, pipeWidth + capOverhang * 2, capHeight);

      // Highlight stripe on cap
      ctx.fillStyle = lightColor;
      ctx.fillRect(p.x - capOverhang + 6, topH - capHeight + 3, 5, capHeight - 6);

      // --- Bottom Pipe ---
      const botH = p.bottomHeight;
      const botY = groundY - botH;

      ctx.fillStyle = topGrad;
      ctx.fillRect(p.x, botY, pipeWidth, botH);
      ctx.strokeRect(p.x, botY, pipeWidth, botH + 2);

      // Bottom Lip / Cap
      ctx.fillRect(p.x - capOverhang, botY, pipeWidth + capOverhang * 2, capHeight);
      ctx.strokeRect(p.x - capOverhang, botY, pipeWidth + capOverhang * 2, capHeight);

      // Highlight stripe on bottom cap
      ctx.fillStyle = lightColor;
      ctx.fillRect(p.x - capOverhang + 6, botY + 3, 5, capHeight - 6);

      // --- Shiny Bonus Coin ---
      if (p.hasCoin && !p.coinCollected) {
        ctx.save();
        const coinX = p.x + pipeWidth / 2;
        const coinY = p.coinY + Math.sin(frameCountRef.current * 0.1) * 4;
        const scaleX = Math.cos(frameCountRef.current * 0.08);

        ctx.translate(coinX, coinY);
        ctx.scale(scaleX, 1);

        // Gold coin circle / ellipse
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        // Star or "$" insignia on coin
        ctx.fillStyle = '#B45309';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 1);

        ctx.restore();
      }
    });
  };

  // Animated Ground
  const drawGround = (ctx: CanvasRenderingContext2D, theme: 'day' | 'sunset' | 'night') => {
    ctx.save();
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;

    // Grass strip colors
    let grassTop = '#4ade80';
    let grassBorder = '#16a34a';
    let soilColor = '#d97706';
    let soilDark = '#92400e';

    if (theme === 'night') {
      grassTop = '#059669';
      grassBorder = '#064e3b';
      soilColor = '#1e293b';
      soilDark = '#0f172a';
    } else if (theme === 'sunset') {
      grassTop = '#ca8a04';
      grassBorder = '#854d0e';
      soilColor = '#78350f';
      soilDark = '#451a03';
    }

    // Dirt base
    ctx.fillStyle = soilColor;
    ctx.fillRect(0, groundY, CANVAS_WIDTH, GROUND_HEIGHT);

    // Subsoil darker band
    ctx.fillStyle = soilDark;
    ctx.fillRect(0, groundY + 28, CANVAS_WIDTH, GROUND_HEIGHT - 28);

    // Decorative pebbles / soil specs
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let i = 0; i < CANVAS_WIDTH; i += 28) {
      ctx.fillRect(i + 8, groundY + 40, 6, 4);
      ctx.fillRect(i + 18, groundY + 55, 4, 3);
    }

    // Top grass bar
    ctx.fillStyle = grassTop;
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 14);

    // Upper rim line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 3);

    // Animated diagonal grass blades
    ctx.fillStyle = grassBorder;
    const offset = groundOffsetRef.current;
    for (let x = -offset; x < CANVAS_WIDTH + 20; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 14);
      ctx.lineTo(x + 8, groundY);
      ctx.lineTo(x + 13, groundY + 14);
      ctx.closePath();
      ctx.fill();
    }

    // Ground divider shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CANVAS_WIDTH, groundY);
    ctx.stroke();

    ctx.restore();
  };

  // Bird Renderer
  const drawBird = (
    ctx: CanvasRenderingContext2D,
    b: typeof birdRef.current,
    skin: typeof skinRef.current,
    state: GameState
  ) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);

    // Optional glow effect for cyber / phoenix / raven
    if (skin.accentGlow) {
      ctx.shadowColor = skin.accentGlow;
      ctx.shadowBlur = 10;
    }

    // 1. Bird Tail Feathers
    ctx.fillStyle = skin.secondaryColor;
    ctx.beginPath();
    ctx.moveTo(-b.radius + 2, -2);
    ctx.lineTo(-b.radius - 8, -6);
    ctx.lineTo(-b.radius - 6, 2);
    ctx.lineTo(-b.radius - 8, 8);
    ctx.lineTo(-b.radius + 2, 4);
    ctx.closePath();
    ctx.fill();

    // 2. Round Bird Body
    const bodyGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, b.radius);
    bodyGrad.addColorStop(0, '#FFFFFF');
    bodyGrad.addColorStop(0.3, skin.primaryColor);
    bodyGrad.addColorStop(1, skin.secondaryColor);

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = skin.secondaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // 3. Belly highlight
    ctx.fillStyle = skin.bellyColor;
    ctx.beginPath();
    ctx.ellipse(2, 4, b.radius * 0.65, b.radius * 0.45, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Crest (for Phoenix)
    if (skin.hasCrest) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(-4, -b.radius);
      ctx.quadraticCurveTo(-2, -b.radius - 10, 6, -b.radius - 6);
      ctx.quadraticCurveTo(2, -b.radius - 2, 2, -b.radius);
      ctx.closePath();
      ctx.fill();
    }

    // 5. Propeller (for Robo)
    if (skin.hasPropeller) {
      ctx.save();
      ctx.translate(0, -b.radius - 3);
      const propSpeed = state === 'PLAYING' ? frameCountRef.current * 0.5 : 0.1;
      ctx.rotate(propSpeed);
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-10, -2, 20, 4);
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Eye
    const eyeX = 6;
    const eyeY = -4;
    const eyeRadius = 4.5;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pupil
    if (b.isDead) {
      // "X" eye when dead
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(eyeX - 2.5, eyeY - 2.5);
      ctx.lineTo(eyeX + 2.5, eyeY + 2.5);
      ctx.moveTo(eyeX + 2.5, eyeY - 2.5);
      ctx.lineTo(eyeX - 2.5, eyeY + 2.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = skin.eyeColor;
      ctx.beginPath();
      ctx.arc(eyeX + 1.2, eyeY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Catchlight glimmer
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(eyeX + 1.8, eyeY - 0.8, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cyber Visor
    if (skin.hasVisor) {
      ctx.fillStyle = 'rgba(236, 72, 153, 0.85)';
      ctx.fillRect(eyeX - 3, eyeY - 4, 10, 8);
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(eyeX - 3, eyeY - 4, 10, 8);
      // Visor highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(eyeX - 2, eyeY - 3, 7, 1.5);
    }

    // 7. Beak
    ctx.fillStyle = skin.beakColor;
    ctx.beginPath();
    ctx.moveTo(b.radius - 2, -1);
    ctx.lineTo(b.radius + 9, 3);
    ctx.lineTo(b.radius - 2, 7);
    ctx.closePath();
    ctx.fill();

    // Mandible dividing line
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(b.radius - 2, 3);
    ctx.lineTo(b.radius + 9, 3);
    ctx.stroke();

    // 8. Animated Wing
    ctx.save();
    ctx.translate(-2, 2);
    ctx.rotate(b.wingAngle);

    ctx.fillStyle = skin.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 4.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(1, 0, 4, Math.PI * 0.7, Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();

    ctx.restore();
  };

  // Particles
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // Gravity
      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife || p.alpha <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'coin') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.vx * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  };

  // Floating score numbers
  const drawFloatingTexts = (ctx: CanvasRenderingContext2D) => {
    for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
      const ft = floatingTextsRef.current[i];
      ft.y += ft.vy;
      ft.alpha -= 0.035;

      if (ft.alpha <= 0) {
        floatingTextsRef.current.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = 'bold 16px "Press Start 2P", monospace';
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  };

  return (
    <div
      className="relative flex items-center justify-center w-full select-none cursor-pointer"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full max-w-[390px] aspect-[380/580] rounded-2xl shadow-2xl border-4 border-slate-800 bg-sky-400 block"
      />
    </div>
  );
};
