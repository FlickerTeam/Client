import { JSX, useEffect, useState } from 'react';
import Brand from '../components/common/brand';

const LoadingScreen = (): JSX.Element => {
  const [loadingText, setLoadingText] = useState("Loading...");
  const [fullMessage, setFullMessage] = useState("");

  useEffect(() => {
    let loadingMessages = [
       "I just kept spinning...",
       "Loading...",
       "Flickering.. wait.. FLICKER??",
    ]

    setFullMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)])
  }, []);

  useEffect(() => {
    if (loadingText.length < fullMessage.length) {
      const timeout = setTimeout(() => {
        setLoadingText(fullMessage.slice(0, loadingText.length + 1));
      }, 50);

      return () => clearTimeout(timeout);
    }
  }, [loadingText, fullMessage]);

  return (
    <div className="loading-container">
      <div className="loading-content">
        <Brand />
        <div className="spinner"></div>
        <p>{loadingText}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;