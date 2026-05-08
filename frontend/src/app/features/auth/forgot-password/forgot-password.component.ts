import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: false,
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email } = this.form.value as { email: string };
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.success = 'OTP sent to your email.';
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/auth/reset-password'], { queryParams: { email } }), 1500);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Failed to send OTP.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
