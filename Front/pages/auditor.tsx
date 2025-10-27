// pages/auditor.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import NavBar from '../components/NavBar';
import {
  getLocalFeed,
  onFeedChange,
  updateIncident,
  addIncident,
  Incident,
  getSettings,
  saveSettings,
} from '../lib/store';
import { TriangleAlert } from 'lucide-react';
import { useConnect } from '@stacks/connect-react';
import { useWallet } from '../components/WalletProvider';
import { resolveDisputeTx, CLARITY_CONSTANTS } from '../lib/stacks';

/** Datos demo (solo UI; puedes “importarlos” a local) */
const demoDisputas = [
  {
    id: 'INC-2025-002',
    tipo: 'Exceso de velocidad',
    placa: 'XYZ-5678',
    razon: 'Error en medición',
    prioridad: 'Alta' as const,
  },
  {
    id: 'INC-2025-008',
    tipo: 'Colisión',
    placa: 'MNO-2468',
    razon: 'Responsabilidad disputada',
    prioridad: 'Media' as const,
  },
];

const demoPendientes = [{ id: 'INC-2025-010', tipo: 'Semáforo en rojo', placa: 'ABC-1111' }];

function Pill({
  children,
  color,
}: {
  children: React.ReactNode;
  color: 'red' | 'yellow' | 'green' | 'blue' | 'sky' | 'rose' | 'slate';
}) {
  const map: Record<string, string> = {
    red: 'bg-red-600 text-white',
    yellow: 'bg-yellow-500 text-black',
    green: 'bg-green-600 text-white',
    blue: 'bg-blue-600 text-white',
    sky: 'bg-sky-500/20 text-sky-300',
    rose: 'bg-rose-500/20 text-rose-300',
    slate: 'bg-slate-500/20 text-slate-300',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs ${map[color]}`}>{children}</span>;
}

export default function AuditorPage() {
  const [tab, setTab] = useState<'disputas' | 'pendientes' | 'config'>('disputas');
  const [local, setLocal] = useState<Incident[]>(getLocalFeed());
  const [modal, setModal] = useState<Incident | null>(null);

  const { doContractCall } = useConnect();
  const { userSession } = useWallet();
  const userData = userSession.isUserSignedIn() ? userSession.loadUserData() : null;
  const senderAddress =
    userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet || '';

  // Escucha cambios del feed local (alta / resolver / marcar stale)
  useEffect(() => {
    const off = onFeedChange(() => setLocal(getLocalFeed()));
    return off;
  }, []);

  const disputasLocal = useMemo(() => local.filter((i) => i.state === 'disputed'), [local]);
  const pendientesLocal = useMemo(() => local.filter((i) => i.state === 'pending'), [local]);

  /** Modal VER: abre detalle si existe local; si es demo solo muestra alerta */
  function viewIncident(id: string) {
    const it = local.find((i) => i.id === id);
    if (it) return setModal(it);

    const d = demoDisputas.find((x) => x.id === id);
    alert(
      `Detalle (demo)
ID: ${id}
Tipo: ${d?.tipo ?? '—'}
Placa: ${d?.placa ?? '—'}
Razón: ${d?.razon ?? '—'}
* Este incidente es de demo y no está en tu almacenamiento local.`
    );
  }

  /** RESOLVER: llama al contrato resolve-dispute */
  function resolveIncident(id: string, newStatus: number) {
    const it = local.find((i) => i.id === id);
    if (!it) {
      return alert(
        'Este incidente es de demo. Solo se pueden resolver incidentes locales que estén vinculados a IDs reales.'
      );
    }
    if (!senderAddress) return alert('Conecta tu wallet para realizar la acción de auditoría.');

    // El contrato opera con IDs uint, no con el string 'INC-2025-00X'
    const incidentId = parseInt(it.id.split('-').pop() ?? '0', 10);

    const resolveOptions = resolveDisputeTx(incidentId, newStatus, senderAddress);

    doContractCall({
      ...resolveOptions,
      onFinish: (data) => {
        alert(
          `Transacción de resolución enviada. TxID: ${data.txId}. Por favor, espera a que se confirme para ver el cambio.`
        );
        // Actualización local para fines de demo/UX rápida
        const newStatusStr = newStatus === CLARITY_CONSTANTS.RESOLVED ? 'resolved' : 'stale';
        updateIncident(id, { state: newStatusStr as any });
      },
      onCancel: () => alert('Transacción de resolución cancelada.'),
    });
  }

  /** Función para el botón 'Resolver' */
  function handleResolve(id: string) {
    resolveIncident(id, CLARITY_CONSTANTS.RESOLVED);
  }

  /** Aprobar/Disputar pendientes */
  // NOTA: Estas funciones se mantienen como mock (solo actualizan el store local)
  // porque no corresponden directamente a `resolve-dispute` o `open-dispute`
  // en el estado PENDING. La lógica de blockchain real para PENDING debe pasar
  // por `reveal-incident`.
  function approvePending(id: string) {
    const it = local.find((i) => i.id === id);
    if (!it) return alert('Solo puedes aprobar incidentes locales.');
    updateIncident(id, { state: 'revealed' });
  }

  function disputePending(id: string) {
    const it = local.find((i) => i.id === id);
    if (!it) return alert('Solo puedes disputar incidentes locales.');
    updateIncident(id, { state: 'disputed' });
  }

  /** Importar demo a local (útil para el jurado) */
  function importDemoDispute(row: (typeof demoDisputas)[number]) {
    if (local.some((i) => i.id === row.id)) return alert('Ya existe en local.');
    addIncident({
      id: row.id,
      state: 'disputed',
      title: row.tipo,
      location: '—',
      plate: row.placa,
      timestamp: new Date().toISOString(),
    });
  }
  return (
    <div className="min-h-screen bg-[#0b111f] text-slate-100">
      <NavBar active="/auditor" />

      <main className="max-w-6xl mx-auto px-4 py-10 grid gap-8">
        <h1 className="text-3xl font-semibold tracking-tight">Panel de Auditor</h1>
        <p className="text-slate-400">
          Gestiona disputas, incidentes pendientes y configuración del sistema
        </p>

        {/* Tabs */}
        <div className="inline-flex gap-2 bg-white/5 rounded-full p-1">
          <button
            onClick={() => setTab('disputas')}
            className={`px-4 py-2 rounded-full text-sm ${tab === 'disputas' ? 'bg-white/20' : ''}`}
          >
            Disputados
          </button>
          <button
            onClick={() => setTab('pendientes')}
            className={`px-4 py-2 rounded-full text-sm ${
              tab === 'pendientes' ? 'bg-white/20' : ''
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setTab('config')}
            className={`px-4 py-2 rounded-full text-sm ${tab === 'config' ? 'bg-white/20' : ''}`}
          >
            Config
          </button>
        </div>

        {/* DISPUTAS */}
        {tab === 'disputas' && (
          <section className="grid gap-6">
            {/* Local */}
            <div className="bg-gradient-to-b from-[#111a2e] to-[#0c1426] border border-white/10 rounded-2xl p-6 shadow-[0_6px_30px_-15px_rgba(0,0,0,.6)]">
              <h2 className="text-xl font-bold text-blue-300 mb-4">
                Incidentes en Disputa (Locales)
              </h2>
              {disputasLocal.length === 0 ? (
                <p className="text-slate-400">No hay disputas locales.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-300">
                      <tr>
                        <th className="py-2">ID</th>
                        <th>Tipo</th>
                        <th>Placa</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-200">
                      {disputasLocal.map((row) => (
                        <tr key={row.id} className="border-t border-white/10">
                          <td className="py-3">{row.id}</td>
                          <td>{row.title}</td>
                          <td>{row.plate}</td>
                          <td>
                            <Pill color="rose">Disputado</Pill>
                          </td>
                          <td className="flex gap-2 py-2">
                            <button
                              onClick={() => viewIncident(row.id)}
                              className="px-3 py-1.5 bg-white/10 rounded-xl hover:bg-white/15"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => resolveIncident(row.id)}
                              className="px-3 py-1.5 bg-green-600 rounded-xl hover:bg-green-500"
                            >
                              Resolver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Demo (importable) */}
            <div className="bg-gradient-to-b from-[#111a2e] to-[#0c1426] border border-white/10 rounded-2xl p-6 shadow-[0_6px_30px_-15px_rgba(0,0,0,.6)]">
              <h2 className="text-xl font-bold text-blue-300 mb-4">Incidentes en Disputa (Demo)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-300">
                    <tr>
                      <th className="py-2">ID</th>
                      <th>Tipo</th>
                      <th>Placa</th>
                      <th>Razón</th>
                      <th>Prioridad</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {demoDisputas.map((row) => (
                      <tr key={row.id} className="border-t border-white/10">
                        <td className="py-3">{row.id}</td>
                        <td>{row.tipo}</td>
                        <td>{row.placa}</td>
                        <td>{row.razon}</td>
                        <td>
                          {row.prioridad === 'Alta' ? (
                            <Pill color="red">Alta</Pill>
                          ) : (
                            <Pill color="yellow">Media</Pill>
                          )}
                        </td>
                        <td className="flex gap-2 py-2">
                          <button
                            onClick={() => viewIncident(row.id)}
                            className="px-3 py-1.5 bg-white/10 rounded-xl hover:bg-white/15"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => resolveIncident(row.id)}
                            className="px-3 py-1.5 bg-green-600 rounded-xl hover:bg-green-500"
                          >
                            Resolver
                          </button>
                          <button
                            onClick={() => importDemoDispute(row)}
                            className="px-3 py-1.5 bg-blue-700 rounded-xl hover:bg-blue-600"
                          >
                            Importar a local
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Importar a local permite simular la resolución con cambios visibles en el Feed.
              </p>
            </div>
          </section>
        )}

        {/* PENDIENTES (con tiempo restante + marcar stale) */}
        {tab === 'pendientes' && (
          <section className="grid gap-6">
            <div className="bg-gradient-to-b from-[#111a2e] to-[#0c1426] border border-white/10 rounded-2xl p-6 shadow-[0_6px_30px_-15px_rgba(0,0,0,.6)]">
              <h2 className="text-xl font-bold text-blue-300 mb-2">
                Incidentes Pendientes de Revelación
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Incidentes comprometidos que aún no han sido revelados.
              </p>

              <div className="flex items-center gap-2 text-amber-900/90 bg-amber-200/60 border border-amber-300/50 rounded-xl px-3 py-2 mb-4">
                <TriangleAlert className="w-4 h-4" />
                <span className="text-sm">
                  Los incidentes deben ser revelados dentro del plazo configurado. Después del
                  deadline, pueden ser marcados como <b>"stale"</b>.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-300">
                    <tr>
                      <th className="py-2">ID</th>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Placa</th>
                      <th>Tiempo restante</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {pendientesLocal.map((p) => {
                      const commitTime = new Date(p.timestamp).getTime();
                      const deadline = commitTime + getSettings().revealHours * 3600 * 1000;
                      const delta = deadline - Date.now();
                      const hours = Math.max(0, Math.floor(delta / 36e5));
                      const mins = Math.max(0, Math.floor((delta % 36e5) / 6e4));
                      const chip = delta > 0 ? `${hours}h ${mins}m restantes` : 'Vencido';

                      return (
                        <tr key={p.id} className="border-t border-white/10">
                          <td className="py-3">{p.id}</td>
                          <td>{new Date(p.timestamp).toISOString().slice(0, 10)}</td>
                          <td>{p.title}</td>
                          <td>{p.plate}</td>
                          <td>
                            <Pill color={delta > 0 ? 'sky' : 'rose'}>{chip}</Pill>
                          </td>
                          <td className="py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => viewIncident(p.id)}
                                className="px-3 py-1.5 bg-white/10 rounded-xl hover:bg-white/15"
                              >
                                Ver
                              </button>
                              <button
                                onClick={() => approvePending(p.id)}
                                className="px-3 py-1.5 bg-green-600 rounded-xl hover:bg-green-500"
                              >
                                Revelado
                              </button>
                              <button
                                onClick={() => updateIncident(p.id, { state: 'stale' as const })}
                                className="px-3 py-1.5 bg-rose-700/90 rounded-xl hover:bg-rose-600"
                              >
                                Marcar stale
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pendientes (Demo) -> importar */}
            <div className="bg-gradient-to-b from-[#111a2e] to-[#0c1426] border border-white/10 rounded-2xl p-6 shadow-[0_6px_30px_-15px_rgba(0,0,0,.6)]">
              <h2 className="text-xl font-bold text-blue-300 mb-4">Incidentes Pendientes (Demo)</h2>
              <ul className="space-y-2">
                {demoPendientes.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between border border-white/10 rounded-xl p-3"
                  >
                    <div>
                      <div className="text-slate-300 text-sm">{p.id}</div>
                      <div className="font-semibold">{p.tipo}</div>
                      <div className="text-slate-400 text-sm">Placa: {p.placa}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          addIncident({
                            id: p.id,
                            state: 'pending',
                            title: p.tipo,
                            location: '—',
                            plate: p.placa,
                            timestamp: new Date().toISOString(),
                          })
                        }
                        className="px-3 py-1.5 bg-blue-700 rounded-xl hover:bg-blue-600"
                      >
                        Importar a local
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* CONFIG (plazo + roles + métricas + guardar) */}
        {tab === 'config' && (
          <section className="bg-gradient-to-b from-[#111a2e] to-[#0c1426] border border-white/10 rounded-2xl p-6 grid gap-6 shadow-[0_6px_30px_-15px_rgba(0,0,0,.6)]">
            <h2 className="text-xl font-bold text-blue-300">Configuración del Sistema</h2>

            {/* Plazos */}
            <div>
              <h3 className="font-semibold text-slate-200 mb-2">Plazos de revelación</h3>
              <p className="text-slate-400 text-sm mb-2">
                Tiempo máximo para revelar evidencia (horas)
              </p>
              <input
                id="revealHours-input"
                defaultValue={getSettings().revealHours}
                type="number"
                min={1}
                className="bg-[#0e1627] border border-white/10 rounded-xl px-3 py-2 w-40"
              />
              <p className="text-slate-500 text-xs mt-2">
                Tiempo límite desde el commit hasta el reveal. Recomendado: 24–48 horas.
              </p>
            </div>

            {/* Roles */}
            <div>
              <h3 className="font-semibold text-slate-200 mb-3">Gestión de roles</h3>
              <div className="grid gap-3">
                {[
                  {
                    key: 'primary',
                    title: 'Auditor Principal',
                    desc: 'Puede resolver disputas y modificar configuración',
                  },
                  {
                    key: 'secondary',
                    title: 'Auditor Secundario',
                    desc: 'Puede revisar incidentes y sugerir resoluciones',
                  },
                  {
                    key: 'verifier',
                    title: 'Verificador',
                    desc: 'Puede verificar evidencias pero no resolver disputas',
                  },
                ].map((card) => {
                  const active = (getSettings().roles as any)[card.key];
                  return (
                    <div
                      key={card.key}
                      className="bg-[#0f172a] border border-white/10 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{card.title}</div>
                        <div className="text-sm text-slate-400">{card.desc}</div>
                      </div>
                      <button
                        onClick={() => {
                          const s = getSettings();
                          (s.roles as any)[card.key] = !(s.roles as any)[card.key];
                          saveSettings(s);
                          alert(
                            `${card.title}: ${(s.roles as any)[card.key] ? 'Activo' : 'Inactivo'}`
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl ${
                          active ? 'bg-emerald-700' : 'bg-white/10'
                        }`}
                      >
                        {active ? 'Activo' : 'Asignar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Métricas */}
            <div>
              <h3 className="font-semibold text-slate-200 mb-3">Parámetros del sistema</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { label: 'Incidentes totales', value: getSettings().metrics.total },
                  {
                    label: 'Tasa de revelación',
                    value: `${getSettings().metrics.revealRate}%`,
                  },
                  {
                    label: 'Disputas activas',
                    value: getSettings().metrics.activeDisputes,
                  },
                  {
                    label: 'Tiempo promedio resolución',
                    value: `${getSettings().metrics.avgResolutionH}h`,
                  },
                ].map((m, i) => (
                  <div key={i} className="bg-[#0f172a] border border-white/10 rounded-xl p-4">
                    <div className="text-slate-400 text-sm">{m.label}</div>
                    <div className="text-2xl font-bold mt-1">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  const el = document.getElementById(
                    'revealHours-input'
                  ) as HTMLInputElement | null;
                  const hours = Math.max(1, Number(el?.value || 24));
                  const s = getSettings();
                  s.revealHours = hours;
                  saveSettings(s);
                  alert('Configuración guardada');
                }}
                className="w-full md:w-auto px-4 py-2 bg-[#063a73] hover:bg-[#0a4d97] rounded-xl inline-flex items-center gap-2"
              >
                Guardar configuración
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Modal detalle */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center p-4">
          <div className="bg-[#121a2b] border border-white/10 rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-2">Detalle del incidente</h3>
            <div className="text-sm text-slate-200 space-y-1">
              <div>
                <b>ID:</b> {modal.id}
              </div>
              <div>
                <b>Estado:</b> {modal.state}
              </div>
              <div>
                <b>Placa:</b> {modal.plate}
              </div>
              <div>
                <b>Ubicación:</b> {modal.location}
              </div>
              <div>
                <b>Fecha:</b> {new Date(modal.timestamp).toLocaleString()}
              </div>
              <div className="break-all">
                <b>Hash:</b> {modal.evidenceHash ?? '—'}
              </div>
              <div className="break-all">
                <b>CID:</b> {modal.cid ?? '—'}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="px-3 py-1.5 bg-white/10 rounded-xl hover:bg-white/15"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  resolveIncident(modal.id);
                  setModal(null);
                }}
                className="px-3 py-1.5 bg-green-600 rounded-xl hover:bg-green-500"
              >
                Resolver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
