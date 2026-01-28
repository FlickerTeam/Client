import { type JSX, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { Channel } from '@/types/channel';
import type { GatewayContextSchema } from '@/types/gatewayContext';
import type { Guild } from '@/types/guilds';
import type { Relationship } from '@/types/relationship';

import ChannelSidebar from '../components/chat/channelSidebar';
import { FriendsList } from '../components/chat/friendsList';
import GuildSidebar from '../components/chat/guildSidebar';
import MainContent from '../components/chat/mainContent';
import Settings from '../components/chat/settings';
import { useGateway } from '../context/gatewayContext';
import LoadingScreen from './loading';

const ChatApp = (): JSX.Element => {
  const { isReady, guilds, user, relationships, requestMembers }: GatewayContextSchema =
    useGateway();
  const { guildId, channelId } = useParams();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [localFriends, setLocalFriends] = useState<Relationship[] | []>([]);
  const [passedGuilds, setPassedGuilds] = useState<Guild[]>([]);

  useEffect(() => {
    if (isReady && guildId && channelId && requestMembers) {
      requestMembers(guildId, channelId);
    }
  }, [guildId, channelId, isReady, requestMembers]);

  useEffect(() => {
    if (guilds.length > 0) {
      setPassedGuilds(guilds);
    }
  }, [guilds]);

  useEffect(() => {
    setLocalFriends(relationships);
  }, [relationships]);

  useEffect(() => {
    const handleNewGuild = (event: Event) => {
      const newGuild = (event as CustomEvent<Guild>).detail;

      setPassedGuilds((prev) => {
        if (prev.some((x) => x.id === newGuild.id)) return prev;

        const firstTextChannel = newGuild.channels.find((c: Channel) => c.type === 0);

        if (firstTextChannel) {
          void navigate(`/channels/${newGuild.id}/${firstTextChannel.id}`);
        } else {
          void navigate(`/channels/${newGuild.id}`);
        }

        return [...prev, newGuild];
      });
    };

    const handleGuildRemove = (event: Event) => {
      const deletedId = (event as CustomEvent<Guild>).detail.id;

      setPassedGuilds((prev) => prev.filter((guild) => guild.id !== deletedId));

      if (window.location.pathname.includes(deletedId)) {
        void navigate('/channels/@me');
      }
    };

    const handleRelationshipAdd = (event: Event) => {
      const newRelationship = (event as CustomEvent<Relationship>).detail;

      setLocalFriends((prev) => {
        if (prev.some((f) => f.id === newRelationship.id)) {
          return prev.map((f) => (f.id === newRelationship.id ? newRelationship : f));
        }

        return [...prev, newRelationship];
      });
    };

    const handleRelationshipRemove = (event: Event) => {
      const removedRelationship = (event as CustomEvent<Relationship>).detail;

      setLocalFriends((prev) => prev.filter((f) => f.id !== removedRelationship.id));
    };

    window.addEventListener('gateway_relationship_add', handleRelationshipAdd);
    window.addEventListener('gateway_relationship_remove', handleRelationshipRemove);
    window.addEventListener('gateway_guild_create', handleNewGuild);
    window.addEventListener('gateway_guild_delete', handleGuildRemove);

    return () => {
      window.removeEventListener('gateway_guild_create', handleNewGuild);
      window.removeEventListener('gateway_guild_delete', handleGuildRemove);
      window.removeEventListener('gateway_relationship_add', handleRelationshipAdd);
      window.removeEventListener('gateway_relationship_remove', handleRelationshipRemove);
    };
  }, [navigate]);

  const handleManualRemoveFriend = (userId: string) => {
    setLocalFriends((prev) => prev.filter((f) => f.id !== userId));
  };

  const handleManualUpdateFriend = (updatedFriend: Relationship) => {
    setLocalFriends((prev) => prev.map((f) => (f.id === updatedFriend.id ? updatedFriend : f)));
  };

  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettings(true);
    };

    window.addEventListener('ui_open_settings', handleOpenSettings);

    return () => {
      window.removeEventListener('ui_open_settings', handleOpenSettings);
    };
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  const selectedGuild = passedGuilds.find((g) => g.id === guildId) ?? null;
  const selectedChannel = selectedGuild?.channels.find((c) => c.id === channelId) ?? null;

  const handleSelectGuild = (guild: Guild) => {
    void navigate(`/channels/${guild.id}`);
  };

  const handleSelectChannel = (channel: Channel | null) => {
    void navigate(`/channels/${guildId ?? ''}/${channel?.id ?? ''}`);
  };

  return (
    <div className='page-wrapper'>
      {showSettings && (
        <Settings
          user={user}
          onClose={() => {
            setShowSettings(false);
          }}
        ></Settings>
      )}

      {!showSettings && (
        <div className='chat-layout'>
          <GuildSidebar
            guilds={passedGuilds}
            selectedGuildId={guildId}
            onSelectGuild={handleSelectGuild}
          />
          <ChannelSidebar
            selectedGuild={selectedGuild}
            selectedChannel={selectedChannel}
            onSelectChannel={handleSelectChannel}
            onSettingsClicked={() => {
              setShowSettings(true);
            }}
            relationships={relationships}
          />

          {selectedChannel && selectedGuild ? (
            <MainContent selectedChannel={selectedChannel} selectedGuild={selectedGuild} />
          ) : !selectedGuild ? (
            <FriendsList
              friends={localFriends}
              onRequestUpdate={handleManualUpdateFriend}
              onRequestDelete={handleManualRemoveFriend}
            />
          ) : (
            <div className='empty-chat-state' />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatApp;
