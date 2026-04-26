import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-box">D</div>
        </div>
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-subtitle">Sign in to your Deckzi AI account</p>

        <div *ngIf="error" class="alert-error" role="alert">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" id="login-form" novalidate>
          <div class="field-group">
            <label for="email">Email</label>
            <input
              id="login-email"
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              [class.invalid]="form.get('email')?.invalid && form.get('email')?.touched"
            />
            <span class="field-error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
              Valid email is required
            </span>
          </div>

          <div class="field-group">
            <label for="password">Password</label>
            <input
              id="login-password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              [class.invalid]="form.get('password')?.invalid && form.get('password')?.touched"
            />
            <span class="field-error" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
              Password is required (min 6 chars)
            </span>
          </div>

          <button
            type="submit"
            id="btn-login-submit"
            class="btn-primary"
            [disabled]="loading"
          >
            <span *ngIf="!loading">Sign In</span>
            <span *ngIf="loading" class="spinner"></span>
          </button>
        </form>

        <p class="auth-footer">
          Don't have an account? <a routerLink="/register" id="link-to-register">Create one</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    .auth-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #f0f2f5;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.2) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.2) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.2) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.2) 0px, transparent 50%);
      padding: 2rem; font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .auth-logo { display: flex; justify-content: center; margin-bottom: 2.5rem; }
    .logo-box {
      width: 64px; height: 64px; background: #1a1c1e; color: #ffffff;
      display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem; font-weight: 900; border-radius: 18px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
      position: relative; overflow: hidden;
    }
    .logo-box::after {
      content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
      transform: rotate(45deg);
    }
    .auth-title { color: #1a1c1e; font-size: 2.25rem; font-weight: 800; text-align: center; margin: 0 0 0.75rem; letter-spacing: -0.04em; }
    .auth-subtitle { color: #64748b; text-align: center; margin: 0 0 3rem; font-size: 1.05rem; font-weight: 600; }
    .alert-error {
      background: #1a1c1e; color: #ffffff;
      padding: 1.25rem; border-radius: 16px; font-size: 0.95rem;
      margin-bottom: 2rem; font-weight: 600; text-align: center;
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    .field-group { margin-bottom: 2rem; }
    label { display: block; color: #1a1c1e; font-size: 0.9rem; font-weight: 700; margin-bottom: 0.75rem; }
    input {
      width: 100%; background: #ffffff; border: 2px solid transparent;
      border-radius: 16px; padding: 1rem 1.25rem; color: #1a1c1e; font-size: 1.05rem;
      outline: none; transition: all 0.3s; box-sizing: border-box;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }
    input:focus { border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(99,102,241,0.1); }
    input.invalid { border-color: #ef4444; }
    .field-error { color: #ef4444; font-size: 0.85rem; margin-top: 0.5rem; font-weight: 700; display: block; }
    .btn-primary {
      width: 100%; background: #1a1c1e;
      border: none; border-radius: 16px; padding: 1.25rem; color: white;
      font-size: 1.1rem; font-weight: 800; cursor: pointer; margin-top: 1.5rem;
      transition: all 0.3s; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }
    .btn-primary:hover:not(:disabled) { background: #333639; transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,0,0,0.2); }
    .btn-primary:disabled { background: #cbd5e1; color: #94a3b8; box-shadow: none; cursor: not-allowed; }
    .spinner {
      width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-footer { text-align: center; color: #64748b; font-size: 1rem; margin-top: 2.5rem; font-weight: 600; }
    .auth-footer a { color: #6366f1; text-decoration: none; font-weight: 800; position: relative; }
    .auth-footer a::after { content: ''; position: absolute; width: 100%; height: 2px; bottom: -4px; left: 0; background: #6366f1; transform: scaleX(0); transition: transform 0.3s; }
    .auth-footer a:hover::after { transform: scaleX(1); }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;
  error = '';

 onSubmit(): void {
  this.error = ''; 
  const { email, password } = this.form.value;

  // Change 'authService' to 'auth' to match your injection above
  this.auth.login({ email, password }).subscribe({
    next: (res: any) => {
      console.log('Login successful');
      this.router.navigate(['/chat']);
    },
    error: (err: any) => {
      console.error('Login failed', err);
      this.error = "Invalid email or password"; 
    }
  });
}
}
