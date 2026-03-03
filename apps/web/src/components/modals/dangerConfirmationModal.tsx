import type { JSX } from 'react';

import { useModal } from '@/layering/modalContext';

export const DangerConfirmationModal = ({
  title,
  body,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
}): JSX.Element => {
  const { closeModal } = useModal();

  return (
    <div className='confirmation-leave-modal'>
      <p>
        <b>{title}</b>
      </p>
      <p>{body}</p>
      <div
        className='modal-footer'
        style={{
          gap: '15px',
        }}
      >
        <button
          onClick={() => {
            onCancel();
            closeModal();
          }}
          className='primary-btn join-btn'
        >
          No
        </button>
        <button
          className='primary-btn'
          onClick={onConfirm}
          style={{
            backgroundColor: 'var(--bg-dnd)',
            color: 'white',
          }}
        >
          Yes
        </button>
      </div>
    </div>
  );
};
