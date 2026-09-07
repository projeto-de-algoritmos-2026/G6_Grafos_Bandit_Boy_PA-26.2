<script lang="ts">
  let {
    isMuted,
    musicVolume,
    sfxVolume,
    onMusicChange,
    onSfxChange,
    onToggleMute,
    onClose,
  }: {
    isMuted: boolean;
    musicVolume: number;
    sfxVolume: number;
    onMusicChange: (vol: number) => void;
    onSfxChange: (vol: number) => void;
    onToggleMute: () => void;
    onClose: () => void;
  } = $props();

  function handleKeyDown(e: KeyboardEvent) {
    if (e.code === "Escape" || e.code === "Backspace") {
      e.preventDefault();
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<div class="modal-backdrop" onclick={onClose} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
  <div
    class="modal-window"
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <header class="modal-header">
      <span class="modal-title">CONFIGURAÇÕES DE ÁUDIO</span>
      <button
        type="button"
        class="close-btn"
        onclick={onClose}
        aria-label="Fechar modal"
      >
        ✕
      </button>
    </header>

    <div class="modal-body">
      <section class="control-card">
        <div class="control-header">
          <span class="control-title">♫ MÚSICA (SOUNDTRACK)</span>
          <span class="control-value">{musicVolume}%</span>
        </div>

        <div class="slider-box">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={musicVolume}
            oninput={(e) => onMusicChange(+e.currentTarget.value)}
            class="pixel-slider"
            aria-label="Volume da Música"
          />
        </div>

        <div class="meter-row" aria-hidden="true">
          {#each Array(10) as _, i}
            <div
              class="meter-block"
              class:is-active={i * 10 < musicVolume}
            ></div>
          {/each}
        </div>
      </section>

      <section class="control-card">
        <div class="control-header">
          <span class="control-title">⚡ EFEITOS SONOROS (SFX)</span>
          <span class="control-value">{sfxVolume}%</span>
        </div>

        <div class="slider-box">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={sfxVolume}
            oninput={(e) => onSfxChange(+e.currentTarget.value)}
            class="pixel-slider"
            aria-label="Volume dos Efeitos"
          />
        </div>

        <div class="meter-row" aria-hidden="true">
          {#each Array(10) as _, i}
            <div
              class="meter-block"
              class:is-active={i * 10 < sfxVolume}
            ></div>
          {/each}
        </div>
      </section>

      <div class="action-center">
        <button
          type="button"
          class="pixel-btn {isMuted ? 'muted' : 'primary'}"
          onclick={onToggleMute}
        >
          {isMuted ? "ÁUDIO: SILENCIADO [M]" : "ÁUDIO: ATIVADO [M]"}
        </button>
      </div>
    </div>

    <footer class="modal-footer">
      <button type="button" class="pixel-btn small" onclick={onClose}>
        VOLTAR
      </button>
      <span class="esc-hint">[ ESC ]</span>
    </footer>
  </div>
</div>

<style>
  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(8, 8, 10, 0.75);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 50;
    user-select: none;
    font-family: "Pixelify Sans", cursive, monospace;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-window {
    width: 500px;
    background: #1c130d;
    border: 3px solid #000000;
    box-shadow:
      inset 3px 3px 0 #4d2f1b,
      inset -3px -3px 0 #0a0604,
      0 9px 0 #000000;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    image-rendering: pixelated;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #2b1a11;
    border-bottom: 3px solid #000000;
    padding: 9px 15px;
    box-shadow: inset 0 3px 0 #4d2f1b;
  }

  .modal-title {
    font-size: 21px;
    font-weight: 700;
    letter-spacing: 0.9px;
    color: #fce8c8;
    text-shadow: 0 3px 0 #000000;
  }

  .close-btn {
    background: #7d1810;
    border: 3px solid #000000;
    color: #ffffff;
    font-family: inherit;
    font-size: 18px;
    font-weight: 700;
    width: 33px;
    height: 33px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow:
      inset 3px 3px 0 #a9291f,
      inset -3px -3px 0 #420a06;
  }

  .close-btn:hover { background: #962016; }
  .close-btn:active { transform: translateY(3px); }

  .modal-body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .control-card {
    background: #25160d;
    border: 3px solid #000000;
    box-shadow:
      inset 3px 3px 0 #3d2415,
      inset -3px -3px 0 #100804,
      0 3px 0 #000000;
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .control-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .control-title {
    font-size: 18px;
    font-weight: 700;
    color: #fce8c8;
    text-shadow: 0 2px 0 #000000;
    letter-spacing: 0.5px;
  }

  .control-value {
    font-size: 20px;
    font-weight: 700;
    color: #facc15;
    text-shadow: 0 2px 0 #000000;
  }

  .slider-box {
    width: 100%;
    position: relative;
    display: flex;
    align-items: center;
  }

  .pixel-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 24px;
    background: #0e0a07;
    border: 3px solid #000000;
    box-shadow:
      inset 3px 3px 0 #000000,
      inset -3px -3px 0 #382013;
    outline: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    image-rendering: pixelated;
  }

  .pixel-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 38px;
    background: #d46816;
    border: 3px solid #000000;
    box-shadow:
      inset 3px 3px 0 #f5a338,
      inset -3px -3px 0 #7d3305,
      0 3px 0 #000000;
    cursor: grab;
    image-rendering: pixelated;
  }

  .pixel-slider::-webkit-slider-thumb:hover {
    background: #e87b28;
    box-shadow:
      inset 3px 3px 0 #ffbc5e,
      inset -3px -3px 0 #943d07,
      0 3px 0 #000000;
  }

  .pixel-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
    background: #f5a338;
  }

  .pixel-slider::-moz-range-thumb {
    width: 24px;
    height: 38px;
    background: #d46816;
    border: 3px solid #000000;
    box-shadow:
      inset 3px 3px 0 #f5a338,
      inset -3px -3px 0 #7d3305,
      0 3px 0 #000000;
    cursor: grab;
    image-rendering: pixelated;
  }

  .pixel-slider::-moz-range-track {
    height: 24px;
    background: #0e0a07;
    border: 3px solid #000000;
    box-shadow:
      inset 3px 3px 0 #000000,
      inset -3px -3px 0 #382013;
  }

  .meter-row {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 6px;
    margin-top: 4px;
  }

  .meter-block {
    height: 12px;
    background: #110b07;
    border: 2px solid #000000;
    box-shadow: inset 2px 2px 0 #000000;
  }

  .meter-block.is-active {
    background: #facc15;
    box-shadow:
      inset 2px 2px 0 #fef08a,
      inset -2px -2px 0 #a16207;
  }

  .action-center {
    display: flex;
    justify-content: center;
    margin-top: 6px;
  }

  .pixel-btn {
    position: relative;
    width: 270px;
    height: 48px;
    padding: 0;
    font-family: "Pixelify Sans", cursive, monospace;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #fce8c8;
    background: #2a1b12;
    border: 3px solid #000000;
    box-shadow:
      inset 3px 3px 0 #543320,
      inset -3px -3px 0 #130a06,
      0 6px 0 #000000;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    image-rendering: pixelated;
    user-select: none;
  }

  .pixel-btn:hover {
    background: #422818;
    color: #ffffff;
    box-shadow:
      inset 3px 3px 0 #73452b,
      inset -3px -3px 0 #1c0f09,
      0 6px 0 #000000;
  }

  .pixel-btn:active {
    transform: translateY(6px);
    box-shadow:
      inset 3px 3px 0 #130a06,
      inset -3px -3px 0 #543320,
      0 0 0 #000000;
  }

  .pixel-btn.primary {
    background: #d46816;
    color: #ffffff;
    box-shadow:
      inset 3px 3px 0 #f5a338,
      inset -3px -3px 0 #7d3305,
      0 6px 0 #000000;
  }

  .pixel-btn.primary:hover {
    background: #e87b28;
    box-shadow:
      inset 3px 3px 0 #ffbc5e,
      inset -3px -3px 0 #943d07,
      0 6px 0 #000000;
  }

  .pixel-btn.primary:active {
    transform: translateY(6px);
    box-shadow:
      inset 3px 3px 0 #7d3305,
      inset -3px -3px 0 #f5a338,
      0 0 0 #000000;
  }

  .pixel-btn.muted {
    background: #521c17;
    color: #fca5a5;
    box-shadow:
      inset 3px 3px 0 #782a23,
      inset -3px -3px 0 #310f0c,
      0 6px 0 #000000;
  }

  .pixel-btn.muted:hover {
    background: #69241e;
    color: #ffffff;
  }

  .pixel-btn.small {
    width: 140px;
    height: 38px;
    font-size: 18px;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #2b1a11;
    border-top: 3px solid #000000;
    padding: 9px 15px;
    box-shadow: inset 0 3px 0 #4d2f1b;
  }

  .esc-hint {
    font-size: 15px;
    font-weight: 700;
    color: #a8835d;
    letter-spacing: 0.6px;
  }
</style>
