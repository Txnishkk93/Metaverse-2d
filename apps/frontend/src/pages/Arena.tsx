import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSpace, SpaceUser, SpaceElement } from '@/contexts/SpaceContext';
import { spaceAPI } from '@/services/api';
import wsService, {
  SpaceJoinedPayload,
  UserJoinPayload,
  MovementPayload,
  UserLeftPayload,
} from '@/services/websocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, MessageCircle, Send, X, Check, UserPlus, Volume2, VolumeX, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const TILE_SIZE = 48;
const VIEWPORT_TILES_X = 20;
const VIEWPORT_TILES_Y = 14;
const INTERACTION_DISTANCE = 3;

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

interface ChatRequest {
  fromUserId: string;
  fromUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Notification {
  id: string;
  type: 'user-join' | 'user-leave';
  username: string;
  timestamp: Date;
}

const Arena: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { token, userId, avatarId } = useAuth();
  const {
    currentSpace,
    users,
    currentUserPosition,
    setCurrentSpace,
    setUsers,
    setCurrentUserPosition,
  } = useSpace();

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [mapDimensions, setMapDimensions] = useState({ width: 30, height: 30 });
  const [elements, setElements] = useState<SpaceElement[]>([]);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<SpaceUser[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<string[]>([]);
  const [chatRequests, setChatRequests] = useState<Map<string, ChatRequest>>(new Map());
  const [acceptedChats, setAcceptedChats] = useState<Set<string>>(new Set());
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastMoveRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Add notification
  const addNotification = (type: 'user-join' | 'user-leave', username: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      username,
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Calculate distance between two users
  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
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

  // Fetch space data
  useEffect(() => {
    const fetchSpace = async () => {
      if (!spaceId) return;

      try {
        const response = await spaceAPI.getById(spaceId);
        const data = response.data;

        setCurrentSpace({
          id: data.id,
          name: data.name,
          dimensions: data.dimensions,
          elements: data.elements || [],
        });

        const [width, height] = (data.dimensions || '30x30').split('x').map(Number);
        setMapDimensions({ width, height });
        setElements(data.elements || []);
      } catch (error) {
        console.error("Failed to load space:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpace();
  }, [spaceId, setCurrentSpace]);

  // WebSocket connection
  useEffect(() => {
    if (!spaceId || !token || loading) return;

    const connectWebSocket = async () => {
      try {
        await wsService.connect(`ws://localhost:3001`);
        wsService.joinSpace(spaceId, token);
        setConnected(true);
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setConnected(false)
      }
    };

    connectWebSocket();

    return () => {
      wsService.disconnect();
    };
  }, [spaceId, token, loading, mapDimensions, setCurrentUserPosition]);

  // WebSocket event handlers
  useEffect(() => {
    const handleSpaceJoined = (payload: SpaceJoinedPayload) => {
      setCurrentUserPosition(payload.spawn.x, payload.spawn.y);
      lastMoveRef.current = { x: payload.spawn.x, y: payload.spawn.y };
      
      const allUsers = payload.users.map((u) => ({
        id: u.id,
        x: u.x,
        y: u.y,
        userId: u.userId,
      }));
      setUsers(allUsers);
      setOnlineUsers(allUsers);
    };

    const handleUserJoin = (payload: UserJoinPayload) => {
      const newUser = {
        id: payload.id,
        x: payload.x,
        y: payload.y,
        userId: payload.userId,
      };
      
      // Check if user already exists to prevent duplicates
      setUsers(prev => {
        if (prev.some(u => u.id === payload.id)) {
          return prev;
        }
        return [...prev, newUser];
      });
      
      setOnlineUsers(prev => {
        if (prev.some(u => u.id === payload.id)) {
          return prev;
        }
        return [...prev, newUser];
      });
      
      // Show notification when user joins
      addNotification('user-join', payload.userId || 'User');
    };

    const handleMovement = (payload: MovementPayload) => {
      // Update both users array and onlineUsers array
      setUsers(prev => prev.map(u => 
        u.id === payload.id ? { ...u, x: payload.x, y: payload.y } : u
      ));
      setOnlineUsers(prev => prev.map(u => 
        u.id === payload.id ? { ...u, x: payload.x, y: payload.y } : u
      ));
    };

    const handleMovementRejected = () => {
      setCurrentUserPosition(lastMoveRef.current.x, lastMoveRef.current.y);
    };

    const handleUserLeft = (payload: UserLeftPayload) => {
      // Find user before removing to get their username
      const user = users.find(u => u.id === payload.id);
      
      setUsers(prev => prev.filter(u => u.id !== payload.id));
      setOnlineUsers(prev => prev.filter(u => u.id !== payload.id));
      
      // Show notification when user leaves
      if (user) {
        addNotification('user-leave', user.userId || 'User');
      }
    };

    wsService.on('space-joined', handleSpaceJoined);
    wsService.on('user-join', handleUserJoin);
    wsService.on('movement', handleMovement);
    wsService.on('movement-rejected', handleMovementRejected);
    wsService.on('user-left', handleUserLeft);

    return () => {
      wsService.off('space-joined', handleSpaceJoined as (p: unknown) => void);
      wsService.off('user-join', handleUserJoin as (p: unknown) => void);
      wsService.off('movement', handleMovement as (p: unknown) => void);
      wsService.off('movement-rejected', handleMovementRejected as (p: unknown) => void);
      wsService.off('user-left', handleUserLeft as (p: unknown) => void);
    };
  }, [users]);

  // Keyboard movement
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
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

      if (newX < 0 || newX >= mapDimensions.width || newY < 0 || newY >= mapDimensions.height) {
        return;
      }

      lastMoveRef.current = { ...currentUserPosition };
      setCurrentUserPosition(newX, newY);

      if (wsService.isConnected()) {
        wsService.move(newX, newY);
      }
    },
    [connected, currentUserPosition, mapDimensions, setCurrentUserPosition]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Send chat request
  const sendChatRequest = (targetUserId: string) => {
    const username = userId || 'User';
    setChatRequests(prev => new Map(prev).set(targetUserId, {
      fromUserId: userId || '',
      fromUsername: username,
      status: 'pending'
    }));
  };

  // Accept chat request
  const acceptChatRequest = (fromUserId: string) => {
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

  // Reject chat request
  const rejectChatRequest = (fromUserId: string) => {
    setChatRequests(prev => {
      const updated = new Map(prev);
      const request = updated.get(fromUserId);
      if (request) {
        updated.set(fromUserId, { ...request, status: 'rejected' });
      }
      return updated;
    });
  };

  // Toggle mute user
  const toggleMuteUser = (targetUserId: string) => {
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

  // Send message
  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: userId || 'anonymous',
      username: userId || 'Anonymous',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">
                {currentSpace?.name || 'Virtual Space'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {currentSpace?.dimensions || `${mapDimensions.width}x${mapDimensions.height}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground font-medium">{onlineUsers.length}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(!showChat)}
              className="relative"
            >
              <MessageCircle className="w-5 h-5" />
              {messages.length > 0 && !showChat && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-card border border-border rounded-lg shadow-lg p-3 animate-in slide-in-from-right pointer-events-auto"
          >
            <div className="flex items-center gap-2">
              {notification.type === 'user-join' ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {notification.username} joined
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Welcome to the space!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {notification.username} left
                    </p>
                    <p className="text-xs text-muted-foreground">
                      User disconnected
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Game Canvas */}
      <div
        ref={containerRef}
        className={cn(
          "fixed inset-0 top-14 overflow-hidden bg-background transition-all",
          showChat ? "right-80" : "right-0"
        )}
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
          {/* Grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
            }}
          />

          {/* Map Elements */}
          {elements.map((element) => (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: element.x * TILE_SIZE,
                top: element.y * TILE_SIZE,
                width: (element.width || 1) * TILE_SIZE,
                height: (element.height || 1) * TILE_SIZE,
              }}
            >
              {element.imageUrl ? (
                <img
                  src={element.imageUrl}
                  alt=""
                  className="w-full h-full object-cover pixel-grid"
                />
              ) : (
                <div className="w-full h-full bg-secondary/50 rounded" />
              )}
            </div>
          ))}

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
                  <div className={cn(
                    "w-10 h-10 rounded-full bg-accent overflow-hidden border-2",
                    isNearby ? "border-green-500 ring-2 ring-green-500/50" : "border-accent"
                  )}>
                    <img
                      src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.userId}`}
                      alt=""
                      className="w-full h-full pixel-grid"
                    />
                  </div>

                  {/* Username */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-card/90 rounded text-xs text-foreground border border-border">
                      {user.userId || 'User'}
                    </span>
                  </div>

                  {/* Chat request button for nearby users */}
                  {isNearby && !hasAcceptedChat && (
                    <button
                      onClick={() => sendChatRequest(user.userId)}
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary hover:bg-primary/90 rounded text-xs text-primary-foreground flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      Chat
                    </button>
                  )}

                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
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
            <div className="relative w-full h-full flex items-center justify-center animate-float">
              <div className="w-10 h-10 rounded-full bg-primary overflow-hidden border-2 border-primary glow-blue">
                <img
                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatarId || userId || 'me'}`}
                  alt=""
                  className="w-full h-full pixel-grid"
                />
              </div>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-2 py-0.5 bg-primary rounded text-xs text-primary-foreground font-medium">
                  You
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="fixed top-14 right-0 bottom-0 w-80 bg-card border-l border-border flex flex-col z-40">
          {/* Chat Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Space Chat</h3>
              <p className="text-xs text-muted-foreground">
                {onlineUsers.length} online
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Pending Chat Requests */}
          {pendingRequests.length > 0 && (
            <div className="p-3 bg-muted/50 border-b border-border space-y-2">
              {pendingRequests.map(([targetUserId, request]) => (
                <div key={targetUserId} className="p-2 bg-card rounded-lg border border-border">
                  <p className="text-sm text-foreground mb-2">
                    <span className="font-medium">{request.fromUsername}</span> wants to chat
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptChatRequest(request.fromUserId)}
                      className="flex-1"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectChatRequest(request.fromUserId)}
                      className="flex-1"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">
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
                      className={cn(
                        "flex gap-2",
                        isOwnMessage ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-accent overflow-hidden flex-shrink-0">
                        <img
                          src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${msg.userId}`}
                          alt=""
                          className="w-full h-full"
                        />
                      </div>
                      <div className={cn("flex-1", isOwnMessage ? "text-right" : "text-left")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-foreground">
                            {msg.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isOwnMessage && (
                            <button
                              onClick={() => toggleMuteUser(msg.userId)}
                              className="ml-auto"
                            >
                              {mutedUsers.has(msg.userId) ? (
                                <VolumeX className="w-3 h-3 text-muted-foreground" />
                              ) : (
                                <Volume2 className="w-3 h-3 text-muted-foreground" />
                              )}
                            </button>
                          )}
                        </div>
                        <div
                          className={cn(
                            "inline-block px-3 py-2 rounded-2xl text-sm",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-foreground"
                          )}
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
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-center pointer-events-none">
        <div className="px-4 py-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            Use <span className="text-foreground font-medium">Arrow Keys</span> or{' '}
            <span className="text-foreground font-medium">WASD</span> to move • Get close to users to chat
          </p>
        </div>
      </div>
    </div>
  );
};

export default Arena;