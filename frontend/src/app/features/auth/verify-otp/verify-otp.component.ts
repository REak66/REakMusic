import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  loading = false;
  error = '';
  success = '';
  email = '';
  countdown = 60;
  private timer?: ReturnType<typeof setInterval>;

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
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  startCountdown(): void {
    this.countdown = 60;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown--;
      this.cdr.markForCheck();
      if (this.countdown <= 0) clearInterval(this.timer);
    }, 1000);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { otp } = this.form.value as { otp: string };
    this.authService.verifyOtp(this.email, otp).subscribe({
      next: () => {
        this.success = 'Email verified successfully!';
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Invalid OTP';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  resend(): void {
    this.authService.resendOtp(this.email).subscribe({
      next: () => {
        this.success = 'OTP resent!';
        this.startCountdown();
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }
}
