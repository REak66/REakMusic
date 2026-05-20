import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { UserService } from '../../../core/services/user.service';
import { ArtistService } from '../../../core/services/artist.service';
import { User, Artist } from '../../../core/models';

// 6 granular system permissions
export interface PermissionDef {
  key: string;
  label: string;
  icon: string;
  description: string;
}

const ALL_PERMISSIONS: PermissionDef[] = [
  { key: 'songs:create', label: 'Upload Songs', icon: 'fa-upload', description: 'Upload / Create Songs' },
  { key: 'songs:update', label: 'Edit Songs', icon: 'fa-pen', description: 'Edit existing songs' },
  { key: 'songs:delete', label: 'Delete Songs', icon: 'fa-trash', description: 'Permanently delete songs' },
  { key: 'analytics:view', label: 'View Analytics', icon: 'fa-chart-bar', description: 'Access Dashboard & Analytics' },
  { key: 'downloads:all', label: 'Download Any Song', icon: 'fa-download', description: 'Download any song on platform' },
  { key: 'users:manage', label: 'Manage Users', icon: 'fa-users-gear', description: 'View and manage users & roles' },
];

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: ['songs:create', 'songs:update', 'songs:delete', 'analytics:view', 'downloads:all', 'users:manage'],
  producer: ['songs:create', 'songs:update', 'songs:delete', 'analytics:view'],
  customer: ['downloads:all'],
  guest: [],
  guest_user: [],
};

@Component({
  standalone: false,
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
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
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  artists: Artist[] = [];
  allPermissions = ALL_PERMISSIONS;

  loading = true;
  showModal = false;
  editingUser: User | null = null;
  saving = false;
  error = '';

  page = 1;
  pageSize = 20;
  total = 0;

  userForm!: FormGroup; // Define the form property
  selectedPermissions: string[] = [];

  constructor(
    private userService: UserService,
    private artistService: ArtistService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phone: [''],
      role: ['customer', Validators.required],
      artistId: [''],
      isVerified: [false],
      permissions: this.fb.group(
        ALL_PERMISSIONS.reduce((acc, perm) => {
          acc[perm.key] = false;
          return acc;
        }, {} as Record<string, boolean>)
      ),
    });

    this.userForm.get('role')?.valueChanges.subscribe((role) => {
      const defaultPermissions = ROLE_DEFAULT_PERMISSIONS[role] || [];
      const permissionsGroup = this.userForm.get('permissions') as FormGroup;
      ALL_PERMISSIONS.forEach((perm) => {
        permissionsGroup.get(perm.key)?.setValue(defaultPermissions.includes(perm.key));
      });
    });

    this.load();
    this.loadArtists();
  }

  // ─── Data loading ──────────────────────────────────────────────────────────

  load(): void {
    this.loading = true;
    this.userService.getUsers({ page: this.page, limit: this.pageSize }).subscribe({
      next: (res) => {
        this.users = res.data;
        this.total = res.total;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  loadArtists(): void {
    this.artistService.getArtists({ limit: 200 }).subscribe({
      next: (res: any) => {
        this.artists = res.data?.artists || res.data || [];
        this.cdr.markForCheck();
      }
    });
  }

  // ─── Modal open/close ──────────────────────────────────────────────────────

  openAdd(): void {
    this.editingUser = null;
    this.error = '';
    this.userForm.reset({ role: 'customer', isVerified: true });
    this.userForm.get('password')!.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')!.updateValueAndValidity();
    this.selectedPermissions = [...ROLE_DEFAULT_PERMISSIONS['customer']];
    this.showModal = true;
    this.cdr.markForCheck();
  }

  openEdit(user: User): void {
    this.editingUser = user;
    this.error = '';
    this.userForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      artistId: (user.artistId as any) || '',
      isVerified: user.isVerified,
      password: '',
    });
    // Password is optional on edit
    this.userForm.get('password')!.clearValidators();
    this.userForm.get('password')!.updateValueAndValidity();
    this.selectedPermissions = [...(user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role] || [])];
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.cdr.markForCheck();
  }

  // ─── Permissions helpers ───────────────────────────────────────────────────

  hasPermission(key: string): boolean {
    return this.selectedPermissions.includes(key);
  }

  togglePermission(key: string): void {
    if (this.hasPermission(key)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== key);
    } else {
      this.selectedPermissions = [...this.selectedPermissions, key];
    }
    this.cdr.markForCheck();
  }

  resetToRoleDefaults(): void {
    const role = this.userForm.get('role')!.value;
    this.selectedPermissions = [...(ROLE_DEFAULT_PERMISSIONS[role] || [])];
    this.cdr.markForCheck();
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  save(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    this.saving = true;
    this.error = '';

    const v = this.userForm.value;
    const payload: any = {
      fullName: v.fullName,
      email: v.email,
      phone: v.phone || undefined,
      role: v.role,
      artistId: v.artistId || undefined,
      isVerified: v.isVerified,
      permissions: this.selectedPermissions,
    };
    if (v.password && v.password.trim()) {
      payload.password = v.password;
    }

    const obs = this.editingUser
      ? this.userService.updateUser(this.editingUser._id, payload)
      : this.userService.createUser(payload);

    obs.subscribe({
      next: () => {
        this.showModal = false;
        this.saving = false;
        this.load();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to save. Please try again.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  deleteUser(user: User): void {
    this.confirmationService.confirm({
      header: 'Delete User',
      message: `Are you sure you want to permanently delete <strong>${user.fullName}</strong>? This action cannot be undone.`,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => {
        this.userService.deleteUser(user._id).subscribe({
          next: () => { this.load(); },
          error: (err: any) => { alert(err.error?.message || 'Delete failed.'); }
        });
      }
    });
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  getArtistName(artistId: any): string {
    if (!artistId) return '—';
    const a = this.artists.find(x => x._id === artistId || x._id === artistId?._id);
    return a ? a.name : '—';
  }

  onPageChange(page: number): void { this.page = page; this.load(); }
  onPageSizeChange(size: number): void { this.pageSize = size; this.page = 1; this.load(); }
}
