import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpDownloadProgressEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { UserService } from '../../../core/services/user.service';
import { SongService } from '../../../core/services/song.service';
import { AuthService } from '../../../core/services/auth.service';
import { Song } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryComponent implements OnInit {
  songs: Song[] = [];
  loading = true;
  loadTotal = 0;
  loadedCount = 0;
  downloadingId: string | null = null;
  /** 0–100 while downloading; -1 means indeterminate (no Content-Length header) */
  downloadProgress = 0;

  constructor(
    private userService: UserService,
    private songService: SongService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: user => {
        if (!user.purchasedSongs?.length) {
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
        this.loadTotal = user.purchasedSongs.length;
        this.loadedCount = 0;
        const requests = user.purchasedSongs.map(id =>
          this.songService.getSong(id)
        );
        let completed = 0;
        requests.forEach(req => {
          req.subscribe({
            next: song => {
              this.songs.push(song);
              completed++;
              this.loadedCount = completed;
              if (completed === requests.length) {
                this.loading = false;
              }
              this.cdr.markForCheck();
            },
            error: () => {
              completed++;
              this.loadedCount = completed;
              if (completed === requests.length) {
                this.loading = false;
                this.cdr.markForCheck();
              }
            }
          });
        });
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  get loadProgress(): number {
    if (!this.loadTotal) return 0;
    return Math.round((this.loadedCount / this.loadTotal) * 100);
  }

  download(song: Song): void {
    if (this.downloadingId) return;
    this.downloadingId = song._id;
    this.downloadProgress = 0;
    this.cdr.markForCheck();

    this.songService.downloadSongWithProgress(song._id).subscribe({
      next: event => {
        if (event.type === HttpEventType.DownloadProgress) {
          const e = event as HttpDownloadProgressEvent;
          this.downloadProgress = e.total
            ? Math.round((e.loaded / e.total) * 100)
            : -1;   // indeterminate when no Content-Length
          this.cdr.markForCheck();
        } else if (event.type === HttpEventType.Response) {
          this.downloadProgress = 100;
          this.cdr.markForCheck();
          const blob = (event as HttpResponse<Blob>).body!;
          this.saveBlobAs(blob, `${song.title}.mp3`).then(() => {
            this.downloadingId = null;
            this.downloadProgress = 0;
            this.cdr.markForCheck();
          });
        }
      },
      error: () => {
        this.downloadingId = null;
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

  getThumbnail(song: Song): string {
    return song.thumbnailId
      ? `https://drive.google.com/thumbnail?id=${song.thumbnailId}`
      : 'assets/images/default-cover.svg';
  }
}
