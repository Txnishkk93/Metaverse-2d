import React, { useEffect, useRef, useState } from 'react';
import { Users, MessageSquare, Settings, Maximize2, Minimize2 } from 'lucide-react';
import './App.css'
const Arena = () => {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [currentUser, setCurrentUser] = useState({});
  const [users, setUsers] = useState(new Map());
  const [params, setParams] = useState({ token: '', spaceId: '' });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [showUsers, setShowUsers] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || 'demo-token-123';
    const spaceId = urlParams.get('spaceId') || 'space-1';
    setParams({ token, spaceId });

    wsRef.current = new WebSocket('ws://localhost:3001');

    wsRef.current.onopen = () => {
      wsRef.current.send(JSON.stringify({
        type: 'join',
        payload: { spaceId, token }
      }));
    };

    wsRef.current.onerror = () => {
      // Simulate connection for demo
      setCurrentUser({ x: 10, y: 10, userId: 'you' });
      setUsers(new Map([
        ['user1', { x: 15, y: 12, userId: 'user1' }],
        ['user2', { x: 8, y: 15, userId: 'user2' }]
      ]));
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'space-joined':
        setCurrentUser({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId
        });
        const userMap = new Map();
        message.payload.users.forEach((user) => {
          if (user.userId !== message.payload.userId) {
            userMap.set(user.userId, user);
          }
        });
        setUsers(userMap);
        break;
      case 'user-joined':
        setUsers(prev => {
          const newUsers = new Map(prev);
          newUsers.set(message.payload.userId, {
            x: message.payload.x,
            y: message.payload.y,
            userId: message.payload.userId
          });
          return newUsers;
        });
        break;
      case 'movement':
        setUsers(prev => {
          const newUsers = new Map(prev);
          const user = newUsers.get(message.payload.userId);
          if (user) {
            user.x = message.payload.x;
            user.y = message.payload.y;
            newUsers.set(message.payload.userId, user);
          }
          return newUsers;
        });
        break;
      case 'movement-rejected':
        setCurrentUser((prev) => ({
          ...prev,
          x: message.payload.x,
          y: message.payload.y
        }));
        break;
      case 'user-left':
        setUsers(prev => {
          const newUsers = new Map(prev);
          newUsers.delete(message.payload.userId);
          return newUsers;
        });
        break;
    }
  };

  const handleMove = (newX, newY) => {
    if (!currentUser || !currentUser.userId) return;

    // Optimistic update
    setCurrentUser(prev => ({ ...prev, x: newX, y: newY }));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'move',
        payload: { x: newX, y: newY, userId: currentUser.userId }
      }));
    }
  };

  // Draw the arena
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const cellSize = 50;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid with darker theme
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += cellSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw current user with glow effect
    if (currentUser && currentUser.x !== undefined) {
      const x = currentUser.x * cellSize;
      const y = currentUser.y * cellSize;
      
      // Glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#3b82f6';
      ctx.beginPath();
      ctx.fillStyle = '#3b82f6';
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Inner circle
      ctx.beginPath();
      ctx.fillStyle = '#60a5fa';
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('You', x, y + 38);
    }

    // Draw other users
    users.forEach(user => {
      if (user.x === undefined) return;
      
      const x = user.x * cellSize;
      const y = user.y * cellSize;
      
      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#10b981';
      ctx.beginPath();
      ctx.fillStyle = '#10b981';
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Inner circle
      ctx.beginPath();
      ctx.fillStyle = '#34d399';
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#fff';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`User ${user.userId.slice(0, 4)}`, x, y + 38);
    });
  }, [currentUser, users]);

  const handleKeyDown = (e) => {
    if (!currentUser || currentUser.x === undefined) return;
    
    const { x, y } = currentUser;
    const maxX = 39;
    const maxY = 39;
    
    switch (e.key) {
      case 'ArrowUp':
        if (y > 0) handleMove(x, y - 1);
        break;
      case 'ArrowDown':
        if (y < maxY) handleMove(x, y + 1);
        break;
      case 'ArrowLeft':
        if (x > 0) handleMove(x - 1, y);
        break;
      case 'ArrowRight':
        if (x < maxX) handleMove(x + 1, y);
        break;
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      user: 'You',
      message: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatInput('');
  };

 
  return (
    <div className="arena-container" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Users Sidebar */}
      {showUsers && (
        <div className="users-sidebar">
          <div className="users-header">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-400" />
              <h2>Participants</h2>
            </div>
            <div className="users-count">{users.size + (currentUser.userId ? 1 : 0)} online</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {currentUser.userId && (
              <div className="user-item current-user">
                <div className="user-avatar">Y</div>
                <div className="flex-1">
                  <div>You</div>
                  <div className="text-xs">Position: ({currentUser.x}, {currentUser.y})</div>
                </div>
              </div>
            )}
            {Array.from(users.values()).map(user => (
              <div key={user.userId} className="user-item">
                <div className="user-avatar">{user.userId[0].toUpperCase()}</div>
                <div className="flex-1">
                  <div>User {user.userId.slice(0, 6)}</div>
                  <div className="text-xs">Position: ({user.x}, {user.y})</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="main-area">
        <div className="header">
          <h1>Metaverse Arena</h1>
          <div className="space-id">Space: {params.spaceId}</div>
          <div className="flex gap-2">
            <button onClick={() => setShowUsers(!showUsers)}><Users /></button>
            <button onClick={() => setShowChat(!showChat)}><MessageSquare /></button>
            <button onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            </button>
            <button><Settings /></button>
          </div>
        </div>

        <div className="canvas-container">
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} width={2000} height={2000} className="arena-canvas" />
          </div>
        </div>

        <div className="footer">
          <div className="instruction">Use arrow keys to move</div>
          <div>
            <button>↑</button>
            <button>←</button>
            <button>↓</button>
            <button>→</button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <MessageSquare /> Chat
          </div>
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div>No messages yet. Start chatting!</div>
            ) : chatMessages.map((msg, idx) => (
              <div key={idx} className="chat-message">
                <div className="header">
                  <span>{msg.user}</span>
                  <span>{msg.time}</span>
                </div>
                <div className="content">{msg.message}</div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Arena;