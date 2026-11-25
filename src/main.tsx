import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './mobile.css';
import './accessibility.css';
import './site-theme-components.css';
import './site-theme.css';
import {AppErrorBoundary} from './components/AppErrorBoundary';
import { installDialogKeyboardNavigation } from './utils/dialogKeyboard';

installDialogKeyboardNavigation();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </StrictMode>,
);
