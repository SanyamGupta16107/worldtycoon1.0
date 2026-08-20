import mqtt, { MqttClient } from 'mqtt';
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

const PUBLIC_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081',
];

export class PeerNetwork {
  private client: MqttClient | null = null;
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

  private topicState = '';
  private topicClientToHost = '';
  private topicChat = '';
  private pingInterval: ReturnType<typeof setInterval> | null = null;

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
    this.topicState = `world-tycoon/v2/room/${normCode}/state`;
    this.topicClientToHost = `world-tycoon/v2/room/${normCode}/client_to_host`;
    this.topicChat = `world-tycoon/v2/room/${normCode}/chat`;

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

    const clientId = `wt_host_${normCode}_${Math.random().toString(36).substring(2, 7)}`;
    this.myPeerId = clientId;

    this.connectMqttBroker(0, clientId, () => {
      this.client?.subscribe([this.topicClientToHost, this.topicChat], { qos: 1 }, (err) => {
        if (!err) {
          onReady(clientId);
        }
      });

      this.client?.on('message', (topic, payload) => {
        try {
          const msg = JSON.parse(payload.toString());
          if (topic === this.topicClientToHost) {
            if (msg.type === 'join') {
              this.onPlayerJoinCallback?.(msg.playerId, msg.fromPeer || 'remote-peer', msg.name, msg.color, msg.avatar);
              if (this.latestState) {
                this.broadcastState(this.latestState);
              }
            } else if (msg.type === 'action') {
              const fromId = (msg.payload?.fromPlayerId as string) || msg.fromPeer || 'remote-peer';
              this.onActionCallback?.(fromId, msg.action, (msg.payload || {}) as Record<string, unknown>);
            }
          } else if (topic === this.topicChat) {
            if (msg.type === 'chat') {
              this.onChatCallback?.(msg.message);
            }
          }
        } catch (e) {
          console.warn('Host parse error:', e);
        }
      });

      // Periodically rebroadcast state in lobby to keep newly joined clients updated
      this.pingInterval = setInterval(() => {
        if (this.latestState && this.latestState.status === 'LOBBY') {
          this.broadcastState(this.latestState);
        }
      }, 3000);
    });
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
    this.topicState = `world-tycoon/v2/room/${normCode}/state`;
    this.topicClientToHost = `world-tycoon/v2/room/${normCode}/client_to_host`;
    this.topicChat = `world-tycoon/v2/room/${normCode}/chat`;

    const clientPeerId = `wt_cli_${normCode}_${Math.random().toString(36).substring(2, 7)}`;
    this.myPeerId = clientPeerId;

    // Multi-tab same-device broadcast channel
    try {
      this.broadcastChannel = new BroadcastChannel(`wt_channel_${normCode}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as NetworkMessage;
        if (msg.type === 'state' || msg.type === 'update') {
          this.onStateCallback?.(msg.state);
        } else if (msg.type === 'chat') {
          this.onChatCallback?.(msg.message);
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

    this.connectMqttBroker(0, clientPeerId, () => {
      this.client?.subscribe([this.topicState, this.topicChat], { qos: 1 }, (err) => {
        if (!err) {
          // Immediately send Join request to host
          const sendJoin = () => {
            const joinPacket = JSON.stringify({
              type: 'join',
              playerId,
              fromPeer: clientPeerId,
              name: playerName,
              color: playerColor,
              avatar: playerAvatar,
            });
            this.client?.publish(this.topicClientToHost, joinPacket, { qos: 1 });
          };

          sendJoin();

          // Retry join packet twice if state not received yet
          setTimeout(() => {
            if (!hasReceivedState) sendJoin();
          }, 1500);

          setTimeout(() => {
            if (!hasReceivedState) sendJoin();
          }, 3500);
        }
      });

      this.client?.on('message', (topic, payload) => {
        try {
          const msg = JSON.parse(payload.toString());
          if (topic === this.topicState) {
            if (msg.type === 'state' || msg.type === 'update') {
              hasReceivedState = true;
              this.onStateCallback?.(msg.state);
            }
          } else if (topic === this.topicChat) {
            if (msg.type === 'chat') {
              this.onChatCallback?.(msg.message);
            }
          }
        } catch (e) {
          console.warn('Client parse error:', e);
        }
      });

      // Verification timeout after 7 seconds if host room is not active
      setTimeout(() => {
        if (!hasReceivedState) {
          this.onErrorCallback?.(`Unable to find active room "${roomCode}". Please ensure the host has created the room and is waiting in the lobby.`);
        }
      }, 7000);
    });
  }

  private connectMqttBroker(brokerIndex: number, clientId: string, onConnected: () => void) {
    const brokerUrl = PUBLIC_BROKERS[brokerIndex] || PUBLIC_BROKERS[0];

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2000,
        keepalive: 30,
      });

      let connected = false;

      this.client.on('connect', () => {
        if (!connected) {
          connected = true;
          onConnected();
        }
      });

      this.client.on('error', (err) => {
        console.warn(`MQTT connection error with broker ${brokerUrl}:`, err);
        if (!connected && brokerIndex + 1 < PUBLIC_BROKERS.length) {
          this.client?.end(true);
          this.connectMqttBroker(brokerIndex + 1, clientId, onConnected);
        }
      });
    } catch {
      if (brokerIndex + 1 < PUBLIC_BROKERS.length) {
        this.connectMqttBroker(brokerIndex + 1, clientId, onConnected);
      }
    }
  }

  public broadcastState(state: GameState) {
    this.latestState = state;
    if (!this.isHost) return;

    const packet = JSON.stringify({
      type: 'update',
      state,
    });

    if (this.client?.connected && this.topicState) {
      this.client.publish(this.topicState, packet, { qos: 1 });
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'update',
          state: JSON.parse(JSON.stringify(state)),
        });
      } catch {}
    }
  }

  public sendAction(action: string, payload: Record<string, unknown> = {}) {
    const packet = JSON.stringify({
      type: 'action',
      action,
      payload,
    });

    if (this.client?.connected && this.topicClientToHost) {
      this.client.publish(this.topicClientToHost, packet, { qos: 1 });
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'action',
          action,
          payload,
        });
      } catch {}
    }
  }

  public broadcastChat(chat: ChatMessage) {
    const packet = JSON.stringify({
      type: 'chat',
      message: chat,
    });

    if (this.client?.connected && this.topicChat) {
      this.client.publish(this.topicChat, packet, { qos: 1 });
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'chat',
          message: chat,
        });
      } catch {}
    }
  }

  public sendChat(chat: ChatMessage) {
    this.broadcastChat(chat);
  }

  public destroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.client) {
      try {
        this.client.end(true);
      } catch {}
      this.client = null;
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }

    this.myPeerId = null;
    this.isHost = false;
    this.latestState = null;
  }
}

export const network = new PeerNetwork();
