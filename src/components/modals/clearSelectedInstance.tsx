import type { JSX } from 'react';

import { useModal } from '../../context/modal';

export const ClearSelectedInstanceModal = (): JSX.Element => {
  const { closeModal } = useModal();

  const clearSelectedInstance = () => {
    localStorage.removeItem('selectedInstanceUrl');
    localStorage.removeItem('selectedGatewayUrl');
    localStorage.removeItem('selectedCdnUrl');
    localStorage.removeItem('selectedAssetsUrl');
    localStorage.removeItem('defaultApiVersion');
    localStorage.removeItem('Authorization');

    closeModal();

    window.location.href = '/login';
  };

  const getFormattedUrl = () => {
    const rawUrl = localStorage.getItem('selectedInstanceUrl');

    if (!rawUrl) {
      return 'your current instance'; //how ?
    }

    try {
      const url = new URL(rawUrl);

      return url.host;
    } catch (e) {
      return rawUrl.replace(/(^\w+:|^)\/\//, '').split('/')[0];
    }
  };

  return (
    <>
      <div className='confirmation-leave-modal'>
        <p>
          Are you sure you want to clear <b>{getFormattedUrl()}</b> from your localStorage?
        </p>
        <p>
          <b>
            This will log you out and you won't be able to chat on this instance unless you select
            it again.
          </b>
        </p>
        <div
          className='modal-footer'
          style={{
            gap: '15px',
          }}
        >
          <button onClick={closeModal} className='join-btn'>
            Cancel
          </button>
          <button
            onClick={() => {
              clearSelectedInstance();
            }}
            style={{
              backgroundColor: 'var(--bg-dnd)',
              color: 'white',
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </>
  );
};
