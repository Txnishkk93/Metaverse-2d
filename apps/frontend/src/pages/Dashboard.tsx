import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { spaceAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Plus,
  Trash2,
  LogOut,
  Grid3X3,
  Gamepad2,
  Users,
  Link2,
  Clock,
  UserCircle,
} from 'lucide-react';

interface Space {
  id: string;
  name: string;
  thumbnail?: string;
  dimensions: string;
}

interface RecentSpace {
  id: string;
  name: string;
  thumbnail?: string;
  dimensions: string;
  lastPlayed: Date;
  players: string[];
}

const Dashboard: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-spaces' | 'community'>('my-spaces');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDimensions, setNewSpaceDimensions] = useState('20x20');
  const [newSpaceMapId, setNewSpaceMapId] = useState('');
  const [joinSpaceId, setJoinSpaceId] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recentSpaces, setRecentSpaces] = useState<RecentSpace[]>([]);
  
  const { logout, userId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSpaces();
    fetchRecentSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const response = await spaceAPI.getAll();
      setSpaces(response.data.spaces || response.data);
    } catch (error) {
      // Mock spaces for demo
      setSpaces([
        { id: '1', name: 'Main Office', dimensions: '30x30', thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400' },
        { id: '2', name: 'Meeting Room', dimensions: '15x15', thumbnail: 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=400' },
        { id: '3', name: 'Lounge Area', dimensions: '25x20', thumbnail: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSpaces = async () => {
    try {
      // Try to fetch from API or localStorage
      const stored = localStorage.getItem(`recent_spaces_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSpaces(parsed.map((s: any) => ({
          ...s,
          lastPlayed: new Date(s.lastPlayed)
        })));
      } else {
        // Mock recent spaces for demo
        setRecentSpaces([
          {
            id: '4',
            name: 'Gaming Arena',
            dimensions: '40x40',
            thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
            lastPlayed: new Date(Date.now() - 3600000),
            players: ['Alice', 'Bob', 'Charlie']
          },
          {
            id: '5',
            name: 'Chill Zone',
            dimensions: '20x20',
            thumbnail: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400',
            lastPlayed: new Date(Date.now() - 7200000),
            players: ['David', 'Emma']
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch recent spaces:', error);
    }
  };

  const saveRecentSpace = (space: Space) => {
    try {
      const recent: RecentSpace = {
        ...space,
        lastPlayed: new Date(),
        players: [] // This would come from WebSocket in real implementation
      };

      const existing = recentSpaces.filter(s => s.id !== space.id);
      const updated = [recent, ...existing].slice(0, 10); // Keep last 10

      setRecentSpaces(updated);
      localStorage.setItem(`recent_spaces_${userId}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent space:', error);
    }
  };

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a space name.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      const response = await spaceAPI.create(newSpaceName, newSpaceDimensions, newSpaceMapId);
      setSpaces((prev) => [...prev, response.data]);
      setCreateModalOpen(false);
      setNewSpaceName('');
      setNewSpaceDimensions('20x20');
      setNewSpaceMapId('');
      
      toast({
        title: 'Space created!',
        description: 'Your new space is ready.',
      });
    } catch (error) {
      // Mock creation for demo
      const newSpace = {
        id: Date.now().toString(),
        name: newSpaceName,
        dimensions: newSpaceDimensions,
      };
      setSpaces((prev) => [...prev, newSpace]);
      setCreateModalOpen(false);
      setNewSpaceName('');
      
      toast({
        title: 'Space created!',
        description: 'Your new space is ready.',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinSpace = async () => {
    if (!joinSpaceId.trim()) {
      toast({
        title: 'Space ID required',
        description: 'Please enter a valid space ID.',
        variant: 'destructive',
      });
      return;
    }

    setJoining(true);

    try {
      // Verify space exists
      const response = await spaceAPI.getById(joinSpaceId);
      const space = response.data;
      
      saveRecentSpace(space);
      setJoinModalOpen(false);
      setJoinSpaceId('');
      navigate(`/arena/${joinSpaceId}`);
      
      toast({
        title: 'Joining space!',
        description: `Entering ${space.name}...`,
      });
    } catch (error) {
      // For demo, allow joining any ID
      setJoinModalOpen(false);
      navigate(`/arena/${joinSpaceId}`);
      setJoinSpaceId('');
      
      toast({
        title: 'Joining space!',
        description: 'Entering the space...',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteSpace = async (spaceId: string) => {
    setDeletingId(spaceId);

    try {
      await spaceAPI.delete(spaceId);
      setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
      
      toast({
        title: 'Space deleted',
        description: 'The space has been removed.',
      });
    } catch (error) {
      // Mock deletion for demo
      setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
      
      toast({
        title: 'Space deleted',
        description: 'The space has been removed.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEnterSpace = (space: Space) => {
    saveRecentSpace(space);
    navigate(`/arena/${space.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/api/v1/signin');
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-4 hidden md:block">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">MetaSpace</h1>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('my-spaces')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'my-spaces' 
                ? 'bg-secondary text-foreground' 
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
            <span>My Spaces</span>
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'community' 
                ? 'bg-secondary text-foreground' 
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Community</span>
          </button>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-8 md:hidden">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">MetaSpace</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Tab Navigation (Mobile) */}
        <div className="flex gap-2 mb-6 md:hidden">
          <Button
            variant={activeTab === 'my-spaces' ? 'default' : 'outline'}
            onClick={() => setActiveTab('my-spaces')}
            className="flex-1"
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            My Spaces
          </Button>
          <Button
            variant={activeTab === 'community' ? 'default' : 'outline'}
            onClick={() => setActiveTab('community')}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            Community
          </Button>
        </div>

        {activeTab === 'my-spaces' ? (
          <>
            {/* My Spaces Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">My Spaces</h2>
                <p className="text-muted-foreground mt-1">
                  Create and manage your virtual spaces
                </p>
              </div>

              <div className="flex gap-2">
                <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
                      <Link2 className="w-5 h-5 mr-2" />
                      Join Space
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Join Space by ID</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="spaceId">Space ID</Label>
                        <Input
                          id="spaceId"
                          placeholder="Enter space ID"
                          value={joinSpaceId}
                          onChange={(e) => setJoinSpaceId(e.target.value)}
                          className="bg-secondary"
                        />
                        <p className="text-xs text-muted-foreground">
                          Ask a friend for their space ID to join them
                        </p>
                      </div>
                      <Button
                        onClick={handleJoinSpace}
                        disabled={joining}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        {joining ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <Link2 className="mr-2 h-4 w-4" />
                            Join Space
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 glow-blue">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Space
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Create New Space</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="spaceName">Space Name</Label>
                        <Input
                          id="spaceName"
                          placeholder="Enter space name"
                          value={newSpaceName}
                          onChange={(e) => setNewSpaceName(e.target.value)}
                          className="bg-secondary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dimensions">Dimensions</Label>
                        <Input
                          id="dimensions"
                          placeholder="e.g., 20x20"
                          value={newSpaceDimensions}
                          onChange={(e) => setNewSpaceDimensions(e.target.value)}
                          className="bg-secondary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mapId">Map ID (optional)</Label>
                        <Input
                          id="mapId"
                          placeholder="Enter map ID"
                          value={newSpaceMapId}
                          onChange={(e) => setNewSpaceMapId(e.target.value)}
                          className="bg-secondary"
                        />
                      </div>
                      <Button
                        onClick={handleCreateSpace}
                        disabled={creating}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Space'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Spaces Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : spaces.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Grid3X3 className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No spaces yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create your first virtual space to get started
                </p>
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Space
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    className="game-panel overflow-hidden group hover:border-primary/50 transition-all duration-300"
                  >
                    <div
                      className="aspect-video bg-secondary relative overflow-hidden cursor-pointer"
                      onClick={() => handleEnterSpace(space)}
                    >
                      {space.thumbnail ? (
                        <img
                          src={space.thumbnail}
                          alt={space.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Grid3X3 className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <span className="text-white font-medium">Enter Space</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {space.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {space.dimensions}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ID: {space.id}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => handleDeleteSpace(space.id)}
                          disabled={deletingId === space.id}
                        >
                          {deletingId === space.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Community Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">Community</h2>
              <p className="text-muted-foreground mt-1">
                Recently played spaces and friends you've met
              </p>
            </div>

            {/* Recent Spaces */}
            {recentSpaces.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No recent activity
                </h3>
                <p className="text-muted-foreground mb-4">
                  Join or create a space to start building your community
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSpaces.map((space) => (
                  <div
                    key={space.id}
                    className="game-panel overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/arena/${space.id}`)}
                  >
                    <div className="flex gap-4 p-4">
                      <div className="w-32 h-24 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        {space.thumbnail ? (
                          <img
                            src={space.thumbnail}
                            alt={space.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Grid3X3 className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {space.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {space.dimensions}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(space.lastPlayed)}
                          </div>
                        </div>
                        
                        {space.players.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-2">
                              Played with:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {space.players.map((player, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-full"
                                >
                                  <UserCircle className="w-3 h-3 text-primary" />
                                  <span className="text-xs text-foreground">
                                    {player}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;