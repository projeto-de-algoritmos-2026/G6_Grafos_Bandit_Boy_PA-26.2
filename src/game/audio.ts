import soundtrackSrc from '../../assets/Desert Stage 4.mp3';
import heroJumpWav from '../../assets/hero-jump.wav';
import slimeJumpWav from '../../assets/slime-jump.wav';
import bombWav from '../../assets/bomb.wav';
import { BOMB_FUSE_SECONDS } from './constants';

function normalizeAudioBuffer(buffer: AudioBuffer, targetPeak = 0.85): void {
  let max = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > max) max = abs;
    }
  }
  if (max > 0.0001 && max < targetPeak) {
    const scale = targetPeak / max;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) data[i] *= scale;
    }
  }
}

export class SfxManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private volumePercent = 10;

  private heroJumpBuffer: AudioBuffer | null = null;
  private slimeJumpBuffer: AudioBuffer | null = null;
  private bombBuffer: AudioBuffer | null = null;

  private lastHeroJumpTime = 0;
  private lastSlimeJumpTime = 0;
  private nextBombSoundId = 1;
  private activeBombSounds = new Map<number, { source: AudioBufferSourceNode; startTime: number }>();

  constructor(isMuted = false) {
    this.isMuted = isMuted;
    try {
      if (!localStorage.getItem('bandit_audio_default_v10')) {
        localStorage.setItem('bandit_audio_default_v10', 'true');
        localStorage.setItem('bandit_sfx_volume', '10');
        localStorage.setItem('bandit_music_volume', '10');
      }
      const savedVol = localStorage.getItem('bandit_sfx_volume');
      if (savedVol !== null) {
        this.volumePercent = Math.max(0, Math.min(100, Number(savedVol)));
      }
    } catch {}
    this.initContext();
    this.loadAllBuffers();
  }

  private initContext(): void {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : this.volumePercent / 100;
    this.masterGain.connect(this.ctx.destination);
  }

  public setVolume(percent: number): void {
    this.volumePercent = Math.max(0, Math.min(100, percent));
    try {
      localStorage.setItem('bandit_sfx_volume', String(this.volumePercent));
    } catch {}
    if (this.masterGain && this.ctx) {
      const gain = this.isMuted ? 0 : this.volumePercent / 100;
      this.masterGain.gain.setValueAtTime(gain, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volumePercent;
  }

  private async loadBuffer(url: string, normalize = false, targetPeak = 0.85): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    try {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      if (normalize) normalizeAudioBuffer(audioBuffer, targetPeak);
      return audioBuffer;
    } catch {
      return null;
    }
  }

  private async loadAllBuffers(): Promise<void> {
    const [hero, slime, bomb] = await Promise.all([
      this.loadBuffer(heroJumpWav, true, 0.85),
      this.loadBuffer(slimeJumpWav, true, 0.95),
      this.loadBuffer(bombWav, false),
    ]);
    this.heroJumpBuffer = hero;
    this.slimeJumpBuffer = slime;
    this.bombBuffer = bomb;
  }

  public unlockAudio(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volumePercent / 100, this.ctx.currentTime);
    }
  }

  public playHeroJump(): void {
    if (this.isMuted || !this.ctx || !this.heroJumpBuffer) return;
    const now = performance.now();
    if (now - this.lastHeroJumpTime < 60) return;
    this.lastHeroJumpTime = now;

    this.unlockAudio();
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.heroJumpBuffer;
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0.65;
      source.connect(gainNode);
      gainNode.connect(this.masterGain!);
      source.start(0);
    } catch {}
  }

  public playSlimeJump(distanceTiles?: number): void {
    if (this.isMuted || !this.ctx || !this.slimeJumpBuffer) return;
    const now = performance.now();
    if (now - this.lastSlimeJumpTime < 60) return;
    this.lastSlimeJumpTime = now;

    this.unlockAudio();
    try {
      const volume = distanceTiles === undefined ? 0.8 : distanceTiles <= 4 ? 0.85 : distanceTiles <= 8 ? 0.75 : 0.65;
      const source = this.ctx.createBufferSource();
      source.buffer = this.slimeJumpBuffer;
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = volume;
      source.connect(gainNode);
      gainNode.connect(this.masterGain!);
      source.start(0);
    } catch {}
  }

  public playBombArming(): number {
    const soundId = this.nextBombSoundId++;
    if (!this.ctx || !this.bombBuffer) return soundId;

    this.unlockAudio();
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.bombBuffer;
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0.85;
      source.connect(gainNode);
      gainNode.connect(this.masterGain!);

      const startTime = this.ctx.currentTime;
      source.start(0, 0);

      this.activeBombSounds.set(soundId, { source, startTime });
      source.onended = () => {
        if (this.activeBombSounds.get(soundId)?.source === source) {
          this.activeBombSounds.delete(soundId);
        }
      };
    } catch {}

    return soundId;
  }

  private playExplosionSound(): void {
    if (!this.ctx || !this.bombBuffer) return;
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.bombBuffer;
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0.95;
      source.connect(gainNode);
      gainNode.connect(this.masterGain!);
      source.start(0, BOMB_FUSE_SECONDS);
    } catch {}
  }

  public detonateBomb(soundId?: number): void {
    if (!this.ctx || !this.bombBuffer) return;
    this.unlockAudio();

    if (soundId !== undefined && this.activeBombSounds.has(soundId)) {
      const active = this.activeBombSounds.get(soundId)!;
      this.activeBombSounds.delete(soundId);
      const elapsed = this.ctx.currentTime - active.startTime;

      if (elapsed < BOMB_FUSE_SECONDS - 0.065) {
        try { active.source.stop(); } catch {}
        this.playExplosionSound();
      }
      return;
    }

    this.playExplosionSound();
  }

  public stopBomb(soundId?: number): void {
    if (soundId !== undefined && this.activeBombSounds.has(soundId)) {
      try {
        this.activeBombSounds.get(soundId)!.source.stop();
      } catch {}
      this.activeBombSounds.delete(soundId);
    }
  }

  public stopAllBombSounds(): void {
    for (const { source } of this.activeBombSounds.values()) {
      try { source.stop(); } catch {}
    }
    this.activeBombSounds.clear();
  }

  public destroy(): void {
    this.stopAllBombSounds();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export class SoundtrackManager {
  private audio: HTMLAudioElement;
  private volumePercent = 10;
  private get targetVolume(): number {
    return (this.volumePercent / 100) * 0.38;
  }
  private fadeAnimationId: number | null = null;
  private isMuted = false;
  private isPlaying = false;
  private removeUnlockListeners?: () => void;
  private sfxManager?: SfxManager;

  constructor() {
    this.audio = new Audio(soundtrackSrc);
    this.audio.loop = true;
    this.audio.volume = 0;
    this.audio.preload = 'auto';

    try {
      const saved = localStorage.getItem('bandit_soundtrack_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
      const savedVol = localStorage.getItem('bandit_music_volume');
      if (savedVol !== null) {
        this.volumePercent = Math.max(0, Math.min(100, Number(savedVol)));
      }
    } catch {}

    const unlock = () => this.unlockAudio();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    this.removeUnlockListeners = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }

  public setVolume(percent: number): void {
    this.volumePercent = Math.max(0, Math.min(100, percent));
    try {
      localStorage.setItem('bandit_music_volume', String(this.volumePercent));
    } catch {}
    if (this.fadeAnimationId === null && this.isPlaying) {
      this.audio.volume = this.isMuted ? 0 : this.targetVolume;
    }
  }

  public getVolume(): number {
    return this.volumePercent;
  }

  public setSfxManager(sfx: SfxManager): void {
    this.sfxManager = sfx;
    this.sfxManager.setMuted(this.isMuted);
  }

  public startMenu(fadeInDuration = 1.2): void {
    this.isPlaying = true;
    this.fadeIn(fadeInDuration);
  }

  public startPhase(fadeInDuration = 1.0): void {
    this.isPlaying = true;
    this.fadeIn(fadeInDuration);
  }

  public endPhase(fadeOutDuration = 0.55): void {
    this.fadeOut(fadeOutDuration, false);
  }

  public onGameOver(fadeOutDuration = 0.8): void {
    this.fadeOut(fadeOutDuration, true);
  }

  public stop(): void {
    this.isPlaying = false;
    this.cancelFade();
    this.audio.pause();
    this.audio.volume = 0;
  }

  private fadeTo(destVol: number, duration: number, pauseOnEnd = false): void {
    this.cancelFade();
    if (duration <= 0) {
      this.audio.volume = destVol;
      if (pauseOnEnd && destVol === 0) this.audio.pause();
      return;
    }

    const startVol = this.audio.volume;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const current = startVol + (destVol - startVol) * progress;
      this.audio.volume = Math.max(0, Math.min(1, current));

      if (progress < 1) {
        this.fadeAnimationId = requestAnimationFrame(step);
      } else {
        this.fadeAnimationId = null;
        if (pauseOnEnd && destVol === 0) {
          this.audio.pause();
        }
      }
    };

    this.fadeAnimationId = requestAnimationFrame(step);
  }

  public fadeIn(duration = 1.0): void {
    this.audio.play().catch(() => {});
    this.fadeTo(this.isMuted ? 0 : this.targetVolume, duration);
  }

  public fadeOut(duration = 0.55, pauseOnEnd = false): void {
    this.fadeTo(0, duration, pauseOnEnd);
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('bandit_soundtrack_muted', String(this.isMuted));
    } catch {}

    this.sfxManager?.setMuted(muted);

    if (this.isMuted) {
      this.cancelFade();
      this.audio.volume = 0;
    } else if (this.isPlaying) {
      this.fadeIn(0.5);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public unlockAudio(): void {
    if (this.isPlaying && this.audio.paused && !this.isMuted) {
      this.audio.play().catch(() => {});
    }
    this.sfxManager?.unlockAudio();
  }

  public destroy(): void {
    this.removeUnlockListeners?.();
    this.stop();
    this.audio.src = '';
  }

  private cancelFade(): void {
    if (this.fadeAnimationId !== null) {
      cancelAnimationFrame(this.fadeAnimationId);
      this.fadeAnimationId = null;
    }
  }
}
