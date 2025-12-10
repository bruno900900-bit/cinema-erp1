import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { withDateProcessing } from './utils/dateProcessing';
import { Provider } from 'react-redux';

// Componente base da aplicação
const BaseApp = ({ store, children }) => {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <BrowserRouter>{children}</BrowserRouter>
      </ErrorBoundary>
    </Provider>
  );
};

// Aplicando o processamento de datas ao componente App
export const App = withDateProcessing(BaseApp);
