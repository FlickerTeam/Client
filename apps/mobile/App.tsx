import { MobileHome } from 'mobile-ui';
import React from 'react';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#16161E' : '#F3F4F6' }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#16161E' : '#F3F4F6'}
      />
      <MobileHome />
    </SafeAreaView>
  );
}

export default App;
