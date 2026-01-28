import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { ContextMenuProvider } from './context/contextMenuProvider';
import { GatewayProvider } from './context/gatewayProvider';
import { ModalProvider } from './context/modalProvider';
import { PopupProvider } from './context/popupProvider';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <GatewayProvider>
          <ModalProvider>
            <PopupProvider>
              <ContextMenuProvider>
                <App />
              </ContextMenuProvider>
            </PopupProvider>
          </ModalProvider>
        </GatewayProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
} else {
  console.error('Failed to find the root element');
}
