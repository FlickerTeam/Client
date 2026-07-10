import './App.css';

import { type JSX, lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { useModal } from './layering/modalContext';
import LoadingScreen from './pages/loading';
import type { Instance } from './types/instance';
import { type DomainsResponse, DomainsResponseSchema } from './types/responses';
import { get } from './utils/api';

const ChatApp = lazy(() => import('./pages/chat'));
const Landing = lazy(() => import('./pages/landing'));
const Login = lazy(() => import('./pages/login'));
const Register = lazy(() => import('./pages/register'));

function App(): JSX.Element {
  const { openModal } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [cantLoad, setCantLoad] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      if (location.pathname === '/') {
        setLoading(false);
        return;
      }

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

      const token = localStorage.getItem('selectedAuthorization');
      const publicPaths = ['/login', '/register'];
      const isPublicPath = publicPaths.includes(location.pathname);

      if (!token) {
        setLoading(false);

        if (!isPublicPath) {
          void navigate('/login', { replace: true });
        }

        return;
      }

      const selectedUrl = localStorage.getItem('selectedInstanceUrl');

      if (!selectedUrl) {
        if (!isPublicPath) {
          void navigate('/login', { replace: true });
        }
        setLoading(false);
        return;
      }

      const hasCachedDomains =
        localStorage.getItem('selectedGatewayUrl') && localStorage.getItem('selectedCdnUrl');
      if (hasCachedDomains) {
        setLoading(false);
        return;
      }

      try {
        const metadataCheck = await get(`/policies/instance/domains`);

        const response: DomainsResponse = DomainsResponseSchema.parse(metadataCheck);

        localStorage.setItem('selectedGatewayUrl', response.gateway);
        localStorage.setItem('selectedCdnUrl', response.cdn); // for user uploaded icons and attachments
        localStorage.setItem(
          'selectedAssetsUrl',
          JSON.stringify(response.assets ?? ['https://cdn.oldcordapp.com']),
        ); //for non user uploaded icons, etc. this is a cascading property where the first url loads first
        localStorage.setItem('defaultApiVersion', 'v' + response.defaultApiVersion);

        setLoading(false);
      } catch (err) {
        console.error('Connection failed:', err);
        setCantLoad(true);
        setLoadingStatus(
          "This instance's API returned an error. Refresh and try again, or click Clear to remove it as your selected instance.",
        );
      }
    };

    void initializeApp();
  }, [location.pathname, navigate]);

  if (loading) {
    return (
      <>
        <LoadingScreen message={loadingStatus}>
          {cantLoad && (
            <button
              className='primary-btn'
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
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login />} />
        <Route path='/channels' element={<ChatApp />}>
          <Route path='@me' element={<ChatApp />} />
          <Route path='@me/:channelId' element={<ChatApp />} />
          <Route path=':guildId' element={<ChatApp />} />
          <Route path=':guildId/:channelId' element={<ChatApp />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
