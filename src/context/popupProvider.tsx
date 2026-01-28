import { type JSX, type ReactNode, useState } from 'react';

import { PopupContext, type PopupDataMap, type PopupType } from './popupContext';
import { PopupRoot } from './popupRoot';

export const PopupProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [popupType, setPopupType] = useState<PopupType | null>(null);
  const [popupData, setPopupData] = useState<PopupDataMap[PopupType] | null>(null);

  const openPopup = <T extends PopupType>(type: T, data?: PopupDataMap[T]) => {
    setPopupType(type);
    setPopupData(data ?? null);
  };

  const closePopup = () => {
    setPopupType(null);
    setPopupData(null);
  };

  return (
    <PopupContext.Provider value={{ popupType, popupData, openPopup, closePopup }}>
      {children}
      <PopupRoot />
    </PopupContext.Provider>
  );
};
