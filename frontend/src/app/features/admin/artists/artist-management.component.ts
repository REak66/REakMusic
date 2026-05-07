import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArtistService } from '../../../core/services/artist.service';
import { Artist } from '../../../core/models';

@Component({
  selector: 'app-artist-management',
  templateUrl: './artist-management.component.html',
  styleUrls: ['./artist-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArtistManagementComponent implements OnInit {
  artists: Artist[] = [];
  loading = false;
  showModal = false;
  editingArtist: Artist | null = null;
  form!: FormGroup;
  error = '';
  saving = false;

  constructor(
    private artistService: ArtistService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      bio: [''],
      country: [''],
      imageUrl: ['']
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.artistService.getArtists({ limit: 100 }).subscribe({
      next: res => { this.artists = res.data || []; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  openAdd(): void {
    this.editingArtist = null;
    this.form.reset();
    this.showModal = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  openEdit(artist: Artist): void {
    this.editingArtist = artist;
    this.form.patchValue(artist);
    this.showModal = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const data = this.form.value as Partial<Artist>;
    const obs = this.editingArtist
      ? this.artistService.updateArtist(this.editingArtist._id, data)
      : this.artistService.createArtist(data);

    obs.subscribe({
      next: () => { this.showModal = false; this.saving = false; this.load(); this.cdr.markForCheck(); },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Failed.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  delete(id: string): void {
    if (!confirm('Delete this artist?')) return;
    this.artistService.deleteArtist(id).subscribe({ next: () => this.load() });
  }
}
