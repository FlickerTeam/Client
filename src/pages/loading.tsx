import { type JSX, useEffect, useState } from 'react';

import Brand from '../components/common/brand';

const LoadingScreen = ({
  message,
  children,
}: {
  message?: string | null;
  children?: React.ReactNode;
}): JSX.Element => {
  const [loadingText, setLoadingText] = useState('Loading...');
  const [fullMessage, setFullMessage] = useState('');

  useEffect(() => {
    const loadingMessages = [
      'I just kept spinning...',
      'Loading...',
      'Flickering.. wait.. FLICKER??',
    ];

    setFullMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
  }, []);

  useEffect(() => {
    if (loadingText.length < fullMessage.length) {
      const timeout = setTimeout(() => {
        setLoadingText(fullMessage.slice(0, loadingText.length + 1));
      }, 50);

      return () => {
        clearTimeout(timeout);
      };
    }

    return;
  }, [loadingText, fullMessage]);

  return (
    <div className='loading-container'>
      <div className='loading-content'>
        <Brand />
        <div className='spinner'></div>
        <p>{message ?? loadingText}</p>
        {children}
      </div>
    </div>
  );
};

export default LoadingScreen;
