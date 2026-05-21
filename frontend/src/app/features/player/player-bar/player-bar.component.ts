import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, combineLatest, map } from 'rxjs';
import { PlayerService } from '../player.service';
import { Song, Artist } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-player-bar',
  templateUrl: './player-bar.component.html',
  styleUrls: ['./player-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerBarComponent implements OnInit {
  currentSong$!: Observable<Song | null>;
  isPlaying$!: Observable<boolean>;
  currentTime$!: Observable<number>;
  duration$!: Observable<number>;
  volume$!: Observable<number>;
  isMuted$!: Observable<boolean>;
  shuffle$!: Observable<boolean>;
  repeatMode$!: Observable<string>;

  private _currentTime = 0;
  private _duration = 0;
  private _repeatMode: string = 'off';
  isMinimized = false;

  constructor(
    public playerService: PlayerService,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    this.currentSong$ = this.playerService.currentSong$;
    this.isPlaying$ = this.playerService.isPlaying$;
    this.currentTime$ = this.playerService.currentTime$;
    this.duration$ = this.playerService.duration$;
    this.volume$ = this.playerService.volume$;
    this.isMuted$ = this.playerService.isMuted$;
    this.shuffle$ = this.playerService.shuffle$;
    this.repeatMode$ = this.playerService.repeatMode$;

    this.currentTime$.subscribe(t => (this._currentTime = t));
    this.duration$.subscribe(d => (this._duration = d));
    this.repeatMode$.subscribe(m => (this._repeatMode = m));
  }

  onSeek(event: Event): void {
    this.playerService.seek(Number((event.target as HTMLInputElement).value));
  }

  onVolumeChange(event: Event): void {
    this.playerService.setVolume(Number((event.target as HTMLInputElement).value));
  }

  onProgressClick(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const ratio = event.offsetX / el.clientWidth;
    this.playerService.seek(ratio * this._duration);
  }

  getProgressPercent(): number {
    return this._duration ? (this._currentTime / this._duration) * 100 : 0;
  }

  getCoverUrl(song: Song): string {
    if (song.thumbnailId) {
      return `https://drive.google.com/thumbnail?id=${song.thumbnailId}&sz=w200`;
    }
    const artist = song.artistId as Artist;
    if (artist?.imageUrl) return artist.imageUrl;
    return 'assets/images/music.png';
  }

  getArtistName(song: Song): string {
    const artist = song.artistId as Artist;
    return artist?.name ?? 'Unknown Artist';
  }

  getRepeatTitle(): string {
    const mode = this._repeatMode;
    if (mode === 'one') return 'Repeat one';
    if (mode === 'all') return 'Repeat all';
    return 'Repeat off';
  }

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      this.document.body.classList.add('player-minimized');
    } else {
      this.document.body.classList.remove('player-minimized');
    }
  }
}
