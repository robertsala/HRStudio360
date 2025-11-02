import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Video, VideoOff, Phone, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import { callingService, CallSession } from '../../utils/callingService';
import { useAuth } from '../../contexts/AuthContext';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callSession: CallSession;
  isIncoming?: boolean;
}

const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, callSession, isIncoming = false }) => {
  const { user } = useAuth();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callSession.call_type === 'video');
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callStatus, setCallStatus] = useState<string>(isIncoming ? 'Incoming call...' : 'Calling...');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const initializeCall = async () => {
      try {
        const stream = await callingService.initializeMedia(callSession.call_type);

        if (localVideoRef.current && callSession.call_type === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        await callingService.createPeerConnection();

        callingService.subscribeToSignals(callSession.id, async (signal) => {
          try {
            if (signal.signal_type === 'offer') {
              await callingService.handleOffer(callSession.id, signal.signal_data);
              setCallStatus('Connecting...');
            } else if (signal.signal_type === 'answer') {
              await callingService.handleAnswer(signal.signal_data);
              handleCallConnected();
            } else if (signal.signal_type === 'ice-candidate') {
              await callingService.handleIceCandidate(signal.signal_data.candidate);
            }
          } catch (error) {
            console.error('Error handling signal:', error);
          }
        });

        if (!isIncoming) {
          await callingService.createOffer(callSession.id);
        }

        const remoteStream = callingService.getRemoteStream();
        if (remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;

          remoteStream.addEventListener('addtrack', () => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });
        }
      } catch (error) {
        console.error('Error initializing call:', error);
        alert('Failed to access camera/microphone. Please check permissions.');
        handleEndCall();
      }
    };

    initializeCall();

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isOpen, callSession.id, callSession.call_type, isIncoming]);

  const handleCallConnected = () => {
    setIsConnected(true);
    setCallStatus('Connected');
    callStartTimeRef.current = Date.now();

    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  };

  const handleAcceptCall = async () => {
    try {
      await callingService.joinCall(callSession.id);
      handleCallConnected();
    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Failed to accept call');
    }
  };

  const handleDeclineCall = async () => {
    try {
      await callingService.declineCall(callSession.id);
      onClose();
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  const handleEndCall = async () => {
    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      await callingService.endCall(callSession.id);
      onClose();
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    callingService.toggleAudio(newState);
  };

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    callingService.toggleVideo(newState);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75">
      <div
        className={`bg-gray-900 rounded-lg shadow-2xl overflow-hidden transition-all ${
          isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl h-[600px]'
        }`}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="text-lg font-semibold">
                {callSession.call_type === 'video' ? 'Video Call' : 'Voice Call'}
              </h3>
              <p className="text-sm text-gray-300">
                {isConnected ? formatDuration(callDuration) : callStatus}
              </p>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative w-full h-full bg-gray-950">
          {callSession.call_type === 'video' ? (
            <>
              {/* Remote Video (Main) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video (PIP) */}
              <div className="absolute bottom-20 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-xl border-2 border-white/20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Phone className="h-16 w-16 text-white" />
                </div>
                <p className="text-white text-xl font-semibold">
                  {isConnected ? formatDuration(callDuration) : callStatus}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center justify-center space-x-4">
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-all ${
                isAudioEnabled
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isAudioEnabled ? 'Mute' : 'Unmute'}
            >
              {isAudioEnabled ? (
                <Mic className="h-6 w-6 text-white" />
              ) : (
                <MicOff className="h-6 w-6 text-white" />
              )}
            </button>

            {/* Video Toggle (only for video calls) */}
            {callSession.call_type === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all ${
                  isVideoEnabled
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoEnabled ? (
                  <Video className="h-6 w-6 text-white" />
                ) : (
                  <VideoOff className="h-6 w-6 text-white" />
                )}
              </button>
            )}

            {/* End/Decline Call */}
            {isIncoming && !isConnected ? (
              <>
                <button
                  onClick={handleAcceptCall}
                  className="p-4 bg-green-600 hover:bg-green-700 rounded-full transition-all"
                  title="Accept call"
                >
                  <Phone className="h-6 w-6 text-white" />
                </button>
                <button
                  onClick={handleDeclineCall}
                  className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all"
                  title="Decline call"
                >
                  <PhoneOff className="h-6 w-6 text-white" />
                </button>
              </>
            ) : (
              <button
                onClick={handleEndCall}
                className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all"
                title="End call"
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default CallModal;
