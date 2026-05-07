import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { PlayerService } from '../player.service';
import { Song } from '../../../core/models';

@Component({
  selector: 'app-mini-player',
  templateUrl: './mini-player.component.html',
  styleUrls: ['./mini-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniPlayerComponent {
  currentSong$: Observable<Song | null>;
  isPlaying$: Observable<boolean>;

  constructor(public playerService: PlayerService) {
    this.currentSong$ = playerService.currentSong$;
    this.isPlaying$ = playerService.isPlaying$;
  }
}
