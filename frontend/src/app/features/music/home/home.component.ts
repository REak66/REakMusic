import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SongService } from '../../../core/services/song.service';
import { GenreService } from '../../../core/services/genre.service';
import { ArtistService } from '../../../core/services/artist.service';
import { PlayerService } from '../../player/player.service';
import { CartService } from '../../../core/services/cart.service';
import { Song, Artist, Genre } from '../../../core/models';
import { environment } from '../../../../environments/environment';

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
  genres: Genre[] = [];
  artists: Artist[] = [];
  loading = true;
  trendingLoading = true;
  genresLoading = true;
  artistsLoading = true;

  stats = {
    tracks: '12K+',
    producers: '350+',
    downloads: '850K+'
  };

  constructor(
    private songService: SongService,
    private genreService: GenreService,
    private artistService: ArtistService,
    public playerService: PlayerService,
    public cartService: CartService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.songService.getFeatured(10).subscribe({
      next: res => {
        const data = (res && (res.data || res)) as Song[];
        this.featuredSongs = Array.isArray(data) ? data.slice(0, 10) : [];
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

    this.genreService.getGenres().subscribe({
      next: res => {
        this.genres = Array.isArray(res) ? res.slice(0, 8) : [];
        this.genresLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.genresLoading = false; this.cdr.markForCheck(); }
    });

    this.artistService.getArtists({ limit: 6 }).subscribe({
      next: (res: any) => {
        this.artists = res.data?.artists || [];
        this.artistsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.artistsLoading = false; this.cdr.markForCheck(); }
    });
  }

  getArtistName(song: Song): string {
    return typeof song.artistId === 'object' && song.artistId ? (song.artistId as { name: string }).name : '';
  }

  getGenreName(song: Song): string {
    if (!song.genre || song.genre.length === 0) return '';
    const first = song.genre[0];
    return typeof first === 'object' && first ? (first as { name: string }).name : String(first);
  }

  getThumbnail(song: Song): string {
    if (song.thumbnailId) {
      return `https://drive.google.com/thumbnail?id=${song.thumbnailId}`;
    }
    const artist = song.artistId as { imageUrl?: string } | null;
    if (artist && typeof artist === 'object' && artist.imageUrl) {
      return artist.imageUrl;
    }
    return 'assets/images/music.png';
  }

  getArtistAvatar(artist: Artist): string {
    return artist.imageUrl || 'assets/images/music.png';
  }

  getGenreGradient(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
      'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
    ];
    return gradients[index % gradients.length];
  }

  isInCart(song: Song): boolean {
    return this.cartService.isInCart(song._id);
  }

  toggleCart(event: Event, song: Song): void {
    event.stopPropagation();
    if (this.isInCart(song)) {
      this.cartService.removeFromCart(song._id);
    } else {
      this.cartService.addToCart(song);
    }
  }

  playSong(event: Event, song: Song): void {
    event.stopPropagation();

    const currentSong = (this.playerService as any).currentSongSubject?.value as Song | null;

    if (currentSong && currentSong._id === song._id) {
      this.playerService.togglePlay();
    } else {
      const url = (song.driveFileId || song.driveLink)
        ? `${environment.apiUrl}/songs/${song._id}/stream`
        : (song.previewUrl || null);
      if (url) {
        this.playerService.play({ ...song, previewUrl: url });
      }
    }
  }
}
