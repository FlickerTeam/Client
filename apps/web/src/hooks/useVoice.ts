import { useCallback, useRef, useState } from 'react';
import type { Channel } from 'shared';
import { logger } from 'shared';

import { useGateway } from '@/context/gatewayContext';

interface VoiceGatewayPayload {
  op: number;
  d: Record<string, unknown>;
}

interface GatewayVoiceStateDetail {
  user_id?: string;
  session_id?: string;
}

interface GatewayVoiceServerDetail {
  token?: string;
  endpoint?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseVoiceGatewayPayload = (raw: string): VoiceGatewayPayload | null => {
  const parsed: unknown = JSON.parse(raw);

  if (!isRecord(parsed) || typeof parsed.op !== 'number' || !isRecord(parsed.d)) {
    return null;
  }

  return {
    op: parsed.op,
    d: parsed.d,
  };
};

export interface UseVoiceReturn {
  connectToVoice: (guildId: string | null, channel: Channel) => void;
  disconnect: () => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  remoteStreams: Map<string, MediaStream>;
  channel: Channel | null;
}

export const useVoice = (): UseVoiceReturn => {
  const { sendOp, user } = useGateway();
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeGuildId, setActiveGuildId] = useState<string | null>(null);

  const voiceSocket = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<{ sessionId?: string; token?: string; endpoint?: string }>({});

  //const webrtcP2P = JSON.parse(localStorage.getItem('developerSettings') ?? '{}').webrtc_p2p ?? false;

  let readyToSpeak = false;
  let cachedSsrc = 0;

  const getSsrc = () => {
    if (cachedSsrc) return cachedSsrc;

    const sdp = pcRef.current?.localDescription?.sdp;
    if (!sdp) return 0;

    const match = /a=ssrc:(\d+)/.exec(sdp);
    if (match?.[1]) {
      cachedSsrc = parseInt(match[1], 10);

      return cachedSsrc;
    }

    return 0;
  };

  const getOpusPayloadType = () => {
    const sdp = pcRef.current?.localDescription?.sdp;
    if (!sdp) return 111;

    const match = /a=rtpmap:(\d+)\s+opus\/48000\/2/i.exec(sdp);
    if (!match?.[1]) return 111;

    return parseInt(match[1], 10);
  };

  const transformSDP = (sdp: string): string | null => {
    const pc = pcRef.current;

    if (!pc?.localDescription) return null;

    const localSdp = pc.localDescription.sdp;
    const midMatch = /a=mid:(\S+)/i.exec(localSdp);
    const mid = midMatch ? midMatch[1] : '0';
    const opusPayload = getOpusPayloadType();

    const discordLines = sdp
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean);
    const ssrcLines = discordLines.filter((l) => l.startsWith('a=ssrc:'));
    const msidLine = discordLines.find((l) => l.startsWith('a=msid:'));

    const discordConn = discordLines.find((l: string) => l.startsWith('c=IN'));
    const iceUfrag = discordLines.find((l: string) => l.startsWith('a=ice-ufrag'));
    const icePwd = discordLines.find((l: string) => l.startsWith('a=ice-pwd'));
    const iceCandidates = discordLines.filter((l: string) => l.startsWith('a=candidate'));
    const remoteFingerprint = discordLines
      .find((l) => l.includes('a=fingerprint:sha-256'))
      ?.split(' ')
      .pop();

    const session = ['v=0', 'o=- 0 0 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=msid-semantic: WMS *'];

    const media = [
      `m=audio 9 UDP/TLS/RTP/SAVPF ${String(opusPayload)}`,
      discordConn || 'c=IN IP4 0.0.0.0',
      'a=rtcp-mux',
      `a=mid:${mid ?? '0'}`,
      `a=rtpmap:${String(opusPayload)} opus/48000/2`,
      `a=fmtp:${String(opusPayload)} minptime=10;useinbandfec=1`,
      'a=setup:active',
      `a=fingerprint:sha-256 ${remoteFingerprint ?? ''}`,
      iceUfrag,
      icePwd,
      ...iceCandidates,
      ...ssrcLines,
      msidLine,
    ].filter(Boolean);

