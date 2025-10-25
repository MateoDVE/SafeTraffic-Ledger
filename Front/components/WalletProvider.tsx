// components/WalletProvider.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { AppConfig, UserSession } from '@stacks/connect';
import { Connect } from '@stacks/connect-react';

// Configuración de la app para Stacks
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

// Definición del tipo de contexto
type WalletCtx = { userSession: UserSession };
const WalletContext = createContext<WalletCtx | null>(null);

// Provider que envuelve toda la app (ver pages/_app.tsx)
export const WalletProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const value = useMemo(() => ({ userSession }), []);
  return (
    <WalletContext.Provider value={value}>
      <Connect
        authOptions={{
          appDetails: { name: 'SafeTraffic Ledger', icon: '/logo.png' },
          userSession,
          redirectTo: '/feed', // después de login va al feed
          onFinish: () => {
            window.location.href = '/feed';
          },
        }}
      >
        {children}
      </Connect>
    </WalletContext.Provider>
  );
};

// Hook para acceder al contexto
export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    // fallback para SSR o si no está envuelto aún
    return {
      userSession: {
        isUserSignedIn: () => false,
        signUserOut: () => {},
      } as UserSession,
    };
  }
  return ctx;
};

// Función HOC (si quieres envolver componentes específicos con <Connect>)
export const withConnect = (children: React.ReactNode) => (
  <Connect
    authOptions={{
      appDetails: { name: 'SafeTraffic Ledger', icon: '/logo.png' },
      userSession,
      redirectTo: '/feed',
      onFinish: () => {
        window.location.href = '/feed';
      },
    }}
  >
    {children}
  </Connect>
);
