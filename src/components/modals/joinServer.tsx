import './joinserver.css';

import { type JSX, useState } from 'react';

import { useModal } from '../../context/modal';

export interface InviteResponseQuery {
  code: string;
  inviter: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  expires_at: string;
  guild: {
    id: string;
    name: string;
    icon: string | null;
    splash: string | null;
    owner_id: string;
    features: string[];
  };
  channel: {
    id: string;
    guild_id: string;
    name: string;
    type: number;
  };
  uses: number;
}

export const JoinServerModal = (): JSX.Element => {
  const { openModal, closeModal } = useModal();
  const [invite, setInvite] = useState('');
  const [error, setError] = useState<ErrorResponse>();

  const fetchInvite = async (inviteCode: string): Promise<InviteResponseQuery | ErrorResponse> => {
    const baseUrl = localStorage.getItem('selectedInstanceUrl');
    const url = `${baseUrl}/${localStorage.getItem('defaultApiVersion')}/invite/${inviteCode}`;

    try {
      const request = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: localStorage.getItem('Authorization')!,
        },
      });

      const response = await request.json();

      if (!request.ok) {
        console.error('Failed to fetch invite');

        return response as ErrorResponse;
      }

      return response as InviteResponseQuery;
    } catch (e) {
      console.error('Failed to fetch invite', e);

      return {
        code: 500,
        message: 'Client Exception',
      };
    }
  };

  const handleJoin = async (inputString: string) => {
    try {
      const segments: string[] = inputString.trim().replace(/\/+$/, '').split('/');
      const inviteCode = segments[segments.length - 1];

      if (!inviteCode) {
        setError({ code: 400, message: 'Please enter a valid invite' });

        return;
      }

      const baseUrl = localStorage.getItem('selectedInstanceUrl');
      const url = `${baseUrl}/${localStorage.getItem('defaultApiVersion')}/invite/${inviteCode}`;
      const inviteResponse: InviteResponseQuery | ErrorResponse = await fetchInvite(inviteCode);

      if ('message' in inviteResponse) {
        //seriously i cant check easily if its an error response or not?
        setError(inviteResponse);
        return;
      }

      const request = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: localStorage.getItem('Authorization')!,
        },
        body: null,
      });

      const response = await request.json();

      if (!request.ok) {
        console.error('Failed to join server');

        return response as ErrorResponse;
      }

      closeModal();
    } catch (e) {
      console.error('Failed to join server', e);

      return {
        code: 500,
        message: 'Client Exception',
      };
    }
  };

  return (
    <div className='join-server-modal'>
      <h2>So.. you decided to join a server</h2>
      <p>Excellent! Enter a valid invite below.</p>
      <p>It may look like...</p>
      <ul>
        <li>
          <span>{`${window.location.protocol}//${window.location.host}`}/invite/NbaaJFnBTpuH</span>
        </li>
        <li>
          <span>
            {`${window.location.protocol}//${window.location.host}`}/invite/cool-people-r-us
          </span>
        </li>
        <li>
          <span>NbaaJFnBTpuH</span>
        </li>
      </ul>

      <div className='join-fields'>
        <span>Enter an invite</span>
        <input
          type='text'
          value={invite}
          placeholder='Enter an invite'
          onChange={(e) => {
            setInvite(e.target.value);
          }}
          style={{
            marginTop: '20px',
          }}
        />
      </div>
      {error?.message && (
        <div className='modal-error'>
          <span className='error'>{error?.message}</span>
        </div>
      )}
      <div className='modal-footer' style={{ gap: '15px', marginTop: '15px' }}>
        <button
          onClick={() => {
            openModal('WHATS_IT_GONNA_BE');
          }}
          style={{
            backgroundColor: 'var(--bg-offline)',
            color: 'white',
          }}
        >
          Back
        </button>
        <button className={!invite ? 'disabled-btn' : ''} onClick={() => handleJoin(invite)}>
          Join
        </button>
      </div>
    </div>
  );
};
