import React, { useState, useEffect, useRef } from 'react';
import { Users, Home, Compass, Bell, Mail, Bookmark, User, MoreHorizontal, Zap, LogOut, LogIn } from 'lucide-react';

const WS_URL = "ws://localhost:3001";
const BACKEND_URL = "http://localhost:3000";
const GRID_SIZE = 50;
const CELL_SIZE = 40;

// Auth Page Component
const AuthPage = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/v1/signin' : '/api/v1/signup';
      const body = isLogin 
        ? { username, password }
        : { username, password, type: 'user' };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          onAuth(data.token, data.userId);
        } else {
          setIsLogin(true);
          setError('Account created! Please login.');
        }
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Zap className="w-16 h-16 text-blue-500" />
          </div>
          <h1 className="text-white text-4xl font-bold mb-2">
            {isLogin ? 'Sign in to Metaverse' : 'Join Metaverse'}
          </h1>
          <p className="text-gray-500">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
              placeholder="Username"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
              placeholder="Password"
            />
          </div>

          {error && (
            <div className={`p-3 rounded-lg text-sm ${
              error.includes('created') ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'
            }`}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !username || !password}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign in' : 'Sign up'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-blue-500 hover:text-blue-400 text-sm transition"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Space Selector Component
const SpaceSelector = ({ token, onSelectSpace, onLogout }) => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/space/all`, {
        headers: { authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSpaces(data.spaces || []);
    } catch (err) {
      setError('Failed to load spaces');
    } finally {
      setLoading(false);
    }
  };

  const createSpace = async () => {
    if (!newSpaceName.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/space`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newSpaceName,
          dimensions: '100x200'
        })
      });
      const data = await response.json();
      if (response.ok) {
        onSelectSpace(data.spaceId);
      } else {
        setError(data.message || 'Failed to create space');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-white text-4xl font-bold mb-2">Spaces</h1>
            <p className="text-gray-500">Choose a space to explore</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-transparent border border-gray-700 hover:bg-gray-900 text-white px-4 py-2 rounded-full transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <h2 className="text-white text-xl font-semibold mb-4">Create New Space</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createSpace()}
              placeholder="Space name"
              className="flex-1 px-4 py-3 bg-black border border-gray-800 rounded-full text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={createSpace}
              disabled={creating || !newSpaceName.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-white text-xl">Loading spaces...</div>
        ) : spaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.map((space) => (
              <div
                key={space.id}
                onClick={() => onSelectSpace(space.id)}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-blue-500 transition"
              >
                <h3 className="text-white text-xl font-semibold mb-2">{space.name}</h3>
                <p className="text-gray-500 text-sm">Dimensions: {space.dimensions}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-xl">
            No spaces found. Create one to get started!
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-900/30 text-red-400 p-4 rounded-lg border border-red-800">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ activeSection, onSectionChange, onlineUsers, onLogout }) => {
  const menuItems = [
    { icon: Home, label: 'Home', id: 'home' },
    { icon: Compass, label: 'Explore', id: 'explore' },
    { icon: Users, label: `Users (${onlineUsers})`, id: 'users' },
    { icon: Bell, label: 'Notifications', id: 'notifications' },
    { icon: Mail, label: 'Messages', id: 'messages' },
    { icon: Bookmark, label: 'Bookmarks', id: 'bookmarks' },
    { icon: User, label: 'Profile', id: 'profile' },
  ];

  return (
    <div className="w-64 h-screen bg-black border-r border-gray-800 fixed left-0 top-0 flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8">
          <Zap className="w-8 h-8 text-blue-500" />
          <span className="text-white text-xl font-bold">Metaverse</span>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-500 text-white'
                  : 'text-white hover:bg-gray-900'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-lg font-medium">{item.label}</span>
            </button>
          ))}
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-full transition-colors text-red-500 hover:bg-gray-900"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-lg font-medium">Logout</span>
          </button>
        </nav>
      </div>
      
      <div className="mt-auto p-4">
        <div className="flex items-center gap-3 p-3 rounded-full hover:bg-gray-900 cursor-pointer transition">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold">Explorer</div>
            <div className="text-gray-500 text-sm">@explorer</div>
          </div>
          <MoreHorizontal className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

