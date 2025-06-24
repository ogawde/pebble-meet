import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RemoteVideo from '@/components/RemoteVideo';
import useUserMedia from '@/hooks/useUserMedia';
import useWebRTC from '@/hooks/useWebRTC';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Copy, Check } from 'lucide-react';

const Meet = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
  const [username, setUsername] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');

  const { stream: localStream, switchDevice, availableDevices } = useUserMedia({
    video: true,
    audio: true,
  });

  const { remoteStreams, remoteUsernames, roomFull } = useWebRTC(
    roomId || '',
    localStream,
    username
  );

  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username');
    if (!storedUsername) {
      navigate('/');
      return;
    }
    setUsername(storedUsername);
  }, [navigate]);

  useEffect(() => {
    if (roomFull) {
      alert('This room is full. Only 2 people can join a room.');
      navigate('/');
    }
  }, [roomFull, navigate]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (Object.keys(remoteStreams).length > 0) {
      setConnectionStatus('Connected');
    } else {
      setConnectionStatus('Waiting for others to join...');
    }
  }, [remoteStreams]);

  useEffect(() => {
    if (availableDevices.video.length > 0 && !selectedVideoDevice) {
      setSelectedVideoDevice(availableDevices.video[0].deviceId);
    }
    if (availableDevices.audio.length > 0 && !selectedAudioDevice) {
      setSelectedAudioDevice(availableDevices.audio[0].deviceId);
    }
  }, [availableDevices, selectedVideoDevice, selectedAudioDevice]);

  const handleCopyRoomId = async () => {
    if (roomId) {
      await navigator.clipboard.writeText(roomId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleLeave = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    navigate('/');
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const handleVideoDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedVideoDevice(deviceId);
    switchDevice(deviceId, 'video');
  };

  const handleAudioDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedAudioDevice(deviceId);
    switchDevice(deviceId, 'audio');
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Pebble Meet</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-gray-400 text-sm">Room:</span>
              <span className="font-mono font-semibold text-cyan-400">{roomId}</span>
              <button
                onClick={handleCopyRoomId}
                className="ml-2 text-gray-400 hover:text-white transition-colors"
                title="Copy room ID"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  connectionStatus === 'Connected' ? 'bg-green-600' : 'bg-yellow-600'
                }`}
              >
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Video Area */}
      <main className="flex-grow p-4 md:p-6 flex flex-col justify-center items-center">
        <div className="flex flex-col md:flex-row justify-center items-start gap-6 w-full max-w-6xl">
          {/* Local Video */}
          <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
            <h2 className="text-lg font-semibold">You ({username})</h2>
            <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-cyan-500">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <VideoOff className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400">Video Off</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 px-3 py-1 rounded text-sm">
                {username}
              </div>
            </div>
          </div>

          {/* Remote Video */}
          <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
            <h2 className="text-lg font-semibold">
              Remote ({Object.keys(remoteStreams).length})
            </h2>
            <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-green-500">
              {Object.entries(remoteStreams).map(([socketID, stream]) => (
                <RemoteVideo
                  key={socketID}
                  stream={stream}
                  socketID={socketID}
                  username={remoteUsernames[socketID] || 'Unknown'}
                />
              ))}
              {Object.keys(remoteStreams).length === 0 && (
                <div className="flex items-center justify-center w-full h-full">
                  <p className="text-gray-400">Waiting for others to join...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 w-full max-w-4xl">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Device Selectors */}
              <div className="flex flex-col md:flex-row gap-3 flex-1 w-full md:w-auto">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Camera</label>
                  <select
                    value={selectedVideoDevice}
                    onChange={handleVideoDeviceChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {availableDevices.video.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Microphone</label>
                  <select
                    value={selectedAudioDevice}
                    onChange={handleAudioDeviceChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {availableDevices.audio.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={toggleVideo}
                  variant={isVideoEnabled ? 'default' : 'destructive'}
                  size="icon"
                  className="h-12 w-12"
                  title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
                <Button
                  onClick={toggleAudio}
                  variant={isAudioEnabled ? 'default' : 'destructive'}
                  size="icon"
                  className="h-12 w-12"
                  title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
                <Button
                  onClick={handleLeave}
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 bg-red-600 hover:bg-red-700"
                  title="Leave call"
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Meet;

