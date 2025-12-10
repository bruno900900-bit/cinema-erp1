import React from 'react';
import { withDateProcessing } from '../utils/dateProcessing';

const BaseErrorBoundary = ({ children }) => {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (error) {
      console.error('🚨 Error caught by ErrorBoundary:', error);
    }
  }, [error]);

  if (error) {
    return (
      <div className="error-boundary">
        <h2>Algo deu errado</h2>
        <p>Por favor, tente recarregar a página.</p>
        <button onClick={() => window.location.reload()}>Recarregar</button>
      </div>
    );
  }

  return children;
};

// Aplicando o HOC de processamento de datas ao ErrorBoundary
export const ErrorBoundary = withDateProcessing(BaseErrorBoundary);
