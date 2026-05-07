import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SongService } from '../../../core/services/song.service';
import { ArtistService } from '../../../core/services/artist.service';
import { GenreService } from '../../../core/services/genre.service';
import { Song, Artist, Genre } from '../../../core/models';

@Component({
  selector: 'app-song-management',
  templateUrl: './song-management.component.html',
  styleUrls: ['./song-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongManagementComponent implements OnInit {
  songs: Song[] = [];
  artists: Artist[] = [];
  genres: Genre[] = [];
  loading = false;
  showModal = false;
  editingSong: Song | null = null;
  form!: FormGroup;
  error = '';
  saving = false;

  constructor(
    private songService: SongService,
    private artistService: ArtistService,
    private genreService: GenreService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  initForm(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      artistId: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      releaseYear: [''],
      description: [''],
      isFeatured: [false]
    });
  }

  loadData(): void {
    this.loading = true;
    this.songService.getSongs({ limit: 50 }).subscribe({
      next: res => {
        this.songs = res.data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
    this.artistService.getArtists({ limit: 100 }).subscribe({
      next: res => { this.artists = res.data || []; this.cdr.markForCheck(); }
    });
    this.genreService.getGenres().subscribe({
      next: genres => { this.genres = genres; this.cdr.markForCheck(); }
    });
  }

  openAdd(): void {
    this.editingSong = null;
    this.form.reset({ price: 0, isFeatured: false });
    this.showModal = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  openEdit(song: Song): void {
    this.editingSong = song;
    this.form.patchValue({
      title: song.title,
      artistId: typeof song.artistId === 'object' ? (song.artistId as Artist)._id : song.artistId,
      price: song.price,
      releaseYear: song.releaseYear || '',
      description: song.description || '',
      isFeatured: song.isFeatured
    });
    this.showModal = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const data = this.form.value as Partial<Song>;
    const obs = this.editingSong
      ? this.songService.updateSong(this.editingSong._id, data)
      : this.songService.createSong(data as unknown as FormData);

    obs.subscribe({
      next: () => {
        this.showModal = false;
        this.saving = false;
        this.loadData();
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Failed to save.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  delete(id: string): void {
    if (!confirm('Delete this song?')) return;
    this.songService.deleteSong(id).subscribe({
      next: () => { this.loadData(); }
    });
  }

  getArtistName(song: Song): string {
    return typeof song.artistId === 'object' && song.artistId
      ? (song.artistId as Artist).name : '';
  }
}
