import { Activity, AlertTriangle, Battery, HardHat, RadioTower, Users } from "lucide-react";

const stats = [
  { label: "Mineros activos", value: "0", icon: Users },
  { label: "Dispositivos enlazados", value: "0", icon: HardHat },
  { label: "Nodos operativos", value: "0", icon: RadioTower },
  { label: "Alertas abiertas", value: "0", icon: AlertTriangle }
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#172026]">
      <header className="border-b border-[#d8dee4] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-normal">MinerGuard</h1>
            <p className="text-sm text-[#52616b]">Monitoreo de seguridad minera en tiempo real</p>
          </div>
          <div className="flex items-center gap-2 rounded border border-[#c7d0d8] px-3 py-2 text-sm text-[#2f3b43]">
            <Activity size={16} />
            Esperando telemetria
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="rounded border border-[#d8dee4] bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#52616b]">{stat.label}</p>
                <Icon size={18} className="text-[#2f6f73]" />
              </div>
              <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
            </article>
          );
        })}
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded border border-[#d8dee4] bg-white p-5">
          <div className="flex items-center justify-between border-b border-[#e5e9ed] pb-3">
            <h2 className="text-base font-semibold">Mapa operativo</h2>
            <span className="text-sm text-[#52616b]">Ultima zona conocida</span>
          </div>
          <div className="mt-4 grid min-h-[380px] place-items-center rounded border border-dashed border-[#b7c2cc] bg-[#eef2f4]">
            <p className="max-w-sm text-center text-sm text-[#52616b]">
              Aqui se renderizara el plano del socavon, nodos, gateways y posiciones estimadas.
            </p>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded border border-[#d8dee4] bg-white p-5">
            <h2 className="text-base font-semibold">Alertas recientes</h2>
            <p className="mt-4 text-sm text-[#52616b]">Sin alertas registradas.</p>
          </div>
          <div className="rounded border border-[#d8dee4] bg-white p-5">
            <h2 className="text-base font-semibold">Estado de dispositivos</h2>
            <div className="mt-4 flex items-center gap-3 text-sm text-[#52616b]">
              <Battery size={16} />
              No hay dispositivos reportando bateria.
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
