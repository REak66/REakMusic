import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SongService } from '../../../../core/services/song.service';
import { ArtistService } from '../../../../core/services/artist.service';
import { GenreService } from '../../../../core/services/genre.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Song, Artist, Genre } from '../../../../core/models';
import { TreeNode, MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';

export interface ImportRow {
  index: number;
  title: string;
  producerName: string;
  artistId: string; // mapped ID
  genreString: string;
  genreIds: string[]; // mapped IDs
  selectedGenreNodes?: any; // Mapped tree selection object
  releaseYear: number | null;
  driveLink: string;
  previewUrl: string;
  description: string;
  isValid: boolean;
  errors: string[];
  importStatus?: 'pending' | 'uploading' | 'success' | 'failed';
  errorMessage?: string;
}

@Component({
  standalone: false,
  selector: 'app-song-import',
  templateUrl: './song-import.component.html',
  styleUrls: ['./song-import.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongImportComponent implements OnInit {
  step = 1;
  loading = false;
  uploading = false;
  fileName = '';
  fileSize = '';
  dragOver = false;
  errorMessage = '';

  // Data parsed from excel
  rows: ImportRow[] = [];
  filteredRows: ImportRow[] = [];

  // Mapped entities
  artists: Artist[] = [];
  genres: Genre[] = [];
  genreTreeNodes: TreeNode[] = [];

  // Options for dropdowns
  artistOptions: { value: string; label: string }[] = [];

  // Filter settings
  searchQuery = '';
  statusFilter: 'all' | 'valid' | 'invalid' = 'all';

  // Import stats
  importProgress = 0;
  totalImported = 0;
  totalFailed = 0;
  failedImportRows: ImportRow[] = [];

  isProducerUser = false;
  producerArtistId = '';

  constructor(
    private songService: SongService,
    private artistService: ArtistService,
    private genreService: GenreService,
    private authService: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isProducerUser = this.authService.isProducer();
    const currentUser = this.authService.getCurrentUser();
    if (this.isProducerUser && currentUser?.artistId) {
      this.producerArtistId = currentUser.artistId;
    }
    this.loadMetadata();
  }

  loadMetadata(): void {
    this.loading = true;
    forkJoin({
      artists: this.artistService.getArtists({ limit: 200 }).pipe(catchError(() => of({ data: { artists: [] } }))),
      genres: this.genreService.getGenres().pipe(catchError(() => of([])))
    }).subscribe({
      next: (res: any) => {
        this.artists = res.artists?.data?.artists || [];
        this.genres = res.genres || [];

        this.artistOptions = this.artists.map(a => ({ value: a._id, label: a.name }));
        this.buildGenreTree();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  buildGenreTree(): void {
    const electronic: TreeNode = { key: 'cat-electronic', label: 'Electronic & EDM', selectable: false, children: [] };
    const hiphop: TreeNode = { key: 'cat-hiphop', label: 'Hip Hop & R&B', selectable: false, children: [] };
    const rock: TreeNode = { key: 'cat-rock', label: 'Rock & Alternative', selectable: false, children: [] };
    const pop: TreeNode = { key: 'cat-pop', label: 'Pop & Indie', selectable: false, children: [] };
    const classical: TreeNode = { key: 'cat-classical', label: 'Classical & Ambient', selectable: false, children: [] };
    const other: TreeNode = { key: 'cat-other', label: 'Other Genres', selectable: false, children: [] };

    this.genres.forEach(g => {
      const name = g.name.toLowerCase();
      const node: TreeNode = {
        key: g._id,
        label: g.name,
        selectable: true
      };

      if (name.includes('synth') || name.includes('electro') || name.includes('techno') || name.includes('house') || name.includes('edm') || name.includes('dance') || name.includes('electronic') || name.includes('dubstep')) {
        electronic.children?.push(node);
      } else if (name.includes('hip') || name.includes('hop') || name.includes('rap') || name.includes('trap') || name.includes('r&b') || name.includes('soul') || name.includes('funk')) {
        hiphop.children?.push(node);
      } else if (name.includes('rock') || name.includes('metal') || name.includes('alternative') || name.includes('punk') || name.includes('grunge') || name.includes('indie')) {
        rock.children?.push(node);
      } else if (name.includes('pop') || name.includes('lo-fi') || name.includes('lofi') || name.includes('acoustic') || name.includes('singer')) {
        pop.children?.push(node);
      } else if (name.includes('class') || name.includes('jazz') || name.includes('blues') || name.includes('ambient') || name.includes('cinema') || name.includes('instrumental') || name.includes('orchestra')) {
        classical.children?.push(node);
      } else {
        other.children?.push(node);
      }
    });

    const tree: TreeNode[] = [];
    if (electronic.children && electronic.children.length > 0) tree.push(electronic);
    if (hiphop.children && hiphop.children.length > 0) tree.push(hiphop);
    if (rock.children && rock.children.length > 0) tree.push(rock);
    if (pop.children && pop.children.length > 0) tree.push(pop);
    if (classical.children && classical.children.length > 0) tree.push(classical);
    if (other.children && other.children.length > 0) tree.push(other);

    if (tree.length === 0) {
      this.genreTreeNodes = this.genres.map(g => ({
        key: g._id,
        label: g.name,
        selectable: true
      }));
    } else {
      this.genreTreeNodes = tree;
    }
  }

  // --- Step 1: Upload and Template ---

  downloadTemplate(): void {
    const templateData = [
      {
        'Title': 'Summer Vibes',
        'Producer': this.isProducerUser && this.artists.find(a => a._id === this.producerArtistId)?.name || 'Chill Beats',
        'Genres': 'Electronic, Pop',
        'Release Year': 2026,
        'Google Drive Link': 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBVJ8khX9sdF5s/view',
        'Preview URL': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'Description': 'An upbeat, synth-driven track perfect for summer play.'
      },
      {
        'Title': 'Midnight Coffee',
        'Producer': this.isProducerUser && this.artists.find(a => a._id === this.producerArtistId)?.name || 'Jazz Lounge',
        'Genres': 'Classical & Ambient',
        'Release Year': 2025,
        'Google Drive Link': 'https://drive.google.com/file/d/1AxxPVs0XRA5nFMdKvBdBVJ8khX9sdA2c/view',
        'Preview URL': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        'Description': 'Lofi jazz instrumental for focus and study.'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Songs Template');

    // Make header row bold and style columns
    const wscols = [
      { wch: 20 }, // Title
      { wch: 18 }, // Producer
      { wch: 22 }, // Genres
      { wch: 12 }, // Release Year
      { wch: 45 }, // Google Drive Link
      { wch: 45 }, // Preview URL
      { wch: 35 }  // Description
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, 'reakmusic_import_template.xlsx');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
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
      this.processFile(file);
    }
  }

  processFile(file: File): void {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      this.errorMessage = 'Please upload a valid Excel file (.xlsx or .xls)';
      this.cdr.markForCheck();
      return;
    }

    this.errorMessage = '';
    this.fileName = file.name;
    this.fileSize = this.formatBytes(file.size);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        this.parseRawData(rawJson);
      } catch (err) {
        this.errorMessage = 'Error reading file: ' + (err as Error).message;
        this.cdr.markForCheck();
      }
    };
    reader.readAsArrayBuffer(file);
  }

  parseRawData(rawRows: any[]): void {
    if (!rawRows || rawRows.length === 0) {
      this.errorMessage = 'Excel file is empty or has no data rows.';
      this.cdr.markForCheck();
      return;
    }

    this.rows = rawRows.map((raw, idx) => {
      // Find matching keys in raw row (flexible casing & trimming)
      const title = this.findValue(raw, ['title', 'song title', 'name']);
      const producerName = this.findValue(raw, ['producer', 'artist', 'singer']);
      const genreString = this.findValue(raw, ['genres', 'genre', 'categories']);
      const releaseYearVal = this.findValue(raw, ['release year', 'year', 'release']);
      const driveLink = this.findValue(raw, ['google drive link', 'drive link', 'link', 'drive url', 'url']);
      const previewUrl = this.findValue(raw, ['preview url', 'preview', 'preview link']);
      const description = this.findValue(raw, ['description', 'desc', 'details']);

      const parsedYear = releaseYearVal ? parseInt(String(releaseYearVal).trim(), 10) : null;
      const releaseYear = isNaN(parsedYear as number) ? null : parsedYear;

      return {
        index: idx + 1,
        title: String(title).trim(),
        producerName: String(producerName).trim(),
        artistId: '',
        genreString: String(genreString).trim(),
        genreIds: [],
        releaseYear,
        driveLink: String(driveLink).trim(),
        previewUrl: String(previewUrl).trim(),
        description: String(description).trim(),
        isValid: false,
        errors: []
      };
    });

    this.autoMapValues();
    this.validateAllRows();
    this.applyFilters();
    this.step = 2; // Advance to Step 2
    this.cdr.markForCheck();
  }

  findValue(obj: any, keys: string[]): any {
    const objKeys = Object.keys(obj);
    for (const key of keys) {
      const match = objKeys.find(ok => ok.toLowerCase().trim() === key.toLowerCase().trim());
      if (match) return obj[match];
    }
    return '';
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // --- Step 2 & 3: Review & Edit ---

  autoMapValues(): void {
    this.rows.forEach(row => {
      // 1. Map Producer/Artist
      if (this.isProducerUser) {
        row.artistId = this.producerArtistId;
        const currentProd = this.artists.find(a => a._id === this.producerArtistId);
        row.producerName = currentProd ? currentProd.name : 'Self';
      } else if (row.producerName) {
        const match = this.artists.find(
          a => a.name.toLowerCase().trim() === row.producerName.toLowerCase().trim()
        );
        if (match) {
          row.artistId = match._id;
        }
      }

      // 2. Map Genres
      row.selectedGenreNodes = [];
      if (row.genreString) {
        // Split by comma or semicolon
        const splitGenres = row.genreString.split(/[;,]/).map(g => g.trim().toLowerCase()).filter(Boolean);
        const mappedIds: string[] = [];
        
        splitGenres.forEach(genreName => {
          const match = this.genres.find(
            g => g.name.toLowerCase().trim() === genreName
          );
          if (match) {
            mappedIds.push(match._id);
            row.selectedGenreNodes.push({ key: match._id, label: match.name });
          }
        });
        row.genreIds = mappedIds;
      }
    });
  }

  validateAllRows(): void {
    this.rows.forEach(row => this.validateRow(row));
  }

  validateRow(row: ImportRow): void {
    const errors: string[] = [];

    // Title checks
    if (!row.title) {
      errors.push('Song title is required.');
    }

    // Producer checks
    if (!this.isProducerUser && !row.artistId) {
      errors.push(row.producerName ? `Producer "${row.producerName}" not found in database.` : 'Producer is required.');
    }

    // Release Year check
    if (row.releaseYear !== null) {
      const currentYear = new Date().getFullYear();
      if (row.releaseYear < 1900 || row.releaseYear > currentYear + 10) {
        errors.push(`Release year must be between 1900 and ${currentYear + 10}.`);
      }
    }

    // Link check (At least one must be provided for reference)
    if (!row.driveLink && !row.previewUrl) {
      errors.push('Either Google Drive link or Preview URL is required.');
    }

    // Url format check
    if (row.driveLink && !row.driveLink.startsWith('http://') && !row.driveLink.startsWith('https://')) {
      errors.push('Google Drive link must be a valid URL.');
    }
    if (row.previewUrl && !row.previewUrl.startsWith('http://') && !row.previewUrl.startsWith('https://')) {
      errors.push('Preview URL must be a valid URL.');
    }

    row.errors = errors;
    row.isValid = errors.length === 0;
  }

  applyFilters(): void {
    let filtered = [...this.rows];

    // Search query filter (Title, original text Producer/Genre)
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        r =>
          r.title.toLowerCase().includes(q) ||
          r.producerName.toLowerCase().includes(q) ||
          r.genreString.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (this.statusFilter === 'valid') {
      filtered = filtered.filter(r => r.isValid);
    } else if (this.statusFilter === 'invalid') {
      filtered = filtered.filter(r => !r.isValid);
    }

    this.filteredRows = filtered;
    this.cdr.markForCheck();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onFilterStatusChange(status: 'all' | 'valid' | 'invalid'): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  onRowValueChange(row: ImportRow): void {
    // Re-verify the producer mapping if they type a different name or edit
    if (!this.isProducerUser && row.producerName) {
      const match = this.artists.find(
        a => a.name.toLowerCase().trim() === row.producerName.toLowerCase().trim()
      );
      if (match) {
        row.artistId = match._id;
      } else {
        row.artistId = '';
      }
    }

    this.validateRow(row);
    this.applyFilters();
  }

  onGenreTreeSelectChange(row: ImportRow, event: any): void {
    row.selectedGenreNodes = event || [];
    let ids: string[] = [];
    if (Array.isArray(event)) {
      ids = event.map(n => n.key as string).filter(k => k && !k.startsWith('cat-'));
    } else if (event && event.key) {
      ids = [event.key as string];
    }
    
    row.genreIds = ids;
    row.genreString = ids.map(id => this.genres.find(g => g._id === id)?.name || '').join(', ');
    this.validateRow(row);
    this.applyFilters();
  }

  get totalValidRows(): number {
    return this.rows.filter(r => r.isValid).length;
  }

  get totalInvalidRows(): number {
    return this.rows.filter(r => !r.isValid).length;
  }

  goToStep(s: number): void {
    this.step = s;
    this.cdr.markForCheck();
  }

  getGenreName(id: string): string {
    const g = this.genres.find(x => x._id === id);
    return g ? g.name : id;
  }

  // --- Step 3 to Step 4: Import execution ---

  executeImport(): void {
    // We only import VALID rows, and we collect any failures
    const validRows = this.rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No valid rows',
        detail: 'There are no valid rows to import. Please correct errors first.'
      });
      return;
    }

    this.uploading = true;
    this.importProgress = 0;
    this.totalImported = 0;
    this.totalFailed = 0;
    this.failedImportRows = [];

    // Mark pending status
    this.rows.forEach(r => {
      if (r.isValid) r.importStatus = 'pending';
    });
    this.cdr.markForCheck();

    // Import sequentially to maintain ordering and reduce server load spikes
    this.importSequentially(validRows, 0);
  }

  importSequentially(queue: ImportRow[], index: number): void {
    if (index >= queue.length) {
      // Completed import process
      this.uploading = false;
      // Add all rows that originally had errors to failedImportRows, plus any server upload failures
      const originalInvalid = this.rows.filter(r => !r.isValid);
      this.failedImportRows = [...originalInvalid, ...this.failedImportRows];
      this.totalFailed = this.failedImportRows.length;

      this.messageService.add({
        severity: this.totalImported > 0 ? 'success' : 'error',
        summary: 'Import Complete',
        detail: `Successfully imported ${this.totalImported} songs. ${this.totalFailed} rows failed.`
      });

      this.step = 4; // Complete page
      this.cdr.markForCheck();
      return;
    }

    const row = queue[index];
    row.importStatus = 'uploading';
    this.cdr.markForCheck();

    const payload = {
      title: row.title,
      artistId: row.artistId,
      genre: row.genreIds,
      releaseYear: row.releaseYear || undefined,
      driveLink: row.driveLink || undefined,
      previewUrl: row.previewUrl || undefined,
      description: row.description || undefined
    };

    this.songService.createSongJson(payload).subscribe({
      next: () => {
        row.importStatus = 'success';
        this.totalImported++;
        this.updateProgress(queue.length, index + 1);
        this.importSequentially(queue, index + 1);
      },
      error: (err) => {
        row.importStatus = 'failed';
        row.errorMessage = err.error?.message || err.message || 'Server creation error';
        this.totalFailed++;
        this.failedImportRows.push(row);
        this.updateProgress(queue.length, index + 1);
        this.importSequentially(queue, index + 1);
      }
    });
  }

  updateProgress(total: number, completed: number): void {
    this.importProgress = Math.round((completed / total) * 100);
    this.cdr.markForCheck();
  }

  // --- Step 4: Complete and Export Failures ---

  exportFailedRows(): void {
    if (this.failedImportRows.length === 0) return;

    const data = this.failedImportRows.map(r => ({
      'Title': r.title,
      'Producer': r.producerName,
      'Genres': r.genreString,
      'Release Year': r.releaseYear,
      'Google Drive Link': r.driveLink,
      'Preview URL': r.previewUrl,
      'Description': r.description,
      'Fail Reasons / Error Messages': r.errors.join(' | ') + (r.errorMessage ? ` [Server: ${r.errorMessage}]` : '')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Songs');

    const wscols = [
      { wch: 20 }, // Title
      { wch: 18 }, // Producer
      { wch: 22 }, // Genres
      { wch: 12 }, // Release Year
      { wch: 45 }, // Google Drive Link
      { wch: 45 }, // Preview URL
      { wch: 35 }, // Description
      { wch: 60 }  // Error messages
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, 'failed_songs_report.xlsx');
  }

  redirectToSongs(): void {
    this.router.navigate(['/admin/songs']);
  }

  clearImportState(): void {
    this.step = 1;
    this.fileName = '';
    this.fileSize = '';
    this.rows = [];
    this.filteredRows = [];
    this.failedImportRows = [];
    this.importProgress = 0;
    this.totalImported = 0;
    this.totalFailed = 0;
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.cdr.markForCheck();
  }
}
