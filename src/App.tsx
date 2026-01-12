import './App.css';
import React, { JSX, useEffect, useState } from "react";
import { Route, Routes, useNavigate, Navigate, useLocation } from "react-router-dom";
import Register from './pages/register';
import Login from './pages/login';
import LoadingScreen from './pages/loading';
import ChatApp from './pages/chat';
import { GatewayProvider } from './context/gateway';
import { Instance } from './interfaces/instance';
import { DomainsResponse } from './interfaces/domainsresponse';
import { ModalProvider } from './context/modal';
import { ContextMenuProvider } from './context/contextMenu';

function App(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      if (!localStorage.getItem('instances')) {
        let defaultInstances: Instance[] = [{
          url: "spacebar.chat",
          name: "Spacebar",
          description: "Official Spacebar Instance",
          provider: "Spacebar Codebase"
        }, {
          url: "staging.oldcordapp.com",
          name: "Oldcord Staging",
          provider: "Oldcord Codebase",
          description: "Official Oldcord (Old Discord Server Reimplementation) Instance"
        }]

        localStorage.setItem('instances', JSON.stringify(defaultInstances))
      }

      const token = localStorage.getItem("Authorization");
      const publicPaths = ['/login', '/register'];
      const isPublicPath = publicPaths.includes(location.pathname);

      if (!token && !isPublicPath) {
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      if (!token && isPublicPath) {
        setLoading(false);
        return;
      }

      let selectedUrl = localStorage.getItem("selectedInstanceUrl");
      if (!selectedUrl) {
        if (!isPublicPath) navigate("/login", { replace: true });
        setLoading(false);
        return;
      }

      try {
        const metadataCheck = await fetch(`${selectedUrl}/policies/instance/domains`);

        if (!metadataCheck.ok) throw new Error();

        let response: DomainsResponse = await metadataCheck.json();

        localStorage.setItem("selectedGatewayUrl", response.gateway);
        localStorage.setItem("selectedCdnUrl", response.cdn); // for non user uploaded icons, etc
        localStorage.setItem("selectedAssetsUrl", response.assets ?? response.cdn); //for user made assets 
        localStorage.setItem("defaultApiVersion", "v" + response.defaultApiVersion);
      } catch (err) {
        if (!isPublicPath) {
          navigate("/login", { replace: true });
        }
      }

      setLoading(false);
    };

    initializeApp();
  }, [location, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <GatewayProvider>
      <ModalProvider>
        <ContextMenuProvider>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ChatApp />}>
              <Route path="channels/@me" element={<ChatApp />} />
              <Route path="channels/:guildId" element={<ChatApp />} />
              <Route path="channels/:guildId/:channelId" element={<ChatApp />} />
            </Route>
          </Routes>
        </ContextMenuProvider>
      </ModalProvider>
    </GatewayProvider>
  );
}

export default App;