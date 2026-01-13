import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { avatarAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
}

const AvatarSelect: React.FC = () => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { setAvatarId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchAvatars();
  }, []);

  const fetchAvatars = async () => {
    try {
      const response = await avatarAPI.getAll();
      setAvatars(response.data.avatars || response.data);
    } catch (error) {
      // Mock avatars for demo
      setAvatars([
        { id: '1', name: 'Neo Ninja', imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=NeoNinja_91' },
        { id: '2', name: 'Astro Kid', imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=AstroKid_42' },
        { id: '3', name: 'Glitch Lord', imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=GlitchLord_77' },
        { id: '4', name: 'Cyber Witch', imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=CyberWitch_13' },
        { id: '5', name: 'Pixel Pirate', imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=PixelPirate_55' },
        { id: '6', name: 'Robo Monk', imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=RoboMonk_29' },
        { id: '7', name: 'Shadow Bot', imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=ShadowBot_68' },
        { id: '8', name: 'Neon Ghost', imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=NeonGhost_94' },
      ]);

    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvatar = async () => {
    if (!selectedAvatar) {
      toast({
        title: 'Select an avatar',
        description: 'Please choose an avatar to continue.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      await avatarAPI.updateUserMetadata(selectedAvatar);
      setAvatarId(selectedAvatar);

      toast({
        title: 'Avatar selected!',
        description: 'Your avatar has been saved.',
      });

      navigate('/api/v1/dashboard');
    } catch (error) {
      // For demo, proceed anyway
      setAvatarId(selectedAvatar);
      navigate('/api/v1/dashboard');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Gamepad2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground glow-text-blue">
            Choose Your Avatar
          </h1>
          <p className="text-muted-foreground mt-2">
            Select your virtual identity in the metaverse
          </p>
        </div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar.id)}
              className={cn(
                'game-panel p-4 transition-all duration-300 hover:scale-105 relative group',
                selectedAvatar === avatar.id
                  ? 'border-primary glow-blue'
                  : 'hover:border-primary/50'
              )}
            >
              {selectedAvatar === avatar.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              <div className="aspect-square rounded-lg bg-secondary overflow-hidden mb-3">
                <img
                  src={avatar.imageUrl}
                  alt={avatar.name}
                  className="w-full h-full object-cover pixel-grid"
                />
              </div>

              <p className="text-sm font-medium text-foreground text-center truncate">
                {avatar.name}
              </p>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSelectAvatar}
            disabled={!selectedAvatar || saving}
            className="px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground glow-blue"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelect;
