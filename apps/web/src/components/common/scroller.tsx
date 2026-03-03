import {
  OverlayScrollbarsComponent,
  type OverlayScrollbarsComponentProps,
  type OverlayScrollbarsComponentRef,
} from 'overlayscrollbars-react';
import { forwardRef, type JSX } from 'react';

import { useTheme } from '@/context/themeContext';

export type ScrollerProps = OverlayScrollbarsComponentProps;

const Scroller = forwardRef<OverlayScrollbarsComponentRef, ScrollerProps>(
  ({ options, ...props }, ref): JSX.Element => {
    const { isDarkMode } = useTheme();

    const mergedOptions = {
      ...(typeof options === 'object' ? options : {}),
      scrollbars: {
        theme: isDarkMode ? 'os-theme-dark' : 'os-theme-light',
        autoHide: 'scroll',
        ...(typeof options === 'object' ? options?.scrollbars || {} : {}),
      },
    } as ScrollerProps['options'];

    return <OverlayScrollbarsComponent {...props} options={mergedOptions} ref={ref} />;
  },
);

Scroller.displayName = 'Scroller';

export default Scroller;
