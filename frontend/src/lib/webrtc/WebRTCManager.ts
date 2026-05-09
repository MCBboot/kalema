import SimplePeer from "simple-peer";
import { getSocket } from "../socket";
import { WEBRTC_OFFER, WEBRTC_ANSWER, WEBRTC_ICE_CANDIDATE } from "@kalema/shared";
import { getGame } from "@kalema/shared";
import { Room, Player, GameEventContext } from "@kalema/shared";
import {
  ROOM_STATE_UPDATED,
  GAME_STATE_UPDATED,
  GAME_PLAYER_DATA,
  PLAYER_LIST_UPDATED
} from "@kalema/shared";

type NetworkMode = "ONLINE" | "LOCAL_HOST" | "LOCAL_CLIENT";

class P2PManager {
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private mode: NetworkMode = "ONLINE";
  private localPlayerId: string | null = null;
  private room: Room | null = null;

  // Callbacks for UI updates
  public onStateUpdate: ((state: unknown) => void) | null = null;
  public onRoomUpdate: ((room: Room) => void) | null = null;
  public onPlayerDataUpdate: ((data: unknown) => void) | null = null;
  public onPlayerListUpdate: ((players: Player[]) => void) | null = null;

  setMode(mode: NetworkMode, playerId: string) {
    this.mode = mode;
    this.localPlayerId = playerId;
  }

  getMode() {
    return this.mode;
  }

  setRoom(room: Room) {
    this.room = room;
  }

  // Called when this client is the HOST and wants to connect to a joining player
  initiateConnectionTo(targetPlayerId: string) {
    if (this.mode !== "LOCAL_HOST") return;

    const peer = new SimplePeer({
      initiator: true,
      trickle: true,
      objectMode: true
    });

    this.setupPeerEvents(peer, targetPlayerId);
    this.peers.set(targetPlayerId, peer);
  }

  // OFFLINE MODE EXPOSED METHODS (QR CODE DATA PIPELINE)

  generateOfflineOffer(targetPlayerId: string, callback: (offerStr: string) => void) {
    if (this.mode !== "LOCAL_HOST") return;
    const peer = new SimplePeer({ initiator: true, trickle: false, objectMode: true });

    peer.on("signal", (data: any) => {
      if (data.type === "offer") {
        callback(JSON.stringify(data));
      }
    });

    peer.on("connect", () => {
      console.log(`Offline WebRTC connected to ${targetPlayerId}`);
      if (this.mode === "LOCAL_HOST" && this.room) {
        peer.send(JSON.stringify({ type: ROOM_STATE_UPDATED, payload: { room: this.room } }));
      }
    });

    peer.on("data", (data: any) => {
      this.handleIncomingData(targetPlayerId, JSON.parse(data.toString()));
    });

    this.peers.set(targetPlayerId, peer);
  }

  generateOfflineAnswer(offerStr: string, callback: (answerStr: string) => void) {
    const peer = new SimplePeer({ initiator: false, trickle: false, objectMode: true });

    peer.on("signal", (data: any) => {
      if (data.type === "answer") {
        callback(JSON.stringify(data));
      }
    });

    peer.on("connect", () => console.log("Offline WebRTC connected to Host"));
    peer.on("data", (data: any) => this.handleIncomingData("host", JSON.parse(data.toString())));

    peer.signal(JSON.parse(offerStr));
    this.peers.set("host", peer); // from client perspective, host is the only peer
  }

  acceptOfflineAnswer(targetPlayerId: string, answerStr: string) {
    const peer = this.peers.get(targetPlayerId);
    if (peer) {
      peer.signal(JSON.parse(answerStr));
    }
  }

  // Handle incoming signaling data from the internet Socket.io
  handleSignalingData(eventName: string, payload: any) {
    const { sourcePlayerId, payload: signalData } = payload;

    let peer = this.peers.get(sourcePlayerId);

    if (!peer && this.mode === "LOCAL_CLIENT" && eventName === WEBRTC_OFFER) {
      peer = new SimplePeer({
        initiator: false,
        trickle: true,
        objectMode: true
      });
      this.setupPeerEvents(peer, sourcePlayerId);
      this.peers.set(sourcePlayerId, peer);
    }

    if (peer) {
      peer.signal(signalData);
    }
  }

  private setupPeerEvents(peer: SimplePeer.Instance, targetPlayerId: string) {
    const socket = getSocket();

    peer.on("signal", (data: any) => {
      if (data.type === "offer") {
        socket.emit(WEBRTC_OFFER, { targetPlayerId, offer: data });
      } else if (data.type === "answer") {
        socket.emit(WEBRTC_ANSWER, { targetPlayerId, answer: data });
      } else if (data.candidate) {
        socket.emit(WEBRTC_ICE_CANDIDATE, { targetPlayerId, candidate: data });
      }
    });

    peer.on("connect", () => {
      console.log(`WebRTC connected to ${targetPlayerId}`);
      if (this.mode === "LOCAL_HOST" && this.room) {
        // Send initial state to the newly connected client
        peer.send(JSON.stringify({
          type: ROOM_STATE_UPDATED,
          payload: { room: this.room }
        }));
      }
    });

    peer.on("data", (data) => {
      const message = JSON.parse(data.toString());
      this.handleIncomingData(targetPlayerId, message);
    });

    peer.on("close", () => {
      console.log(`WebRTC connection to ${targetPlayerId} closed`);
      this.peers.delete(targetPlayerId);
    });

    peer.on("error", (err) => {
      console.error(`WebRTC error with ${targetPlayerId}`, err);
    });
  }

