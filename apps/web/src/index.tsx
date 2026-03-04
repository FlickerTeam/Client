import React from 'react';
import ReactDOM from 'react-dom/client';
import { useMediaQuery } from 'react-responsive';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { ConfigProvider } from './context/configProvider';
import { GatewayProvider } from './context/gatewayProvider';
import { MobileWebProvider } from './context/mobileWebContext';
import { ThemeProvider } from './context/themeProvider';
import { VoiceProvider } from './context/voiceProvider';
import { LayerPortals } from './layering/layerPortals';
import { MenuOverlayLayer } from './layering/menuOverlayLayer';

function RootApp(): React.JSX.Element {
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 800px)' });
  return (
    <MobileWebProvider isMobileWeb={isTabletOrMobile}>
      <App />
    </MobileWebProvider>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <ConfigProvider>
          <GatewayProvider>
            <VoiceProvider>
              <ThemeProvider>
                <RootApp />
                <LayerPortals />
                <MenuOverlayLayer />
              </ThemeProvider>
            </VoiceProvider>
          </GatewayProvider>
        </ConfigProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
} else {
  console.error('Failed to find the root element');
}
