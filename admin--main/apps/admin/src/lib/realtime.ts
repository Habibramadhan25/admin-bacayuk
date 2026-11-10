/**
 * Real-time Engine untuk Portal Admin BacaYuk
 * Menggabungkan BroadcastChannel (sinkronisasi antar-tab seketika 0ms)
 * dan Server-Sent Events (SSE) via /api/realtime/stream (antar-browser & antar-perangkat).
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

class RealtimeClient {
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
      console.warn('BroadcastChannel tidak didukung di lingkungan ini:', err);
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

        // Coba rekoneksi otomatis setiap 4 detik
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
    // 1. Panggil subscriber internal
    this.listeners.forEach((cb) => {
      try {
        cb(msg);
      } catch (e) {
        console.error('Realtime listener error:', e);
      }
    });

    // 2. Dispatch custom DOM event sesuai kategori
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
      sender: 'admin_portal',
      timestamp: new Date().toISOString(),
    };

    // 1. Broadcast seketika ke tab lokal via BroadcastChannel (0ms)
    try {
      this.channel?.postMessage(payload);
    } catch {}

    // 2. Kirim ke Server via HTTP POST agar diteruskan ke browser lain / siswa
    try {
      fetch('/api/realtime/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {}

    // 3. Picu update lokal pada tab saat ini
    this.handleIncoming(payload);
  }

  public getStatus(): boolean {
    return this.isConnected || Boolean(this.channel);
  }
}

export const realtime = new RealtimeClient();

/**
 * Hook untuk memantau status koneksi real-time di UI
 */
export function useRealtimeStatus() {
  const [isLive, setIsLive] = useState(realtime.getStatus());

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail && typeof e.detail.isConnected === 'boolean') {
        setIsLive(e.detail.isConnected || Boolean(realtime.getStatus()));
      }
    };

    window.addEventListener('bacayuk_realtime_status', handler);
    return () => window.removeEventListener('bacayuk_realtime_status', handler);
  }, []);

  return isLive;
}

/**
 * Hook untuk menerima notifikasi pesan real-time
 */
export function useRealtimeEvent(onEvent: (msg: RealtimeMessage) => void) {
  useEffect(() => {
    const unsubscribe = realtime.subscribe(onEvent);
    return () => unsubscribe();
  }, [onEvent]);
}
