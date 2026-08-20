import Peer, { DataConnection } from 'peerjs';
import { GameState, NetworkMessage, PlayerColor, ChatMessage } from '../types';

/**
 * Normalizes any room code format (e.g. "WT-7X9K", "7X9K", "wt-7x9k", " 7x9k ")
 * to a standardized uppercase code without prefix: e.g. "7X9K"
 */
export function normalizeRoomCode(input: string): string {
  if (!input) return '';
  let clean = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
  if (clean.startsWith('WT') && clean.length > 2) {
    clean = clean.substring(2);
  }
  return clean;
}

export function makeRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WT-${result}`;
}

export function formatHostPeerId(code: string): string {
  const clean = normalizeRoomCode(code).toLowerCase();
  return `world-tycoon-host-${clean}`;
}

const PEER_OPTIONS = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:stun.services.mozilla.com' },
    ],
    iceCandidatePoolSize: 10,
    sdpSemantics: 'unified-plan',
  },
};

export class PeerNetwork {
  private peer: Peer | null = null;
  private hostConn: DataConnection | null = null;
  private connections = new Map<string, DataConnection>();
  private broadcastChannel: BroadcastChannel | null = null;

  public myPeerId: string | null = null;
  public isHost = false;
  public roomCode: string = '';
  public latestState: GameState | null = null;

  private onStateCallback?: (state: GameState) => void;
  private onActionCallback?: (fromPlayerId: string, action: string, payload: Record<string, unknown>) => void;
  private onPlayerJoinCallback?: (playerId: string, peerId: string, name: string, color: PlayerColor, avatar: string) => void;
  private onPlayerDisconnectCallback?: (peerId: string) => void;
  private onChatCallback?: (chat: ChatMessage) => void;
  private onErrorCallback?: (err: string) => void;

  public initHost(
    roomCode: string,
    onReady: (peerId: string) => void,
    onPlayerJoin: (playerId: string, peerId: string, name: string, color: PlayerColor, avatar: string) => void,
    onAction: (fromPlayerId: string, action: string, payload: Record<string, unknown>) => void,
    onChat: (chat: ChatMessage) => void,
    onDisconnect: (peerId: string) => void,
    onError: (err: string) => void
  ) {
    this.destroy();
    this.isHost = true;
    this.roomCode = roomCode;
    this.onPlayerJoinCallback = onPlayerJoin;
    this.onActionCallback = onAction;
    this.onChatCallback = onChat;
    this.onPlayerDisconnectCallback = onDisconnect;
    this.onErrorCallback = onError;

    const normCode = normalizeRoomCode(roomCode);

    // Multi-tab same-device broadcast channel
    try {
      this.broadcastChannel = new BroadcastChannel(`wt_channel_${normCode}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as NetworkMessage & { fromPeer?: string };
        if (msg.type === 'join') {
          this.onPlayerJoinCallback?.(msg.playerId, msg.fromPeer || 'tab-peer', msg.name, msg.color, msg.avatar);
          if (this.latestState) {
            this.broadcastChannel?.postMessage({
              type: 'state',
              state: JSON.parse(JSON.stringify(this.latestState)),
            });
          }
        } else if (msg.type === 'action') {
          const fromId = (msg.payload?.fromPlayerId as string) || msg.fromPeer || 'tab-peer';
          this.onActionCallback?.(fromId, msg.action, (msg.payload || {}) as Record<string, unknown>);
        } else if (msg.type === 'chat') {
          this.onChatCallback?.(msg.message);
        }
      };
    } catch {}

    const hostId = formatHostPeerId(roomCode);
    try {
      this.peer = new Peer(hostId, PEER_OPTIONS);

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        onReady(id);
      });

      this.peer.on('connection', (conn) => {
        this.connections.set(conn.peer, conn);

        conn.on('open', () => {
          // Immediately send latest game state to freshly connected peer
          if (this.latestState) {
            conn.send({
              type: 'state',
              state: JSON.parse(JSON.stringify(this.latestState)),
            });
          }
        });

        conn.on('data', (data) => {
          const msg = data as NetworkMessage;
          if (msg.type === 'join') {
            this.onPlayerJoinCallback?.(msg.playerId, conn.peer, msg.name, msg.color, msg.avatar);
            if (this.latestState) {
              conn.send({
                type: 'state',
                state: JSON.parse(JSON.stringify(this.latestState)),
              });
            }
          } else if (msg.type === 'action') {
            const fromId = (msg.payload?.fromPlayerId as string) || conn.peer;
            this.onActionCallback?.(fromId, msg.action, (msg.payload || {}) as Record<string, unknown>);
          } else if (msg.type === 'chat') {
            this.onChatCallback?.(msg.message);
            this.broadcastChat(msg.message);
          }
        });

        conn.on('close', () => {
          this.connections.delete(conn.peer);
          this.onPlayerDisconnectCallback?.(conn.peer);
        });

        conn.on('error', (err) => {
          console.warn('Host connection peer warning:', err);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Host peer notice:', err);
        if (err.type === 'unavailable-id') {
          this.onErrorCallback?.(`Room code "${roomCode}" is currently occupied. Please create a new room.`);
        } else {
          this.myPeerId = hostId;
          onReady(hostId);
        }
      });
    } catch {
      this.myPeerId = hostId;
      onReady(hostId);
    }
  }

  public joinRoom(
    roomCode: string,
    playerId: string,
    playerName: string,
    playerColor: PlayerColor,
    playerAvatar: string,
    onState: (state: GameState) => void,
    onChat: (chat: ChatMessage) => void,
    onError: (err: string) => void
  ) {
    this.destroy();
    this.isHost = false;
    this.roomCode = roomCode;
    this.onStateCallback = onState;
    this.onChatCallback = onChat;
    this.onErrorCallback = onError;

    const normCode = normalizeRoomCode(roomCode);
    const hostId = formatHostPeerId(roomCode);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const clientPeerId = `wt-client-${randomSuffix}`;

    // Multi-tab same-device broadcast channel
    try {
      this.broadcastChannel = new BroadcastChannel(`wt_channel_${normCode}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as NetworkMessage;
        if (msg.type === 'state' || msg.type === 'update') {
          this.onStateCallback?.(msg.state);
        } else if (msg.type === 'chat') {
          this.onChatCallback?.(msg.message);
        } else if (msg.type === 'error') {
          this.onErrorCallback?.(msg.message);
        }
      };

      this.broadcastChannel.postMessage({
        type: 'join',
        playerId,
        fromPeer: clientPeerId,
        name: playerName,
        color: playerColor,
        avatar: playerAvatar,
      });
    } catch {}

    let hasReceivedState = false;
    let connectTimeout: ReturnType<typeof setTimeout> | null = null;

    try {
      this.peer = new Peer(clientPeerId, PEER_OPTIONS);

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        const conn = this.peer!.connect(hostId, {
          reliable: true,
        });
        this.hostConn = conn;

        const sendJoinPacket = () => {
          if (conn.open) {
            conn.send({
              type: 'join',
              playerId,
              name: playerName,
              color: playerColor,
              avatar: playerAvatar,
            });
          }
        };

        conn.on('open', () => {
          sendJoinPacket();
        });

        conn.on('data', (data) => {
          hasReceivedState = true;
          if (connectTimeout) clearTimeout(connectTimeout);

          const msg = data as NetworkMessage;
          if (msg.type === 'state' || msg.type === 'update') {
            this.onStateCallback?.(msg.state);
          } else if (msg.type === 'chat') {
            this.onChatCallback?.(msg.message);
          } else if (msg.type === 'error') {
            this.onErrorCallback?.(msg.message);
          }
        });

        conn.on('close', () => {
          this.onErrorCallback?.('Host closed the game room session.');
        });

        conn.on('error', (err) => {
          console.warn('Client peer connection error:', err);
        });

        // Fallback timeout warning if host peer is not found after 8 seconds
        connectTimeout = setTimeout(() => {
          if (!hasReceivedState) {
            this.onErrorCallback?.(`Unable to connect to room "${roomCode}". Please verify the room code is active and the host is online.`);
          }
        }, 8000);
      });

      this.peer.on('error', (err) => {
        console.warn('Client peer broker notice:', err);
        if (err.type === 'peer-unavailable') {
          this.onErrorCallback?.(`Room "${roomCode}" was not found. Please check the code and ensure the host has created the lobby.`);
        }
      });
    } catch {
      this.myPeerId = clientPeerId;
    }
  }

  public broadcastState(state: GameState) {
    this.latestState = state;
    if (!this.isHost) return;

    const packet: NetworkMessage = {
      type: 'update',
      state: JSON.parse(JSON.stringify(state)),
    };

    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(packet);
      }
    });

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(packet);
      } catch {}
    }
  }

  public sendAction(action: string, payload: Record<string, unknown> = {}) {
    const packet: NetworkMessage = {
      type: 'action',
      action,
      payload,
    };

    if (this.hostConn && this.hostConn.open) {
      this.hostConn.send(packet);
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(packet);
      } catch {}
    }
  }

  public broadcastChat(chat: ChatMessage) {
    const packet: NetworkMessage = {
      type: 'chat',
      message: chat,
    };

    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(packet);
      }
    });

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(packet);
      } catch {}
    }
  }

  public sendChat(chat: ChatMessage) {
    if (this.isHost) {
      this.broadcastChat(chat);
    } else {
      if (this.hostConn && this.hostConn.open) {
        this.hostConn.send({ type: 'chat', message: chat });
      }
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({ type: 'chat', message: chat });
        } catch {}
      }
    }
  }

  public destroy() {
    if (this.hostConn) {
      try {
        this.hostConn.close();
      } catch {}
      this.hostConn = null;
    }
    this.connections.forEach((conn) => {
      try {
        conn.close();
      } catch {}
    });
    this.connections.clear();

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
    this.myPeerId = null;
    this.isHost = false;
    this.latestState = null;
  }
}

export const network = new PeerNetwork();
