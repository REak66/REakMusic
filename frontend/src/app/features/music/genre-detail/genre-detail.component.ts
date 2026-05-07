import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GenreService } from '../../../core/services/genre.service';
import { SongService } from '../../../core/services/song.service';
import { Genre, Song } from '../../../core/models';

@Component({
  selector: 'app-genre-detail',
  templateUrl: './genre-detail.component.html',
  styleUrls: ['./genre-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenreDetailComponent implements OnInit {
  genre: Genre | null = null;
  songs: Song[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private genreService: GenreService,
    private songService: SongService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.genreService.getGenre(slug).subscribe({
      next: genre => {
        this.genre = genre;
        this.loading = false;
        this.cdr.markForCheck();
        this.songService.getSongs({ genre: genre._id, limit: 20 }).subscribe({
          next: res => { this.songs = res.data || []; this.cdr.markForCheck(); }
        });
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  getThumbnail(song: Song): string {
    return song.thumbnailId
      ? `https://drive.google.com/thumbnail?id=${song.thumbnailId}`
      : 'assets/images/default-cover.svg';
  }

  getArtistName(song: Song): string {
    return typeof song.artistId === 'object' && song.artistId
      ? (song.artistId as { name: string }).name : '';
  }
}
