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
  titleAutoFilled = false;
  driveResolveStatus: 'idle' | 'resolving' | 'success' | 'error' = 'idle';

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

    // Extract Title from pasted links
    this.form.get('driveLink')?.valueChanges.subscribe(val => {
      if (val) this.extractTitleFromLink(val);
    });
    this.form.get('previewUrl')?.valueChanges.subscribe(val => {
      if (val) this.extractTitleFromLink(val);
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
    this.titleAutoFilled = false;
    this.driveResolveStatus = 'idle';
    this.form.reset({ isFeatured: false });
    this.showModal = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  openEdit(song: Song): void {
    this.editingSong = song;
    this.selectedFile = null;
    this.titleAutoFilled = false;
    this.driveResolveStatus = 'idle';
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
      this.readAudioMetadata(this.selectedFile);
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
      this.readAudioMetadata(file);
      this.cdr.markForCheck();
    }
  }

  clearFile(): void {
    this.selectedFile = null;
    this.titleAutoFilled = false;
    this.cdr.markForCheck();
  }

  /** Read ID3 / MP4 / FLAC tags from the dropped/selected file and pre-fill the form. */
  readAudioMetadata(file: File): void {
    // 1. Instantly parse filename as high-quality fallback
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    let parsedTitle = nameWithoutExt;

    // If filename is like "Artist - Title", extract title
    if (nameWithoutExt.includes(' - ')) {
      const parts = nameWithoutExt.split(' - ');
      if (parts.length >= 2) {
        parsedTitle = parts.slice(1).join(' - ').trim();
      }
    }
    // Clean up underscores or extra spaces
    parsedTitle = parsedTitle.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

    // Fill immediately as a baseline
    const currentTitle = this.form.get('title')?.value || '';
    if (!currentTitle.trim()) {
      this.form.patchValue({ title: parsedTitle });
      this.titleAutoFilled = true;
      this.cdr.markForCheck();
    }

    // 2. Read first 128KB to parse ID3v2 tags asynchronously
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) return;

        const view = new DataView(buffer);
        // Header starts with "ID3"
        if (
          view.getUint8(0) === 0x49 &&
          view.getUint8(1) === 0x44 &&
          view.getUint8(2) === 0x33
        ) {
          const majorVersion = view.getUint8(3);
          if (majorVersion > 4) return; // Unsupported version

          // Tag size (synchsafe 4 bytes at offsets 6-9)
          const s0 = view.getUint8(6);
          const s1 = view.getUint8(7);
          const s2 = view.getUint8(8);
          const s3 = view.getUint8(9);
          const tagSize = ((s0 & 0x7f) << 21) | ((s1 & 0x7f) << 14) | ((s2 & 0x7f) << 7) | (s3 & 0x7f);

          let offset = 10;
          const end = Math.min(offset + tagSize, buffer.byteLength);

          let title = '';
          let year = '';

          while (offset < end - 10) {
            let frameId = '';
            let frameSize = 0;

            if (majorVersion === 2) {
              frameId = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2));
              frameSize = (view.getUint8(offset + 3) << 16) | (view.getUint8(offset + 4) << 8) | view.getUint8(offset + 5);
              offset += 6;
            } else {
              frameId = String.fromCharCode(
                view.getUint8(offset),
                view.getUint8(offset + 1),
                view.getUint8(offset + 2),
                view.getUint8(offset + 3)
              );
              const sz0 = view.getUint8(offset + 4);
              const sz1 = view.getUint8(offset + 5);
              const sz2 = view.getUint8(offset + 6);
              const sz3 = view.getUint8(offset + 7);

              if (majorVersion === 4) {
                // Synchsafe in v2.4
                frameSize = ((sz0 & 0x7f) << 21) | ((sz1 & 0x7f) << 14) | ((sz2 & 0x7f) << 7) | (sz3 & 0x7f);
              } else {
                // Normal 32-bit uint in v2.3
                frameSize = (sz0 << 24) | (sz1 << 16) | (sz2 << 8) | sz3;
              }
              offset += 10;
            }

            if (frameSize <= 0 || offset + frameSize > end) {
              break;
            }

            // Decode frames we care about
            if (frameId === 'TIT2' || frameId === 'TT2') {
              title = this.decodeTextFrame(view, offset, frameSize);
            } else if (frameId === 'TYER' || frameId === 'TYE' || frameId === 'TDRC') {
              year = this.decodeTextFrame(view, offset, frameSize);
            }

            offset += frameSize;
          }

          if (title.trim()) {
            this.form.patchValue({ title: title.trim() });
            this.titleAutoFilled = true;
          }
          if (year.trim()) {
            const yr = parseInt(year, 10);
            if (!isNaN(yr)) {
              this.form.patchValue({ releaseYear: yr });
            }
          }
          this.cdr.markForCheck();
        }
      } catch (err) {
        console.warn('ID3 parse error:', err);
      }
    };
    reader.readAsArrayBuffer(file.slice(0, 131072));
  }

  private decodeTextFrame(view: DataView, offset: number, length: number): string {
    if (length <= 1) return '';
    const encoding = view.getUint8(offset);
    const dataOffset = offset + 1;
    const dataLength = length - 1;

    try {
      const bytes = new Uint8Array(view.buffer, dataOffset, dataLength);
      let label = 'utf-8';
      if (encoding === 0x01) {
        label = 'utf-16';
      } else if (encoding === 0x02) {
        label = 'utf-16be';
      } else if (encoding === 0x00) {
        label = 'iso-8859-1';
      }
      const decoder = new TextDecoder(label);
      return decoder.decode(bytes).replace(/\0/g, '').trim();
    } catch (e) {
      return '';
    }
  }

  /** Try to parse a meaningful title from direct links or Google Drive links */
  extractTitleFromLink(url: string): void {
    if (!url || typeof url !== 'string') return;
    const currentTitle = this.form.get('title')?.value || '';
    if (currentTitle.trim()) return; // Don't overwrite existing title

    try {
      const decodedUrl = decodeURIComponent(url);
      let parsedTitle = '';

      try {
        const urlObj = new URL(decodedUrl);
        const searchParams = urlObj.searchParams;

        // 1. Try to check common query parameters
        const potentialKeys = ['title', 'name', 'filename', 'file', 'song'];
        for (const key of potentialKeys) {
          const val = searchParams.get(key);
          if (val) {
            parsedTitle = val;
            break;
          }
        }

        // 2. Try to get last segment of the path
        if (!parsedTitle) {
          const pathname = urlObj.pathname;
          const segments = pathname.split('/').filter(s => s.length > 0);
          if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1];
            if (lastSegment.includes('.')) {
              parsedTitle = lastSegment.replace(/\.[^/.]+$/, ""); // strip extension
            } else if (lastSegment !== 'view' && lastSegment !== 'edit' && lastSegment.length > 3) {
              parsedTitle = lastSegment;
            }
          }
        }
      } catch (err) {
        // Fallback split
        const lastSegment = decodedUrl.split('/').pop() || '';
        parsedTitle = lastSegment.replace(/\.[^/.]+$/, "");
      }

      if (parsedTitle && parsedTitle.length > 2) {
        // Skip obvious generic hex hashes or standard google drive IDs
        const isHexHash = /^[a-fA-F0-9]{20,}$/.test(parsedTitle);
        const isGoogleDriveId = /^[a-zA-Z0-9_-]{25,}$/.test(parsedTitle) && url.includes('drive.google.com');

        if (isGoogleDriveId) {
          this.driveResolveStatus = 'resolving';
          this.cdr.markForCheck();
          
          this.songService.resolveDriveLink(url).subscribe({
            next: (resolvedName) => {
              if (resolvedName) {
                let cleanName = resolvedName.replace(/\.[^/.]+$/, ""); // strip extension
                
                // If cleanName has "Artist - Title", extract title
                if (cleanName.includes(' - ')) {
                  const parts = cleanName.split(' - ');
                  if (parts.length >= 2) {
                    cleanName = parts.slice(1).join(' - ').trim();
                  }
                }

                // Clean underscores/hyphens
                cleanName = cleanName
                  .replace(/_/g, ' ')
                  .replace(/-/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();

                // Capitalize
                cleanName = cleanName
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');

                if (cleanName.length > 0) {
                  this.form.patchValue({ title: cleanName });
                  this.titleAutoFilled = true;
                  this.driveResolveStatus = 'success';
                  this.cdr.markForCheck();
                } else {
                  this.driveResolveStatus = 'error';
                  this.cdr.markForCheck();
                }
              } else {
                this.driveResolveStatus = 'error';
                this.cdr.markForCheck();
              }
            },
            error: () => {
              this.driveResolveStatus = 'error';
              this.cdr.markForCheck();
            }
          });
          return;
        }

        if (!isHexHash) {
          // If title has "Artist - Title", extract just Title
          if (parsedTitle.includes(' - ')) {
            const parts = parsedTitle.split(' - ');
            if (parts.length >= 2) {
              parsedTitle = parts.slice(1).join(' - ').trim();
            }
          }

          // Clean symbols, underscores, and extra spacing
          parsedTitle = parsedTitle
            .replace(/_/g, ' ')
            .replace(/-/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          // Title-case capitalization
          parsedTitle = parsedTitle
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          if (parsedTitle.length > 0) {
            this.form.patchValue({ title: parsedTitle });
            this.titleAutoFilled = true;
            this.cdr.markForCheck();
          }
        }
      }
    } catch (e) {
      // ignore
    }
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
