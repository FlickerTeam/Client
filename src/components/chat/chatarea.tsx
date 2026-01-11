import { JSX, useEffect, useRef, useState } from 'react';
import { Channel } from '../../interfaces/channel';
import './chatarea.css';
import { getDefaultAvatar } from '../../utils/avatar';
import { useGateway } from '../../context/gateway';

const ChatArea = ({ selectedChannel } : {
    selectedChannel: Channel
}) : JSX.Element => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const { typingUsers, user, memberLists } = useGateway();
    const [messages, setMessages] = useState<any[]>([]);
    const [chatMessage, setChatMessage] = useState('');
    const lastTypingSent = useRef<number>(0);
    const isloadingMore = useRef(false);
    const isFirstLoad = useRef(true);

    const scrollToBottom = () => {
        if (scrollerRef.current) {
            scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async (limit: number, before?: string) => {
        const baseUrl = localStorage.getItem("selectedInstanceUrl");
        const url = `${baseUrl}/channels/${selectedChannel.id}/messages?limit=${limit}${before ? `&before=${before}` : ''}`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': localStorage.getItem("Authorization")! }
        });

        if (!response.ok) return [];

        const data = await response.json();

        return data;
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!chatMessage.trim()) return;

        const baseUrl = localStorage.getItem("selectedInstanceUrl");
        const url = `${baseUrl}/channels/${selectedChannel.id}/messages`;
        const content = chatMessage;

        setChatMessage('');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Authorization': localStorage.getItem("Authorization")!,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    content: content
                 })
            });

            if (!response.ok) {
                console.error("Failed to send message");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }

        lastTypingSent.current = 0;
    };

    const handleScroll = async () => {
        const scroller = scrollerRef.current;

        if (!scroller || messages.length === 0 || isloadingMore.current) return;

        if (scroller.scrollTop === 0) {
            isloadingMore.current = true;

            const oldestMsgId = messages[0].id;
            const prevHeight = scroller.scrollHeight;

            const olderMessages = await fetchMessages(50, oldestMsgId);

            if (olderMessages.length > 0) {
                const reversedOlder = olderMessages.reverse();

                setMessages(prev => [...reversedOlder, ...prev]);

                requestAnimationFrame(() => {
                    if (scrollerRef.current) {
                        const newHeight = scrollerRef.current.scrollHeight;
                        const heightDifference = newHeight - prevHeight;

                        scrollerRef.current.scrollTop = heightDifference;

                        setTimeout(() => {
                            isloadingMore.current = false;
                        }, 150);
                    }
                });
            } else {
                isloadingMore.current = false;
            }
        }
    };

    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);

        yesterday.setDate(yesterday.getDate() - 1);
        
        const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (msgDate.getTime() === today.getTime()) {
            return `Today at ${timeStr}`;
        } else if (msgDate.getTime() === yesterday.getTime()) {
            return `Yesterday at ${timeStr}`;
        } else {
            return `${date.toLocaleDateString()} ${timeStr}`;
        }
    };

    useEffect(() => {
        if (isFirstLoad.current && messages.length > 0) {
            scrollToBottom();
            isFirstLoad.current = false;
        }
    }, [messages]);


    useEffect(() => {
        if (!selectedChannel?.id) {
            setMessages([]);
            return;
        }

        isFirstLoad.current = true;

        setMessages([]);

        fetchMessages(50).then(data => {
            if (data && data.length > 0) {
                setMessages(data.reverse());
            }
        });
    }, [selectedChannel?.id]);

    useEffect(() => {
        const handleNewMessage = (event: any) => {
            const newMessage = event.detail;

            if (newMessage.channel_id === selectedChannel.id) {
                setMessages((prev) => {
                    if (prev.find(m => m.id === newMessage.id)) return prev;

                    return [...prev, newMessage];
                });

                scrollToBottom();
            }
        };

        window.addEventListener('gateway_message', handleNewMessage);

        return () => {
            window.removeEventListener('gateway_message', handleNewMessage);
        };
    }, [selectedChannel?.id]);


    const renderMessages = () => {
        if (messages.length === 0) {
            return (
                <div className='no-messages'>
                    <h1>There are no messages here yet!</h1>
                    <p>This is the start of something exciting!</p>
                </div>
            )
        };

        return messages.map((msg: any, index: number) => {
            const prevMsg = messages[index - 1];
            const isNewGroup = !prevMsg ||  prevMsg.author.id !== msg.author.id || new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 420000;
            const avatarUrl = msg.author?.avatar ? `${localStorage.getItem("selectedCdnUrl")!}/avatars/${msg.author.id}/${msg.author.avatar}.png` : `https://cdn.oldcordapp.com/assets/${getDefaultAvatar(msg.author)}.png`;

            if (isNewGroup) {
                return (
                    <div key={msg.id} className="message-group">
                        <img src={avatarUrl} className="avatar-img" alt="" />
                        <div className="message-details">
                            <div className="message-header">
                                <span className="author-name">{msg.author.username}</span>
                                <span className="timestamp">{formatTimestamp(msg.timestamp)}</span>
                            </div>
                            <div className="message-content">{msg.content}</div>
                        </div>
                    </div>
                );
            }

            return (
                <div key={msg.id} className="message-sub">
                    <div className="message-content">{msg.content}</div>
                </div>
            );
        });
    };

    const updateChat = (message: string) => {
        setChatMessage(message);

        let now = Date.now();

        if (now - lastTypingSent.current > 3000 && message.length > 0) {
            lastTypingSent.current = now;
            sendTypingStart();
        }
    };

    const sendTypingStart = async () => {
        const baseUrl = localStorage.getItem("selectedInstanceUrl");
        const url = `${baseUrl}/channels/${selectedChannel.id}/typing`;
        
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': localStorage.getItem("Authorization")! }
            });
        } catch (e) {
            console.error("Failed to send typing status", e);
        }
    };

    const handleTypingStatus = () => {
        if (!selectedChannel?.id) return null;

        const channelTypingMap = typingUsers[selectedChannel.id] || {};
        const typingIds = Object.keys(channelTypingMap).filter(id => id !== user?.id);

        if (typingIds.length === 0) return null;

        const names = typingIds.map(id => {
            const guildId = selectedChannel.guild_id;
            const listData = memberLists?.[guildId!];
            const items = listData?.ops.find((op: any) => op.op === "SYNC")?.items || [];
            const memberEntry = items.find((item: any) => item.member?.user.id === id);

            return memberEntry?.member.user.username || "Someone";
        });

        const reactKeyThing = names.join("-");

        if (names.length === 1) {
            return <p key={reactKeyThing}><strong>{names[0]}</strong> is typing...</p>;
        } else if (names.length === 2) {
            return <p key={reactKeyThing}><strong>{names[0]}</strong> and <strong>{names[1]}</strong> are typing...</p>;
        } else if (names.length === 3) {
            return <p key={reactKeyThing}><strong>{names[0]}</strong>, <strong>{names[1]}</strong> and <strong>{names[2]}</strong> are typing...</p>;
        } else {
            return <p key={`several-people`}>MFmgph.. so many people.. aresh typing...</p>;
        }
    }

    return selectedChannel && (
        <main className="chat-main">
            <header className="header-base"># {selectedChannel.name}{selectedChannel.topic ? ` | ${selectedChannel.topic}` : ''}</header>
            <div className="chat-view">
                <div className="messages-scroller scroller" ref={scrollerRef} onScroll={handleScroll}>
                    {renderMessages()}
                </div>
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                   <div className="input-wrapper">
                         <input type="text" placeholder={`Message #${selectedChannel.name}`} value={chatMessage} onChange={(e) => updateChat(e.target.value)}/>
                    </div>
                </form>
                <div className="typing-status-wrapper">
                    {handleTypingStatus()}
                </div>
            </div>
        </main>
    )
}

export default ChatArea;