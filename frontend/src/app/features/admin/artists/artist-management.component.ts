import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ArtistService } from '../../../core/services/artist.service';
import { Artist } from '../../../core/models';
import { SelectOption } from '../../../shared/components/select-dropdown/select-dropdown.component';

@Component({
  standalone: false,
  selector: 'app-artist-management',
  templateUrl: './artist-management.component.html',
  styleUrls: ['./artist-management.component.scss'],
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
export class ArtistManagementComponent implements OnInit {
  artists: Artist[] = [];
  loading = false;
  showModal = false;
  editingArtist: Artist | null = null;
  form!: FormGroup;
  error = '';
  saving = false;
  searchQuery = '';
  page = 1;
  pageSize = 10;

  get filteredArtists(): Artist[] {
    if (!this.searchQuery.trim()) return this.artists;
    const q = this.searchQuery.toLowerCase();
    return this.artists.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.country || '').toLowerCase().includes(q) ||
      (a.bio || '').toLowerCase().includes(q)
    );
  }

  get pagedArtists(): Artist[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredArtists.slice(start, start + this.pageSize);
  }

  readonly SOCIAL_PLATFORMS = ['Facebook', 'Instagram', 'Twitter', 'YouTube', 'TikTok', 'Spotify', 'SoundCloud', 'Website', 'Other'];

  readonly SOCIAL_PLATFORM_OPTIONS: SelectOption[] = [
    { value: 'Facebook', label: 'Facebook', icon: 'fa-brands fa-facebook' },
    { value: 'Instagram', label: 'Instagram', icon: 'fa-brands fa-instagram' },
    { value: 'Twitter', label: 'Twitter', icon: 'fa-brands fa-x-twitter' },
    { value: 'YouTube', label: 'YouTube', icon: 'fa-brands fa-youtube' },
    { value: 'TikTok', label: 'TikTok', icon: 'fa-brands fa-tiktok' },
    { value: 'Spotify', label: 'Spotify', icon: 'fa-brands fa-spotify' },
    { value: 'SoundCloud', label: 'SoundCloud', icon: 'fa-brands fa-soundcloud' },
    { value: 'Website', label: 'Website', icon: 'fa-solid fa-globe' },
    { value: 'Other', label: 'Other', icon: 'fa-solid fa-link' },
  ];

  constructor(
    private artistService: ArtistService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
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
      next: (res: any) => { this.artists = res.data?.artists || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
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
      next: () => {
        this.showModal = false;
        this.saving = false;
        this.load();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Producer ${this.editingArtist ? 'updated' : 'saved'} successfully!` });
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        const validationErrors = err.error?.errors;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          this.error = validationErrors.map((e: any) => e.msg || e.message || e).join(', ');
        } else {
          this.error = err.error?.message || err.message || 'Failed to save producer.';
        }
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: this.error });
        this.cdr.markForCheck();
      }
    });
  }

  delete(id: string): void {
    const artist = this.artists.find(a => a._id === id);
    this.confirmationService.confirm({
      header: 'Delete Producer',
      message: `Are you sure you want to delete "${artist?.name || 'this producer'}"? This action cannot be undone.`,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => {
        this.artistService.deleteArtist(id).subscribe({
          next: () => {
            this.artists = this.artists.filter(a => a._id !== id);
            this.load();
            this.confirmationService.confirm({
              header: 'Deleted Successfully',
              message: `Producer "${artist?.name || 'Producer'}" was deleted successfully.`,
              icon: 'fa-solid fa-circle-check',
              acceptLabel: 'OK',
              rejectVisible: false,
              styleClass: 'confirm-dialog--success'
            } as any);
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            this.error = err.message || 'Failed to delete producer.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: this.error });
            this.cdr.detectChanges();
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

  isBase64(value: string | undefined): boolean {
    return !!value && value.startsWith('data:');
  }
}
