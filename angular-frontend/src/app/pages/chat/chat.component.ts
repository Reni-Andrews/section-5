import {
  Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewChecked, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

interface UiMessage {
  role: 'user' | 'model';
  content: string;
  streaming?: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="chat-page">
      <!-- Sidebar -->
      <aside class="sidebar">
          <div class="sidebar-header">
            <div class="logo-box-sm">D</div>
            <div>
              <h2 class="ai-name">Deckzi AI</h2>
              <div class="ai-status">
                <span class="status-dot"></span>
                Online
              </div>
            </div>
          </div>

        <div class="session-info">
          <p class="label">Session</p>
          <code class="session-id">{{ sessionId }}</code>
        </div>

        <button
          id="btn-clear-history"
          class="btn-clear"
          (click)="clearHistory()"
        >
          🗑 Clear History
        </button>

        <div class="sidebar-footer">
          <p>Logged in as</p>
          <strong>{{ username }}</strong>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </aside>

      <!-- Main chat area -->
      <div class="chat-main">
        <!-- Messages -->
        <div class="messages-container" #messagesContainer>
          <!-- Empty state -->
          <div class="empty-state" *ngIf="messages.length === 0 && !isStreaming">
            <div class="empty-icon">💬</div>
            <h2>Start a conversation</h2>
            <p>Ask anything — I'm powered by Google Gemini.</p>
            <div class="prompt-chips">
              <button class="chip" (click)="usePrompt('What can you help me with?')">What can you help me with?</button>
              <button class="chip" (click)="usePrompt('Explain machine learning in simple terms')">Explain machine learning</button>
              <button class="chip" (click)="usePrompt('Write me a Python hello world')">Write Python code</button>
            </div>
          </div>

          <!-- Messages -->
          <div
            *ngFor="let msg of messages; let i = index"
            class="message-row"
            [class.user-row]="msg.role === 'user'"
            [class.model-row]="msg.role === 'model'"
          >
            <div class="message-avatar" *ngIf="msg.role === 'model'">🤖</div>
            <div class="message-bubble" [class.user-bubble]="msg.role === 'user'" [class.model-bubble]="msg.role === 'model'">
              <div class="message-content" [innerHTML]="formatContent(msg.content)"></div>
              <span class="streaming-cursor" *ngIf="msg.streaming">▊</span>
            </div>
            <div class="message-avatar user-av" *ngIf="msg.role === 'user'">{{ userInitial }}</div>
          </div>

          <!-- Typing indicator -->
          <div class="typing-indicator" *ngIf="isStreaming && !currentStreamMessage">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>

        <!-- Safety error -->
        <div class="safety-banner" *ngIf="safetyError">
          ⚠️ {{ safetyError }}
          <button (click)="safetyError = ''">✕</button>
        </div>

        <!-- Input area -->
        <div class="input-area">
          <form [formGroup]="chatForm" (ngSubmit)="sendMessage()" id="chat-form">
            <div class="input-wrapper">
              <textarea
                id="chat-input"
                formControlName="prompt"
                placeholder="Ask me anything..."
                rows="1"
                (keydown.enter)="onEnter($any($event))"
                (input)="autoResize($event)"
              ></textarea>
              <button
                type="submit"
                id="btn-send"
                class="btn-send"
              >
                <svg *ngIf="!isStreaming" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                <span *ngIf="isStreaming" class="spinner-sm"></span>
              </button>
            </div>
            <p class="input-hint">Press Enter to send · Shift+Enter for newline</p>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    .chat-page {
      display: flex; height: calc(100vh - 60px);
      background: #f0f2f5;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.15) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.15) 0px, transparent 50%);
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1a1c1e;
      padding: 1.5rem;
      gap: 1.5rem;
    }

    /* ── Sidebar ────────────────────────────────── */
    .sidebar {
      width: 300px; flex-shrink: 0;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 24px;
      display: flex; flex-direction: column; padding: 2rem; gap: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.04);
    }
    .sidebar-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
    .logo-box-sm {
      width: 42px; height: 42px; background: #1a1c1e; color: #ffffff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 900; border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .ai-name { color: #1a1c1e; font-weight: 800; margin: 0; font-size: 1.25rem; letter-spacing: -0.02em; }
    .ai-status { color: #64748b; font-size: 0.8rem; display: flex; align-items: center; gap: 0.4rem; font-weight: 500; }
    .status-dot {
      width: 8px; height: 8px; background: #22c55e; border-radius: 50%;
      box-shadow: 0 0 10px rgba(34, 197, 94, 0.4);
    }

    .session-info { background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.8); border-radius: 16px; padding: 1.25rem; }
    .session-info .label { color: #94a3b8; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 0.5rem; font-weight: 700; }
    .session-id { color: #1a1c1e; font-size: 0.75rem; word-break: break-all; font-weight: 600; font-family: monospace; }

    .btn-clear {
      background: #ffffff; border: 1px solid #fee2e2;
      color: #ef4444; padding: 0.85rem 1rem; border-radius: 14px;
      cursor: pointer; font-size: 0.9rem; transition: all 0.2s; width: 100%;
      font-weight: 700; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.05);
    }
    .btn-clear:hover:not(:disabled) { background: #fef2f2; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(239, 68, 68, 0.1); }
    .btn-clear:disabled { opacity: 0.4; cursor: not-allowed; }

    .sidebar-footer { margin-top: auto; padding-top: 1.5rem; border-top: 1px solid rgba(0,0,0,0.05); }
    .sidebar-footer p { color: #94a3b8; font-size: 0.8rem; margin-bottom: 0.25rem; font-weight: 500; }
    .sidebar-footer strong { color: #1a1c1e; display: block; margin-bottom: 1rem; font-weight: 700; }
    
    .btn-logout {
      background: #1a1c1e; color: #ffffff;
      padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.85rem; cursor: pointer;
      transition: all 0.2s; width: 100%; text-align: center; font-weight: 600; border: none;
    }
    .btn-logout:hover { background: #333639; transform: scale(1.02); }

    /* ── Chat main ──────────────────────────────── */
    .chat-main { 
      flex: 1; display: flex; flex-direction: column; overflow: hidden; 
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.04);
    }

    /* Messages */
    .messages-container {
      flex: 1; overflow-y: auto; padding: 2.5rem;
      display: flex; flex-direction: column; gap: 2rem;
      scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;
    }

    .empty-state {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; gap: 1rem;
    }
    .empty-icon { font-size: 5rem; margin-bottom: 1.5rem; }
    .empty-state h2 { color: #1a1c1e; margin: 0; font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; }
    .empty-state p { margin: 0; font-size: 1.1rem; color: #64748b; max-width: 400px; line-height: 1.5; }
    .prompt-chips { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; margin-top: 3rem; }
    .chip {
      background: #ffffff; border: 1px solid #e2e8f0;
      color: #1a1c1e; padding: 0.75rem 1.5rem; border-radius: 16px;
      cursor: pointer; font-size: 0.9rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }
    .chip:hover { border-color: #6366f1; color: #6366f1; transform: translateY(-4px) scale(1.02); box-shadow: 0 10px 20px rgba(99,102,241,0.12); }

    .message-row {
      display: flex; align-items: flex-start; gap: 1.25rem;
      animation: messageSlide 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    @keyframes messageSlide { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .user-row { flex-direction: row-reverse; }
    .message-avatar {
      width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center;
      justify-content: center; font-size: 1.4rem; flex-shrink: 0;
      background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .user-av { background: #1a1c1e; color: white; border: none; font-size: 1rem; }

    .message-bubble {
      max-width: 70%; padding: 1.25rem 1.5rem; border-radius: 24px;
      position: relative; line-height: 1.7; font-size: 1rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    }
    .model-bubble {
      background: #ffffff; border: 1px solid #e2e8f0;
      border-top-left-radius: 4px; color: #1a1c1e;
    }
    .user-bubble {
      background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff;
      border-top-right-radius: 4px; box-shadow: 0 8px 20px rgba(99,102,241,0.2);
    }
    .message-content { font-weight: 500; }
    
    /* Code Block Styling */
    .message-content pre {
      background: #1a1c1e;
      color: #f8fafc;
      padding: 1.25rem;
      border-radius: 12px;
      margin: 1rem 0;
      overflow-x: auto;
      font-family: 'Fira Code', monospace;
      font-size: 0.85rem;
      line-height: 1.5;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .message-content code {
      background: #f1f5f9;
      color: #ef4444;
      padding: 0.2rem 0.4rem;
      border-radius: 6px;
      font-family: 'Fira Code', monospace;
      font-size: 0.9em;
      font-weight: 600;
    }
    .message-content pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      font-weight: 400;
    }

    .streaming-cursor { display: inline-block; width: 2px; height: 1.2em; background: #6366f1; animation: blink 0.8s infinite; vertical-align: middle; margin-left: 4px; }
    @keyframes blink { 50% { opacity: 0; } }

    .typing-indicator {
      display: flex; align-items: center; gap: 8px; padding: 0.75rem 1.25rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; width: fit-content;
    }
    .typing-dot {
      width: 8px; height: 8px; background: #cbd5e1; border-radius: 50%;
      animation: wave 1.2s infinite ease-in-out;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes wave { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); background: #6366f1; } }

    /* Safety banner */
    .safety-banner {
      margin: 0 2.5rem 1.5rem; padding: 1.25rem; background: #1a1c1e;
      border-radius: 18px; color: #ffffff;
      font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-weight: 600;
    }
    .safety-banner button { background: rgba(255,255,255,0.1); border: none; color: #ffffff; cursor: pointer; padding: 0.4rem; border-radius: 8px; }

    /* Input */
    .input-area { padding: 1.5rem 2.5rem 2.5rem; background: transparent; }
    .input-wrapper {
      display: flex; gap: 1rem; align-items: flex-end;
      background: #ffffff; border: 2px solid transparent;
      border-radius: 22px; padding: 1rem 1.25rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    }
    .input-wrapper:focus-within { border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 15px 40px rgba(99,102,241,0.15); }
    textarea {
      flex: 1; background: transparent; border: none; outline: none;
      color: #1a1c1e; font-size: 1.05rem; resize: none; max-height: 200px;
      font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.6; padding: 0.25rem 0;
      font-weight: 500;
    }
    textarea::placeholder { color: #94a3b8; }
    .btn-send {
      width: 48px; height: 48px; background: #6366f1;
      border: none; border-radius: 16px; cursor: pointer; color: white;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      transition: all 0.2s;
    }
    .btn-send:hover:not(:disabled) { background: #4f46e5; transform: rotate(-5deg) scale(1.1); }
    .btn-send:disabled { background: #f1f5f9; color: #cbd5e1; cursor: not-allowed; }
    
    .input-hint { color: #64748b; font-size: 0.8rem; margin: 0.8rem 0 0 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
    .input-hint::before { content: '✨'; font-size: 0.9rem; }
  `],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private fb = inject(FormBuilder);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  messages: UiMessage[] = [];
  isStreaming = false;
  currentStreamMessage: UiMessage | null = null;
  safetyError = '';
  sessionId = 'session-' + Date.now();
  username = '';

  chatForm = this.fb.group({
    prompt: ['', [Validators.required, Validators.minLength(1)]],
  });

  private sub?: Subscription;
  private shouldScrollDown = false;

  get userInitial(): string {
    return this.username ? this.username[0].toUpperCase() : 'U';
  }

  ngOnInit(): void {
    this.username = this.authService.getUsername() ?? 'User';
    this.loadHistory();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollDown) {
      this.scrollToBottom();
      this.shouldScrollDown = false;
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadHistory(): void {
  this.chatService.getHistory(this.sessionId).subscribe({
    next: res => {
      // Use optional chaining (?.) and a fallback empty array ([])
      if (res && res.turns) {
        this.messages = res.turns.map((t: any) => ({ 
          role: t.role as 'user' | 'model', 
          content: t.content 
        }));
      } else {
        this.messages = [];
      }
      
      this.shouldScrollDown = true;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('History load failed:', err);
      this.messages = []; // Clear messages on error so the UI stays stable
    },
  });
}

  usePrompt(text: string): void {
    this.chatForm.setValue({ prompt: text });
    this.sendMessage();
  }

sendMessage(): void {
  if (this.chatForm.invalid || this.isStreaming) return;

  const prompt = this.chatForm.value.prompt!.trim();
  if (!prompt) return;

  // 1. Disable the prompt input via the form control
  this.chatForm.get('prompt')?.disable(); 

  this.messages.push({ role: 'user', content: prompt });
  this.isStreaming = true;
  // ... existing code ...

  this.sub = this.chatService.sendMessage(prompt, this.sessionId).subscribe({
    next: chunk => {
      if (!this.currentStreamMessage) {
        this.currentStreamMessage = { role: 'model', content: chunk, streaming: true };
        this.messages.push(this.currentStreamMessage);
      } else {
        this.currentStreamMessage.content += chunk;
      }
      this.shouldScrollDown = true;
      this.cdr.detectChanges();
    },
    error: err => {
      this.isStreaming = false;
      this.chatForm.get('prompt')?.enable();
      this.safetyError = err?.detail?.message || err?.detail || err?.message || 'An error occurred';
      this.currentStreamMessage = null;
      this.cdr.detectChanges();
    },
    complete: () => {
      this.chatForm.get('prompt')?.enable();
      this.chatForm.reset({ prompt: '' });
      if (this.currentStreamMessage) {
        this.currentStreamMessage.streaming = false;
      }
      this.isStreaming = false;
      this.currentStreamMessage = null;
      this.shouldScrollDown = true;
      this.cdr.detectChanges();
    },
  });
}

  clearHistory(): void {
    this.chatService.clearHistory(this.sessionId).subscribe({
      next: () => {
        this.messages = [];
        this.cdr.detectChanges();
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  onEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  formatContent(content: string): string {
    if (!content) return '';
    
    // Basic markdown: code blocks with language support, inline code, bold, italic
    let formatted = content
      // Handle code blocks with potential language tag: ```javascript ... ```
      .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'none'}">${code.trim()}</code></pre>`;
      })
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');

    return formatted;
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
