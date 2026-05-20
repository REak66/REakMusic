import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArtistService } from '../../../core/services/artist.service';
import { SongService } from '../../../core/services/song.service';
import { Artist, Song } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-artist-detail',
  templateUrl: './artist-detail.component.html',
  styleUrls: ['./artist-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArtistDetailComponent implements OnInit {
  artist: Artist | null = null;
  songs: Song[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private artistService: ArtistService,
    private songService: SongService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.artistService.getArtist(id).subscribe({
      next: artist => {
        this.artist = artist;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
    this.songService.getSongs({ artistId: id, limit: 20 }).subscribe({
      next: res => {
        this.songs = res.data || [];
        this.cdr.markForCheck();
      }
    });
  }

  getThumbnail(song: Song): string | null {
    if (song.thumbnailId) {
      return `https://drive.google.com/thumbnail?id=${song.thumbnailId}`;
    }
    if (this.artist?.imageUrl) {
      return this.artist.imageUrl;
    }
    return null;
  }
}
