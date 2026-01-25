import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { ContextMenuProvider } from './context/contextMenu';
import { GatewayProvider } from './context/gateway';
import { ModalProvider } from './context/modal';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <GatewayProvider>
        <ModalProvider>
          <ContextMenuProvider>
            <App />
          </ContextMenuProvider>
        </ModalProvider>
      </GatewayProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
