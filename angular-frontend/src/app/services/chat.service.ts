import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ChatTurn {
  role: 'user' | 'model';
  content: string;
  timestamp?: string;
}

export interface HistoryResponse {
  session_id: string;
  turns: ChatTurn[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private auth: AuthService) {}

  /**
   * Streams the AI response using the Fetch API (not HttpClient)
   * because Angular's HttpClient doesn't support streaming.
   * Returns an Observable that emits text chunks as they arrive.
   */
  sendMessage(prompt: string, sessionId = 'default'): Observable<string> {
    return new Observable<string>(subscriber => {
      const token = this.auth.getToken();

      fetch(`${environment.fastapiUrl}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Ensure there is a SPACE after Bearer
      'Authorization': `Bearer ${token}`, 
    },
    body: JSON.stringify({ prompt: prompt, session_id: sessionId }),
})
        .then(async response => {
          if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Unknown error' }));
            subscriber.error(err);
            return;
          }

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            subscriber.next(chunk);
          }
          subscriber.complete();
        })
        .catch(err => subscriber.error(err));
    });
  }

  getHistory(sessionId = 'default'): Observable<HistoryResponse> {
    return new Observable<HistoryResponse>(subscriber => {
      const token = this.auth.getToken();
      fetch(`${environment.fastapiUrl}/chat/history?session_id=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          subscriber.next(data);
          subscriber.complete();
        })
        .catch(err => subscriber.error(err));
    });
  }

  clearHistory(sessionId = 'default'): Observable<any> {
    return new Observable(subscriber => {
      const token = this.auth.getToken();
      fetch(`${environment.fastapiUrl}/chat/clear?session_id=${sessionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          subscriber.next(data);
          subscriber.complete();
        })
        .catch(err => subscriber.error(err));
    });
  }
}
