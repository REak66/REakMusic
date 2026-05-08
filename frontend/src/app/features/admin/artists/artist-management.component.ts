import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ArtistService } from '../../../core/services/artist.service';
import { Artist } from '../../../core/models';
import { SelectOption } from '../../../shared/components/select-dropdown/select-dropdown.component';

@Component({
  standalone: false,
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

  readonly SOCIAL_PLATFORMS = ['Facebook', 'Instagram', 'Twitter', 'YouTube', 'TikTok', 'Spotify', 'SoundCloud', 'Website', 'Other'];

  readonly SOCIAL_PLATFORM_OPTIONS: SelectOption[] = this.SOCIAL_PLATFORMS.map(p => ({ value: p, label: p }));

  constructor(
    private artistService: ArtistService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      bio: [''],
      country: [''],
      imageUrl: [''],
      socialLinks: this.fb.array([])
    });
    this.load();
  }

  get socialLinks(): FormArray {
    return this.form.get('socialLinks') as FormArray;
  }

  addSocialLink(): void {
    this.socialLinks.push(this.fb.group({
      platform: ['Facebook'],
      url: ['', Validators.required]
    }));
    this.cdr.markForCheck();
  }

  removeSocialLink(index: number): void {
    this.socialLinks.removeAt(index);
    this.cdr.markForCheck();
  }

  onImageCropped(base64: string): void {
    this.form.patchValue({ imageUrl: base64 });
  }

  load(): void {
    this.loading = true;
    this.artistService.getArtists({ limit: 100 }).subscribe({
      next: (res: any) => { this.artists = res.data?.artists || []; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  openAdd(): void {
    this.editingArtist = null;
    this.form.reset();
    this.socialLinks.clear();
    this.showModal = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  openEdit(artist: Artist): void {
    this.editingArtist = artist;
    this.socialLinks.clear();
    this.form.patchValue({
      name: artist.name,
      bio: artist.bio || '',
      country: artist.country || '',
      imageUrl: artist.imageUrl || ''
    });
    (artist.socialLinks || []).forEach(link => {
      this.socialLinks.push(this.fb.group({
        platform: [link.platform || 'Other'],
        url: [link.url, Validators.required]
      }));
    });
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

  isBase64(value: string | undefined): boolean {
    return !!value && value.startsWith('data:');
  }
}
