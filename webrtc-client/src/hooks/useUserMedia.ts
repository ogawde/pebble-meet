import { useState, useEffect, useCallback } from 'react';

interface AvailableDevices {
  video: MediaDeviceInfo[];
  audio: MediaDeviceInfo[];
}

const useUserMedia = (constraints: MediaStreamConstraints) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [availableDevices, setAvailableDevices] = useState<AvailableDevices>({
    video: [],
    audio: [],
  });

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      const audioDevices = devices.filter((device) => device.kind === 'audioinput');
      
      setAvailableDevices({
        video: videoDevices,
        audio: audioDevices,
      });
    } catch {
      setAvailableDevices({ video: [], audio: [] });
    }
  }, []);

  useEffect(() => {
    let didCancel = false;
    let mediaStream: MediaStream | null = null;

    const getMedia = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!didCancel) {
          setStream(mediaStream);
          await enumerateDevices();
        }
      } catch {
        if (!didCancel) {
          setStream(null);
        }
      }
    };

    getMedia();

    return () => {
      didCancel = true;
      mediaStream?.getTracks().forEach((track) => track.stop());
    };
  }, [JSON.stringify(constraints), enumerateDevices]);

  const switchDevice = useCallback(
    async (deviceId: string, kind: 'video' | 'audio') => {
      if (!stream) return;

      try {
        const newConstraints: MediaStreamConstraints = {
          video: kind === 'video' ? { deviceId: { exact: deviceId } } : constraints.video,
          audio: kind === 'audio' ? { deviceId: { exact: deviceId } } : constraints.audio,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(newConstraints);

        const oldTrack = stream.getTracks().find((track) => track.kind === kind);
        const newTrack = newStream.getTracks().find((track) => track.kind === kind);

        if (oldTrack && newTrack) {
          oldTrack.stop();
          stream.removeTrack(oldTrack);
          stream.addTrack(newTrack);
          setStream(new MediaStream(stream.getTracks()));
        }

        newStream.getTracks().forEach((track) => {
          if (track !== newTrack) {
            track.stop();
          }
        });
      } catch {
        return;
      }
    },
    [stream, constraints]
  );

  return { stream, switchDevice, availableDevices };
};

export default useUserMedia;
