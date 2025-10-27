import { useConnect } from '@stacks/connect-react';
import { useEffect, useState } from 'react';
import { useWallet } from './WalletProvider';

export default function ConnectButton() {
  const { doOpenAuth } = useConnect();
  const { userSession } = useWallet();
  const [addr, setAddr] = useState<string | null>(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      setAddr(
        userData.profile?.stxAddress?.testnet ||
          userData.profile?.stxAddress?.mainnet ||
          'Connected'
      );
    }
  }, [userSession]);

  if (userSession.isUserSignedIn()) {
    return (
      <button
        onClick={() => userSession.signUserOut()}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Disconnect {addr?.slice(0, 6)}…
      </button>
    );
  }

  return (
    <button onClick={() => doOpenAuth()} className="px-4 py-2 bg-blue-500 text-white rounded">
      Connect Wallet
    </button>
  );
}
