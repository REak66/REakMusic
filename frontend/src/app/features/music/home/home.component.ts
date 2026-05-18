import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SongService } from '../../../core/services/song.service';
import { Song } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  featuredSongs: Song[] = [];
  trendingSongs: Song[] = [];
  loading = true;
  trendingLoading = true;

  constructor(private songService: SongService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.songService.getFeatured(6).subscribe({
      next: res => {
        this.featuredSongs = res.data || res as unknown as Song[];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
    this.songService.getTrending(10).subscribe({
      next: res => {
        this.trendingSongs = res.data || res as unknown as Song[];
        this.trendingLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.trendingLoading = false; this.cdr.markForCheck(); }
    });
  }

  getArtistName(song: Song): string {
    return typeof song.artistId === 'object' && song.artistId ? (song.artistId as { name: string }).name : '';
  }

  getThumbnail(song: Song): string {
    if (song.thumbnailId) {
      return `https://drive.google.com/thumbnail?id=${song.thumbnailId}`;
    }
    const artist = song.artistId as { imageUrl?: string } | null;
    if (artist && typeof artist === 'object' && artist.imageUrl) {
      return artist.imageUrl;
    }
    return 'assets/images/default-cover.svg';
  }
}
