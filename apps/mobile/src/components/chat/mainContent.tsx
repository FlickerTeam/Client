import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Channel, Guild, User } from 'shared';
import { get, type Message, MessageListSchema, post } from 'shared';

import { styles } from '../../pages/chatStyles';
import { renderMaterialIcon } from '../../utils/chatUtils';

interface MobileMessage {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface GatewayMessageCreateDetail {
  channel_id: string;
  id: string;
  content: string;
  timestamp?: string;
  author?: {
    username?: string;
    global_name?: string | null;
  };
}

interface MobileMainContentProps {
  selectedChannel?: Channel | null;
  selectedGuild: Guild | null;
  user?: User | null;
  onBack?: () => void;
}

const nowLabel = (): string =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const timestampLabel = (value?: string): string => {
  if (!value) return nowLabel();

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return nowLabel();

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toMobileMessage = (message: Message): MobileMessage => ({
  id: message.id,
  author: message.author.global_name ?? message.author.username ?? 'Unknown User',
  content: message.content ?? '',
  timestamp: timestampLabel(message.timestamp),
});

export function MobileMainContent({
  selectedChannel,
  selectedGuild,
  user,
  onBack,
}: MobileMainContentProps) {
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<MobileMessage[]>([]);
  const selectedChannelId = selectedChannel?.id;

  const channelTitle = useMemo(() => {
    if (!selectedChannel) {
      return selectedGuild?.name ?? 'Home';
    }

    return (
      selectedChannel.name ??
      selectedChannel.recipients?.[0]?.global_name ??
      selectedChannel.recipients?.[0]?.username ??
      'Direct Message'
    );
  }, [selectedChannel, selectedGuild?.name]);

  const isGuildPlaceholder = selectedGuild != null && selectedChannel == null;

  useEffect(() => {
    if (!selectedChannelId) return;

    const fetchMessages = async () => {
      try {
        const response = await get(`/channels/${selectedChannelId}/messages?limit=50`);
        const parsed = MessageListSchema.parse(response);
        const sorted = [...parsed].reverse().map(toMobileMessage);
        setMessages(sorted);
      } catch {
        setMessages([]);
      }
    };

    void fetchMessages();
  }, [selectedChannelId]);

  useEffect(() => {
    if (!selectedChannelId) return;

    const handleNewMessage = (event: CustomEvent<GatewayMessageCreateDetail>) => {
      const detail = event.detail;
      if (detail.channel_id !== selectedChannelId) return;

      const next: MobileMessage = {
        id: detail.id,
        author: detail.author?.global_name ?? detail.author?.username ?? 'Unknown User',
        content: detail.content ?? '',
        timestamp: timestampLabel(detail.timestamp),
      };

      setMessages((prev) => {
        if (prev.some((item) => item.id === next.id)) {
          return prev;
        }
        return [...prev, next];
      });
    };

    const eventName = 'gateway_message_create';
    window.addEventListener(eventName, handleNewMessage as EventListener);
    return () => {
      window.removeEventListener(eventName, handleNewMessage as EventListener);
    };
  }, [selectedChannelId]);

  const handleSend = async () => {
    if (!selectedChannel) return;

    const content = chatMessage.trim();
    if (!content) return;

    const author = user?.global_name ?? user?.username ?? 'You';

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now().toString()}`,
        author,
        content,
        timestamp: nowLabel(),
      },
    ]);
    setChatMessage('');

    try {
      await post(`/channels/${selectedChannel.id}/messages`, {
        content,
        tts: false,
      });
    } catch {
      // another placeholder catch function!!! yay!!!
    }
  };

  return (
    <View style={styles.mainContent}>
      <View style={styles.mainHeader}>
        <View style={styles.mainHeaderLeft}>
          {onBack ? (
            <TouchableOpacity style={styles.mainIconButton} onPress={onBack}>
              <Text style={styles.materialIconText}>{renderMaterialIcon('arrow_back')}</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.mainHeaderIcon}>
            {selectedGuild ? renderMaterialIcon('tag') : renderMaterialIcon('alternate_email')}
          </Text>
          <Text style={styles.mainHeaderTitle} numberOfLines={1}>
            {channelTitle}
          </Text>
        </View>
        <View style={styles.mainHeaderRight}>
          <TouchableOpacity style={styles.mainIconButton}>
            <Text style={styles.materialIconText}>{renderMaterialIcon('group')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mainIconButton}>
            <Text style={styles.materialIconText}>{renderMaterialIcon('search')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isGuildPlaceholder ? (
        <View style={styles.guildPlaceholder}>
          <Text style={styles.guildPlaceholderTitle}>
            Welcome to {selectedGuild?.name ?? 'your server'}
          </Text>
          <Text style={styles.guildPlaceholderBody}>
            Select a text channel from the sidebar to start chatting.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.messagesScroller}
            contentContainerStyle={styles.messagesScrollerContent}
          >
            {messages.map((message) => (
              <View key={message.id} style={styles.messageRow}>
                <View style={styles.messageAvatar}>
                  <Text style={styles.messageAvatarText}>
                    {message.author.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.messageBody}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageAuthor}>{message.author}</Text>
                    <Text style={styles.messageTime}>{message.timestamp}</Text>
                  </View>
                  <Text style={styles.messageContent}>{message.content}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {selectedChannel && (
            <View style={styles.chatBar}>
              <TouchableOpacity style={styles.chatAddButton}>
                <Text style={styles.materialIconText}>{renderMaterialIcon('add')}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.chatInput}
                placeholder={
                  selectedGuild
                    ? `Message #${selectedChannel.name ?? 'channel'}`
                    : `Message @${selectedChannel.recipients?.[0]?.username ?? 'someone'}`
                }
                placeholderTextColor='#767B86'
                value={chatMessage}
                onChangeText={setChatMessage}
                onSubmitEditing={() => {
                  void handleSend();
                }}
                returnKeyType='send'
              />
              <TouchableOpacity
                style={styles.chatActionButton}
                onPress={() => {
                  void handleSend();
                }}
              >
                <Text style={styles.materialIconText}>{renderMaterialIcon('send')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}
