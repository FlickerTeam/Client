import type { JSX } from 'react';
import { del } from 'shared';

import { useModal } from '@/layering/modalContext';

export const ConfirmationLeaveModal = ({
  name,
  id,
  type,
}: {
  name: string;
  id: string;
  type: string;
}): JSX.Element => {
  const { closeModal } = useModal();

  const leaveGuild = async (id: string): Promise<boolean> => {
    try {
      await del(`/guilds/${id}`);

      closeModal();
      return true;
    } catch (error) {
      closeModal();
      console.error('Failed to leave guild: ', error);
      return false;
    }
  };

  const leavePlace = async (id: string, type: string) => {
    if (type === 'server') {
      return leaveGuild(id);
    } //handle group dms, cuz like how else would you leave something

    return;
  };

  return (
    <div className='confirmation-leave-modal'>
      <p>
        Are you sure you want to leave <b>{name}?</b>
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
          onClick={() => void leavePlace(id, type)}
          style={{
            backgroundColor: 'var(--bg-dnd)',
            color: 'white',
          }}
        >
          Leave
        </button>
      </div>
    </div>
  );
};
