import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SongService } from '../../../core/services/song.service';
import { GenreService } from '../../../core/services/genre.service';
import { Song, Genre, SongQueryParams } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongListComponent implements OnInit {
  songs: Song[] = [];
  genres: Genre[] = [];
  loading = false;
  total = 0;
  page = 1;
  limit = 12;
  totalPages = 1;

  filterForm!: FormGroup;
  sortOptions = [
    { value: '-createdAt', label: 'Newest' },
    { value: '-downloadCount', label: 'Most Popular' },
    { value: 'title', label: 'Title A-Z' }
  ];

  genreOptions = [
    { value: '', label: 'All Genres' }
  ];

  constructor(
    private songService: SongService,
    private genreService: GenreService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      search: [''],
      genre: [''],
      releaseYear: [''],
      sort: ['-createdAt']
    });

    this.genreService.getGenres().subscribe(genres => {
      this.genres = genres;
      this.genreOptions = [
        { value: '', label: 'All Genres' },
        ...genres.map(g => ({ value: g._id, label: g.name }))
      ];
      this.cdr.markForCheck();
    });

    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.loadSongs();
    });

    this.loadSongs();
  }

  loadSongs(): void {
    this.loading = true;
    const v = this.filterForm.value as {
      search: string; genre: string; releaseYear: string; sort: string;
    };
    const params: SongQueryParams = {
      page: this.page,
      limit: this.limit,
      sort: v.sort
    };
    if (v.search) params.search = v.search;
    if (v.genre) params.genre = v.genre;
    if (v.releaseYear) params.releaseYear = Number(v.releaseYear);

    this.songService.getSongs(params).subscribe({
      next: res => {
        this.songs = res.data || [];
        this.total = res.total;
        this.totalPages = res.totalPages;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  onPageChange(p: number): void {
    this.page = p;
    this.loadSongs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getArtistName(song: Song): string {
    return typeof song.artistId === 'object' && song.artistId
      ? (song.artistId as { name: string }).name : '';
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

  onLimitChange(size: number): void {
    this.limit = size;
    this.page = 1;
    this.loadSongs();
  }
}
