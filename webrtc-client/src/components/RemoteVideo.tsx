import React, { useEffect, useRef, useState } from 'react';

interface RemoteVideoProps {
  stream: MediaStream;
  socketID: string;
}

const RemoteVideo: React.FC<RemoteVideoProps> = ({ stream, socketID }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const videoTracks = stream.getVideoTracks();
    const hasVideo = videoTracks.length > 0;
    setHasVideoTrack(hasVideo);
    
    
    if (!hasVideo) {
      console.warn('RemoteVideo: No video found');
      setError('No video');
      return;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      

      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setError(null);
        })
        .catch(error => {
          setIsPlaying(false);
          setError(`${error.message}`);
        });
    }
  }, [stream]);

  useEffect(() => {
    const handleTrackChange = () => {
      const videoTracks = stream.getVideoTracks();
      const hasVideo = videoTracks.length > 0;
      setHasVideoTrack(hasVideo);
      
      if (hasVideo && videoRef.current && !isPlaying) {
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setError(null);
          })
          .catch(error => {
            setError(`Track change error: ${error.message}`);
          });
      }
    };

    stream.addEventListener('addtrack', handleTrackChange);
    stream.addEventListener('removetrack', handleTrackChange);

    return () => {
      stream.removeEventListener('addtrack', handleTrackChange);
      stream.removeEventListener('removetrack', handleTrackChange);
    };
  }, [stream, isPlaying]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full bg-black rounded-lg border-2 border-green-500 object-cover"
      />
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
        {socketID.slice(0, 8)}
      </div>
      {!hasVideoTrack && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">No video available</p>
            <div className="w-16 h-16 mx-auto bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-2xl">📹</span>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <p className="text-red-200 text-sm mb-2">Error</p>
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        </div>
      )}
      {isPlaying && hasVideoTrack && (
        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
          Playing
        </div>
      )}
    </div>
  );
};

export default RemoteVideo;