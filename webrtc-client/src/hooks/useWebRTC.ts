import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import { io, Socket } from 'socket.io-client';

const SIGNALING_SERVER_URL = 'http://localhost:3001';

const useWebRTC = (roomId: string, localStream: MediaStream | null) => {
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  useEffect(() => {
    const fetchIceServers = async () => {
      try {
        const response = await fetch(`${SIGNALING_SERVER_URL}/api/get-turn-credentials`);
        if (!response.ok) {
          throw new Error('Failed to fetch ICE servers');
        }
        const data = await response.json();
        const servers = [...data.iceServers, { urls: 'stun:stun.l.google.com:19302' }];
        setIceServers(servers);
      } catch (error) {
        setIceServers([{ urls: 'stun:stun.l.google.com:19302' }]);
      }
    };
    fetchIceServers();
  }, []);


  useEffect(() => {
    if (!localStream || iceServers.length === 0) return;

    socketRef.current = io(SIGNALING_SERVER_URL);
    const socket = socketRef.current;

    const createPeerConnection = (socketID: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers });

      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      pc.ontrack = (event) => {
        if (event.streams && event.streams.length > 0) {
          const remoteStream = event.streams[0];
          setRemoteStreams(prev => ({
            ...prev,
            [socketID]: remoteStream
          }));
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { target: socketID, from: socket.id, candidate: event.candidate });
        }
      };

      return pc;
    };

    socket.on('connect', () => {
      socket.emit('join-room', roomId);
    });

    socket.on('other-users', (otherUsers: string[]) => {
      otherUsers.forEach(otherUserId => {
        if (peerConnections.current[otherUserId]) {
          return;
        }
        const pc = createPeerConnection(otherUserId);
        peerConnections.current[otherUserId] = pc;
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit('offer', { target: otherUserId, caller: socket.id, signal: pc.localDescription });
          })
          .catch(error => {
            console.error(error);
          });
      });
    });

    socket.on('offer', (data: { caller: string; signal: RTCSessionDescriptionInit }) => {
      if (peerConnections.current[data.caller]) {
        return;
      }
      const pc = createPeerConnection(data.caller);
      peerConnections.current[data.caller] = pc;
      pc.setRemoteDescription(data.signal)
        .then(() => pc.createAnswer())
        .then(answer => pc.setLocalDescription(answer))
        .then(() => {
          socket.emit('answer', { target: data.caller, caller: socket.id, signal: pc.localDescription });
        })
        .catch(error => {
          console.error(error);
        });
    });

    socket.on('answer', (data: { caller: string; signal: RTCSessionDescriptionInit }) => {
      const pc = peerConnections.current[data.caller];
      if (pc) {
        pc.setRemoteDescription(data.signal).catch(error => {
          console.error(error);
        });
      }
    });

    socket.on('ice-candidate', (data: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.current[data.from];
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(error => {
          console.error(error);
        });
      }
    });

    socket.on('user-left', (socketID: string) => {
      if (peerConnections.current[socketID]) {
        peerConnections.current[socketID].close();
        delete peerConnections.current[socketID];
      }
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[socketID];
        return newStreams;
      });
    });

    return () => {
      socket.disconnect();
      Object.values(peerConnections.current).forEach(pc => pc.close());
    };
  }, [localStream, roomId, iceServers]);

  return { remoteStreams };
};

export default useWebRTC;