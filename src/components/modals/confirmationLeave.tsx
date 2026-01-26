import type { JSX } from 'react';

import { useModal } from '../../context/modalContext';

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
      const baseUrl = localStorage.getItem('selectedInstanceUrl');
      const url = `${baseUrl ?? ''}/${localStorage.getItem('defaultApiVersion') ?? ''}/guilds/${id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: localStorage.getItem('Authorization') ?? '' },
      });

      if (!response.ok) {
        const msg = await response.text();

        closeModal(); //to-do: show an error msg

        console.error('Failed to leave guild: ', msg);
        return false;
      }

      closeModal();
      return true;
    } catch (error) {
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
