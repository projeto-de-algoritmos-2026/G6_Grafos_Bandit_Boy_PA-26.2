<script lang="ts">
  import { onMount } from "svelte";
  import { GameEngine } from "./game/engine";
  import { getLevelHueOffset } from "./game/constants";
  import StartScreen from "./StartScreen.svelte";
  import GameOver from "./GameOver.svelte";
  import type { GameOverStats, GraphMetricsStats } from "./game/types";

  import fireIcon from '../assets/fire1.png';
  import bootsIcon from '../assets/winged-boot1.png';
  import shieldIcon from '../assets/shield.png';
  import iceIcon from '../assets/ice1.png';
  import AudioModal from './AudioModal.svelte';

  const UPGRADES_CONFIG = [
    { kind: 'fire', icon: fireIcon, label: 'Fogo' },
    { kind: 'boots', icon: bootsIcon, label: 'Botas aladas' },
    { kind: 'shield', icon: shieldIcon, label: 'Proteção contra bombas' },
    { kind: 'ice', icon: iceIcon, label: 'Inimigos congelados' },
  ] as const;

  let upgrades = $state({ fire: 0, boots: 0, shield: 0, ice: 0 });

  type GameState = "menu" | "starting" | "playing" | "gameover";

  let canvas: HTMLCanvasElement;
  let engine: GameEngine | null = null;
  let gameState = $state<GameState>("menu");
  let gameOverStats = $state<GameOverStats | null>(null);
  let currentLevel = $state(1);
  let graphStats = $state<GraphMetricsStats | null>(null);
  let isMuted = $state(false);
  let showAudioModal = $state(false);
  let musicVolume = $state(10);
  let sfxVolume = $state(10);

  let bgHue = $derived(getLevelHueOffset(currentLevel));
  let themeColor = $derived(`hsl(${(48 + bgHue) % 360}, 96%, 54%)`);

  onMount(() => {
    engine = new GameEngine(canvas);
    isMuted = engine.isMuted();
    musicVolume = engine.getMusicVolume();
    sfxVolume = engine.getSfxVolume();
    engine.onMuteChange = (muted) => {
      isMuted = muted;
    };
    engine.onGameOver = (stats) => {
      gameState = "gameover";
      gameOverStats = stats;
    };
    engine.onLevelChange = (level) => {
      currentLevel = level;
    };
    engine.onGraphStatsUpdate = (stats) => {
      graphStats = stats;
    };
    engine.onUpgradesChange = (timers) => { upgrades = timers; };
    engine.start();
    return () => engine?.destroy();
  });

  function handlePlayStart() {
    if (gameState !== "menu") return;
    engine?.unlockAudio();
    gameState = "starting";
  }

  function handlePlayComplete() {
    gameState = "playing";
    engine?.startPlay();
  }

  function handleRestart() {
    gameState = "menu";
    gameOverStats = null;
    engine?.resetToMenu();
  }

  function toggleSound() {
    if (engine) {
      isMuted = engine.toggleMute();
    }
  }

  function handleMusicChange(val: number) {
    musicVolume = val;
    engine?.setMusicVolume(val);
  }

  function handleSfxChange(val: number) {
    sfxVolume = val;
    engine?.setSfxVolume(val);
    engine?.playSfxPreview();
  }

  function openAudioModal() {
    engine?.unlockAudio();
    showAudioModal = true;
  }

  function closeAudioModal() {
    showAudioModal = false;
  }
</script>

