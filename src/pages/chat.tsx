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
    const [cdnUrl, setCdnUrl] = useState("");
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        setCdnUrl(localStorage.getItem("selectedCdnUrl")!);
    }, []);

    useEffect(() => {
        if (isReady && guildId && channelId && requestMembers) {
            console.log("Requesting members for:", guildId, channelId);
            requestMembers(guildId, channelId);
        }
    }, [guildId, channelId, isReady]);

    if (!isReady) {
        return <LoadingScreen />;
    }

    const selectedGuild = guilds.find(g => g.id === guildId) || null;
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
                        guilds={guilds}
                        cdnUrl={cdnUrl}
                        selectedGuildId={guildId}
                        onSelectGuild={handleSelectGuild}
                    />
                    <ChannelSidebar selectedGuild={selectedGuild} selectedChannel={selectedChannel} onSelectChannel={handleSelectChannel} user={user} onSettingsClicked={() => setShowSettings(true)} status={user_settings.status || "online"}/>
                    <ChatArea selectedChannel={selectedChannel} />
                    <MemberList selectedGuild={selectedGuild} selectedChannel={selectedChannel} cdnUrl={cdnUrl} />
                </div>
            )}

        </div>
    );
};

export default ChatApp;