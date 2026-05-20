import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { GenreService } from '../../../core/services/genre.service';
import { Genre } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-genre-management',
  templateUrl: './genre-management.component.html',
  styleUrls: ['./genre-management.component.scss'],
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
export class GenreManagementComponent implements OnInit {
  genres: Genre[] = [];
  loading = false;
  showModal = false;
  editingGenre: Genre | null = null;
  form!: FormGroup;
  error = '';
  saving = false;
  searchQuery = '';
  page = 1;
  pageSize = 10;

  readonly GENRE_COLORS = [
    '#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706',
    '#db2777', '#0891b2', '#65a30d', '#9333ea', '#ea580c'
  ];

  get filteredGenres(): Genre[] {
    if (!this.searchQuery.trim()) return this.genres;
    const q = this.searchQuery.toLowerCase();
    return this.genres.filter(g =>
      g.name.toLowerCase().includes(q) ||
      ((g as any).description || '').toLowerCase().includes(q)
    );
  }

  get pagedGenres(): Genre[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredGenres.slice(start, start + this.pageSize);
  }

  constructor(
    private genreService: GenreService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      color: [this.GENRE_COLORS[0]]
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.genreService.getGenres().subscribe({
      next: (genres) => {
        this.genres = genres;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.error = err.message;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openAdd(): void {
    this.editingGenre = null;
    this.form.reset({ color: this.GENRE_COLORS[0] });
    this.showModal = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  openEdit(genre: Genre): void {
    this.editingGenre = genre;
    this.form.patchValue({
      name: genre.name,
      description: (genre as any).description || '',
      color: (genre as any).color || this.GENRE_COLORS[0]
    });
    this.showModal = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.form.invalid) return;
    const data = this.form.value;
    this.saving = true;
    this.genreService.createGenre(data).subscribe({
      next: () => {
        this.load();
        this.showModal = false;
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.error = err.message;
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  delete(id: string): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this genre?',
      accept: () => {
        this.genreService.deleteGenre(id).subscribe({
          next: () => {
            this.load();
            this.cdr.markForCheck();
          },
          error: (err: any) => {
            this.error = err.message;
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  setSearch(query: string): void {
    this.searchQuery = query;
    this.page = 1;
    this.cdr.markForCheck();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.cdr.markForCheck();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.cdr.markForCheck();
  }

  selectColor(color: string): void {
    this.form.patchValue({ color });
    this.cdr.markForCheck();
  }

  getGenreColor(genre: Genre): string {
    return (genre as any).color || '#7c3aed';
  }

  getGenreInitial(genre: Genre): string {
    return genre.name.charAt(0).toUpperCase();
  }
}