// Right Sidebar Component
const RightSidebar = ({ users, myPosition }) => {
  return (
    <div className="w-80 h-screen bg-black border-l border-gray-800 fixed right-0 top-0 overflow-y-auto">
      <div className="p-4">
        <div className="bg-gray-900 rounded-2xl p-4 mb-4">
          <h2 className="text-white text-xl font-bold mb-3">Your Stats</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Position X</span>
              <span className="text-white font-semibold">{myPosition.x}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Position Y</span>
              <span className="text-white font-semibold">{myPosition.y}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-white text-xl font-bold mb-3">Active Users</h2>
          <div className="space-y-3">
            {Object.entries(users).length === 0 ? (
              <p className="text-gray-500 text-sm">No other users online</p>
            ) : (
              Object.entries(users).map(([userId, pos]) => (
                <div key={userId} className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition cursor-pointer">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">User {userId.slice(0, 8)}</div>
                    <div className="text-gray-500 text-xs">Position: ({pos.x}, {pos.y})</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Arena Component
const Arena = ({ token, spaceId, onLogout }) => {
  const [users, setUsers] = useState({});
  const [myPosition, setMyPosition] = useState({ x: 0, y: 0 });
  const [myUserId, setMyUserId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [spaceInfo, setSpaceInfo] = useState(null);
  const wsRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchSpaceInfo();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [users, myPosition, spaceInfo]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!connected) return;
      
      let newX = myPosition.x;
      let newY = myPosition.y;

      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newY = Math.max(0, myPosition.y - 1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newY = myPosition.y + 1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newX = Math.max(0, myPosition.x - 1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newX = myPosition.x + 1;
          break;
        default:
          return;
      }

      if (newX !== myPosition.x || newY !== myPosition.y) {
        sendMove(newX, newY);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [myPosition, connected]);

  const fetchSpaceInfo = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSpaceInfo(data);
    } catch (err) {
      console.error('Failed to fetch space info:', err);
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        payload: { spaceId, token }
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.onclose = () => {
      setConnected(false);
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handleWebSocketMessage = (message) => {
    switch(message.type) {
      case 'space-joined':
        setConnected(true);
        setMyPosition(message.payload.spawn);
        setMyUserId(message.payload.userId);
        const userMap = {};
        message.payload.users.forEach(u => {
          userMap[u.userId] = { x: u.x, y: u.y };
        });
        setUsers(userMap);
        break;
      
      case 'user-joined':
        setUsers(prev => ({
          ...prev,
          [message.payload.userId]: { x: message.payload.x, y: message.payload.y }
        }));
        break;
      
      case 'movement':
        setUsers(prev => ({
          ...prev,
          [message.payload.userId]: { x: message.payload.x, y: message.payload.y }
        }));
        break;
      
      case 'movement-rejected':
        setMyPosition({ x: message.payload.x, y: message.payload.y });
        break;
      
      case 'user-left':
        setUsers(prev => {
          const newUsers = { ...prev };
          delete newUsers[message.payload.userId];
          return newUsers;
        });
        break;
    }
  };

  const sendMove = (x, y) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'move',
        payload: { x, y }
      }));
      setMyPosition({ x, y });
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(width, i * CELL_SIZE);
      ctx.stroke();
    }

    if (spaceInfo?.elements) {
      spaceInfo.elements.forEach(element => {
        ctx.fillStyle = '#374151';
        ctx.fillRect(
          element.x * CELL_SIZE + 5,
          element.y * CELL_SIZE + 5,
          CELL_SIZE - 10,
          CELL_SIZE - 10
        );
      });
    }

    Object.entries(users).forEach(([userId, pos]) => {
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(
        pos.x * CELL_SIZE + CELL_SIZE / 2,
        pos.y * CELL_SIZE + CELL_SIZE / 2,
        16,
        0,
        2 * Math.PI
      );
      ctx.fill();
      
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`User`, pos.x * CELL_SIZE + CELL_SIZE / 2, pos.y * CELL_SIZE - 12);
    });

    ctx.fillStyle = '#1d9bf0';
    ctx.beginPath();
    ctx.arc(
      myPosition.x * CELL_SIZE + CELL_SIZE / 2,
      myPosition.y * CELL_SIZE + CELL_SIZE / 2,
      16,
      0,
      2 * Math.PI
    );
    ctx.fill();
    
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('You', myPosition.x * CELL_SIZE + CELL_SIZE / 2, myPosition.y * CELL_SIZE - 12);
  };

  return (
    <div className="min-h-screen bg-black">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        onlineUsers={Object.keys(users).length + 1}
        onLogout={onLogout}
      />
      
      <div className="ml-64 mr-80">
        <div className="border-r border-l border-gray-800 min-h-screen">
          <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 z-10">
            <div className="p-4">
              <h1 className="text-white text-xl font-bold">Metaverse Arena</h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-gray-400 text-sm">
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="text-gray-600">•</div>
                <div className="text-gray-400 text-sm">
                  {Object.keys(users).length + 1} users online
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white text-lg font-semibold">Live Arena</h2>
                <div className="text-gray-400 text-sm">
                  Use ↑↓←→ or WASD to move
                </div>
              </div>
              
              <div className="overflow-auto rounded-xl border border-gray-800">
                <canvas
                  ref={canvasRef}
                  width={GRID_SIZE * CELL_SIZE}
                  height={GRID_SIZE * CELL_SIZE}
                  className="bg-black"
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-black rounded-xl p-4 border border-gray-800">
                  <div className="text-gray-400 text-xs mb-1">X Position</div>
                  <div className="text-white text-2xl font-bold">{myPosition.x}</div>
                </div>
                <div className="bg-black rounded-xl p-4 border border-gray-800">
                  <div className="text-gray-400 text-xs mb-1">Y Position</div>
                  <div className="text-white text-2xl font-bold">{myPosition.y}</div>
                </div>
                <div className="bg-black rounded-xl p-4 border border-gray-800">
                  <div className="text-gray-400 text-xs mb-1">Users Nearby</div>
                  <div className="text-white text-2xl font-bold">{Object.keys(users).length}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="text-white text-lg font-semibold px-2">Recent Activity</h3>
              
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">You</span>
                      <span className="text-gray-500 text-sm">@explorer</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-500 text-sm">Just now</span>
                    </div>
                    <p className="text-white mt-1">
                      Exploring the metaverse arena! Currently at position ({myPosition.x}, {myPosition.y})
                    </p>
                    <div className="flex gap-4 mt-3 text-gray-500">
                      <button className="hover:text-blue-500 transition">
                        <span className="text-sm">💬 Reply</span>
                      </button>
                      <button className="hover:text-green-500 transition">
                        <span className="text-sm">🔄 Repost</span>
                      </button>
                      <button className="hover:text-red-500 transition">
                        <span className="text-sm">❤️ Like</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {Object.keys(users).length > 0 && (
                <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">User {Object.keys(users)[0]?.slice(0, 8)}</span>
                        <span className="text-gray-500 text-sm">@user1</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500 text-sm">2m ago</span>
                      </div>
                      <p className="text-white mt-1">
                        Just joined the arena! This metaverse is amazing! 🚀
                      </p>
                      <div className="flex gap-4 mt-3 text-gray-500">
                        <button className="hover:text-blue-500 transition">
                          <span className="text-sm">💬 12</span>
                        </button>
                        <button className="hover:text-green-500 transition">
                          <span className="text-sm">🔄 5</span>
                        </button>
                        <button className="hover:text-red-500 transition">
                          <span className="text-sm">❤️ 28</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <RightSidebar users={users} myPosition={myPosition} />
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [spaceId, setSpaceId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlSpaceId = params.get('spaceid');

    if (urlToken) {
      setToken(urlToken);
      if (urlSpaceId) {
        setSpaceId(urlSpaceId);
      }
    }
  }, []);

  const handleAuth = (authToken, authUserId) => {
    setToken(authToken);
    setUserId(authUserId);
  };

  const handleLogout = () => {
    setToken(null);
    setUserId(null);
    setSpaceId(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  if (!token) {
    return <AuthPage onAuth={handleAuth} />;
  }

  if (!spaceId) {
    return <SpaceSelector token={token} onSelectSpace={setSpaceId} onLogout={handleLogout} />;
  }

  return <Arena token={token} spaceId={spaceId} onLogout={handleLogout} />;
}