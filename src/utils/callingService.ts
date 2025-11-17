import { apiRequest } from '../lib/queryClient';

export interface CallSession {
  id: string;
  channelId: string;
  callerId: string;
  callType: 'voice' | 'video';
  status: 'ringing' | 'active' | 'ended' | 'missed' | 'declined';
  startedAt: string;
  endedAt?: string;
  duration: number;
  createdAt: string;
}

export interface CallParticipant {
  id: string;
  callSessionId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string;
  status: 'calling' | 'connected' | 'disconnected';
}

export interface SignalData {
  id: string;
  callSessionId: string;
  fromUserId: string;
  toUserId?: string;
  signalType: 'offer' | 'answer' | 'ice-candidate';
  signalData: any;
  createdAt: string;
}

export interface IncomingCall {
  callId: string;
  channelId: string;
  callerId: string;
  callType: 'voice' | 'video';
  status: string;
  startedAt: string;
  participantId: string;
  participantStatus: string;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

class CallingService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCallId: string | null = null;
  private signalPollingInterval: number | null = null;
  private incomingCallPollingInterval: number | null = null;
  private lastSignalTime: Date | null = null;

  async startCall(channelId: string, callType: 'voice' | 'video'): Promise<CallSession> {
    try {
      const session = await apiRequest<CallSession>('/api/calls/start', {
        method: 'POST',
        body: JSON.stringify({ channelId, callType })
      });

      this.currentCallId = session.id;
      return session;
    } catch (error: any) {
      console.error('Error in startCall:', error);
      throw new Error(error.message || 'Failed to start call. Please try again.');
    }
  }

