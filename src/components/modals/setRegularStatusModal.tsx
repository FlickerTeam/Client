import { usePopup } from '@/layering/popupContext';
import './setRegularStatusModal.css';

import { type JSX } from 'react';
import { patch } from '@/utils/api';

export const SetRegularStatusModal = (): JSX.Element => {
  const { closePopup } = usePopup();
  const changeStatus = async (status: 'online' | 'idle' | 'dnd' | 'invisible') => {
    try {
      await patch('/users/@me/settings', { status });
    } catch (err) {
      console.error(`Failed to update visibility status to ${status}:`, err);
    } finally {
      closePopup('SET_STATUS');
    }
  };

  return (
    <div className='set-status-modal'>
      <div className='status-option' onClick={() => void changeStatus('online')}>
        <div className='action-status-icon'>
          <div className='status-indicator-wrapper'>
            <div className='status-dot online'></div>
          </div>
        </div>
        <div className='status-info'>
          <p className='status-title'>Online</p>
          <p className='status-description'></p>
        </div>
      </div>
      <div
        className='divider'
        style={{
          borderBottom: '1px solid var(--bg-alt)',
        }}
      ></div>
      <div className='status-option' onClick={() => void changeStatus('idle')}>
        <div className='action-status-icon'>
          <div className='status-indicator-wrapper'>
            <div className='status-dot idle'></div>
          </div>
        </div>
        <div className='status-info'>
          <p className='status-title'>Idle</p>
          <p className='status-description'></p>
        </div>
      </div>
      <div className='status-option' onClick={() => void changeStatus('dnd')}>
        <div className='action-status-icon'>
          <div className='status-indicator-wrapper'>
            <div className='status-dot dnd'></div>
          </div>
        </div>
        <div className='status-info'>
          <p className='status-title'>Do Not Disturb</p>
          <p className='status-description'>You will not receive any notifications.</p>
        </div>
      </div>
      <div className='status-option' onClick={() => void changeStatus('invisible')}>
        <div className='action-status-icon'>
          <div className='status-indicator-wrapper'>
            <div className='status-dot offline'></div>
          </div>
        </div>
        <div className='status-info'>
          <p className='status-title'>Invisible</p>
          <p className='status-description'>
            You will not appear online but you can still interact with this instance.
          </p>
        </div>
      </div>
    </div>
  );
};
