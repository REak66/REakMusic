import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const p = control.get('newPassword')?.value as string;
  const c = control.get('confirmPassword')?.value as string;
  return p === c ? null : { mismatch: true };
}

@Component({
  standalone: false,
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error = '';
  success = '';
  email = '';
  step: 'otp' | 'password' = 'otp';
  resetToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    this.form = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatch });
  }

  verifyOtp(): void {
    const otp = (this.form.get('otp')?.value as string) || '';
    if (!otp) return;
    this.loading = true;
    this.authService.verifyForgotOtp(this.email, otp).subscribe({
      next: res => {
        this.resetToken = res.resetToken;
        this.step = 'password';
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Invalid OTP';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.resetToken) return;
    this.loading = true;
    const { newPassword } = this.form.value as { newPassword: string };
    this.authService.resetPassword(this.resetToken, newPassword).subscribe({
      next: () => {
        this.success = 'Password reset successfully!';
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Failed to reset password.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
