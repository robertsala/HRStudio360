import { supabase } from './supabaseClient';

export interface CallSession {
  id: string;
  channel_id: string;
  caller_id: string;
  call_type: 'voice' | 'video';
  status: 'ringing' | 'active' | 'ended' | 'missed' | 'declined';
  started_at: string;
  ended_at?: string;
  duration: number;
  created_at: string;
}

export interface CallParticipant {
  id: string;
  call_session_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  status: 'calling' | 'connected' | 'disconnected';
}

export interface SignalData {
  id: string;
  call_session_id: string;
  from_user_id: string;
  to_user_id?: string;
  signal_type: 'offer' | 'answer' | 'ice-candidate';
  signal_data: any;
  created_at: string;
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
  private signalSubscription: any = null;

  async startCall(channelId: string, callType: 'voice' | 'video'): Promise<CallSession> {
    try {
      const { data: session, error } = await supabase
        .from('call_sessions')
        .insert({
          channel_id: channelId,
          call_type: callType,
          status: 'ringing',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create call session:', error);
        throw new Error('Failed to start call. Please try again.');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User authentication error:', userError);
        throw new Error('User not authenticated');
      }

      const { error: participantError } = await supabase.from('call_participants').insert({
        call_session_id: session.id,
        user_id: user.id,
        status: 'connected',
      });

      if (participantError) {
        console.error('Failed to add call participant:', participantError);
      }

      const { data: channelMembers } = await supabase
        .from('channel_members')
        .select('user_id')
        .eq('channel_id', channelId)
        .neq('user_id', user.id);

      if (channelMembers && channelMembers.length > 0) {
        for (const member of channelMembers) {
          await supabase.from('call_participants').insert({
            call_session_id: session.id,
            user_id: member.user_id,
            status: 'calling',
          });
        }
      }

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
    await supabase.from('call_signaling').insert({
      call_session_id: callId,
      to_user_id: toUserId,
      signal_type: signalType,
      signal_data: signalData,
    });
  }

  subscribeToSignals(callId: string, onSignal: (signal: SignalData) => void) {
    const { data: { user } } = supabase.auth.getUser();

    this.signalSubscription = supabase
      .channel(`call_signaling:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signaling',
          filter: `call_session_id=eq.${callId}`,
        },
        (payload) => {
          const signal = payload.new as SignalData;
          user.then(({ data }) => {
            if (data?.user && signal.from_user_id !== data.user.id) {
              onSignal(signal);
            }
          });
        }
      )
      .subscribe();

    return this.signalSubscription;
  }

  async joinCall(callId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    this.currentCallId = callId;

    await supabase
      .from('call_participants')
      .update({ status: 'connected', joined_at: new Date().toISOString() })
      .eq('call_session_id', callId)
      .eq('user_id', user.id);

    await supabase
      .from('call_sessions')
      .update({ status: 'active' })
      .eq('id', callId);
  }

  async endCall(callId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('call_participants')
      .update({ status: 'disconnected', left_at: new Date().toISOString() })
      .eq('call_session_id', callId)
      .eq('user_id', user.id);

    const { data: participants } = await supabase
      .from('call_participants')
      .select('status')
      .eq('call_session_id', callId);

    const allDisconnected = participants?.every((p) => p.status === 'disconnected');

    if (allDisconnected) {
      const { data: session } = await supabase
        .from('call_sessions')
        .select('started_at')
        .eq('id', callId)
        .single();

      if (session) {
        const duration = Math.floor(
          (new Date().getTime() - new Date(session.started_at).getTime()) / 1000
        );

        await supabase
          .from('call_sessions')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            duration,
          })
          .eq('id', callId);
      }
    }

    this.cleanup();
  }

  async declineCall(callId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('call_participants')
      .update({ status: 'disconnected' })
      .eq('call_session_id', callId)
      .eq('user_id', user.id);

    await supabase
      .from('call_sessions')
      .update({ status: 'declined' })
      .eq('id', callId);
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

    if (this.signalSubscription) {
      this.signalSubscription.unsubscribe();
      this.signalSubscription = null;
    }

    this.remoteStream = null;
    this.currentCallId = null;
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

  async getIncomingCalls(userId: string) {
    const { data, error } = await supabase
      .from('call_participants')
      .select(`
        *,
        call_session:call_sessions!call_participants_call_session_id_fkey(
          *,
          caller:profiles!call_sessions_caller_id_fkey(*)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'calling');

    if (error) throw error;
    return data;
  }

  subscribeToIncomingCalls(userId: string, onIncomingCall: (call: any) => void) {
    return supabase
      .channel(`incoming_calls:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_participants',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const participant = payload.new;
          if (participant.status === 'calling') {
            const { data: session } = await supabase
              .from('call_sessions')
              .select(`
                *,
                caller:profiles!call_sessions_caller_id_fkey(*)
              `)
              .eq('id', participant.call_session_id)
              .single();

            if (session) {
              onIncomingCall({ ...participant, call_session: session });
            }
          }
        }
      )
      .subscribe();
  }
}

export const callingService = new CallingService();