  async initializeMedia(callType: 'voice' | 'video'): Promise<MediaStream> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported in this browser. Please use Chrome, Firefox, Safari, or Edge.');
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
      };

      console.log('Requesting media access with constraints:', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media access granted successfully');
      return this.localStream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);

      let userMessage = 'Unable to access your ';
      let troubleshooting = '';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        const deviceType = callType === 'video' ? 'camera and microphone' : 'microphone';
        userMessage += `${deviceType}. Permission was denied.\n\n`;
        troubleshooting = `To fix this:\n`;
        troubleshooting += `1. Click the camera icon in your browser's address bar\n`;
        troubleshooting += `2. Allow access to your ${deviceType}\n`;
        troubleshooting += `3. Refresh the page and try again`;
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        const deviceType = callType === 'video' ? 'camera or microphone' : 'microphone';
        userMessage += `${deviceType}. No devices detected.\n\n`;
        troubleshooting = `Please check:\n`;
        troubleshooting += `1. Your ${deviceType} is properly connected\n`;
        troubleshooting += `2. No other application is using it\n`;
        troubleshooting += `3. Device drivers are installed correctly`;
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        const deviceType = callType === 'video' ? 'camera or microphone' : 'microphone';
        userMessage += `${deviceType}. Device is already in use.\n\n`;
        troubleshooting = `Please:\n`;
        troubleshooting += `1. Close other applications using your ${deviceType}\n`;
        troubleshooting += `2. Close other browser tabs with video calls\n`;
        troubleshooting += `3. Restart your browser if needed`;
      } else if (error.name === 'OverconstrainedError') {
        userMessage += 'camera or microphone. Settings could not be applied.\n\n';
        troubleshooting = 'Your device may not support the required video quality. Please try audio-only mode.';
      } else if (error.name === 'TypeError') {
        userMessage = 'Browser does not support video calls. ';
        troubleshooting = 'Please use Chrome, Firefox, Safari, or Edge browser.';
      } else {
        userMessage += 'camera or microphone.\n\n';
        troubleshooting = `Error: ${error.message || 'Unknown error occurred'}\n\nPlease check your device settings and try again.`;
      }

      throw new Error(userMessage + troubleshooting);
    }
  }

  async createPeerConnection(): Promise<RTCPeerConnection> {
    console.log('Creating peer connection with ICE servers:', ICE_SERVERS);
    this.peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
      if (this.peerConnection?.iceConnectionState === 'failed') {
        console.error('ICE connection failed - attempting to reconnect');
        this.peerConnection?.restartIce();
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    this.remoteStream = new MediaStream();

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream!.addTrack(track);
      });
    };

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate && this.currentCallId) {
        await this.sendSignal(this.currentCallId, 'ice-candidate', {
          candidate: event.candidate.toJSON(),
        });
      }
    };

    return this.peerConnection;
  }

  async createOffer(callId: string): Promise<void> {
    if (!this.peerConnection) {
      await this.createPeerConnection();
    }

    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);

    await this.sendSignal(callId, 'offer', {
      sdp: offer.sdp,
      type: offer.type,
    });
  }

  async handleOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      await this.createPeerConnection();
    }

    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);

    await this.sendSignal(callId, 'answer', {
      sdp: answer.sdp,
      type: answer.type,
    });
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  async sendSignal(
    callId: string,
    signalType: 'offer' | 'answer' | 'ice-candidate',
    signalData: any,
    toUserId?: string
  ): Promise<void> {
    await apiRequest('/api/calls/signal', {
      method: 'POST',
      body: JSON.stringify({
        callId,
        signalType,
        signalData,
        toUserId
      })
    });
  }

  subscribeToSignals(callId: string, onSignal: (signal: SignalData) => void): { unsubscribe: () => void } {
    this.lastSignalTime = new Date();

    const pollSignals = async () => {
      try {
        const fromTime = this.lastSignalTime?.toISOString();
        const signals = await apiRequest<SignalData[]>(
          `/api/calls/signals/${callId}${fromTime ? `?fromTime=${fromTime}` : ''}`
        );

        if (signals && signals.length > 0) {
          signals.forEach((signal: SignalData) => {
            onSignal(signal);
            const signalTime = new Date(signal.createdAt);
            if (!this.lastSignalTime || signalTime > this.lastSignalTime) {
              this.lastSignalTime = signalTime;
            }
          });
        }
      } catch (error) {
        console.error('Error polling signals:', error);
      }
    };

    this.signalPollingInterval = window.setInterval(pollSignals, 500);

    return {
      unsubscribe: () => {
        if (this.signalPollingInterval) {
          clearInterval(this.signalPollingInterval);
          this.signalPollingInterval = null;
        }
      }
    };
  }

  async joinCall(callId: string): Promise<void> {
    this.currentCallId = callId;

    await apiRequest('/api/calls/join', {
      method: 'POST',
      body: JSON.stringify({ callId })
    });
  }

  async endCall(callId: string): Promise<void> {
    await apiRequest('/api/calls/end', {
      method: 'POST',
      body: JSON.stringify({ callId })
    });

    this.cleanup();
  }

  async declineCall(callId: string): Promise<void> {
    await apiRequest('/api/calls/decline', {
      method: 'POST',
      body: JSON.stringify({ callId })
    });
  }

  cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.signalPollingInterval) {
      clearInterval(this.signalPollingInterval);
      this.signalPollingInterval = null;
    }

    if (this.incomingCallPollingInterval) {
      clearInterval(this.incomingCallPollingInterval);
      this.incomingCallPollingInterval = null;
    }

    this.remoteStream = null;
    this.currentCallId = null;
    this.lastSignalTime = null;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  async getIncomingCalls(): Promise<IncomingCall[]> {
    const calls = await apiRequest<IncomingCall[]>('/api/calls/incoming');
    return calls;
  }

  subscribeToIncomingCalls(onIncomingCall: (call: IncomingCall) => void): { unsubscribe: () => void } {
    let previousCallIds = new Set<string>();

    const pollIncomingCalls = async () => {
      try {
        const calls = await this.getIncomingCalls();
        
        calls.forEach(call => {
          if (!previousCallIds.has(call.callId)) {
            onIncomingCall(call);
            previousCallIds.add(call.callId);
          }
        });

        const currentCallIds = new Set(calls.map(c => c.callId));
        previousCallIds = currentCallIds;
      } catch (error) {
        console.error('Error polling incoming calls:', error);
      }
    };

    pollIncomingCalls();

    this.incomingCallPollingInterval = window.setInterval(pollIncomingCalls, 2000);

    return {
      unsubscribe: () => {
        if (this.incomingCallPollingInterval) {
          clearInterval(this.incomingCallPollingInterval);
          this.incomingCallPollingInterval = null;
        }
      }
    };
  }
}

export const callingService = new CallingService();
