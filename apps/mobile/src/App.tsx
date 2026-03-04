import type { JSX } from 'react';
import { useState } from 'react';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';
import type { Instance } from 'shared';

import { ChatApp } from './pages/chat';
import { Landing } from './pages/landing';
import { Login } from './pages/login';
import { Register } from './pages/register';

type NativeRoute = 'landing' | 'login' | 'register' | 'chat';

const DEFAULT_INSTANCES: Instance[] = [
  {
    url: 'spacebar.chat',
    name: 'Spacebar',
    description: 'Official Spacebar Instance',
    provider: 'Spacebar Codebase',
  },
  {
    url: 'staging.oldcordapp.com',
    name: 'Oldcord Staging',
    description: 'Official Oldcord (Old Discord Server Reimplementation) Instance',
    provider: 'Oldcord Codebase',
  },
];

function NativeAppMobile(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [route, setRoute] = useState<NativeRoute>('landing');
  const [selectedInstanceUrl, setSelectedInstanceUrl] = useState('custom-instance');
  const [customInstance, setCustomInstance] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loginStatus, setLoginStatus] = useState<string | null>(null);
  const [registerStatus, setRegisterStatus] = useState<string | null>(null);

  const instanceStatus =
    selectedInstanceUrl !== 'custom-instance'
      ? 'Instance is online'
      : customInstance.trim()
        ? 'Custom instance selected'
        : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#16161E' : '#F3F4F6' }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#16161E' : '#F3F4F6'}
      />
      {route === 'landing' && (
        <Landing
          onOpenClient={() => {
            setRoute('login');
          }}
          onOpenGithub={() => {
            // placeholder i guess
          }}
          onOpenRegister={() => {
            setRoute('register');
          }}
        />
      )}
      {route === 'login' && (
        <Login
          instances={DEFAULT_INSTANCES}
          selectedInstanceUrl={selectedInstanceUrl}
          customInstance={customInstance}
          instanceStatus={instanceStatus}
          onSelectInstance={setSelectedInstanceUrl}
          onChangeCustomInstance={setCustomInstance}
          email={email}
          password={password}
          onChangeEmail={setEmail}
          onChangePassword={setPassword}
          status={loginStatus}
          onSubmit={() => {
            if (!email.trim() || !password.trim()) {
              setLoginStatus('Invalid email or password');
              return;
            }
            setLoginStatus(null);
            setRoute('chat');
          }}
          onOpenRegister={() => {
            setRoute('register');
          }}
        />
      )}
      {route === 'register' && (
        <Register
          instances={DEFAULT_INSTANCES}
          selectedInstanceUrl={selectedInstanceUrl}
          customInstance={customInstance}
          instanceStatus={instanceStatus}
          onSelectInstance={setSelectedInstanceUrl}
          onChangeCustomInstance={setCustomInstance}
          username={username}
          email={email}
          password={password}
          onChangeUsername={setUsername}
          onChangeEmail={setEmail}
          onChangePassword={setPassword}
          status={registerStatus}
          onSubmit={() => {
            if (!username.trim()) {
              setRegisterStatus('Invalid username');
              return;
            }
            if (!email.trim()) {
              setRegisterStatus('Invalid email');
              return;
            }
            if (!password.trim()) {
              setRegisterStatus('Bad password');
              return;
            }
            setRegisterStatus(null);
            setRoute('chat');
          }}
          onOpenLogin={() => {
            setRoute('login');
          }}
        />
      )}
      {route === 'chat' && <ChatApp />}
    </SafeAreaView>
  );
}

export default NativeAppMobile;
