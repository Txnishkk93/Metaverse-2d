import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Users, MessageCircle, Send, X, Check, UserPlus, Volume2, VolumeX, UserCheck, Settings } from 'lucide-react';

const TILE_SIZE = 48;
const VIEWPORT_TILES_X = 20;
const VIEWPORT_TILES_Y = 14;
const INTERACTION_DISTANCE = 3;

// Mock data for demonstration
const MOCK_SPACE = {
  id: '1',
  name: 'Office Space',
  dimensions: '30x30',
  elements: [
    // Walls - Top
    ...Array.from({ length: 30 }, (_, i) => ({ id: `wall-top-${i}`, x: i, y: 0, width: 1, height: 1, type: 'wall', color: '#8B4513' })),
    // Walls - Bottom
    ...Array.from({ length: 30 }, (_, i) => ({ id: `wall-bottom-${i}`, x: i, y: 29, width: 1, height: 1, type: 'wall', color: '#8B4513' })),
    // Walls - Left
    ...Array.from({ length: 30 }, (_, i) => ({ id: `wall-left-${i}`, x: 0, y: i, width: 1, height: 1, type: 'wall', color: '#8B4513' })),
    // Walls - Right
    ...Array.from({ length: 30 }, (_, i) => ({ id: `wall-right-${i}`, x: 29, y: i, width: 1, height: 1, type: 'wall', color: '#8B4513' })),
    
    // Meeting room 1
    { id: 'table1', x: 5, y: 5, width: 3, height: 2, type: 'table', color: '#D2691E' },
    { id: 'chair1-1', x: 5, y: 4, width: 1, height: 1, type: 'chair', color: '#A0522D' },
    { id: 'chair1-2', x: 7, y: 4, width: 1, height: 1, type: 'chair', color: '#A0522D' },
    { id: 'chair1-3', x: 5, y: 7, width: 1, height: 1, type: 'chair', color: '#A0522D' },
    { id: 'chair1-4', x: 7, y: 7, width: 1, height: 1, type: 'chair', color: '#A0522D' },
    
    // Meeting room 2
    { id: 'table2', x: 20, y: 5, width: 3, height: 2, type: 'table', color: '#D2691E' },
    { id: 'chair2-1', x: 20, y: 4, width: 1, height: 1, type: 'chair', color: '#A0522D' },
    { id: 'chair2-2', x: 22, y: 4, width: 1, height: 1, type: 'chair', color: '#A0522D' },
    { id: 'chair2-3', x: 20, y: 7, width: 1, height: 1, type: 'chair', color: '#A0522D' },
    { id: 'chair2-4', x: 22, y: 7, width: 1, height: 1, type: 'chair', color: '#A0522D' },
    
    // Lounge area
    { id: 'couch1', x: 12, y: 20, width: 3, height: 2, type: 'couch', color: '#4169E1' },
    { id: 'couch2', x: 16, y: 20, width: 3, height: 2, type: 'couch', color: '#4169E1' },
    { id: 'plant1', x: 10, y: 20, width: 1, height: 1, type: 'plant', color: '#228B22' },
    { id: 'plant2', x: 19, y: 20, width: 1, height: 1, type: 'plant', color: '#228B22' },
    
    // Desks
    { id: 'desk1', x: 5, y: 15, width: 2, height: 1, type: 'desk', color: '#8B7355' },
    { id: 'desk2', x: 10, y: 15, width: 2, height: 1, type: 'desk', color: '#8B7355' },
    { id: 'desk3', x: 15, y: 15, width: 2, height: 1, type: 'desk', color: '#8B7355' },
    { id: 'desk4', x: 20, y: 15, width: 2, height: 1, type: 'desk', color: '#8B7355' },
  ]
};

