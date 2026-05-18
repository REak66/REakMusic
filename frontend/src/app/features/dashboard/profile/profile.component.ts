import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

@Component({
  standalone: false,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  loading = false;
  saving = false;
  avatarUploading = false;
  avatarPreview: string | null = null;
  error = '';
  success = '';
  user: User | null = null;

  // Image cropper state
  showCropper = false;
  imageFile: File | undefined = undefined;
  croppedBlob: Blob | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['']
    });

    this.loading = true;
    this.userService.getProfile().subscribe({
      next: user => {
        this.user = user;
        this.form.patchValue({ fullName: user.fullName, phone: user.phone || '' });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    this.success = '';
    const data = this.form.value as { fullName: string; phone: string };
    this.userService.updateProfile(data).subscribe({
      next: user => {
        this.user = user;
        this.success = 'Profile updated successfully!';
        this.saving = false;
        this.cdr.markForCheck();
        setTimeout(() => { this.success = ''; this.cdr.markForCheck(); }, 4000);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Failed to update profile.';
        this.saving = false;
        this.cdr.markForCheck();
        setTimeout(() => { this.error = ''; this.cdr.markForCheck(); }, 5000);
      }
    });
  }

  triggerAvatarInput(): void {
    this.avatarInput.nativeElement.click();
  }

  onAvatarFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Reset so the same file can be re-selected after an error
    input.value = '';

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.error = 'Only JPEG, PNG or WebP images are allowed.';
      this.cdr.markForCheck();
      setTimeout(() => { this.error = ''; this.cdr.markForCheck(); }, 5000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.error = 'Image must be smaller than 5 MB.';
      this.cdr.markForCheck();
      setTimeout(() => { this.error = ''; this.cdr.markForCheck(); }, 5000);
      return;
    }

    // Open the cropper modal instead of uploading directly
    this.imageFile = file;
    this.croppedBlob = null;
    this.showCropper = true;
    this.cdr.markForCheck();
  }

  onImageCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  applyCrop(): void {
    if (!this.croppedBlob) return;
    const file = new File([this.croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
    this.showCropper = false;
    this.imageFile = undefined;
    this.croppedBlob = null;
    this.avatarUploading = true;
    this.error = '';
    this.success = '';
    this.cdr.markForCheck();

    this.userService.uploadAvatar(file).subscribe({
      next: user => {
        this.user = user;
        this.avatarPreview = null;
        this.avatarUploading = false;
        this.success = 'Profile photo updated!';
        this.cdr.markForCheck();
        setTimeout(() => { this.success = ''; this.cdr.markForCheck(); }, 4000);
      },
      error: (err: { error?: { message?: string } }) => {
        this.avatarUploading = false;
        this.error = err.error?.message || 'Failed to upload photo.';
        this.cdr.markForCheck();
        setTimeout(() => { this.error = ''; this.cdr.markForCheck(); }, 5000);
      }
    });
  }

  cancelCrop(): void {
    this.showCropper = false;
    this.imageFile = undefined;
    this.croppedBlob = null;
    this.cdr.markForCheck();
  }

  get profileCompletion(): number {
    if (!this.user) return 0;
    let score = 0;
    if (this.user.fullName.trim()) score += 25;
    if (this.user.phone?.trim()) score += 25;
    if (this.user.avatarUrl) score += 25;
    if (this.user.isVerified) score += 25;
    return score;
  }

  get profileCompletionColor(): 'danger' | 'warning' | 'info' | 'success' {
    const v = this.profileCompletion;
    if (v < 25) return 'danger';
    if (v < 50) return 'warning';
    if (v < 100) return 'info';
    return 'success';
  }
}
