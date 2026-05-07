import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { PlayerService } from '../player.service';
import { Song } from '../../../core/models';

@Component({
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

  constructor(public playerService: PlayerService) {}

  ngOnInit(): void {
    this.currentSong$ = this.playerService.currentSong$;
    this.isPlaying$ = this.playerService.isPlaying$;
    this.currentTime$ = this.playerService.currentTime$;
    this.duration$ = this.playerService.duration$;
    this.volume$ = this.playerService.volume$;
    this.isMuted$ = this.playerService.isMuted$;
  }

  onSeek(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.playerService.seek(Number(input.value));
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.playerService.setVolume(Number(input.value));
  }

  progressPercent(current: number, duration: number): number {
    if (!duration) return 0;
    return (current / duration) * 100;
  }
}
