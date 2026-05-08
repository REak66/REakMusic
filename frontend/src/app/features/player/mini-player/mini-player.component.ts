import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { PlayerService } from '../player.service';
import { Song, Artist } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-mini-player',
  templateUrl: './mini-player.component.html',
  styleUrls: ['./mini-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniPlayerComponent implements OnInit {
  currentSong$!: Observable<Song | null>;
  isPlaying$!: Observable<boolean>;
  progressPercent$!: Observable<number>;

  constructor(public playerService: PlayerService) { }

  ngOnInit(): void {
    this.currentSong$ = this.playerService.currentSong$;
    this.isPlaying$ = this.playerService.isPlaying$;
    this.progressPercent$ = combineLatest([
      this.playerService.currentTime$,
      this.playerService.duration$
    ]).pipe(
      map(([t, d]) => (d ? (t / d) * 100 : 0))
    );
  }

  getCoverUrl(song: Song): string {
    if (song.thumbnailId) {
      return `https://drive.google.com/thumbnail?id=${song.thumbnailId}&sz=w120`;
    }
    const artist = song.artistId as Artist;
    return artist?.imageUrl ?? 'assets/images/default-cover.svg';
  }

  getArtistName(song: Song): string {
    const artist = song.artistId as Artist;
    return artist?.name ?? 'Unknown Producer';
  }
}
