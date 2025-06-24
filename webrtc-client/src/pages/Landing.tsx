import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const generateRoomId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

const Landing = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [username, setUsername] = useState('');
  const [pendingRoomId, setPendingRoomId] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    setPendingRoomId(newRoomId);
    setShowUsernameModal(true);
    setError('');
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    setPendingRoomId(roomId.trim());
    setShowUsernameModal(true);
    setError('');
  };

  const handleUsernameSubmit = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    sessionStorage.setItem('username', username.trim());
    navigate(`/meet/${pendingRoomId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <header className="py-6 px-6 border-b border-gray-700">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Pebble Meet
        </h1>
        <p className="text-center mt-2 text-gray-400">
          Connect with anyone, anywhere
        </p>
      </header>

      <main className="flex-grow flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Join a Room
            </h2>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleJoinRoom)}
                className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
              <Button
                onClick={handleJoinRoom}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Join
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">OR</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Create a New Room
            </h2>
            <Button
              onClick={handleCreateRoom}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-6 text-lg font-semibold"
            >
              Create Room
            </Button>
          </div>

          {error && !showUsernameModal && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-center">
              <p className="text-red-200">{error}</p>
            </div>
          )}
        </div>
      </main>

      {showUsernameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-center">
              Enter Your Name
            </h3>
            <p className="text-gray-400 mb-6 text-center">
              How should others identify you?
            </p>
            <Input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleUsernameSubmit)}
              className="mb-4 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              autoFocus
            />
            {error && showUsernameModal && (
              <div className="mb-4 bg-red-900/50 border border-red-700 rounded-lg p-2 text-center">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowUsernameModal(false);
                  setUsername('');
                  setError('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUsernameSubmit}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;

