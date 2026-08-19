import Peer, { DataConnection } from 'peerjs';
import { GameState, NetworkMessage, PlayerColor, ChatMessage } from '../types';

export function makeRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WT-${result}`;
}

export function formatHostPeerId(code: string): string {
  const clean = code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
  return `world-tycoon-v2-host-${clean}`;
}

export class PeerNetwork {
  private peer: Peer | null = null;
  private hostConn: DataConnection | null = null;
  private connections = new Map<string, DataConnection>();
  private broadcastChannel: BroadcastChannel | null = null;

  public myId: string | null = null;
  public isHost = false;
  public roomCode: string = '';

  private onStateCallback?: (state: GameState, myId: string) => void;
  private onActionCallback?: (fromPeer: string, action: string, payload: Record<string, unknown>) => void;
  private onPlayerJoinCallback?: (peerId: string, name: string, color: PlayerColor, avatar: string) => void;
  private onPlayerDisconnectCallback?: (peerId: string) => void;
  private onChatCallback?: (chat: ChatMessage) => void;
  private onErrorCallback?: (err: string) => void;

  public initHost(
    roomCode: string,
    onReady: (peerId: string) => void,
    onPlayerJoin: (peerId: string, name: string, color: PlayerColor, avatar: string) => void,
    onAction: (fromPeer: string, action: string, payload: Record<string, unknown>) => void,
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

    // Initialize BroadcastChannel for same-browser multi-tab communication fallback
    try {
      this.broadcastChannel = new BroadcastChannel(`wt_channel_${roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as NetworkMessage & { fromId?: string };
        if (msg.type === 'join') {
          this.onPlayerJoinCallback?.(msg.fromId || 'tab-peer', msg.name, msg.color, msg.avatar);
        } else if (msg.type === 'action') {
          this.onActionCallback?.(msg.fromId || 'tab-peer', msg.action, (msg.payload || {}) as Record<string, unknown>);
        } else if (msg.type === 'chat') {
          this.onChatCallback?.(msg.message);
        }
      };
    } catch {}

    const hostId = formatHostPeerId(roomCode);
    try {
      this.peer = new Peer(hostId, {
        debug: 1,
      });

      this.peer.on('open', (id) => {
        this.myId = id;
        onReady(id);
      });

      this.peer.on('connection', (conn) => {
        this.connections.set(conn.peer, conn);

        conn.on('open', () => {
          conn.send({ type: 'hello', room: roomCode });
        });

        conn.on('data', (data) => {
          const msg = data as NetworkMessage;
          if (msg.type === 'join') {
            this.onPlayerJoinCallback?.(conn.peer, msg.name, msg.color, msg.avatar);
          } else if (msg.type === 'action') {
            this.onActionCallback?.(conn.peer, msg.action, (msg.payload || {}) as Record<string, unknown>);
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
          console.error('Host connection peer error:', err);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Host peer setup notice:', err);
        if (err.type === 'unavailable-id') {
          this.onErrorCallback?.('Room code collision. Please create another room code.');
        } else {
          this.myId = hostId;
          onReady(hostId);
        }
      });
    } catch {
      this.myId = hostId;
      onReady(hostId);
    }
  }

  public joinRoom(
    roomCode: string,
    playerName: string,
    playerColor: PlayerColor,
    playerAvatar: string,
    onState: (state: GameState, myId: string) => void,
    onChat: (chat: ChatMessage) => void,
    onError: (err: string) => void
  ) {
    this.destroy();
    this.isHost = false;
    this.roomCode = roomCode;
    this.onStateCallback = onState;
    this.onChatCallback = onChat;
    this.onErrorCallback = onError;

    const hostId = formatHostPeerId(roomCode);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const clientPeerId = `wt-client-${randomSuffix}`;

    try {
      this.broadcastChannel = new BroadcastChannel(`wt_channel_${roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as NetworkMessage;
        if (msg.type === 'state' || msg.type === 'update') {
          this.onStateCallback?.(msg.state, this.myId || clientPeerId);
        } else if (msg.type === 'chat') {
          this.onChatCallback?.(msg.message);
        } else if (msg.type === 'error') {
          this.onErrorCallback?.(msg.message);
        }
      };

      this.broadcastChannel.postMessage({
        type: 'join',
        fromId: clientPeerId,
        name: playerName,
        color: playerColor,
        avatar: playerAvatar,
      });
    } catch {}

    try {
      this.peer = new Peer(clientPeerId);

      this.peer.on('open', (id) => {
        this.myId = id;
        const conn = this.peer!.connect(hostId, { reliable: true });
        this.hostConn = conn;

        conn.on('open', () => {
          conn.send({
            type: 'join',
            name: playerName,
            color: playerColor,
            avatar: playerAvatar,
          });
        });

        conn.on('data', (data) => {
          const msg = data as NetworkMessage;
          if (msg.type === 'state' || msg.type === 'update') {
            this.onStateCallback?.(msg.state, this.myId || id);
          } else if (msg.type === 'chat') {
            this.onChatCallback?.(msg.message);
          } else if (msg.type === 'error') {
            this.onErrorCallback?.(msg.message);
          }
        });

        conn.on('close', () => {
          this.onErrorCallback?.('Host disconnected from simulation room.');
        });

        conn.on('error', () => {});
      });

      this.peer.on('error', (err) => {
        console.warn('Client peer notice:', err);
      });
    } catch {
      this.myId = clientPeerId;
    }
  }

  public broadcastState(state: GameState) {
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
        this.broadcastChannel.postMessage({
          ...packet,
          fromId: this.myId,
        });
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
    this.myId = null;
    this.isHost = false;
  }
}

export const network = new PeerNetwork();
