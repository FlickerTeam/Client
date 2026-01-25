import './App.css';

import { type JSX, useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { useModal } from './context/modal';
import ChatApp from './pages/chat';
import LoadingScreen from './pages/loading';
import Login from './pages/login';
import Register from './pages/register';

function App(): JSX.Element {
  const { openModal } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [cantLoad, setCantLoad] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      if (!localStorage.getItem('instances')) {
        const defaultInstances: Instance[] = [
          {
            url: 'spacebar.chat',
            name: 'Spacebar',
            description: 'Official Spacebar Instance',
            provider: 'Spacebar Codebase',
          },
          {
            url: 'staging.oldcordapp.com',
            name: 'Oldcord Staging',
            provider: 'Oldcord Codebase',
            description: 'Official Oldcord (Old Discord Server Reimplementation) Instance',
          },
        ];

        localStorage.setItem('instances', JSON.stringify(defaultInstances));
      }

      const token = localStorage.getItem('Authorization');
      const publicPaths = ['/login', '/register'];
      const isPublicPath = publicPaths.includes(location.pathname);

      if (!token) {
        setLoading(false);

        if (!isPublicPath) {
          navigate('/login', { replace: true });
        }

        return;
      }

      const selectedUrl = localStorage.getItem('selectedInstanceUrl');

      if (!selectedUrl) {
        if (!isPublicPath) {
          navigate('/login', { replace: true });
        }
        setLoading(false);
        return;
      }

      try {
        const metadataCheck = await fetch(`${selectedUrl}/policies/instance/domains`);

        if (!metadataCheck.ok) {
          setCantLoad(true);
          setLoadingStatus(
            "This instance's API returned an error. Refresh and try again, or click Clear to remove it as your selected instance.",
          );
          return;
        }

        const response: DomainsResponse = await metadataCheck.json();

        localStorage.setItem('selectedGatewayUrl', response.gateway);
        localStorage.setItem('selectedCdnUrl', response.cdn); // for non user uploaded icons, etc
        localStorage.setItem('selectedAssetsUrl', response.assets ?? response.cdn); //for user made assets
        localStorage.setItem('defaultApiVersion', 'v' + response.defaultApiVersion);

        setLoading(false);
      } catch (err) {
        console.error('Connection failed:', err);
        setCantLoad(true);
        setLoadingStatus(
          'Unable to connect to the instance. You can try to refresh the page, or clear the current instance settings to start over.',
        );
      }
    };

    initializeApp();
  }, [location, navigate]);

  if (loading) {
    return (
      <>
        <LoadingScreen message={loadingStatus}>
          {cantLoad && (
            <button
              onClick={() => {
                openModal('CLEAR_SELECTED_INSTANCE');
              }}
            >
              Clear
            </button>
          )}
        </LoadingScreen>
      </>
    );
  }

  return (
    <Routes>
      <Route path='/register' element={<Register />} />
      <Route path='/login' element={<Login />} />
      <Route path='/' element={<ChatApp />}>
        <Route path='channels/@me' element={<ChatApp />} />
        <Route path='channels/:guildId' element={<ChatApp />} />
        <Route path='channels/:guildId/:channelId' element={<ChatApp />} />
      </Route>
    </Routes>
  );
}

export default App;
