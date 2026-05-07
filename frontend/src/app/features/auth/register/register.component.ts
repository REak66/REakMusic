import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pass = control.get('password')?.value as string;
  const confirm = control.get('confirmPassword')?.value as string;
  return pass === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error = '';
  pendingEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatch });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { fullName, email, phone, password } = this.form.value as {
      fullName: string; email: string; phone: string; password: string;
    };
    this.authService.register({ fullName, email, phone: phone || undefined, password }).subscribe({
      next: () => {
        this.pendingEmail = email;
        this.router.navigate(['/auth/verify-otp'], { queryParams: { email } });
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