  // The HOST handles events like a server. The CLIENT just receives state updates.
  private handleIncomingData(sourcePlayerId: string, message: any) {
    if (this.mode === "LOCAL_CLIENT") {
      // Receive updates from HOST
      switch (message.type) {
        case ROOM_STATE_UPDATED:
          this.room = message.payload.room;
          if (this.onRoomUpdate) this.onRoomUpdate(this.room!);
          break;
        case GAME_STATE_UPDATED:
          if (this.onStateUpdate) this.onStateUpdate(message.payload.gameState);
          break;
        case GAME_PLAYER_DATA:
          if (this.onPlayerDataUpdate) this.onPlayerDataUpdate(message.payload.data);
          break;
        case PLAYER_LIST_UPDATED:
          if (this.room) {
            this.room.players = message.payload.players;
            if (this.onPlayerListUpdate) this.onPlayerListUpdate(message.payload.players);
          }
          break;
      }
    } else if (this.mode === "LOCAL_HOST") {
      // Process events from CLIENT (like socket.on in the backend)
      const { eventName, payload } = message;
      this.dispatchGameEvent(sourcePlayerId, eventName, payload);
    }
  }

  // Host only: route game event to shared logic
  private dispatchGameEvent(playerId: string, eventName: string, payload: any) {
    if (!this.room || !this.room.selectedGame) return;

    const gameReg = getGame(this.room.selectedGame);
    if (!gameReg) return;

    // Dynamically load the shared module game logic
    // We assume it's imported somewhere globally or statically available
    import("@kalema/shared").then((shared) => {
      const gameDef = shared.getGame(this.room!.selectedGame!);
      if (!gameDef) return;

      const ctx: GameEventContext = {
        room: this.room!,
        playerId,
        emit: (event, data) => this.sendToPeer(playerId, event, data),
        broadcast: (event, data) => this.broadcast(event, data),
        emitTo: (targetId, event, data) => this.sendToPeer(targetId, event, data)
      };

      try {
        gameDef.handleEvent(ctx, eventName, payload);
        // After event, broadcast state changes
        if (this.room!.gameState) {
          this.broadcast(GAME_STATE_UPDATED, { gameState: gameDef.getPublicState(this.room!.gameState) });
          // Private data
          for (const p of this.room!.players) {
            const privateData = gameDef.getPlayerPrivateData(this.room!.gameState, p.id);
            if (privateData) {
              if (p.id === this.localPlayerId) {
                if (this.onPlayerDataUpdate) this.onPlayerDataUpdate(privateData);
              } else {
                this.sendToPeer(p.id, GAME_PLAYER_DATA, { data: privateData });
              }
            }
          }
        }
      } catch (err) {
        console.error("Game event error", err);
      }
    });
  }

  // Send an event via WebRTC or socket depending on mode
  sendEvent(eventName: string, payload: any) {
    if (this.mode === "ONLINE") {
      getSocket().emit(eventName, payload);
    } else if (this.mode === "LOCAL_CLIENT") {
      // Send to HOST
      // Assuming HOST is always the admin of the room
      const hostId = this.room?.adminPlayerId;
      if (hostId) {
        this.sendToPeer(hostId, "event", { eventName, payload });
      }
    } else if (this.mode === "LOCAL_HOST") {
      // Execute directly
      this.dispatchGameEvent(this.localPlayerId!, eventName, payload);
    }
  }

  private sendToPeer(targetPlayerId: string, type: string, payload: any) {
    const peer = this.peers.get(targetPlayerId);
    if (peer && peer.connected) {
      peer.send(JSON.stringify({ type, payload }));
    }
  }

  private broadcast(type: string, payload: any) {
    // Send to self via callback
    if (type === GAME_STATE_UPDATED && this.onStateUpdate) {
       this.onStateUpdate(payload.gameState);
    } else if (type === ROOM_STATE_UPDATED && this.onRoomUpdate) {
       this.onRoomUpdate(payload.room);
    }

    // Send to all connected peers
    const message = JSON.stringify({ type, payload });
    for (const peer of this.peers.values()) {
      if (peer.connected) {
        peer.send(message);
      }
    }
  }

  disconnectAll() {
    for (const peer of this.peers.values()) {
      peer.destroy();
    }
    this.peers.clear();
  }
}

export const p2pManager = new P2PManager();
