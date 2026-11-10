/**
 * Real-time Engine untuk Aplikasi Siswa (Mobile/Web) BacaYuk
 * Mendukung sinkronisasi instan via BroadcastChannel & SSE (/api/realtime/stream)
 */

import { useState, useEffect } from 'react';

export type RealtimeEventType = 
  | 'BOOKS_UPDATED'
  | 'BOOK_CREATED'
  | 'BOOK_DELETED'
  | 'BOOK_UPDATED'
  | 'REVIEWS_UPDATED'
  | 'REVIEW_CREATED'
  | 'USERS_UPDATED'
  | 'USER_REGISTERED'
  | 'USER_JOINED'
  | 'ACTIVITY_UPDATED'
  | 'NOTIFICATION_BROADCAST'
  | 'LOAN_CREATED'
  | 'LOAN_UPDATED'
  | 'READING_HISTORY_UPDATED'
  | 'STATE_SYNCED';

export interface RealtimeMessage {
  type: RealtimeEventType;
  data?: any;
  sender?: string;
  timestamp?: string;
}

type EventCallback = (msg: RealtimeMessage) => void;

class MobileRealtimeClient {
  private channel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private listeners: Set<EventCallback> = new Set();
  private isConnected: boolean = false;
  private reconnectTimer: any = null;

  constructor() {
    this.initBroadcastChannel();
    this.initSse();
  }

  private initBroadcastChannel() {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    try {
      this.channel = new BroadcastChannel('bacayuk_realtime_sync');
      this.channel.onmessage = (event) => {
        if (event.data && event.data.type) {
          this.handleIncoming(event.data);
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel tidak didukung di lingkungan mobile web ini:', err);
    }
  }

  private initSse() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource('/api/realtime/stream');

      this.eventSource.addEventListener('connected', () => {
        this.isConnected = true;
        this.notifyStatusChange();
      });

      this.eventSource.addEventListener('message', (event) => {
        try {
          const payload: RealtimeMessage = JSON.parse(event.data);
          this.handleIncoming(payload);
        } catch {}
      });

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notifyStatusChange();
        this.eventSource?.close();

        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.initSse();
        }, 4000);
      };
    } catch {
      // Offline fallback
    }
  }

  private handleIncoming(msg: RealtimeMessage) {
    // 1. Panggil subscriber callback
    this.listeners.forEach((cb) => {
      try {
        cb(msg);
      } catch (e) {
        console.error('Realtime callback error:', e);
      }
    });

    // 2. Dispatch event ke window DOM
    if (typeof window !== 'undefined') {
      if (msg.type.includes('BOOK')) {
        window.dispatchEvent(new Event('bacayuk_books_updated'));
      }
      if (msg.type.includes('REVIEW')) {
        window.dispatchEvent(new Event('bacayuk_reviews_updated'));
      }
      if (msg.type.includes('USER')) {
        window.dispatchEvent(new Event('bacayuk_users_updated'));
      }
      if (msg.type.includes('ACTIVITY')) {
        window.dispatchEvent(new Event('bacayuk_activity_updated'));
      }
      window.dispatchEvent(new Event('storage'));
    }
  }

  private notifyStatusChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bacayuk_realtime_status', {
        detail: { isConnected: this.isConnected }
      }));
    }
  }

  public subscribe(cb: EventCallback) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public publish(type: RealtimeEventType, data?: any) {
    const payload: RealtimeMessage = {
      type,
      data,
      sender: 'student_app',
      timestamp: new Date().toISOString(),
    };

    try {
      this.channel?.postMessage(payload);
    } catch {}

    try {
      fetch('/api/realtime/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {}

    this.handleIncoming(payload);
  }

  public getStatus(): boolean {
    return this.isConnected || Boolean(this.channel);
  }
}

export const mobileRealtime = new MobileRealtimeClient();

/**
 * Hook untuk mengecek status realtime di aplikasi siswa
 */
export function useRealtimeStatus() {
  const [isLive, setIsLive] = useState(mobileRealtime.getStatus());

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail && typeof e.detail.isConnected === 'boolean') {
        setIsLive(e.detail.isConnected || Boolean(mobileRealtime.getStatus()));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('bacayuk_realtime_status', handler);
      return () => window.removeEventListener('bacayuk_realtime_status', handler);
    }
  }, []);

  return isLive;
}

/**
 * Hook untuk menerima notifikasi real-time di layar siswa
 */
export function useRealtimeEvent(onEvent: (msg: RealtimeMessage) => void) {
  useEffect(() => {
    const unsubscribe = mobileRealtime.subscribe(onEvent);
    return () => unsubscribe();
  }, [onEvent]);
}
