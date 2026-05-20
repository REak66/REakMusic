import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { SongService } from '../../../core/services/song.service';
import { ArtistService } from '../../../core/services/artist.service';
import { GenreService } from '../../../core/services/genre.service';
import { AuthService } from '../../../core/services/auth.service';
import { Song, Artist, Genre } from '../../../core/models';
import { SelectOption } from '../../../shared/components/select-dropdown/select-dropdown.component';

@Component({
  standalone: false,
  selector: 'app-song-management',
  templateUrl: './song-management.component.html',
  styleUrls: ['./song-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(22px)' }),
        animate('450ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('tableEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('400ms 60ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
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
  page = 1;
  pageSize = 10;
  total = 0;

  selectedFile: File | null = null;
  dragOver = false;
  selectedGenreIds: string[] = [];

  constructor(
    private songService: SongService,
    private artistService: ArtistService,
    private genreService: GenreService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  initForm(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      artistId: ['', Validators.required],
      releaseYear: [''],
      description: [''],
      isFeatured: [false],
      driveLink: [''],
      previewUrl: ['']
    });
  }

  loadData(): void {
    this.loading = true;
    // Admins see all songs, producers see only their own songs
    const params: any = { page: this.page, limit: this.pageSize };
    if (this.authService.isProducer()) {
      params.ownerOnly = true;
    }
    this.songService.getSongs(params).subscribe({
      next: (res: any) => {
        this.songs = res.data || [];
        this.total = res.total || 0;
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
    this.selectedGenreIds = [];
    this.form.reset({ isFeatured: false });
    this.showModal = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  openEdit(song: Song): void {
    this.editingSong = song;
    this.selectedFile = null;
    // Resolve genre IDs from populated objects or plain IDs
    this.selectedGenreIds = (song.genre || []).map((g: any) =>
      typeof g === 'object' ? g._id : g
    );
    this.form.patchValue({
      title: song.title,
      artistId: typeof song.artistId === 'object' ? (song.artistId as Artist)._id : song.artistId,
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
    // Append each selected genre ID
    this.selectedGenreIds.forEach(id => formData.append('genre', id));
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
    this.confirmationService.confirm({
      header: 'Delete Song',
      message: 'Are you sure you want to delete this song? This action cannot be undone.',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => {
        this.songService.deleteSong(id).subscribe({
          next: () => { this.loadData(); }
        });
      }
    });
  }

  get artistOptions(): SelectOption[] {
    return this.artists.map(a => ({ value: a._id, label: a.name }));
  }

  get genreOptions(): SelectOption[] {
    return this.genres.map(g => ({ value: (g as any)._id, label: g.name }));
  }

  isGenreSelected(genreId: string): boolean {
    return this.selectedGenreIds.includes(genreId);
  }

  toggleGenre(genreId: string): void {
    const idx = this.selectedGenreIds.indexOf(genreId);
    if (idx === -1) {
      this.selectedGenreIds = [...this.selectedGenreIds, genreId];
    } else {
      this.selectedGenreIds = this.selectedGenreIds.filter(id => id !== genreId);
    }
    this.cdr.markForCheck();
  }

  removeGenre(genreId: string): void {
    this.selectedGenreIds = this.selectedGenreIds.filter(id => id !== genreId);
    this.cdr.markForCheck();
  }

  getGenreName(id: string): string {
    const g = this.genres.find(x => (x as any)._id === id);
    return g ? g.name : id;
  }

  getGenreColor(id: string): string {
    const g = this.genres.find(x => (x as any)._id === id) as any;
    return g?.color || '#7c3aed';
  }

  getSongGenres(song: Song): any[] {
    return (song.genre || []) as any[];
  }

  getArtistName(song: Song): string {
    return typeof song.artistId === 'object' && song.artistId
      ? (song.artistId as Artist).name : '';
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadData();
  }
}
