import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SelectOption } from '../../../shared/components/select-dropdown/select-dropdown.component';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pass = control.get('password')?.value as string;
  const confirm = control.get('confirmPassword')?.value as string;
  return pass === confirm ? null : { mismatch: true };
}

@Component({
  standalone: false,
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
  showPassword = false;
  showConfirmPassword = false;

  roleOptions: SelectOption[] = [
    { value: 'customer', label: 'Listener (Customer)', icon: 'fa-solid fa-headphones' },
    { value: 'producer', label: 'Creator (Producer)', icon: 'fa-solid fa-microphone' }
  ];

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
      role: ['customer', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatch });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { fullName, email, phone, role, password, confirmPassword } = this.form.value as {
      fullName: string; email: string; phone: string; role: string; password: string; confirmPassword: string;
    };
    this.authService.register({ fullName, email, phone: phone || undefined, role, password, confirmPassword }).subscribe({
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

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
