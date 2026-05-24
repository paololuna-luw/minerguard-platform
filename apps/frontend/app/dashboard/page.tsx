"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? `http://${window.location.hostname}:4000`;
}

type ViewKey = "overview" | "miners" | "devices" | "gateways" | "alerts" | "map" | "users" | "settings";

type User = {
  id: string;
  username: string;
  email: string | null;
  fullName: string | null;
  status: string;
  mustChangePassword: boolean;
  roles: Array<{ name: string; description: string | null }>;
};

type DashboardData = {
  summary: {
    minersActive: number;
    devicesLinked: number;
    gatewaysOnline: number;
    alertsOpen: number;
  };
  miners: any[];
  devices: any[];
  gateways: any[];
  alerts: any[];
  mines: any[];
};

const navItems: Array<{ key: ViewKey; label: string; adminOnly?: boolean }> = [
  { key: "overview", label: "Resumen" },
  { key: "miners", label: "Mineros" },
  { key: "devices", label: "Dispositivos" },
  { key: "gateways", label: "Nodos" },
  { key: "alerts", label: "Alertas" },
  { key: "map", label: "Mapa operativo" },
  { key: "users", label: "Usuarios", adminOnly: true },
  { key: "settings", label: "Ajustes" }
];

function statusClass(status: string) {
  if (["active", "online", "resolved"].includes(status)) return "border-[#8bbf9f] bg-[#eef8f1] text-[#285b35]";
  if (["warning", "open"].includes(status)) return "border-[#d8ba6a] bg-[#fff8df] text-[#765600]";
  if (["emergency", "critical", "offline"].includes(status)) return "border-[#d59b9b] bg-[#fff1f1] text-[#8a2e2e]";
  return "border-[#c7d0d8] bg-[#f6f8f9] text-[#52616b]";
}

