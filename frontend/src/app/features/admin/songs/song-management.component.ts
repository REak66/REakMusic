import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SongService } from '../../../core/services/song.service';
import { ArtistService } from '../../../core/services/artist.service';
import { GenreService } from '../../../core/services/genre.service';
import { Song, Artist, Genre } from '../../../core/models';
import { SelectOption } from '../../../shared/components/select-dropdown/select-dropdown.component';

@Component({
  standalone: false,
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

  selectedFile: File | null = null;
  dragOver = false;

  constructor(
    private songService: SongService,
    private artistService: ArtistService,
    private genreService: GenreService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

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
      isFeatured: [false],
      driveLink: [''],
      previewUrl: ['']
    });
  }

  loadData(): void {
    this.loading = true;
    this.songService.getSongs({ limit: 50 }).subscribe({
      next: (res: any) => {
        this.songs = res.data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
    this.artistService.getArtists({ limit: 100 }).subscribe({
      next: (res: any) => { this.artists = res.data?.artists || []; this.cdr.markForCheck(); }
    });
    this.genreService.getGenres().subscribe({
      next: genres => { this.genres = genres; this.cdr.markForCheck(); }
    });
  }

  openAdd(): void {
    this.editingSong = null;
    this.selectedFile = null;
    this.form.reset({ price: 0, isFeatured: false });
    this.showModal = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  openEdit(song: Song): void {
    this.editingSong = song;
    this.selectedFile = null;
    this.form.patchValue({
      title: song.title,
      artistId: typeof song.artistId === 'object' ? (song.artistId as Artist)._id : song.artistId,
      price: song.price,
      releaseYear: song.releaseYear || '',
      description: song.description || '',
      isFeatured: song.isFeatured,
      driveLink: song.driveLink || '',
      previewUrl: song.previewUrl || ''
    });
    this.showModal = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.cdr.markForCheck();
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
    this.cdr.markForCheck();
  }

  onDragLeave(): void {
    this.dragOver = false;
    this.cdr.markForCheck();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.selectedFile = file;
      this.cdr.markForCheck();
    }
  }

  clearFile(): void {
    this.selectedFile = null;
    this.cdr.markForCheck();
  }

  get existingDriveLink(): string {
    return this.editingSong?.driveLink || '';
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const formData = new FormData();
    const values = this.form.value;
    Object.entries(values).forEach(([key, val]) => {
      if (val !== null && val !== undefined && val !== '') {
        formData.append(key, String(val));
      }
    });
    if (this.selectedFile) {
      formData.append('songFile', this.selectedFile, this.selectedFile.name);
    }

    const obs = this.editingSong
      ? this.songService.updateSong(this.editingSong._id, formData)
      : this.songService.createSong(formData);

    obs.subscribe({
      next: () => {
        this.showModal = false;
        this.saving = false;
        this.selectedFile = null;
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

  get artistOptions(): SelectOption[] {
    return this.artists.map(a => ({ value: a._id, label: a.name }));
  }

  get genreOptions(): SelectOption[] {
    return this.genres.map(g => ({ value: (g as any)._id, label: g.name }));
  }

  getArtistName(song: Song): string {
    return typeof song.artistId === 'object' && song.artistId
      ? (song.artistId as Artist).name : '';
  }
}
