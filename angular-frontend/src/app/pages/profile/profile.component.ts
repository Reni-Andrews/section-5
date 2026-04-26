import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ProfileService, UserProfile } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page">
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar">{{ initial }}</div>
          <div>
            <h1 class="profile-name">{{ profile?.displayName || profile?.username }}</h1>
            <p class="profile-email">{{ profile?.email }}</p>
          </div>
        </div>

        <div *ngIf="loadError" class="alert-info">
          ℹ️ Profile data from .NET backend unavailable (MySQL may not be running locally).
          Your FastAPI account is active.
        </div>

        <form [formGroup]="form" (ngSubmit)="onSave()" id="profile-form" *ngIf="profile && !loadError">
          <div class="field-group">
            <label>Display Name</label>
            <input id="profile-display-name" type="text" formControlName="displayName" placeholder="Your display name" />
          </div>
          <div class="field-group">
            <label>Preferences (JSON)</label>
            <textarea id="profile-preferences" formControlName="preferences" rows="4" placeholder='{"theme":"dark"}'></textarea>
          </div>
          <div class="form-actions">
            <span class="save-success" *ngIf="saved">✓ Saved successfully</span>
            <button type="submit" id="btn-save-profile" class="btn-primary" [disabled]="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>

        <div class="meta" *ngIf="profile">
          <span>Member since: {{ profile.createdAt | date:'mediumDate' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    .profile-page {
      min-height: 100%; display: flex; align-items: flex-start; justify-content: center;
      padding: 3rem 2rem;
      background: #f0f2f5;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.1) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.1) 0px, transparent 50%);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .profile-card {
      width: 100%; max-width: 580px;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 32px; padding: 3.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
    }
    .profile-header { display: flex; align-items: center; gap: 2rem; margin-bottom: 3rem; }
    .avatar {
      width: 80px; height: 80px; border-radius: 24px; 
      background: linear-gradient(135deg, #6366f1, #a855f7);
      display: flex; align-items: center; justify-content: center; font-size: 2rem;
      font-weight: 800; color: white; flex-shrink: 0;
      box-shadow: 0 10px 20px rgba(99,102,241,0.3);
    }
    .profile-name { color: #1a1c1e; font-size: 1.75rem; font-weight: 800; margin: 0 0 0.4rem; letter-spacing: -0.03em; }
    .profile-email { color: #64748b; font-size: 1rem; margin: 0; font-weight: 600; }
    
    .alert-info {
      background: #1a1c1e; color: #ffffff;
      padding: 1.25rem; border-radius: 16px; font-size: 0.9rem; line-height: 1.6;
      margin-bottom: 2rem; font-weight: 600; box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    
    .field-group { margin-bottom: 2rem; }
    label { display: block; color: #1a1c1e; font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; }
    input, textarea {
      width: 100%; background: #ffffff; border: 2px solid transparent;
      border-radius: 16px; padding: 1rem 1.25rem; color: #1a1c1e; font-size: 1.05rem;
      outline: none; transition: all 0.3s; box-sizing: border-box; font-family: inherit;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }
    input:focus, textarea:focus { border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(99,102,241,0.1); }
    textarea { resize: vertical; min-height: 120px; }
    
    .form-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; }
    .save-success { color: #22c55e; font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .save-success::before { content: '✨'; }
    
    .btn-primary {
      background: #1a1c1e; border: none;
      border-radius: 16px; padding: 1rem 2.5rem; color: white; font-size: 1.05rem;
      font-weight: 800; cursor: pointer; transition: all 0.3s;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }
    .btn-primary:hover:not(:disabled) { background: #333639; transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,0,0,0.2); }
    .btn-primary:disabled { background: #cbd5e1; color: #94a3b8; box-shadow: none; cursor: not-allowed; }
    
    .meta { color: #94a3b8; font-size: 0.85rem; margin-top: 2.5rem; text-align: center; font-weight: 600; }
  `],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  profile: UserProfile | null = null;
  form = this.fb.group({ displayName: [''], preferences: ['{}'] });
  saving = false;
  saved = false;
  loadError = false;
  initial = 'U';

  ngOnInit(): void {
    this.initial = this.authService.getUsername()?.[0]?.toUpperCase() ?? 'U';
    this.profileService.getProfile().subscribe({
      next: p => {
        this.profile = p;
        this.form.setValue({
          displayName: p.displayName ?? '',
          preferences: p.preferences ?? '{}',
        });
      },
      error: () => {
        this.loadError = true;
      },
    });
  }

  onSave(): void {
    this.saving = true;
    const { displayName, preferences } = this.form.value;
    this.profileService.updateProfile(displayName!, preferences!).subscribe({
      next: p => {
        this.profile = p;
        this.saved = true;
        this.saving = false;
        setTimeout(() => (this.saved = false), 3000);
      },
      error: () => {
        this.saving = false;
      },
    });
  }
}
