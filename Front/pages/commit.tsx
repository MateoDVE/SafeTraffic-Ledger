import Link from 'next/link';
import CommitForm from '../components/CommitForm';
import ConnectButton from '../components/ConnectButton';

export default function CommitPage() {
  return (
    <main className="max-w-4xl mx-auto p-4 grid gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Commit Incident</h1>
        <ConnectButton />
      </header>
      <nav className="text-sm"><Link className="underline" href="/home">← Volver</Link></nav>
      <CommitForm />
    </main>
  );
}
