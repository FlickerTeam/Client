import LoadingScreen from './loading';
import { GatewayContextType, useGateway } from '../context/gateway';
import { JSX, useEffect, useState } from 'react';
import GuildSidebar from '../components/chat/guildsidebar';
import ChatArea from '../components/chat/chatarea';
import MemberList from '../components/chat/memberlist';
import ChannelSidebar from '../components/chat/channelsidebar';
import { useNavigate, useParams } from 'react-router-dom';
import Settings from '../components/chat/settings';
import { Guild } from '../interfaces/guild';
import { Channel } from '../interfaces/channel';

const ChatApp = (): JSX.Element => {
    const { isReady, guilds, user, user_settings, requestMembers }: GatewayContextType = useGateway();
    const { guildId, channelId } = useParams();
    const navigate = useNavigate();
    const [showSettings, setShowSettings] = useState(false);
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
        const handleNewGuild = (event: any) => {
            const newGuild = event.detail;

            setPassedGuilds(prev => {
                if (prev.some(x => x.id === newGuild.id)) return prev;

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

            setPassedGuilds(prev => prev.filter(guild => guild.id !== deletedId));

            if (window.location.pathname.includes(deletedId)) {
                navigate('/channels/@me');
            }
        };

        window.addEventListener('gateway_guild_create', handleNewGuild);
        window.addEventListener('gateway_guild_delete', handleGuildRemove);

        return () => {
            window.removeEventListener('gateway_guild_create', handleNewGuild);
            window.removeEventListener('gateway_guild_delete', handleGuildRemove);
        };
    }, []);

    if (!isReady) {
        return <LoadingScreen />;
    }

    const selectedGuild = passedGuilds.find(g => g.id === guildId) || null;
    const selectedChannel = selectedGuild?.channels?.find(c => c.id === channelId) || null;

    const handleSelectGuild = (guild: Guild) => {
        navigate(`/channels/${guild.id}`);
    };

    const handleSelectChannel = (channel: Channel) => {
        navigate(`/channels/${guildId}/${channel.id}`);
    };

    return (
        <div className="page-wrapper">
            {showSettings && (
                <Settings user={user} onClose={() => setShowSettings(false)}></Settings>
            )}

            {!showSettings && (
                <div className='chat-layout'>
                    <GuildSidebar
                        guilds={passedGuilds}
                        selectedGuildId={guildId}
                        onSelectGuild={handleSelectGuild}
                    />
                    <ChannelSidebar selectedGuild={selectedGuild} selectedChannel={selectedChannel} onSelectChannel={handleSelectChannel} user={user} onSettingsClicked={() => setShowSettings(true)} status={user_settings.status || "online"} />
                    <ChatArea selectedChannel={selectedChannel} />
                    <MemberList selectedGuild={selectedGuild} selectedChannel={selectedChannel} />
                </div>
            )}

        </div>
    );
};

export default ChatApp;