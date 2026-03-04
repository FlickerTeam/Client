import { createContext, type JSX, useContext } from 'react';

const MobileWebContext = createContext(false);

export function MobileWebProvider({
  isMobileWeb,
  children,
}: {
  isMobileWeb: boolean;
  children: JSX.Element;
}): JSX.Element {
  return <MobileWebContext.Provider value={isMobileWeb}>{children}</MobileWebContext.Provider>;
}

export function useIsMobileWeb(): boolean {
  return useContext(MobileWebContext);
}
