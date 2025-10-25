import Link from "next/link";
import AuthLayout from "../components/AuthLayout";
import { Button, Input, Label } from "../components/ui";
import { useState } from "react";

export default function Forgot() {
  const [mail, setMail] = useState("");

  function sendLink(e: React.FormEvent) {
    e.preventDefault();
    alert("Enlace de recuperación enviado (demo)");
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-b from-blue-400 to-blue-700 grid place-items-center">
          <span className="text-2xl">🛡️</span>
        </div>
        <h1 className="text-xl font-semibold">Recuperar contraseña</h1>
        <p className="text-slate-400 text-sm -mt-1">Ingresa tu correo o carnet para recibir el enlace</p>
      </div>

      <form onSubmit={sendLink} className="grid gap-3">
        <div className="grid gap-1">
          <Label>Correo electrónico o Carnet</Label>
          <Input placeholder="correo@ejemplo.com o 12345678" value={mail} onChange={e=>setMail(e.target.value)} />
        </div>
        <Button type="submit">Enviar enlace de recuperación</Button>
      </form>

      <div className="text-sm text-blue-300 mt-4">
        <Link href="/login">← Volver al inicio de sesión</Link>
      </div>

      <p className="text-xs text-center text-slate-500 mt-6">
        SafeTraffic Ledger — Stacks Hackathon 2025
      </p>
    </AuthLayout>
  );
}