    return [...session, ...media].join('\r\n') + '\r\n';
  };

  const handleVoiceReady = useCallback(async () => {
    const vs = voiceSocket.current;
    if (!vs) return;

    const pc = new RTCPeerConnection({
      rtcpMuxPolicy: 'require',
      iceServers: [],
    });

    pcRef.current = pc;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    localStreamRef.current = stream;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let isSpeaking = false;

    const checkVolume = async (): Promise<void> => {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (voiceSocket.current?.readyState !== WebSocket.OPEN) {
        void audioContext.close();
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const currentlySpeaking = volume > 10;

      if (currentlySpeaking !== isSpeaking && readyToSpeak) {
        isSpeaking = currentlySpeaking;

        window.dispatchEvent(
          new CustomEvent('ui_vc_member_speaking', {
            detail: { userId: user?.id, speaking: isSpeaking },
          }),
        );

        if (voiceSocket.current?.readyState === WebSocket.OPEN) {
          voiceSocket.current.send(
            JSON.stringify({
              op: 5,
              d: {
                speaking: isSpeaking ? 1 : 0,
                delay: 0,
                ssrc: getSsrc(),
              },
            }),
          );
        }
      }

      requestAnimationFrame(() => {
        void checkVolume();
      });
    };

    void checkVolume();

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected') {
        logger.info('WEBRTC', 'ICE Connected');
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      const audio = new Audio();

      audio.srcObject = remoteStream;
      void audio.play();

      setRemoteStreams((prev) => new Map(prev).set(event.track.id, remoteStream));
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    vs.send(
      JSON.stringify({
        op: 1,
        d: {
          protocol: 'webrtc',
          data: offer.sdp,
          sdp: offer.sdp,
          codecs: [
            {
              name: 'opus',
              type: 'audio',
              priority: 1000,
              payload_type: getOpusPayloadType(),
            },
          ],
        },
      }),
    );
  }, [user?.id]);

  const tryConnectVoiceSocket = useCallback(() => {
    const { sessionId, token, endpoint } = sessionRef.current;
    if (!sessionId || !token || !endpoint) return;

    const url = `ws://${endpoint}/?v=3`;
    const vs = new WebSocket(url);

    voiceSocket.current = vs;

    vs.onopen = () => {
      vs.send(
        JSON.stringify({
          op: 0,
          d: {
            server_id: activeGuildId,
            user_id: user?.id,
            session_id: sessionId,
            token: token,
            video: false,
          },
        }),
      );
    };

    vs.onmessage = async (e) => {
      if (typeof e.data !== 'string') return;
      const payload = parseVoiceGatewayPayload(e.data);
      if (!payload) return;

      const { op, d } = payload;

      if (op === 2) {
        await handleVoiceReady();
      }

      if (op === 4) {
        const pc = pcRef.current;

        if (!pc?.localDescription) return;

        const fullSdp = transformSDP(typeof d.sdp === 'string' ? d.sdp : '');
        if (!fullSdp) return;

        try {
          await pc.setRemoteDescription({
            type: 'answer',
            sdp: fullSdp,
          });

          if (voiceSocket.current?.readyState === WebSocket.OPEN) {
            voiceSocket.current.send(
              JSON.stringify({
                op: 12,
                d: {
                  audio_ssrc: getSsrc(),
                  video_ssrc: 0,
                  rtx_ssrc: 0,
                  streams: [],
                },
              }),
            );

            readyToSpeak = true;
            logger.info('WEBRTC', `Connected with Audio SSRC: ${String(getSsrc())}`);
            setConnectionStatus('connected');
          }
        } catch (err) {
          logger.error('WEBRTC', 'SDP transformation failed', err);
        }
      }

      if (op === 5) {
        window.dispatchEvent(
          new CustomEvent('ui_vc_member_speaking', {
            detail: {
              userId: typeof d.user_id === 'string' ? d.user_id : '',
              speaking: Boolean(d.speaking),
            },
          }),
        );
      }

      if (op === 8) {
        const heartbeatInterval =
          typeof d.heartbeat_interval === 'number' ? d.heartbeat_interval : null;

        if (!heartbeatInterval) return;

        setInterval(() => {
          if (voiceSocket.current?.readyState === WebSocket.OPEN) {
            voiceSocket.current.send(
              JSON.stringify({
                op: 3,
                d: Date.now(),
              }),
            );
          }
        }, heartbeatInterval);
      }

      if (op === 12 && typeof d.user_id === 'string') {
        const audioSsrc =
          typeof d.audio_ssrc === 'string' || typeof d.audio_ssrc === 'number'
            ? d.audio_ssrc
            : 'unknown';

        logger.info('WEBRTC', `UserID: ${d.user_id} joined with ${String(audioSsrc)} audio_ssrc`);
      }
    };
  }, [activeGuildId, handleVoiceReady, user?.id]);

  const connectToVoice = useCallback(
    (guildId: string | null, channel: Channel) => {
      if (activeChannel?.id === channel.id) return;

      setConnectionStatus('connecting');
      setActiveChannel(channel);
      setActiveGuildId(guildId);

      const onVoiceState = (e: Event) => {
        const detail = (e as CustomEvent<GatewayVoiceStateDetail>).detail;
        if (detail.user_id === user?.id && detail.session_id) {
          sessionRef.current.sessionId = detail.session_id;
          tryConnectVoiceSocket();
        }
      };

      const onVoiceServer = (e: Event) => {
        const detail = (e as CustomEvent<GatewayVoiceServerDetail>).detail;
        sessionRef.current.token = detail.token;
        sessionRef.current.endpoint = detail.endpoint;
        tryConnectVoiceSocket();
      };

      window.addEventListener('gateway_voice_state', onVoiceState);
      window.addEventListener('gateway_voice_server', onVoiceServer);

      if (sendOp) {
        sendOp(4, {
          guild_id: guildId,
          channel_id: channel.id,
          self_mute: false,
          self_deaf: false,
        });
      }
    },
    [activeChannel, sendOp, tryConnectVoiceSocket, user?.id],
  );

  const disconnect = useCallback(() => {
    voiceSocket.current?.close();
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => {
      t.stop();
    });

    setConnectionStatus('disconnected');
    setActiveChannel(null);
    setRemoteStreams(new Map());
  }, []);

  return { connectToVoice, disconnect, connectionStatus, remoteStreams, channel: activeChannel };
};
