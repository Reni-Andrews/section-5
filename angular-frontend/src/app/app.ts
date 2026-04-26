import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="nav-brand">
        <div class="logo-box-xs">D</div>
        <span class="brand-text">Deckzi<span class="brand-ai">AI</span></span>
      </div>
      <div class="nav-links" *ngIf="auth.isLoggedIn$ | async">
        <a routerLink="/chat" routerLinkActive="active" id="nav-chat">Chat</a>
        <a routerLink="/profile" routerLinkActive="active" id="nav-profile">Profile</a>
        <button class="btn-logout-nav" id="btn-logout" (click)="auth.logout()">Logout</button>
      </div>
    </nav>
    <main>
      <router-outlet />
    </main>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    :host { 
      display: block; min-height: 100vh; 
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f0f2f5;
    }
    .navbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2.5rem; height: 60px;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.5);
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    }
    .nav-brand { display: flex; align-items: center; gap: 0.75rem; }
    .logo-box-xs {
      width: 32px; height: 32px; background: #1a1c1e; color: #ffffff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 900; border-radius: 8px;
    }
    .brand-text { font-size: 1.25rem; font-weight: 800; color: #1a1c1e; letter-spacing: -0.04em; }
    .brand-ai { color: #6366f1; }
    .nav-links { display: flex; align-items: center; gap: 2rem; }
    .nav-links a {
      color: #64748b; text-decoration: none; font-size: 0.95rem; font-weight: 700;
      transition: all 0.2s; padding: 0.4rem 0.8rem; border-radius: 10px;
    }
    .nav-links a.active, .nav-links a:hover { color: #1a1c1e; background: rgba(255,255,255,0.5); }
    .btn-logout-nav {
      background: rgba(239, 68, 68, 0.1); border: none;
      color: #ef4444; padding: 0.5rem 1.25rem; border-radius: 12px;
      cursor: pointer; font-size: 0.85rem; font-weight: 700; transition: all 0.2s;
    }
    .btn-logout-nav:hover { background: rgba(239, 68, 68, 0.2); transform: scale(1.05); }
    main { min-height: calc(100vh - 60px); }
  `],
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
