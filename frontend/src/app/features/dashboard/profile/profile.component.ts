import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  saving = false;
  error = '';
  success = '';
  user: User | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

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
    const data = this.form.value as { fullName: string; phone: string };
    this.userService.updateProfile(data).subscribe({
      next: user => {
        this.user = user;
        this.success = 'Profile updated!';
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Failed to update profile.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }
}