const Arena = () => {
  const [currentSpace] = useState(MOCK_SPACE);
  const [userId] = useState(`user-${Math.random().toString(36).substr(2, 9)}`);
  const [username] = useState(`User${Math.floor(Math.random() * 1000)}`);
  const [currentUserPosition, setCurrentUserPosition] = useState({ x: 15, y: 15 });
  const [users, setUsers] = useState([]);
  const [connected, setConnected] = useState(true);
  const [mapDimensions] = useState({ width: 30, height: 30 });
  const [elements] = useState(MOCK_SPACE.elements);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [chatRequests, setChatRequests] = useState(new Map());
  const [acceptedChats, setAcceptedChats] = useState(new Set());
  const [mutedUsers, setMutedUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);

  const containerRef = useRef(null);
  const chatEndRef = useRef(null);
  const lastMoveRef = useRef({ x: 15, y: 15 });

  // Simulate other users joining
  useEffect(() => {
    const mockUsers = [
      { id: 'user-1', x: 6, y: 5, userId: 'Alice' },
      { id: 'user-2', x: 21, y: 6, userId: 'Bob' },
      { id: 'user-3', x: 13, y: 21, userId: 'Charlie' },
      { id: 'user-4', x: 11, y: 16, userId: 'Diana' },
    ];
    
    setUsers(mockUsers);
    
    // Simulate user movements
    const interval = setInterval(() => {
      setUsers(prev => prev.map(user => {
        const random = Math.random();
        if (random > 0.7) {
          const dx = Math.floor(Math.random() * 3) - 1;
          const dy = Math.floor(Math.random() * 3) - 1;
          const newX = Math.max(1, Math.min(28, user.x + dx));
          const newY = Math.max(1, Math.min(28, user.y + dy));
          return { ...user, x: newX, y: newY };
        }
        return user;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Calculate distance
  const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // Update nearby users
  useEffect(() => {
    const nearby = users.filter(user => {
      const distance = calculateDistance(
        currentUserPosition.x,
        currentUserPosition.y,
        user.x,
        user.y
      );
      return distance <= INTERACTION_DISTANCE;
    }).map(u => u.userId);

    setNearbyUsers(nearby);
  }, [users, currentUserPosition]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add notification
  const addNotification = (type, username) => {
    const notification = {
      id: Date.now().toString(),
      type,
      username,
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Keyboard movement
  const handleKeyDown = useCallback((e) => {
    if (!connected) return;

    let dx = 0;
    let dy = 0;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        dy = -1;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        dy = 1;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        dx = -1;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        dx = 1;
        break;
      default:
        return;
    }

    e.preventDefault();

    const newX = currentUserPosition.x + dx;
    const newY = currentUserPosition.y + dy;

    // Boundary check
    if (newX < 1 || newX >= mapDimensions.width - 1 || newY < 1 || newY >= mapDimensions.height - 1) {
      return;
    }

    // Collision detection with elements
    const hasCollision = elements.some(element => {
      if (element.type === 'wall' || element.type === 'table' || element.type === 'desk' || element.type === 'couch') {
        return newX >= element.x && 
               newX < element.x + (element.width || 1) &&
               newY >= element.y && 
               newY < element.y + (element.height || 1);
      }
      return false;
    });

    if (hasCollision) {
      return;
    }

    lastMoveRef.current = { ...currentUserPosition };
    setCurrentUserPosition({ x: newX, y: newY });
  }, [connected, currentUserPosition, mapDimensions, elements]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Chat functions
  const sendChatRequest = (targetUserId) => {
    setChatRequests(prev => new Map(prev).set(targetUserId, {
      fromUserId: userId,
      fromUsername: username,
      status: 'pending'
    }));
    addNotification('chat-request', `Sent chat request to ${targetUserId}`);
  };

  const acceptChatRequest = (fromUserId) => {
    setAcceptedChats(prev => new Set(prev).add(fromUserId));
    setChatRequests(prev => {
      const updated = new Map(prev);
      const request = updated.get(fromUserId);
      if (request) {
        updated.set(fromUserId, { ...request, status: 'accepted' });
      }
      return updated;
    });
  };

  const rejectChatRequest = (fromUserId) => {
    setChatRequests(prev => {
      const updated = new Map(prev);
      updated.delete(fromUserId);
      return updated;
    });
  };

  const toggleMuteUser = (targetUserId) => {
    setMutedUsers(prev => {
      const updated = new Set(prev);
      if (updated.has(targetUserId)) {
        updated.delete(targetUserId);
      } else {
        updated.add(targetUserId);
      }
      return updated;
    });
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      userId: userId,
      username: username,
      message: messageInput.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
  };

  // Camera offset
  const cameraOffset = {
    x: Math.max(
      0,
      Math.min(
        currentUserPosition.x - Math.floor(VIEWPORT_TILES_X / 2),
        Math.max(0, mapDimensions.width - VIEWPORT_TILES_X)
      )
    ),
    y: Math.max(
      0,
      Math.min(
        currentUserPosition.y - Math.floor(VIEWPORT_TILES_Y / 2),
        Math.max(0, mapDimensions.height - VIEWPORT_TILES_Y)
      )
    ),
  };

  const pendingRequests = Array.from(chatRequests.entries())
    .filter(([_, req]) => req.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="font-semibold text-white">
                {currentSpace?.name || 'Virtual Space'}
              </h1>
              <p className="text-xs text-slate-400">
                {currentSpace?.dimensions}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white font-medium">{users.length + 1}</span>
            </div>
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors relative"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              {messages.length > 0 && !showChat && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-3 animate-in slide-in-from-right pointer-events-auto"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {notification.username}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Game Canvas */}
      <div
        ref={containerRef}
        className={`fixed inset-0 top-14 overflow-hidden bg-slate-800 transition-all ${
          showChat ? 'right-80' : 'right-0'
        }`}
      >
        <div
          className="relative"
          style={{
            width: mapDimensions.width * TILE_SIZE,
            height: mapDimensions.height * TILE_SIZE,
            transform: `translate(${-cameraOffset.x * TILE_SIZE}px, ${-cameraOffset.y * TILE_SIZE}px)`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Grid Background */}
          <div
            className="absolute inset-0 bg-slate-700"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(100, 116, 139, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(100, 116, 139, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
            }}
          />

          {/* Map Elements */}
          {elements.map((element) => {
            const getElementStyle = () => {
              switch (element.type) {
                case 'wall':
                  return 'bg-amber-900 border-2 border-amber-950';
                case 'table':
                  return 'bg-amber-700 border-2 border-amber-800 rounded-lg';
                case 'chair':
                  return 'bg-amber-600 border-2 border-amber-700 rounded';
                case 'desk':
                  return 'bg-stone-700 border-2 border-stone-800 rounded-lg';
                case 'couch':
                  return 'bg-blue-700 border-2 border-blue-800 rounded-lg';
                case 'plant':
                  return 'bg-green-700 border-2 border-green-800 rounded-full';
                default:
                  return 'bg-slate-600';
              }
            };

            return (
              <div
                key={element.id}
                className={`absolute ${getElementStyle()}`}
                style={{
                  left: element.x * TILE_SIZE,
                  top: element.y * TILE_SIZE,
                  width: (element.width || 1) * TILE_SIZE,
                  height: (element.height || 1) * TILE_SIZE,
                }}
              />
            );
          })}

          {/* Other Users */}
          {users.map((user) => {
            const isNearby = nearbyUsers.includes(user.userId);
            const hasAcceptedChat = acceptedChats.has(user.userId);

            return (
              <div
                key={user.id}
                className="absolute transition-all duration-150 ease-out"
                style={{
                  left: user.x * TILE_SIZE,
                  top: user.y * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full bg-purple-500 overflow-hidden border-2 ${
                    isNearby ? 'border-green-400 ring-2 ring-green-400/50' : 'border-purple-600'
                  }`}>
                    <img
                      src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.userId}`}
                      alt=""
                      className="w-full h-full"
                    />
                  </div>

                  {/* Username */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-slate-800/90 rounded text-xs text-white border border-slate-700">
                      {user.userId}
                    </span>
                  </div>

                  {/* Chat request button */}
                  {isNearby && !hasAcceptedChat && (
                    <button
                      onClick={() => sendChatRequest(user.userId)}
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white flex items-center gap-1 transition-colors"
                    >
                      <UserPlus className="w-3 h-3" />
                      Chat
                    </button>
                  )}

                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />
                </div>
              </div>
            );
          })}

          {/* Current User */}
          <div
            className="absolute transition-all duration-150 ease-out z-10"
            style={{
              left: currentUserPosition.x * TILE_SIZE,
              top: currentUserPosition.y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-blue-500 overflow-hidden border-2 border-blue-400 shadow-lg shadow-blue-500/50">
                <img
                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${userId}`}
                  alt=""
                  className="w-full h-full"
                />
              </div>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-2 py-0.5 bg-blue-600 rounded text-xs text-white font-medium">
                  You
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="fixed top-14 right-0 bottom-0 w-80 bg-slate-800 border-l border-slate-700 flex flex-col z-40">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Space Chat</h3>
              <p className="text-xs text-slate-400">
                {users.length + 1} online
              </p>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Pending Chat Requests */}
          {pendingRequests.length > 0 && (
            <div className="p-3 bg-slate-900/50 border-b border-slate-700 space-y-2">
              {pendingRequests.map(([targetUserId, request]) => (
                <div key={targetUserId} className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-sm text-white mb-2">
                    <span className="font-medium">{request.fromUsername}</span> wants to chat
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptChatRequest(request.fromUserId)}
                      className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm text-white flex items-center justify-center gap-1 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      Accept
                    </button>
                    <button
                      onClick={() => rejectChatRequest(request.fromUserId)}
                      className="flex-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white flex items-center justify-center gap-1 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p className="text-sm text-slate-400">No messages yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Get close to other users to start chatting
                </p>
              </div>
            ) : (
              messages
                .filter(msg => !mutedUsers.has(msg.userId))
                .map((msg) => {
                  const isOwnMessage = msg.userId === userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500 overflow-hidden flex-shrink-0">
                        <img
                          src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${msg.userId}`}
                          alt=""
                          className="w-full h-full"
                        />
                      </div>
                      <div className={`flex-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-white">
                            {msg.username}
                          </span>
                          <span className="text-xs text-slate-400">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isOwnMessage && (
                            <button
                              onClick={() => toggleMuteUser(msg.userId)}
                              className="ml-auto"
                            >
                              {mutedUsers.has(msg.userId) ? (
                                <VolumeX className="w-3 h-3 text-slate-500" />
                              ) : (
                                <Volume2 className="w-3 h-3 text-slate-500" />
                              )}
                            </button>
                          )}
                        </div>
                        <div
                          className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-center pointer-events-none">
        <div className="px-4 py-2 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700">
          <p className="text-sm text-slate-300">
            Use <span className="text-white font-medium">Arrow Keys</span> or{' '}
            <span className="text-white font-medium">WASD</span> to move • Get close to users to chat
          </p>
        </div>
      </div>
    </div>
  );
};

export default Arena;