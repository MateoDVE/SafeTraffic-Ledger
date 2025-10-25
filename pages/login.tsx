import Link from "next/link";
import AuthLayout from "../components/AuthLayout";
import { Button, GhostButton, Input, Label } from "../components/ui";
import ConnectButton from "../components/ConnectButton";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const [ci, setCi] = useState("");
  const [pass, setPass] = useState("");

  function fakeLogin(e: React.FormEvent) {
    e.preventDefault();
    // DEMO: no hay backend; simplemente navega al home
    // dentro de login.tsx
    router.push('/feed');
  }
  

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-b from-blue-400 to-blue-700 grid place-items-center">
          <span className="text-2xl">🛡️</span>
        </div>
        <h1 className="text-xl font-semibold">SafeTraffic Ledger</h1>
        <p className="text-slate-400 text-sm -mt-1">Inicia sesión para acceder a tu cuenta</p>
      </div>

      <form onSubmit={fakeLogin} className="grid gap-3">
        <div className="grid gap-1">
          <Label>Número de Carnet de Identidad</Label>
          <Input placeholder="Ej: 12345678" value={ci} onChange={e=>setCi(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Contraseña</Label>
          <Input type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} />
        </div>

        <Button type="submit">Iniciar sesión</Button>

        {/* Wallet Stacks */}
        <div className="grid gap-2">
          <GhostButton type="button">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">🧩</span>
              <span>Conectar con wallet Stacks</span>
            </div>
          </GhostButton>
          {/* botón real que abre el modal */}
          <ConnectButton />
        </div>

        <div className="flex items-center justify-between text-sm text-blue-300 mt-1">
          <Link href="/forgot">¿Olvidaste tu contraseña?</Link>
          <Link href="/register">Crear cuenta nueva</Link>
        </div>
      </form>

      <p className="text-xs text-center text-slate-500 mt-6">
        SafeTraffic Ledger — Stacks Hackathon 2025
      </p>
    </AuthLayout>
  );
}