export default function DashboardPage() {
  const [view, setView] = useState<ViewKey>("overview");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ username: "", password: "", fullName: "", role: "viewer" });

  const isAdmin = useMemo(() => user?.roles.some((role) => role.name === "admin") ?? false, [user]);

  useEffect(() => {
    const storedToken = localStorage.getItem("minerguard_token");
    if (!storedToken) {
      window.location.href = "/login";
      return;
    }

    setToken(storedToken);
    void load(storedToken);
  }, []);

  async function api(path: string, options: RequestInit = {}) {
      const response = await fetch(`${getApiUrl()}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || localStorage.getItem("minerguard_token")}`,
        ...(options.headers ?? {})
      }
    });

    if (response.status === 401) {
      localStorage.removeItem("minerguard_token");
      window.location.href = "/login";
      throw new Error("Sesion expirada");
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function load(authToken: string) {
    setLoading(true);
    try {
      const meResponse = await fetch(`${getApiUrl()}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!meResponse.ok) throw new Error("Sesion invalida");
      const me = await meResponse.json();
      setUser(me.user);
      localStorage.setItem("minerguard_user", JSON.stringify(me.user));

      const dashboard = await fetch(`${getApiUrl()}/api/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }).then((response) => response.json());
      setData(dashboard);

      if (me.user.roles.some((role: { name: string }) => role.name === "admin")) {
        const [usersResponse, rolesResponse] = await Promise.all([
          fetch(`${getApiUrl()}/api/users`, { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch(`${getApiUrl()}/api/users/roles`, { headers: { Authorization: `Bearer ${authToken}` } })
        ]);
        setUsers(await usersResponse.json());
        setRoles(await rolesResponse.json());
      }
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    await api("/api/users", {
      method: "POST",
      body: JSON.stringify({
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        roles: [form.role]
      })
    });
    setForm({ username: "", password: "", fullName: "", role: "viewer" });
    setUsers(await api("/api/users"));
    setMessage("Usuario creado correctamente");
  }

  async function updateUserRole(userId: string, role: string) {
    await api(`/api/users/${userId}/roles`, {
      method: "PATCH",
      body: JSON.stringify({ roles: [role] })
    });
    setUsers(await api("/api/users"));
  }

  function logout() {
    localStorage.removeItem("minerguard_token");
    localStorage.removeItem("minerguard_user");
    window.location.href = "/login";
  }

  if (loading || !data || !user) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f6f8] text-[#52616b]">Cargando MinerGuard...</main>;
  }

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);
  const selectedMine = data.mines[0];

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#172026]">
      <header className="sticky top-0 z-20 border-b border-[#d8dee4] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">MinerGuard</h1>
            <p className="text-sm text-[#52616b]">Centro de monitoreo operativo</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded border border-[#c7d0d8] px-3 py-2">{user.username}</span>
            <span className="rounded border border-[#8bbf9f] bg-[#eef8f1] px-3 py-2 text-[#285b35]">
              {user.roles.map((role) => role.name).join(", ")}
            </span>
            <button onClick={logout} className="rounded border border-[#c7d0d8] px-3 py-2">
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[220px_1fr]">
        <nav className="rounded border border-[#d8dee4] bg-white p-2 lg:sticky lg:top-[92px] lg:h-fit">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {visibleNav.map((item) => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`rounded px-3 py-2 text-left text-sm transition ${
                  view === item.key
                    ? "bg-[#2f6f73] font-semibold text-white"
                    : "text-[#2f3b43] hover:bg-[#eef2f4]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <section className="soft-in min-w-0">
          {message ? <div className="mb-4 rounded border border-[#d8ba6a] bg-[#fff8df] px-4 py-3 text-sm text-[#765600]">{message}</div> : null}
          {view === "overview" && <Overview data={data} setView={setView} />}
          {view === "miners" && <Miners miners={data.miners} />}
          {view === "devices" && <Devices devices={data.devices} />}
          {view === "gateways" && <Gateways gateways={data.gateways} />}
          {view === "alerts" && <Alerts alerts={data.alerts} />}
          {view === "map" && <MineMap mine={selectedMine} devices={data.devices} />}
          {view === "users" && isAdmin && (
            <UsersAdmin
              users={users}
              roles={roles}
              form={form}
              setForm={setForm}
              createUser={createUser}
              updateUserRole={updateUserRole}
            />
          )}
          {view === "settings" && <Settings user={user} apiUrl={getApiUrl()} />}
        </section>
      </div>
    </main>
  );
}

function Overview({ data, setView }: { data: DashboardData; setView: (view: ViewKey) => void }) {
  const cards = [
    ["Mineros activos", data.summary.minersActive, "miners"],
    ["Dispositivos enlazados", data.summary.devicesLinked, "devices"],
    ["Nodos operativos", data.summary.gatewaysOnline, "gateways"],
    ["Alertas abiertas", data.summary.alertsOpen, "alerts"]
  ] as const;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, target]) => (
          <button key={label} onClick={() => setView(target)} className="rounded border border-[#d8dee4] bg-white p-4 text-left transition hover:border-[#2f6f73]">
            <p className="text-sm text-[#52616b]">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </button>
        ))}
      </div>
      <Alerts alerts={data.alerts.slice(0, 4)} compact />
    </div>
  );
}

function Miners({ miners }: { miners: any[] }) {
  return <Panel title="Mineros registrados" subtitle="Estado del personal vinculado a la mina">{miners.map((miner) => <Row key={miner.id} title={miner.fullName} meta={`${miner.document ?? "Sin documento"} - ${miner.mine?.name ?? "Sin mina"}`} status={miner.status} detail={`${miner.devices?.length ?? 0} dispositivo(s) asignado(s)`} />)}</Panel>;
}

function Devices({ devices }: { devices: any[] }) {
  return <Panel title="Dispositivos enlazados" subtitle="Cascos, relojes, tags y modulos de comunicacion">{devices.map((device) => <Row key={device.id} title={device.code} meta={`${device.type} - ${device.miner?.fullName ?? "Sin asignar"}`} status={device.status} detail={`Bateria ${device.telemetry?.[0]?.battery ?? "N/D"}% - RSSI ${device.telemetry?.[0]?.signalRssi ?? "N/D"}`} />)}</Panel>;
}

function Gateways({ gateways }: { gateways: any[] }) {
  return <Panel title="Nodos y gateways" subtitle="Puntos de comunicacion LoRa/MQTT de la operacion">{gateways.map((gateway) => <Row key={gateway.id} title={gateway.name} meta={`${gateway.code} - ${gateway.mine?.name ?? "Sin mina"}`} status={gateway.status} detail="Nodo registrado para cobertura interna o exterior" />)}</Panel>;
}

function Alerts({ alerts, compact = false }: { alerts: any[]; compact?: boolean }) {
  return <Panel title={compact ? "Alertas recientes" : "Centro de alertas"} subtitle="Eventos que requieren seguimiento operativo">{alerts.map((alert) => <Row key={alert.id} title={alert.message} meta={`${alert.type} - ${alert.device?.code ?? "Operacion"}`} status={alert.status} detail={`Severidad ${alert.severity}`} />)}</Panel>;
}

function MineMap({ mine, devices }: { mine: any; devices: any[] }) {
  return (
    <div className="rounded border border-[#d8dee4] bg-white p-5">
      <div className="flex flex-col gap-2 border-b border-[#e5e9ed] pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mapa operativo</h2>
          <p className="text-sm text-[#52616b]">{mine?.name ?? "Sin mina seleccionada"}</p>
        </div>
        <select className="rounded border border-[#c7d0d8] px-3 py-2 text-sm">
          <option>{mine?.name ?? "Sin mina"}</option>
        </select>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="relative min-h-[360px] overflow-hidden rounded border border-[#b7c2cc] bg-[#eef2f4] p-5">
          <div className="absolute left-[12%] top-[18%] h-14 w-[70%] rounded-full border-2 border-[#8aa0a8]" />
          <div className="absolute left-[30%] top-[42%] h-20 w-[48%] rounded-full border-2 border-[#8aa0a8]" />
          <div className="absolute left-[10%] top-[66%] h-12 w-[62%] rounded-full border-2 border-[#8aa0a8]" />
          {devices.slice(0, 4).map((device, index) => (
            <div key={device.id} className="absolute rounded-full border border-white bg-[#2f6f73] px-3 py-1 text-xs font-semibold text-white shadow" style={{ left: `${18 + index * 16}%`, top: `${24 + (index % 3) * 22}%` }}>
              {device.code}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {mine?.zones?.map((zone: any) => <Row key={zone.id} title={zone.name} meta={zone.level ?? "Sin nivel"} status="active" detail="Zona monitoreada" />)}
        </div>
      </div>
    </div>
  );
}

function UsersAdmin({ users, roles, form, setForm, createUser, updateUserRole }: any) {
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form onSubmit={createUser} className="rounded border border-[#d8dee4] bg-white p-5">
        <h2 className="text-lg font-semibold">Crear cuenta</h2>
        <input className="mt-4 w-full rounded border px-3 py-2" placeholder="Usuario" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="mt-3 w-full rounded border px-3 py-2" placeholder="Nombre completo" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input className="mt-3 w-full rounded border px-3 py-2" placeholder="Contrasena inicial" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="mt-3 w-full rounded border px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {roles.map((role: any) => <option key={role.id} value={role.name}>{role.name}</option>)}
        </select>
        <button className="mt-4 w-full rounded bg-[#2f6f73] px-4 py-2 text-sm font-semibold text-white">Crear usuario</button>
      </form>
      <Panel title="Usuarios y jerarquia" subtitle="Solo administradores pueden crear cuentas y asignar roles">
        {users.map((user: any) => (
          <div key={user.id} className="rounded border border-[#d8dee4] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{user.fullName ?? user.username}</p>
                <p className="text-sm text-[#52616b]">{user.username} - {user.status}</p>
              </div>
              <select className="rounded border border-[#c7d0d8] px-3 py-2 text-sm" value={user.roles?.[0]?.role?.name ?? "viewer"} onChange={(event) => updateUserRole(user.id, event.target.value)}>
                {roles.map((role: any) => <option key={role.id} value={role.name}>{role.name}</option>)}
              </select>
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function Settings({ user, apiUrl }: { user: User; apiUrl: string }) {
  return (
    <div className="rounded border border-[#d8dee4] bg-white p-5">
      <h2 className="text-lg font-semibold">Ajustes de usuario</h2>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <Info label="Usuario" value={user.username} />
        <Info label="Nombre" value={user.fullName ?? "Sin nombre"} />
        <Info label="Estado" value={user.status} />
        <Info label="API configurada" value={apiUrl} />
        <Info label="Roles" value={user.roles.map((role) => role.name).join(", ")} />
        <Info label="Cambio requerido" value={user.mustChangePassword ? "Si" : "No"} />
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[#d8dee4] bg-white p-5">
      <div className="border-b border-[#e5e9ed] pb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-[#52616b]">{subtitle}</p>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({ title, meta, status, detail }: { title: string; meta: string; status: string; detail: string }) {
  return (
    <article className="soft-in rounded border border-[#d8dee4] p-4 transition hover:border-[#2f6f73]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-[#52616b]">{meta}</p>
          <p className="mt-1 text-xs text-[#6b7a84]">{detail}</p>
        </div>
        <span className={`w-fit rounded border px-3 py-1 text-xs font-semibold ${statusClass(status)}`}>{status}</span>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#d8dee4] p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[#6b7a84]">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
