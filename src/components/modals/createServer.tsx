import './createServer.css';

import { type JSX, useRef, useState } from 'react';

import { useModal } from '../../context/modalContext';

export const CreateServerModal = (): JSX.Element => {
  const { openModal, closeModal } = useModal();
  const [serverName, setServerName] = useState('');
  const [avatar, setAvatar] = useState<string | ArrayBuffer | null>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    const payload = {
      name: serverName,
      region: '',
      icon: avatar === null || avatar === '' ? null : avatar,
    };

    const baseUrl = localStorage.getItem('selectedInstanceUrl');
    const url = `${baseUrl ?? ''}/${localStorage.getItem('defaultApiVersion') ?? ''}/guilds`;

    try {
      const request = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: localStorage.getItem('Authorization') ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!request.ok) {
        console.error('Failed to make server');
        return;
      }

      closeModal();
    } catch (e) {
      console.error('Failed to make server', e);
    }
  };

  return (
    <div className='join-server-modal'>
      <h2>New server, alright!</h2>

      <div className='avatar-upload-section' style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          className='avatar-preview'
          onClick={() => fileInputRef.current?.click()}
          style={{
            backgroundImage: `url(${previewUrl ?? ''})`,
          }}
        >
          {!previewUrl && <span>+</span>}
        </button>
        <input
          type='file'
          ref={fileInputRef}
          onChange={(e) => {
            handleFileChange(e);
          }}
          style={{ display: 'none' }}
          accept='image/*'
        />
        <p style={{ fontSize: '12px' }}>Upload Icon</p>
      </div>

      <div className='server-fields'>
        <span>Server Name</span>
        <input
          type='text'
          value={serverName}
          placeholder='My Awesome Server'
          onChange={(e) => {
            setServerName(e.target.value);
          }}
          style={{
            marginTop: '20px',
          }}
        />
      </div>

      <div className='modal-footer' style={{ gap: '15px', marginTop: '20px' }}>
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
          className={!serverName ? 'primary-btn disabled-btn' : 'primary-btn'}
          onClick={() => void handleCreate()}
        >
          Create
        </button>
      </div>
    </div>
  );
};
