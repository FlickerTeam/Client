import type { JSX } from 'react';
import type { Channel } from 'shared';

import { useVoice } from '@/hooks/useVoice';
import { useModal } from '@/layering/modalContext';

export const ConfirmationConnectP2PModal = ({
  channel,
  name,
  guild_id,
}: {
  channel: Channel;
  name: string;
  guild_id?: string | null;
}): JSX.Element => {
  const { closeModal } = useModal();
  const { connectToVoice } = useVoice();

  return (
    <div className='confirmation-leave-modal'>
      <p>
        Are you sure you want to connect to the voice channel &ldquo;<b>{name}&rdquo;</b>?
      </p>
      <p>
        Since you are using webrtc-p2p, <b>others in the call will see your IP.</b>
      </p>
      <div
        className='modal-footer'
        style={{
          gap: '15px',
        }}
      >
        <button onClick={closeModal} className='primary-btn join-btn'>
          Cancel
        </button>
        <button
          className='primary-btn'
          style={{
            backgroundColor: 'var(--bg-dnd)',
            color: 'white',
          }}
          onClick={() => {
            connectToVoice(guild_id ?? null, channel);
          }}
        >
          Continue to connect
        </button>
      </div>
    </div>
  );
};
