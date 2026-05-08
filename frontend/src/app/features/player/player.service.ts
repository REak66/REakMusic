import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Song } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private audio = new Audio();

  private currentSongSubject = new BehaviorSubject<Song | null>(null);
  private queueSubject = new BehaviorSubject<Song[]>([]);
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  private currentTimeSubject = new BehaviorSubject<number>(0);
  private durationSubject = new BehaviorSubject<number>(0);
  private volumeSubject = new BehaviorSubject<number>(1);
  private isMutedSubject = new BehaviorSubject<boolean>(false);
  private shuffleSubject = new BehaviorSubject<boolean>(false);
  private repeatModeSubject = new BehaviorSubject<'off' | 'all' | 'one'>('off');

  currentSong$ = this.currentSongSubject.asObservable();
  queue$ = this.queueSubject.asObservable();
  isPlaying$ = this.isPlayingSubject.asObservable();
  currentTime$ = this.currentTimeSubject.asObservable();
  duration$ = this.durationSubject.asObservable();
  volume$ = this.volumeSubject.asObservable();
  isMuted$ = this.isMutedSubject.asObservable();
  shuffle$ = this.shuffleSubject.asObservable();
  repeatMode$ = this.repeatModeSubject.asObservable();

  constructor() {
    this.audio.addEventListener('timeupdate', () => {
      this.currentTimeSubject.next(this.audio.currentTime);
    });
    this.audio.addEventListener('loadedmetadata', () => {
      this.durationSubject.next(this.audio.duration);
    });
    this.audio.addEventListener('ended', () => {
      if (this.repeatModeSubject.value === 'one') {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => { });
      } else {
        this.next();
      }
    });
    this.audio.addEventListener('play', () => this.isPlayingSubject.next(true));
    this.audio.addEventListener('pause', () => this.isPlayingSubject.next(false));
  }

  play(song: Song): void {
    const url = song.previewUrl;
    if (!url) return;
    this.currentSongSubject.next(song);
    this.audio.src = url;
    this.audio.load();
    this.audio.play().catch(() => { });
  }

  pause(): void {
    this.audio.pause();
  }

  resume(): void {
    this.audio.play().catch(() => { });
  }

  togglePlay(): void {
    if (this.audio.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  next(): void {
    const queue = this.queueSubject.value;
    const current = this.currentSongSubject.value;
    if (!current || queue.length === 0) return;
    if (this.repeatModeSubject.value === 'one') {
      this.seek(0);
      this.resume();
      return;
    }
    if (this.shuffleSubject.value) {
      const others = queue.filter(s => s._id !== current._id);
      if (others.length > 0) {
        this.play(others[Math.floor(Math.random() * others.length)]);
      }
      return;
    }
    const idx = queue.findIndex(s => s._id === current._id);
    const nextSong = queue[idx + 1] ?? (this.repeatModeSubject.value === 'all' ? queue[0] : null);
    if (nextSong) this.play(nextSong);
  }

  previous(): void {
    const queue = this.queueSubject.value;
    const current = this.currentSongSubject.value;
    if (!current || queue.length === 0) return;
    const idx = queue.findIndex(s => s._id === current._id);
    const prevSong = queue[idx - 1] ?? queue[queue.length - 1];
    this.play(prevSong);
  }

  toggleShuffle(): void {
    this.shuffleSubject.next(!this.shuffleSubject.value);
  }

  toggleRepeat(): void {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const current = this.repeatModeSubject.value;
    const idx = modes.indexOf(current);
    this.repeatModeSubject.next(modes[(idx + 1) % modes.length]);
  }

  seek(time: number): void {
    this.audio.currentTime = time;
  }

  setVolume(vol: number): void {
    this.audio.volume = vol;
    this.volumeSubject.next(vol);
    if (vol > 0) this.isMutedSubject.next(false);
  }

  toggleMute(): void {
    const muted = !this.audio.muted;
    this.audio.muted = muted;
    this.isMutedSubject.next(muted);
  }

  addToQueue(song: Song): void {
    const queue = [...this.queueSubject.value];
    if (!queue.find(s => s._id === song._id)) {
      queue.push(song);
      this.queueSubject.next(queue);
    }
  }

  removeFromQueue(songId: string): void {
    this.queueSubject.next(this.queueSubject.value.filter(s => s._id !== songId));
  }

  clearQueue(): void {
    this.queueSubject.next([]);
    this.audio.pause();
    this.audio.src = '';
    this.currentSongSubject.next(null);
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
