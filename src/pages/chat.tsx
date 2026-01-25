import { type JSX, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { Channel } from '@/types/channel';
import type { GatewayContextType } from '@/types/gateway';
import type { Guild } from '@/types/guild';

import ChannelSidebar from '../components/chat/channelSidebar';
import ChatArea from '../components/chat/chatArea';
import { FriendsList } from '../components/chat/friendsList';
import GuildSidebar from '../components/chat/guildSidebar';
import MemberList from '../components/chat/memberList';
import Settings from '../components/chat/settings';
import { useGateway } from '../context/gateway';
import LoadingScreen from './loading';

const ChatApp = (): JSX.Element => {
  const {
    isReady,
    guilds,
    user,
    user_settings,
    relationships,
    requestMembers,
  }: GatewayContextType = useGateway();
  const { guildId, channelId } = useParams();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [localFriends, setLocalFriends] = useState<any[] | []>([]);
  const [passedGuilds, setPassedGuilds] = useState<Guild[]>([]);

  useEffect(() => {
    if (isReady && guildId && channelId && requestMembers) {
      requestMembers(guildId, channelId);
    }
  }, [guildId, channelId, isReady]);

  useEffect(() => {
    if (guilds && guilds.length > 0) {
      setPassedGuilds(guilds);
    }
  }, [guilds]);

  useEffect(() => {
    if (relationships) {
      setLocalFriends(relationships);
    }
  }, [relationships]);

  useEffect(() => {
    const handleNewGuild = (event: any) => {
      const newGuild = event.detail;

      setPassedGuilds((prev) => {
        if (prev.some((x) => x.id === newGuild.id)) return prev;

        const firstTextChannel = newGuild.channels?.find((c: any) => c.type === 0);

        if (firstTextChannel) {
          navigate(`/channels/${newGuild.id}/${firstTextChannel.id}`);
        } else {
          navigate(`/channels/${newGuild.id}`);
        }

        return [...prev, newGuild];
      });
    };

    const handleGuildRemove = (event: any) => {
      const deletedId = event.detail.id;

      setPassedGuilds((prev) => prev.filter((guild) => guild.id !== deletedId));

      if (window.location.pathname.includes(deletedId)) {
        navigate('/channels/@me');
      }
    };

    const handleRelationshipAdd = (event: any) => {
      const newRelationship = event.detail;

      setLocalFriends((prev) => {
        if (prev.some((f) => f.id === newRelationship.id)) {
          return prev.map((f) => (f.id === newRelationship.id ? newRelationship : f));
        }

        return [...prev, newRelationship];
      });
    };

    const handleRelationshipRemove = (event: any) => {
      const removedRelationship = event.detail;

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
  }, []);

  const handleManualRemoveFriend = (userId: string) => {
    setLocalFriends((prev) => prev.filter((f) => f.id !== userId));
  };

  const handleManualUpdateFriend = (updatedFriend: any) => {
    setLocalFriends((prev) => prev.map((f) => (f.id === updatedFriend.id ? updatedFriend : f)));
  };

  if (!isReady) {
    return <LoadingScreen />;
  }

  const selectedGuild = passedGuilds.find((g) => g.id === guildId) || null;
  const selectedChannel = selectedGuild?.channels?.find((c) => c.id === channelId) || null;

  const handleSelectGuild = (guild: Guild) => {
    navigate(`/channels/${guild.id}`);
  };

  const handleSelectChannel = (channel: Channel) => {
    navigate(`/channels/${guildId}/${channel.id}`);
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
            user={user}
            onSettingsClicked={() => {
              setShowSettings(true);
            }}
            status={user_settings.status || 'online'}
            relationships={relationships}
          />

          {selectedChannel ? (
            <ChatArea selectedChannel={selectedChannel} />
          ) : !selectedGuild ? (
            <FriendsList
              friends={localFriends}
              onRequestUpdate={handleManualUpdateFriend}
              onRequestDelete={handleManualRemoveFriend}
            />
          ) : (
            <></>
          )}
          <MemberList selectedGuild={selectedGuild} selectedChannel={selectedChannel} />
        </div>
      )}
    </div>
  );
};

export default ChatApp;
