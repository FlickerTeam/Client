import type { JSX } from 'react';
import { del, logger, post, useGuildChannelMemoryStore } from 'shared';

import { useModal } from '@/layering/modalContext';

export const ConfirmationDeleteModal = ({
  id,
  type,
}: {
  id: string;
  type: string;
}): JSX.Element => {
  const { closeModal } = useModal();
  const currentChannelId = useGuildChannelMemoryStore((s) => s.currentChannelId);

  const deleteGuild = async (id: string): Promise<boolean> => {
    try {
      await post(`/guilds/${id}/delete`, {});

      closeModal();
      return true;
    } catch (error) {
      closeModal();

      logger.error(`CONFIRM_DELETE`, 'Failed to delete guild', error);
      return false;
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await del(`/channels/${currentChannelId ?? ''}/messages/${id}`);

      closeModal();
      return true;
    } catch (error) {
      closeModal();

      logger.error(`CONFIRM_DELETE`, 'Failed to delete message', error);
      return false;
    }
  };

  const deletePlace = (id: string, type: string) => {
    if (type === 'server') {
      return deleteGuild(id);
    } //handle group dms, cuz like how else would you leave something
    else if (type === 'message') {
      return deleteMessage(id);
    }

    return;
  };

  return (
    <div className='confirmation-leave-modal'>
      <p>Are you sure you want to delete this {type}?</p>
      <p>
        <b>Once it&rsquo;s gone, it&rsquo;s gone.</b>
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
          onClick={() => void deletePlace(id, type)}
          style={{
            backgroundColor: 'var(--bg-dnd)',
            color: 'white',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
