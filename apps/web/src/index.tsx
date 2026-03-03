import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { ConfigProvider } from './context/configProvider';
import { GatewayProvider } from './context/gatewayProvider';
import { ThemeProvider } from './context/themeProvider';
import { VoiceProvider } from './context/voiceProvider';
import { LayerPortals } from './layering/layerPortals';
import { MenuOverlayLayer } from './layering/menuOverlayLayer';

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
                <App />
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
