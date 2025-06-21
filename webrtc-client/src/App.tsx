import { useRef, useEffect } from 'react';
import useUserMedia from './hooks/useUserMedia';

function App() {
  const constraints = { video: true, audio: true };
  const { stream } = useUserMedia(constraints);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans text-center p-5">
      
      <div className="w-full max-w-2xl bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg">
       
        
        {stream && 
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full block"
          />
        }
      </div>
    </div>
  );
}

export default App
