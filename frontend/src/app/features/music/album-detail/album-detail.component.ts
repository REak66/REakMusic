import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlbumService } from '../../../core/services/album.service';
import { SongService } from '../../../core/services/song.service';
import { Album, Song } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-album-detail',
  templateUrl: './album-detail.component.html',
  styleUrls: ['./album-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlbumDetailComponent implements OnInit {
  album: Album | null = null;
  songs: Song[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private albumService: AlbumService,
    private songService: SongService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.albumService.getAlbum(id).subscribe({
      next: album => {
        this.album = album;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
    this.songService.getSongs({ albumId: id, limit: 50 }).subscribe({
      next: res => {
        this.songs = res.data || [];
        this.cdr.markForCheck();
      }
    });
  }

  getThumbnail(song: Song): string {
    return song.thumbnailId
      ? `https://drive.google.com/thumbnail?id=${song.thumbnailId}`
      : 'assets/images/default-cover.svg';
  }
}
