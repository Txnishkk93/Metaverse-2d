import React, { useState, useEffect, useRef } from 'react';
import { Users, Home, Compass, Bell, Mail, Bookmark, User, MoreHorizontal, Zap } from 'lucide-react';

const WS_URL = "ws://localhost:3001";
const BACKEND_URL = "http://localhost:3000";
const GRID_SIZE = 50;
const CELL_SIZE = 40;

// Sidebar Component
const Sidebar = ({ activeSection, onSectionChange, onlineUsers }) => {
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
const Arena = () => {
  const [users, setUsers] = useState({});
  const [myPosition, setMyPosition] = useState({ x: 0, y: 0 });
  const [myUserId, setMyUserId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [spaceInfo, setSpaceInfo] = useState(null);
  const wsRef = useRef(null);
  const canvasRef = useRef(null);

  // Demo mode - using hardcoded values for exploration
  const demoToken = "demo-token";
  const demoSpaceId = "demo-space";

  useEffect(() => {
    // For demo, set initial position
    setMyPosition({ x: 10, y: 10 });
    setMyUserId("demo-user-" + Math.random().toString(36).substr(2, 9));
    
    // Simulate some demo users
    setUsers({
      'user-1': { x: 15, y: 20 },
      'user-2': { x: 25, y: 15 },
      'user-3': { x: 30, y: 30 },
    });
    
    setConnected(true);
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [users, myPosition]);

  useEffect(() => {
    const handleKeyPress = (e) => {
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
          newY = Math.min(GRID_SIZE - 1, myPosition.y + 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newX = Math.max(0, myPosition.x - 1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newX = Math.min(GRID_SIZE - 1, myPosition.x + 1);
          break;
        default:
          return;
      }

      if (newX !== myPosition.x || newY !== myPosition.y) {
        setMyPosition({ x: newX, y: newY });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [myPosition]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear with dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
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

    // Draw other users
    Object.entries(users).forEach(([userId, pos]) => {
      // User circle
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
      
      // User border
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // User label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`User`, pos.x * CELL_SIZE + CELL_SIZE / 2, pos.y * CELL_SIZE - 12);
    });

    // Draw current user (you)
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
    
    // User border
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // "You" label
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
      />
      
      <div className="ml-64 mr-80">
        <div className="border-r border-l border-gray-800 min-h-screen">
          {/* Header */}
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

          {/* Arena Canvas */}
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

            {/* Activity Feed */}
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
            </div>
          </div>
        </div>
      </div>

      <RightSidebar users={users} myPosition={myPosition} />
    </div>
  );
};

export default function App() {
  return <Arena />;
}