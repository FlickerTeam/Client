import './joinServer.css';

import { type JSX, useState } from 'react';
import {
  ApiError,
  type ErrorResponse,
  ErrorResponseSchema,
  get,
  type InviteResponse,
  InviteResponseSchema,
  post,
} from 'shared';

import { useModal } from '@/layering/modalContext';

export const JoinServerModal = (): JSX.Element => {
  const { openModal, closeModal } = useModal();
  const [invite, setInvite] = useState('');
  const [error, setError] = useState<ErrorResponse>();

  const fetchInvite = async (inviteCode: string): Promise<InviteResponse | ErrorResponse> => {
    try {
      const response = await get<InviteResponse>(`/invites/${inviteCode}`);
      const result = InviteResponseSchema.safeParse(response);

      if (result.success) return result.data;

      return response;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const errorBody = err.responseBody;
        const errorResult = ErrorResponseSchema.safeParse(errorBody);

        if (errorResult.success) {
          return errorResult.data;
        }
      }

      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal Server Error',
      };
    }
  };

  const handleJoin = async (inputString: string) => {
    setError(undefined);

    const segments = inputString.trim().replace(/\/+$/, '').split('/');
    const inviteCode = segments.pop();

    if (!inviteCode) {
      setError({ code: 400, message: 'Please enter a valid invite' });
      return;
    }

    const inviteResponse = await fetchInvite(inviteCode);

    const errorCheck = ErrorResponseSchema.safeParse(inviteResponse);

    if (errorCheck.success) {
      setError(errorCheck.data);
      return;
    }

    try {
      await post(`/invites/${inviteCode}`, null);

      closeModal();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const errorBody = err.responseBody;
        const errorResult = ErrorResponseSchema.safeParse(errorBody);

        if (errorResult.success) {
          setError(errorResult.data);
        }
      } else {
        setError({
          code: 500,
          message: 'Failed to join',
        });
      }
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
            marginTop: '10px',
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
