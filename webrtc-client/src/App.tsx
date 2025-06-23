import React, { useEffect, useRef, useState } from 'react';
import RemoteVideo from './components/RemoteVideo';
import useUserMedia from './hooks/useUserMedia';
import useWebRTC from './hooks/useWebRTC';

const App: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  
  const { stream: localStream } = useUserMedia({ video: true, audio: true });
  const { remoteStreams } = useWebRTC('test-room', localStream);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    
    if (Object.keys(remoteStreams).length > 0) {
      setConnectionStatus(`Connected to ${Object.keys(remoteStreams).length} peer(s)`);
    } else {
      setConnectionStatus('Waiting for peers...');
    }
  }, [remoteStreams]);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <header className="py-4 px-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-center">My Video Chat</h1>
        <div className="text-center mt-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            connectionStatus.includes('Connected') ? 'bg-green-600' : 'bg-yellow-600'
          }`}>
            {connectionStatus}
          </span>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-6 flex justify-center items-center">
        <div id="videos" className="flex flex-col md:flex-row justify-center items-start gap-6 w-full max-w-6xl">

          <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
            <h2 className="text-lg font-semibold">Your Video</h2>
            <div className="flex justify-center items-center p-4 rounded-lg bg-gray-800 w-full aspect-video">
              <video 
                ref={localVideoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full bg-black rounded-lg border-2 border-cyan-500 object-cover"
              ></video>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
            <h2 className="text-lg font-semibold">Remote Videos ({Object.keys(remoteStreams).length})</h2>
            <div className="flex justify-center items-center p-4 rounded-lg bg-gray-800 w-full aspect-video">
              {Object.entries(remoteStreams).map(([socketID, stream]) => (
                <RemoteVideo key={socketID} stream={stream} socketID={socketID} />
              ))}
              {Object.keys(remoteStreams).length === 0 && (
                <div className="flex items-center justify-center w-full h-full">
                  <p className="text-gray-400">No remote users connected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
