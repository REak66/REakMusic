import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpDownloadProgressEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { SongService } from '../../../core/services/song.service';
import { AuthService } from '../../../core/services/auth.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { PlayerService } from '../../player/player.service';
import { Song, Genre, Artist } from '../../../core/models';
import { environment } from '../../../../environments/environment';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
  hasActiveSubscription = false;
  downloading = false;
  /** 0–100 while downloading; -1 = indeterminate (no Content-Length) */
  downloadProgress = 0;
  downloadError = '';

  constructor(
    private route: ActivatedRoute,
    private songService: SongService,
    public authService: AuthService,
    private subscriptionService: SubscriptionService,
    public playerService: PlayerService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const song$ = this.songService.getSong(id);
    const sub$ = this.authService.getCurrentUser()
      ? this.subscriptionService.getMySubscription().pipe(catchError(() => of(null)))
      : of(null);

    forkJoin({ song: song$, subscription: sub$ }).subscribe({
      next: ({ song, subscription }) => {
        this.song = song;
        this.hasActiveSubscription = subscription?.status === 'active';
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
    return 'assets/images/music.png';
  }

  get isOwned(): boolean {
    return false;
  }

  /** Any logged-in user can download songs now */
  get canDownload(): boolean {
    return this.isLoggedIn;
  }

  get isLoggedIn(): boolean {
    return !!this.authService.getCurrentUser();
  }

  download(): void {
    if (!this.song || this.downloading) return;
    this.downloading = true;
    this.downloadError = '';
    this.cdr.markForCheck();
    const songTitle = this.song.title;
    const songId = this.song._id;
    this.songService.downloadSongWithProgress(songId).subscribe({
      next: event => {
        if (event.type === HttpEventType.DownloadProgress) {
          const e = event as HttpDownloadProgressEvent;
          this.downloadProgress = e.total
            ? Math.round((e.loaded / e.total) * 100)
            : -1;
          this.cdr.markForCheck();
        } else if (event.type === HttpEventType.Response) {
          this.downloadProgress = 100;
          this.cdr.markForCheck();
          const blob = (event as HttpResponse<Blob>).body!;
          this.saveBlobAs(blob, `${songTitle}.mp3`).then(() => {
            this.downloading = false;
            this.downloadProgress = 0;
            if (this.song) this.song = { ...this.song, downloadCount: (this.song.downloadCount || 0) + 1 };
            this.cdr.markForCheck();
          });
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.downloadError = err.error?.message || 'Download failed.';
        this.downloading = false;
        this.downloadProgress = 0;
        this.cdr.markForCheck();
      }
    });
  }

  private async saveBlobAs(blob: Blob, filename: string): Promise<void> {
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'Audio File', accept: { 'audio/*': ['.mp3', '.wav', '.flac'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (e) {
        if ((e as any).name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
