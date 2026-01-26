import './joinServer.css';

import { type JSX, useState } from 'react';

import {
  type ErrorResponse,
  ErrorResponseSchema,
  type InviteResponse,
  InviteResponseSchema,
} from '@/types/responses';

import { useModal } from '../../context/modalContext';

export const JoinServerModal = (): JSX.Element => {
  const { openModal, closeModal } = useModal();
  const [invite, setInvite] = useState('');
  const [error, setError] = useState<ErrorResponse>();

  const fetchInvite = async (inviteCode: string): Promise<InviteResponse | ErrorResponse> => {
    const baseUrl = localStorage.getItem('selectedInstanceUrl');
    const url = `${baseUrl ?? ''}/${localStorage.getItem('defaultApiVersion') ?? ''}/invite/${inviteCode}`;

    const request = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: localStorage.getItem('Authorization') ?? '',
      },
    });

    const response: unknown = await request.json();

    if (request.ok) {
      const result = InviteResponseSchema.safeParse(response);
      if (result.success) return result.data;

      console.error('Failed to fetch invite', result.error);

      return {
        code: 500,
        message: 'Client Exception',
      };
    }

    const errorResult = ErrorResponseSchema.safeParse(response);

    if (errorResult.success) return errorResult.data;

    console.error('Failed to parse error', errorResult.error);

    return {
      code: 500,
      message: 'Client Exception',
    };
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
      const url = `${baseUrl ?? ''}/${localStorage.getItem('defaultApiVersion') ?? ''}/invite/${inviteCode}`;
      const inviteResponse = await fetchInvite(inviteCode);

      const isError = ErrorResponseSchema.safeParse(inviteResponse).success;

      if (isError) {
        //maybe zod saves you lol
        setError(inviteResponse as ErrorResponse);
        return;
      }

      const request = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: localStorage.getItem('Authorization') ?? '',
        },
        body: null,
      });

      const response: unknown = await request.json();

      if (!request.ok) {
        console.error('Failed to join server');

        return response as ErrorResponse;
      }

      closeModal();

      return;
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
          <span className='error'>{error.message}</span>
        </div>
      )}
      <div className='modal-footer' style={{ gap: '15px', marginTop: '15px' }}>
        <button
          className='primary-btn'
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
        <button
          className={!invite ? 'primary-btn disabled-btn' : 'primary-btn'}
          onClick={() => void handleJoin(invite)}
        >
          Join
        </button>
      </div>
    </div>
  );
};
