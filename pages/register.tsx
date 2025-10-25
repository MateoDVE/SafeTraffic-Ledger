import Link from "next/link";
import AuthLayout from "../components/AuthLayout";
import { Button, GhostButton, Input, Label } from "../components/ui";
import { useRouter } from "next/router";
import { useState } from "react";
import ConnectButton from "../components/ConnectButton";

export default function Register() {
  const router = useRouter();
  const [accept, setAccept] = useState(false);

  function createAcc(e: React.FormEvent) {
    e.preventDefault();
    if (!accept) return alert("Debes aceptar los términos (demo).");
    // DEMO: navega al login
    router.push("/login");
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-b from-green-400 to-green-700 grid place-items-center">
          <span className="text-2xl">🛡️</span>
        </div>
        <h1 className="text-xl font-semibold">Crear cuenta nueva</h1>
        <p className="text-slate-400 text-sm -mt-1">Únete a SafeTraffic Ledger</p>
      </div>

      <form onSubmit={createAcc} className="grid gap-3">
        <div className="grid gap-1">
          <Label>Nombre completo</Label>
          <Input placeholder="Juan Pérez" />
        </div>
        <div className="grid gap-1">
          <Label>Correo electrónico</Label>
          <Input type="email" placeholder="juan@ejemplo.com" />
        </div>
        <div className="grid gap-1">
          <Label>Número de Carnet de Identidad</Label>
          <Input placeholder="12345678" />
        </div>
        <div className="grid gap-1">
          <Label>Contraseña</Label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <div className="grid gap-1">
          <Label>Confirmar contraseña</Label>
          <Input type="password" placeholder="••••••••" />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300 mt-1">
          <input type="checkbox" checked={accept} onChange={e=>setAccept(e.target.checked)} />
          Acepto los términos y condiciones de SafeTraffic Ledger
        </label>

        <Button type="submit">Crear cuenta</Button>

        <GhostButton type="button">Registrarse con wallet Stacks</GhostButton>
        <ConnectButton />

        <div className="text-center text-sm text-blue-300">
          ¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
