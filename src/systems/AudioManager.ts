// src/systems/AudioManager.ts

export const MUSIC_MANIFEST = {

  menu: '/assets/audio/music/menu/00_main_theme.mp3',

  eternal_crown: '/assets/audio/music/realms/01_eternal_crown.mp3',

  elven_throne: '/assets/audio/music/realms/02_elven_throne.mp3',

  iron_bastion: '/assets/audio/music/realms/03_iron_bastion.mp3',

  ash_throne: '/assets/audio/music/realms/04_ash_throne.mp3',

  draconic_empire: '/assets/audio/music/realms/05_draconic_empire.mp3',

  shadow_court: '/assets/audio/music/realms/06_shadow_court.mp3',

  celestial_sanctuary: '/assets/audio/music/realms/07_celestial_sanctuary.mp3',

  snow_dominion: '/assets/audio/music/realms/08_snow_dominion.mp3',

  sand_kingdom: '/assets/audio/music/realms/09_sand_kingdom.mp3',

  void_throne: '/assets/audio/music/realms/10_void_throne.mp3',

} as const;



export class AudioManager {
  private ctx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentTrackKey: string | null = null;
  private pendingPlayOnGesture: HTMLAudioElement | null = null;
  private isUnlocked = false;

  private masterVolume = 0.85;
  private musicVolume = 0.7;
  private sfxVolume = 0.8;
  private muted = false;

  constructor() {
    this.setupUserInteractionUnlock();
  }

  private setupUserInteractionUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlockAudio();
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
    window.addEventListener('click', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
  }

  public unlockAudio(): void {
    // 1. Resumir AudioContext si está suspendido
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    } else if (!this.ctx) {
      this.ensureContext();
    }

    // 2. Reproducir música en cola si el navegador había bloqueado el autoplay
    if (this.pendingPlayOnGesture) {
      const audio = this.pendingPlayOnGesture;
      this.pendingPlayOnGesture = null;
      audio.play().catch((err) => {
        console.warn('[AudioManager] Reintento de reproducción tras interacción:', err);
      });
    } else if (this.currentAudio && this.currentAudio.paused && !this.muted) {
      this.currentAudio.play().catch(() => {});
    }

    this.isUnlocked = true;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playMusic(trackKey: keyof typeof MUSIC_MANIFEST): void {
    if (this.currentTrackKey === trackKey && this.currentAudio && !this.currentAudio.paused) return;
    this.currentTrackKey = trackKey;

    const rawSrc = MUSIC_MANIFEST[trackKey];
    const metaEnv = (import.meta as unknown as { env?: { BASE_URL?: string } })?.env;
    const base = metaEnv?.BASE_URL ? metaEnv.BASE_URL.replace(/\/$/, '') : '';
    const src = base + rawSrc;

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = this.muted ? 0 : this.masterVolume * this.musicVolume;
    this.currentAudio = audio;

    audio.play().catch((err) => {
      // Si el navegador bloqueó el autoplay por falta de interacción del usuario (común en móviles),
      // se deja en cola para reproducirse en cuanto el usuario toque cualquier punto de la pantalla
      console.warn(`[AudioManager] Autoplay esperando interacción del usuario (${err?.name || 'NotAllowedError'}). En cola para el primer toque.`);
      this.pendingPlayOnGesture = audio;
    });
  }



  public playSfx(type: 'move' | 'capture' | 'check' | 'victory' | 'defeat'): void {

    if (this.muted) return;

    const ctx = this.ensureContext();

    if (!ctx) return;



    const osc = ctx.createOscillator();

    const gain = ctx.createGain();

    osc.connect(gain);

    gain.connect(ctx.destination);



    const now = ctx.currentTime;

    const vol = this.masterVolume * this.sfxVolume * 0.25;



    if (type === 'move') {

      osc.type = 'triangle';

      osc.frequency.setValueAtTime(140, now);

      osc.frequency.exponentialRampToValueAtTime(65, now + 0.09);

      gain.gain.setValueAtTime(vol, now);

      gain.gain.linearRampToValueAtTime(0.01, now + 0.09);

      osc.start(now);

      osc.stop(now + 0.09);

    } else if (type === 'capture') {

      osc.type = 'sawtooth';

      osc.frequency.setValueAtTime(190, now);

      osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);

      gain.gain.setValueAtTime(vol * 1.3, now);

      gain.gain.linearRampToValueAtTime(0.01, now + 0.16);

      osc.start(now);

      osc.stop(now + 0.16);

    } else if (type === 'check') {

      osc.type = 'sine';

      osc.frequency.setValueAtTime(520, now);

      osc.frequency.exponentialRampToValueAtTime(260, now + 0.35);

      gain.gain.setValueAtTime(vol * 1.4, now);

      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

      osc.start(now);

      osc.stop(now + 0.35);

    }

  }



  public setVolumes(master: number, music: number, sfx: number, muted: boolean): void {

    this.masterVolume = master;

    this.musicVolume = music;

    this.sfxVolume = sfx;

    this.muted = muted;

    if (this.currentAudio) {

      this.currentAudio.volume = this.muted ? 0 : this.masterVolume * this.musicVolume;

    }

  }

}