<main>
  <button
    type="button"
    class="pixel-audio-btn"
    onclick={openAudioModal}
    title="Configurações de Áudio [M]"
    aria-label="Configurações de Áudio"
  >
    <span class="btn-icon">{isMuted ? "✕" : "♫"}</span>
    <span class="btn-text">SOM</span>
    {#if isMuted}
      <span class="btn-badge is-muted">[MUDO]</span>
    {:else}
      <span class="btn-badge">[{musicVolume}%]</span>
    {/if}
  </button>

  <div
    class="bg-overlay"
    style="filter: blur(14px) brightness(0.25) contrast(1.1) hue-rotate({bgHue}deg);"
  ></div>

  <div class="game-wrapper">
    <canvas
      bind:this={canvas}
      class:is-blurred={gameState === "menu" || gameState === "gameover"}
    ></canvas>

    {#if gameState === "playing"}
      <aside class="upgrades" aria-label="Upgrades ativos">
        {#each UPGRADES_CONFIG as upgrade}
          {#if upgrades[upgrade.kind] > 0}
            <div class="upgrade" title={upgrade.label}>
              <img src={upgrade.icon} alt={upgrade.label} />
              <span>{upgrades[upgrade.kind].toFixed(1)}s</span>
            </div>
          {/if}
        {/each}
      </aside>
    {/if}

    {#if graphStats?.show && gameState === "playing"}
      <div
        class="graph-modal-bar"
        style="--theme-color: {themeColor};"
      >
        <div class="modal-info">
          <span class="modal-tag">[G] {graphStats.algorithmName}</span>
          <span class="modal-stat">EXPANDIDOS: <strong>{graphStats.totalExpanded}</strong></span>
          <span class="modal-sep">|</span>
          <span class="modal-stat">TEMPO: <strong>{graphStats.maxTime.toFixed(2)}ms</strong></span>
          <span class="modal-sep">|</span>
          <span class="modal-stat">ROTA: <strong>{graphStats.pathLenStr}</strong></span>
        </div>
      </div>
    {/if}
  </div>

  {#if gameState === "menu" || gameState === "starting"}
    <StartScreen
      onPlay={handlePlayStart}
      onComplete={handlePlayComplete}
      isExiting={gameState === "starting"}
      onOpenAudio={openAudioModal}
    />
  {:else if gameState === "gameover" && gameOverStats}
    <GameOver stats={gameOverStats} onRestart={handleRestart} />
  {/if}

  {#if showAudioModal}
    <AudioModal
      {isMuted}
      {musicVolume}
      {sfxVolume}
      onMusicChange={handleMusicChange}
      onSfxChange={handleSfxChange}
      onToggleMute={toggleSound}
      onClose={closeAudioModal}
    />
  {/if}
</main>

<style>
  .upgrades { position: absolute; left: calc(100% + 12px); top: 48px; z-index: 2; display: grid; gap: 16px; }
  .upgrade { display: grid; justify-items: center; color: white; font-family: monospace; }
  .upgrade img { width: 48px; height: 48px; image-rendering: pixelated; animation: upgrade-blink 0.5s steps(1) infinite; }
  @keyframes upgrade-blink { 50% { opacity: 0.2; } }

  main {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    overflow: hidden;
    background: #08080a;
  }

  .bg-overlay {
    position: absolute;
    inset: -30px;
    background: url("../assets/bg.png") no-repeat center center;
    background-size: cover;
    filter: blur(14px) brightness(0.25) contrast(1.1);
    transform: scale(1.05);
    pointer-events: none;
    z-index: 0;
  }

  .game-wrapper {
    position: relative;
    width: 720px;
    height: 672px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  canvas {
    position: relative;
    z-index: 1;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.8));
    transition: filter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  canvas.is-blurred {
    filter: blur(14px) brightness(0.25) contrast(1.1) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.8));
  }

  .graph-modal-bar {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    width: 720px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 4px;
    background: transparent;
    border: none;
    box-shadow: none;
    z-index: 5;
    font-family: "Pixelify Sans", cursive, monospace;
    animation: modalFade 0.15s ease-out;
  }

  @keyframes modalFade {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.95), 0 0 3px rgba(0, 0, 0, 0.9);
  }

  .modal-tag {
    color: var(--theme-color, #facc15);
    letter-spacing: 0.5px;
    transition: color 0.4s ease;
  }

  .modal-stat {
    color: #cbd5e1;
  }

  .modal-stat strong {
    color: #ffffff;
  }

  .modal-sep {
    color: var(--theme-color, #facc15);
    transition: color 0.4s ease;
  }

  .pixel-audio-btn {
    position: absolute;
    top: 18px;
    right: 20px;
    z-index: 30;
    height: 42px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #2a1b12;
    border: 3px solid #000000;
    border-radius: 0;
    box-shadow:
      inset 3px 3px 0 #543320,
      inset -3px -3px 0 #130a06,
      0 4px 0 #000000;
    color: #fce8c8;
    font-family: "Pixelify Sans", cursive, monospace;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.8px;
    cursor: pointer;
    image-rendering: pixelated;
    transition: none;
    user-select: none;
  }

  .pixel-audio-btn:hover {
    background: #422818;
    color: #ffffff;
    box-shadow:
      inset 3px 3px 0 #73452b,
      inset -3px -3px 0 #1c0f09,
      0 4px 0 #000000;
  }

  .pixel-audio-btn:active {
    transform: translateY(4px);
    box-shadow:
      inset 3px 3px 0 #130a06,
      inset -3px -3px 0 #543320,
      0 0 0 #000000;
  }

  .pixel-audio-btn .btn-icon {
    color: #facc15;
    font-size: 18px;
  }

  .pixel-audio-btn .btn-badge {
    color: #facc15;
    font-size: 14px;
  }

  .pixel-audio-btn .btn-badge.is-muted {
    color: #fca5a5;
  }
</style>
