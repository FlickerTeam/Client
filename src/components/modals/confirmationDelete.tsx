import type { JSX } from 'react';

import { useModal } from '../../context/modalContext';

export const ConfirmationDeleteModal = ({
  name,
  id,
  type,
}: {
  name: string;
  id: string;
  type: string;
}): JSX.Element => {
  const { closeModal } = useModal();

  const deleteGuild = async (id: string): Promise<boolean> => {
    try {
      const baseUrl = localStorage.getItem('selectedInstanceUrl');
      const url = `${baseUrl ?? ''}/${localStorage.getItem('defaultApiVersion') ?? ''}/guilds/${id}/delete`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: localStorage.getItem('Authorization') ?? '' },
      });

      if (!response.ok) {
        const msg = await response.text();

        closeModal(); //to-do: show an error msg

        console.error('Failed to delete guild: ', msg);
        return false;
      }

      closeModal();
      return true;
    } catch (error) {
      console.error('Failed to delete guild: ', error);
      return false;
    }
  };

  const deletePlace = async (id: string, type: string) => {
    if (type === 'server') {
      return deleteGuild(id);
    } //handle group dms, cuz like how else would you leave something

    return;
  };

  return (
    <div className='confirmation-leave-modal'>
      <p>
        Are you sure you want to delete the {type} &ldquo;<b>{name}&rdquo;</b>?
      </p>
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
