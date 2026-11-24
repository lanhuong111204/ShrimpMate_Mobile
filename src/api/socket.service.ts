import { io, Socket } from 'socket.io-client';
import { AppConfig } from '@/constants/config';
import { Storage } from '@/utils/storage';
import { AlertItem } from '@/types/alert';

export interface TelemetrySocketPayload {
  pondId: string;
  readingId?: string;
  id?: string;
  deviceId?: string;
  deviceUid?: string;
  ph?: number;
  dissolvedOxygenMgL?: number;
  do?: number;
  temperatureC?: number;
  temperature?: number;
  salinityPpt?: number;
  salinity?: number;
  ammoniaMgL?: number;
  nh3?: number;
  turbidityNtu?: number;
  turbidity?: number;
  isBuffered?: boolean;
  measuredAt?: string;
  emittedAt?: string;
  rawData?: Record<string, unknown>;
}

export interface FeederStatusSocketPayload {
  pondId?: string;
  recordId?: string;
  deviceId?: string;
  deviceUid?: string;
  status?: string;
  mode?: string;
  command?: string;
  requestedAmountKg?: number;
  actualAmountKg?: number | null;
  feedAmountKg?: number;
  safetyDecision?: string;
  reason?: string;
  stoppedReason?: string | null;
  finishedAt?: string | null;
  timestamp?: string;
  emittedAt?: string;
}

export interface FeedingCompletedSocketPayload {
  pondId: string;
  recordId?: string;
  status?: string;
  actualAmountKg?: number | null;
  stoppedReason?: string | null;
  finishedAt?: string | null;
  emittedAt?: string;
}

export interface DeviceStatusSocketPayload {
  deviceId: string;
  deviceUid?: string;
  pondId?: string | null;
  name?: string;
  type?: string;
  status?: string;
  mode?: string;
  lastSeenAt?: string | null;
  rssi?: number;
  reason?: string;
  emittedAt?: string;
}

type Unsubscribe = () => void;

class SocketService {
  private socket: Socket | null = null;
  private activePondId: string | null = null;
  private currentToken: string | null = null;
  private connectPromise: Promise<void> | null = null;

  private telemetryListeners = new Set<(payload: TelemetrySocketPayload) => void>();
  private feederStatusListeners = new Set<(payload: FeederStatusSocketPayload) => void>();
  private feedingCompletedListeners = new Set<(payload: FeedingCompletedSocketPayload) => void>();
  private alertNewListeners = new Set<(payload: AlertItem) => void>();
  private deviceStatusListeners = new Set<(payload: DeviceStatusSocketPayload) => void>();

  async connect(): Promise<void> {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = (async () => {
      try {
        const token = await Storage.getItem(AppConfig.storageKeys.authToken);
        if (!token || token === 'offline_session_shrimpmate') {
          this.disconnect();
          return;
        }

        // Backend EventsGateway verifies client.handshake.auth.token directly (no 'Bearer ' prefix)
        const rawToken = token.replace(/^Bearer\s+/i, '').trim();
        if (!rawToken) {
          this.disconnect();
          return;
        }

        if (this.socket && this.currentToken === rawToken) {
          if (!this.socket.connected) {
            this.socket.connect();
          }
          return;
        }

        if (this.socket) {
          this.socket.removeAllListeners();
          this.socket.disconnect();
          this.socket = null;
        }

        const baseUrl = AppConfig.apiBaseUrl.replace(/\/+$/, '');
        this.currentToken = rawToken;

        const socket = io(`${baseUrl}/`, {
          transports: ['websocket', 'polling'],
          auth: { token: rawToken },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
        });

        socket.on('connect', () => {
          if (this.activePondId) {
            socket.emit('join:pond', { pondId: this.activePondId });
          }
        });

        const forwardTelemetry = (payload: TelemetrySocketPayload) => {
          this.telemetryListeners.forEach((handler) => handler(payload));
        };
        socket.on('telemetry:update', forwardTelemetry);
        socket.on('telemetry:new', forwardTelemetry);

        const forwardFeederStatus = (payload: FeederStatusSocketPayload) => {
          this.feederStatusListeners.forEach((handler) => handler(payload));
        };
        socket.on('feeder:status', forwardFeederStatus);
        socket.on('feeding:progress', forwardFeederStatus);

        socket.on('feeding:completed', (payload: FeedingCompletedSocketPayload) => {
          this.feedingCompletedListeners.forEach((handler) => handler(payload));
        });

        socket.on('alert:new', (payload: AlertItem) => {
          this.alertNewListeners.forEach((handler) => handler(payload));
        });

        socket.on('device:status', (payload: DeviceStatusSocketPayload) => {
          this.deviceStatusListeners.forEach((handler) => handler(payload));
        });

        this.socket = socket;
      } finally {
        this.connectPromise = null;
      }
    })();

    return this.connectPromise;
  }

  disconnect(): void {
    if (this.activePondId && this.socket?.connected) {
      this.socket.emit('leave:pond', { pondId: this.activePondId });
    }
    this.activePondId = null;
    this.currentToken = null;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinPond(pondId: string): void {
    if (!pondId) return;
    const prevPondId = this.activePondId;
    if (prevPondId && prevPondId !== pondId && this.socket?.connected) {
      this.socket.emit('leave:pond', { pondId: prevPondId });
    }
    this.activePondId = pondId;
    if (this.socket?.connected) {
      this.socket.emit('join:pond', { pondId });
    }
  }

  leavePond(pondId?: string): void {
    const targetPondId = pondId ?? this.activePondId;
    if (targetPondId && this.socket?.connected) {
      this.socket.emit('leave:pond', { pondId: targetPondId });
    }
    if (!pondId || pondId === this.activePondId) {
      this.activePondId = null;
    }
  }

  onTelemetry(handler: (payload: TelemetrySocketPayload) => void): Unsubscribe {
    this.telemetryListeners.add(handler);
    return () => {
      this.telemetryListeners.delete(handler);
    };
  }

  onFeederStatus(handler: (payload: FeederStatusSocketPayload) => void): Unsubscribe {
    this.feederStatusListeners.add(handler);
    return () => {
      this.feederStatusListeners.delete(handler);
    };
  }

  onFeedingCompleted(handler: (payload: FeedingCompletedSocketPayload) => void): Unsubscribe {
    this.feedingCompletedListeners.add(handler);
    return () => {
      this.feedingCompletedListeners.delete(handler);
    };
  }

  onAlertNew(handler: (payload: AlertItem) => void): Unsubscribe {
    this.alertNewListeners.add(handler);
    return () => {
      this.alertNewListeners.delete(handler);
    };
  }

  onDeviceStatus(handler: (payload: DeviceStatusSocketPayload) => void): Unsubscribe {
    this.deviceStatusListeners.add(handler);
    return () => {
      this.deviceStatusListeners.delete(handler);
    };
  }
}

export const socketService = new SocketService();
export { SocketService };
