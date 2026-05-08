import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    private userService: UserService,
    private songService: SongService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: user => {
        if (!user.purchasedSongs?.length) {
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
        const requests = user.purchasedSongs.map(id =>
          this.songService.getSong(id)
        );
        let completed = 0;
        requests.forEach(req => {
          req.subscribe({
            next: song => {
              this.songs.push(song);
              completed++;
              if (completed === requests.length) {
                this.loading = false;
              }
              this.cdr.markForCheck();
            },
            error: () => {
              completed++;
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

  download(songId: string): void {
    this.songService.downloadSong(songId).subscribe({
      next: res => { window.open(res.downloadUrl, '_blank'); }
    });
  }

  getThumbnail(song: Song): string {
    return song.thumbnailId
      ? `https://drive.google.com/thumbnail?id=${song.thumbnailId}`
      : 'assets/images/default-cover.svg';
  }
}
