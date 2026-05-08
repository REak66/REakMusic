import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SongService } from '../../../core/services/song.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { PlayerService } from '../../player/player.service';
import { Song, Genre, Artist } from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-song-detail',
  templateUrl: './song-detail.component.html',
  styleUrls: ['./song-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongDetailComponent implements OnInit {
  song: Song | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private songService: SongService,
    public cartService: CartService,
    public authService: AuthService,
    public playerService: PlayerService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.songService.getSong(id).subscribe({
      next: song => {
        this.song = song;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Song not found.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get artist(): Artist | null {
    if (!this.song) return null;
    return typeof this.song.artistId === 'object' ? (this.song.artistId as Artist) : null;
  }

  get genres(): Genre[] {
    if (!this.song) return [];
    return (this.song.genre || []).filter(g => typeof g === 'object') as Genre[];
  }

  get thumbnail(): string {
    if (this.song?.thumbnailId) {
      return `https://drive.google.com/thumbnail?id=${this.song.thumbnailId}`;
    }
    if (this.artist?.imageUrl) {
      return this.artist.imageUrl;
    }
    return 'assets/images/default-cover.svg';
  }

  get isOwned(): boolean {
    return this.song ? this.authService.hasPurchased(this.song._id) : false;
  }

  download(): void {
    if (!this.song) return;
    this.songService.downloadSong(this.song._id).subscribe({
      next: res => { window.open(res.downloadUrl, '_blank'); }
    });
  }

  playPreview(): void {
    if (!this.song) return;
    // Prefer the backend stream endpoint when a Drive file exists, since
    // song.previewUrl may contain a Drive share/view URL (HTML page, not audio).
    const url = (this.song.driveFileId || this.song.driveLink)
      ? `${environment.apiUrl}/songs/${this.song._id}/stream`
      : (this.song.previewUrl || null);
    if (!url) return;
    this.playerService.play({ ...this.song, previewUrl: url });
  }
}
