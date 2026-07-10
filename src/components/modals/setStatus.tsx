import './setStatus.css';

import { type JSX, useState } from 'react';

import { useModal } from '@/layering/modalContext';
import { patch } from '@/utils/api';

export const SetStatusModal = (): JSX.Element => {
  const { closeModal } = useModal();
  const [statusText, setStatusText] = useState('');
  const [clearTime, setClearTime] = useState('dont-clear');

  const handleSaveCustomStatus = async () => {
    let expiresAt: string | null = null;
    const now = new Date();

    if (clearTime === '30m') {
      expiresAt = new Date(now.getTime() + 30 * 60000).toISOString();
    } else if (clearTime === '1h') {
      expiresAt = new Date(now.getTime() + 60 * 60000).toISOString();
    } else if (clearTime === '4h') {
      expiresAt = new Date(now.getTime() + 4 * 60 * 60000).toISOString();
    } else if (clearTime === '1d') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60000).toISOString();
    }

    const payload = {
      custom_status: {
        text: statusText.trim() || null,
        expires_at: expiresAt,
        emoji_id: null,
        emoji_name: null,
      },
    };

    try {
      await patch(`/users/@me/settings`, payload);
      closeModal();
    } catch (e) {
      console.error('Failed to update custom text status:', e);
    }
  };

  return (
    <div className='set-custom-status-modal'>
      <h2>Set your status</h2>

      <div className='server-fields'>
        <span className='field-label'>Status</span>
        <input
          type='text'
          value={statusText}
          placeholder='What are you up to?'
          onChange={(e) => setStatusText(e.target.value)}
        />
      </div>

      <div className='modal-footer modal-footer-status'>
        <div className='clear-when'>
          <span className='clear-label'>Clear after</span>
          <div className='select-wrapper'>
            <select
              name='clear-time'
              id='clear-time'
              value={clearTime}
              onChange={(e) => setClearTime(e.target.value)}
            >
              <option value='dont-clear'>Don't Clear</option>
              <option value='30m'>30 Minutes</option>
              <option value='1h'>1 Hour</option>
              <option value='4h'>4 Hours</option>
              <option value='1d'>1 Day</option>
            </select>
          </div>
        </div>
        <button className='primary-btn' onClick={() => void handleSaveCustomStatus()}>
          Save
        </button>
      </div>
    </div>
  );
};
