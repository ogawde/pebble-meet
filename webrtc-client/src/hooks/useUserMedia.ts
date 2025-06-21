import { useState, useEffect } from 'react';

const useUserMedia = (constraints: MediaStreamConstraints) => {
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let didCancel = false;
    let mediaStream: MediaStream | null = null;

    const getMedia = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!didCancel) {
          setStream(mediaStream);
        }
      } catch (err) {
        console.error(err);
      }
    };

    getMedia();

    return () => {
      didCancel = true;
      mediaStream?.getTracks().forEach(track => track.stop());
    };
  }, [JSON.stringify(constraints)]);

  return { stream };
};

export default useUserMedia;
