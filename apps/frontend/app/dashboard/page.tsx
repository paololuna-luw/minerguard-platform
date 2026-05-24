"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BrandLogo } from "../components/BrandLogo";

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

function heartRateLevel(value?: number | null) {
  if (value === undefined || value === null) return "unknown";
  if (value < 50 || value > 130) return "critical";
  if (value < 60 || value > 110) return "warning";
  return "normal";
}

function spo2Level(value?: number | null) {
  if (value === undefined || value === null) return "unknown";
  if (value < 90) return "critical";
  if (value < 94) return "warning";
  return "normal";
}

function vitalClass(level: string) {
  if (level === "normal") return "border-[#8bbf9f] bg-[#eef8f1] text-[#285b35]";
  if (level === "warning") return "border-[#d8ba6a] bg-[#fff8df] text-[#765600]";
  if (level === "critical") return "border-[#d59b9b] bg-[#fff1f1] text-[#8a2e2e]";
  return "border-[#c7d0d8] bg-[#f6f8f9] text-[#52616b]";
}

function vitalBarClass(level: string) {
  if (level === "normal") return "bg-[#4b8f5a]";
  if (level === "warning") return "bg-[#b08a27]";
  if (level === "critical") return "bg-[#a54848]";
  return "bg-[#9aa8b0]";
}

function vitalPercent(value: number | undefined | null, min: number, max: number) {
  if (value === undefined || value === null) return 0;
  return Math.min(100, Math.max(6, ((value - min) / (max - min)) * 100));
}

function UserIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 21c1.6-4.2 4.2-6 8-6s6.4 1.8 8 6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function ShieldIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 20 6v6c0 5-3.2 8-8 9-4.8-1-8-4-8-9V6l8-3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function LogoutIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 6H6v12h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M13 12h7" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="m17 8 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
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
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    mine: "all",
    type: "all",
    severity: "all"
  });
  const [sessionOpen, setSessionOpen] = useState(false);

  const isAdmin = useMemo(() => user?.roles.some((role) => role.name === "admin") ?? false, [user]);
  const primaryRole = user?.roles[0]?.name ?? "viewer";

  useEffect(() => {
    const storedToken = localStorage.getItem("minerguard_token");
    if (!storedToken) {
      window.location.href = "/login";
      return;
    }

    setToken(storedToken);
    void load(storedToken);
  }, []);

  useEffect(() => {
    if (!token) return;

    const interval = window.setInterval(() => {
      void refreshDashboard();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [token]);

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

  async function refreshDashboard() {
    try {
      const dashboard = await api("/api/dashboard");
      setData(dashboard);
    } catch {
      return;
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
    return <main className="network-bg grid min-h-screen place-items-center bg-[#f4f6f8] text-[#52616b]">Cargando MinerGuard...</main>;
  }

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);
  const selectedMine = data.mines[0];

  return (
    <main className="network-bg min-h-screen bg-[#f4f6f8] text-[#172026]">
      <header className="sticky top-0 z-[80] border-b border-[#d8dee4] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo />
            <div className="hidden border-l border-[#d8dee4] pl-4 sm:block">
              <p className="text-sm font-medium text-[#172026]">Centro de monitoreo operativo</p>
              <p className="text-xs text-[#52616b]">LoRa, signos vitales y trazabilidad minera</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="relative">
              <button
                onClick={() => setSessionOpen((value) => !value)}
                className="flex items-center gap-3 rounded border border-[#d8dee4] bg-[#f8fafb] px-3 py-2 text-left transition hover:border-[#2f6f73] hover:bg-white"
                aria-expanded={sessionOpen}
              >
                <div className="grid h-9 w-9 place-items-center rounded bg-white text-[#2f6f73] shadow-sm">
                  <UserIcon size={22} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold leading-tight text-[#172026]">{user.fullName ?? user.username}</p>
                  <p className="text-xs text-[#52616b]">@{user.username}</p>
                </div>
                <span className="flex items-center gap-1 rounded border border-[#8bbf9f] bg-[#eef8f1] px-2 py-1 text-xs font-semibold text-[#285b35]">
                  <ShieldIcon />
                  {primaryRole}
                </span>
              </button>

              {sessionOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-[min(360px,calc(100vw-2rem))] rounded border border-[#d8dee4] bg-white p-4 text-sm shadow-xl">
                  <div className="flex items-start gap-3 border-b border-[#e5e9ed] pb-3">
                    <div className="grid h-10 w-10 place-items-center rounded bg-[#eef8f1] text-[#2f6f73]">
                      <UserIcon size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#172026]">{user.fullName ?? "Usuario sin nombre"}</p>
                      <p className="text-xs text-[#52616b]">@{user.username}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <InfoLine label="Estado" value={user.status} />
                    <InfoLine label="Correo" value={user.email ?? "No registrado"} />
                    <InfoLine label="Roles" value={user.roles.map((role) => role.name).join(", ")} />
                    <InfoLine label="API" value={getApiUrl()} />
                  </div>
                  <div className="mt-3 rounded border border-[#fff0c2] bg-[#fff8df] px-3 py-2 text-xs text-[#765600]">
                    {user.mustChangePassword
                      ? "Cambio de contrasena recomendado para esta cuenta."
                      : "Sesion activa con permisos asignados."}
                  </div>
                  <button
                    onClick={logout}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-[#d59b9b] bg-[#fff1f1] px-3 py-2 font-semibold text-[#8a2e2e] transition hover:bg-white"
                  >
                    <LogoutIcon />
                    Salir
                  </button>
                </div>
              ) : null}
            </div>
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
          {view === "miners" && <Miners miners={data.miners} mines={data.mines} filters={filters} setFilters={setFilters} />}
          {view === "devices" && <Devices devices={data.devices} mines={data.mines} filters={filters} setFilters={setFilters} />}
          {view === "gateways" && <Gateways gateways={data.gateways} mines={data.mines} filters={filters} setFilters={setFilters} />}
          {view === "alerts" && <Alerts alerts={data.alerts} filters={filters} setFilters={setFilters} />}
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

function Miners({ miners, mines, filters, setFilters }: { miners: any[]; mines: any[]; filters: any; setFilters: (filters: any) => void }) {
  const filtered = miners.filter((miner) => {
    const text = `${miner.fullName} ${miner.document ?? ""} ${miner.mine?.name ?? ""}`;
    return matchesText(text, filters.search) && (filters.status === "all" || miner.status === filters.status) && (filters.mine === "all" || miner.mineId === filters.mine);
  });
  const withVitals = filtered.filter((miner) => miner.devices?.[0]?.vitalSigns?.[0]).length;

  return (
    <Panel title="Mineros registrados" subtitle="Estado, signos vitales y nodo cercano del personal">
      <MiniStats items={[["Resultados", filtered.length], ["Con vitales", withVitals], ["Activos", filtered.filter((miner) => miner.status === "active").length], ["En riesgo", filtered.filter((miner) => ["warning", "emergency"].includes(miner.status)).length]]} />
      <FilterBar filters={filters} setFilters={setFilters} mines={mines} statuses={uniqueValues(miners, (miner) => miner.status)} placeholder="Buscar minero, documento o mina" />
      {filtered.map((miner) => {
        const primaryDevice = miner.devices?.[0];
        const vitals = primaryDevice?.vitalSigns?.[0];
        const signal = primaryDevice?.nodeSignals?.[0];
        const heartLevel = heartRateLevel(vitals?.heartRate);
        const oxygenLevel = spo2Level(vitals?.spo2);
        return (
          <article key={miner.id} className="soft-in rounded border border-[#d8dee4] bg-white p-4 transition hover:border-[#2f6f73]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-[220px]">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{miner.fullName}</p>
                  <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${statusClass(miner.status)}`}>{miner.status}</span>
                </div>
                <p className="mt-1 text-sm text-[#52616b]">{miner.document ?? "Sin documento"} - {miner.mine?.name ?? "Sin mina"}</p>
                <p className="mt-1 text-xs text-[#6b7a84]">Nodo cercano: {signal?.nearestNodeCode ?? "N/D"} - Dispositivo: {primaryDevice?.code ?? "Sin asignar"}</p>
              </div>

              <div className="grid flex-1 gap-3 md:grid-cols-2">
                <VitalCard
                  label="Frecuencia cardiaca"
                  value={vitals?.heartRate}
                  unit="bpm"
                  level={heartLevel}
                  percent={vitalPercent(vitals?.heartRate, 40, 150)}
                  hint={heartLevel === "normal" ? "Rango estable" : heartLevel === "warning" ? "Observacion" : heartLevel === "critical" ? "Critico" : "Sin datos"}
                />
                <VitalCard
                  label="Oxigenacion SpO2"
                  value={vitals?.spo2}
                  unit="%"
                  level={oxygenLevel}
                  percent={vitalPercent(vitals?.spo2, 80, 100)}
                  hint={oxygenLevel === "normal" ? "Saturacion normal" : oxygenLevel === "warning" ? "Baja moderada" : oxygenLevel === "critical" ? "Baja critica" : "Sin datos"}
                />
              </div>
            </div>
          </article>
        );
      })}
      {filtered.length === 0 ? <EmptyState /> : null}
    </Panel>
  );
}

function matchesText(value: string, search: string) {
  return value.toLowerCase().includes(search.trim().toLowerCase());
}

function uniqueValues(items: any[], selector: (item: any) => string | undefined | null) {
  return Array.from(new Set(items.map(selector).filter(Boolean) as string[])).sort();
}

function FilterBar({
  filters,
  setFilters,
  mines = [],
  statuses = [],
  types = [],
  severities = [],
  placeholder = "Buscar"
}: {
  filters: any;
  setFilters: (filters: any) => void;
  mines?: any[];
  statuses?: string[];
  types?: string[];
  severities?: string[];
  placeholder?: string;
}) {
  return (
    <div className="mb-4 grid gap-3 rounded border border-[#d8dee4] bg-[#f8fafb] p-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
      <input
        className="rounded border border-[#c7d0d8] bg-white px-3 py-2 text-sm outline-none focus:border-[#2f6f73]"
        placeholder={placeholder}
        value={filters.search}
        onChange={(event) => setFilters({ ...filters, search: event.target.value })}
      />
      {mines.length > 0 ? (
        <select className="rounded border border-[#c7d0d8] bg-white px-3 py-2 text-sm" value={filters.mine} onChange={(event) => setFilters({ ...filters, mine: event.target.value })}>
          <option value="all">Todas las minas</option>
          {mines.map((mine) => <option key={mine.id} value={mine.id}>{mine.name}</option>)}
        </select>
      ) : null}
      {statuses.length > 0 ? (
        <select className="rounded border border-[#c7d0d8] bg-white px-3 py-2 text-sm" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="all">Todos los estados</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      ) : null}
      {types.length > 0 ? (
        <select className="rounded border border-[#c7d0d8] bg-white px-3 py-2 text-sm" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
          <option value="all">Todos los tipos</option>
          {types.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      ) : null}
      {severities.length > 0 ? (
        <select className="rounded border border-[#c7d0d8] bg-white px-3 py-2 text-sm" value={filters.severity} onChange={(event) => setFilters({ ...filters, severity: event.target.value })}>
          <option value="all">Toda severidad</option>
          {severities.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
        </select>
      ) : null}
    </div>
  );
}

function MiniStats({ items }: { items: Array<[string, string | number]> }) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded border border-[#d8dee4] bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[#6b7a84]">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded border border-dashed border-[#b7c2cc] bg-[#f8fafb] px-4 py-8 text-center text-sm text-[#52616b]">
      No hay resultados con los filtros actuales.
    </div>
  );
}

function VitalCard({
  label,
  value,
  unit,
  level,
  percent,
  hint
}: {
  label: string;
  value?: number | null;
  unit: string;
  level: string;
  percent: number;
  hint: string;
}) {
  return (
    <div className={`rounded border p-3 ${vitalClass(level)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
          <p className="mt-1 text-2xl font-semibold">
            {value ?? "N/D"} <span className="text-sm font-medium">{value === undefined || value === null ? "" : unit}</span>
          </p>
        </div>
        <span className="rounded border border-current px-2 py-1 text-xs font-semibold">{hint}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded bg-white/70">
        <div className={`h-full rounded ${vitalBarClass(level)}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Devices({ devices, mines, filters, setFilters }: { devices: any[]; mines: any[]; filters: any; setFilters: (filters: any) => void }) {
  const filtered = devices.filter((device) => {
    const text = `${device.code} ${device.type} ${device.miner?.fullName ?? ""} ${device.mine?.name ?? ""}`;
    return matchesText(text, filters.search) && (filters.status === "all" || device.status === filters.status) && (filters.mine === "all" || device.mineId === filters.mine) && (filters.type === "all" || device.type === filters.type);
  });

  return (
    <Panel title="Dispositivos enlazados" subtitle="Cascos, relojes, tags, sensores y modulos LoRa">
      <MiniStats items={[["Resultados", filtered.length], ["Online", filtered.filter((device) => device.status === "online").length], ["Con minero", filtered.filter((device) => Boolean(device.minerId)).length], ["Bateria baja", filtered.filter((device) => (device.telemetry?.[0]?.battery ?? 100) < 25).length]]} />
      <FilterBar filters={filters} setFilters={setFilters} mines={mines} statuses={uniqueValues(devices, (device) => device.status)} types={uniqueValues(devices, (device) => device.type)} placeholder="Buscar dispositivo, tipo o minero" />
      {filtered.map((device) => {
        const telemetry = device.telemetry?.[0];
        const vitals = device.vitalSigns?.[0];
        const location = device.locations?.[0];
        return (
          <Row
            key={device.id}
            title={device.code}
            meta={`${device.type} - ${device.miner?.fullName ?? "Sin asignar"}`}
            status={device.status}
            detail={`Bateria ${telemetry?.battery ?? "N/D"}% - RSSI ${telemetry?.signalRssi ?? "N/D"} - BPM ${vitals?.heartRate ?? "N/D"} - (${location?.x?.toFixed?.(1) ?? "?"}, ${location?.y?.toFixed?.(1) ?? "?"})`}
          />
        );
      })}
      {filtered.length === 0 ? <EmptyState /> : null}
    </Panel>
  );
}

function Gateways({ gateways, mines, filters, setFilters }: { gateways: any[]; mines: any[]; filters: any; setFilters: (filters: any) => void }) {
  const filtered = gateways.filter((gateway) => {
    const text = `${gateway.name} ${gateway.code} ${gateway.mine?.name ?? ""}`;
    return matchesText(text, filters.search) && (filters.status === "all" || gateway.status === filters.status) && (filters.mine === "all" || gateway.mineId === filters.mine);
  });

  return (
    <Panel title="Nodos y gateways" subtitle="Puntos de comunicacion LoRa/MQTT de la operacion">
      <MiniStats items={[["Resultados", filtered.length], ["Online", filtered.filter((gateway) => gateway.status === "online").length], ["Revision", filtered.filter((gateway) => gateway.status === "warning").length], ["Offline", filtered.filter((gateway) => gateway.status === "offline").length]]} />
      <FilterBar filters={filters} setFilters={setFilters} mines={mines} statuses={uniqueValues(gateways, (gateway) => gateway.status)} placeholder="Buscar nodo, codigo o mina" />
      {filtered.map((gateway) => <Row key={gateway.id} title={gateway.name} meta={`${gateway.code} - ${gateway.mine?.name ?? "Sin mina"}`} status={gateway.status} detail="Nodo registrado para cobertura interna o exterior" />)}
      {filtered.length === 0 ? <EmptyState /> : null}
    </Panel>
  );
}

function Alerts({ alerts, compact = false, filters, setFilters }: { alerts: any[]; compact?: boolean; filters?: any; setFilters?: (filters: any) => void }) {
  const filtered = filters
    ? alerts.filter((alert) => {
        const text = `${alert.message} ${alert.type} ${alert.device?.code ?? ""} ${alert.device?.miner?.fullName ?? ""}`;
        return matchesText(text, filters.search) && (filters.status === "all" || alert.status === filters.status) && (filters.severity === "all" || alert.severity === filters.severity);
      })
    : alerts;

  return (
    <Panel title={compact ? "Alertas recientes" : "Centro de alertas"} subtitle="Eventos que requieren seguimiento operativo">
      {!compact && filters && setFilters ? (
        <>
          <MiniStats items={[["Resultados", filtered.length], ["Abiertas", filtered.filter((alert) => alert.status === "open").length], ["Criticas", filtered.filter((alert) => alert.severity === "critical").length], ["Resueltas", filtered.filter((alert) => alert.status === "resolved").length]]} />
          <FilterBar filters={filters} setFilters={setFilters} statuses={uniqueValues(alerts, (alert) => alert.status)} severities={uniqueValues(alerts, (alert) => alert.severity)} placeholder="Buscar alerta, dispositivo o minero" />
        </>
      ) : null}
      {filtered.map((alert) => <Row key={alert.id} title={alert.message} meta={`${alert.type} - ${alert.device?.code ?? "Operacion"}`} status={alert.status} detail={`Severidad ${alert.severity}`} />)}
      {filtered.length === 0 ? <EmptyState /> : null}
    </Panel>
  );
}

function MineMap({ mine, devices }: { mine: any; devices: any[] }) {
  const visibleDevices = devices.filter((device) => device.mineId === mine?.id).slice(0, 14);
  const gateways = mine?.gateways ?? [];

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
        <div className="relative min-h-[430px] overflow-hidden rounded border border-[#9aaeb8] bg-[#f4f7f8] p-5">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 520" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <pattern id="grid2d" width="45" height="45" patternUnits="userSpaceOnUse">
                <path d="M45 0H0V45" fill="none" stroke="#d8e1e5" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="900" height="520" fill="url(#grid2d)" />
            <path d="M74 34 L92 126 L125 188 L190 240 L195 314 L230 372 L310 396 L442 394 L460 412 L468 456 L450 506" fill="none" stroke="#2f3b43" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M190 240 L244 180 L332 126 L405 82 L438 42 L486 75 L448 96" fill="none" stroke="#2f3b43" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M442 394 L590 394 C708 350 752 245 735 178 C722 128 665 103 612 116 C548 132 506 190 490 256 L450 236" fill="none" stroke="#2f3b43" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M735 178 L784 195 L786 226 L753 216" fill="none" stroke="#2f3b43" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M74 34 L92 126 L125 188 L190 240 L195 314 L230 372 L310 396 L442 394 L460 412 L468 456 L450 506" fill="none" stroke="#f4f7f8" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M190 240 L244 180 L332 126 L405 82 L438 42 L486 75 L448 96" fill="none" stroke="#f4f7f8" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M442 394 L590 394 C708 350 752 245 735 178 C722 128 665 103 612 116 C548 132 506 190 490 256 L450 236" fill="none" stroke="#f4f7f8" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M735 178 L784 195 L786 226 L753 216" fill="none" stroke="#f4f7f8" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M74 34 L92 126 L125 188 L190 240 L195 314 L230 372 L310 396 L442 394 L460 412 L468 456 L450 506" fill="none" stroke="#20282d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M190 240 L244 180 L332 126 L405 82 L438 42 L486 75 L448 96" fill="none" stroke="#20282d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M442 394 L590 394 C708 350 752 245 735 178 C722 128 665 103 612 116 C548 132 506 190 490 256 L450 236" fill="none" stroke="#20282d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M735 178 L784 195 L786 226 L753 216" fill="none" stroke="#20282d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M70 36 L52 24 M70 36 L54 52 M438 42 L416 28 M438 42 L424 64 M490 256 L462 258 M490 256 L472 276 M735 178 L758 164 M735 178 L760 190" stroke="#20282d" strokeWidth="3" strokeLinecap="round" />
          </svg>

          <div className="absolute left-5 top-5 rounded border border-[#c7d0d8] bg-white px-3 py-2 text-xs text-[#52616b]">
            Plano 2D del socavon
          </div>

          {gateways.map((gateway: any, index: number) => {
            const gatewayPositions = [
              { left: "12%", top: "18%" },
              { left: "50%", top: "34%" },
              { left: "78%", top: "66%" },
              { left: "32%", top: "76%" },
              { left: "84%", top: "44%" }
            ];
            return (
              <div key={gateway.id} className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2" style={gatewayPositions[index % gatewayPositions.length]}>
                <div className={`grid h-6 w-6 place-items-center rounded border-2 border-white text-[10px] font-bold text-white ${gateway.status === "offline" ? "bg-[#a54848]" : gateway.status === "warning" ? "bg-[#b08a27]" : "bg-[#4b7f52]"}`}>N</div>
                <span className="rounded border border-[#c7d0d8] bg-white px-2 py-1 text-[11px] font-semibold text-[#2f3b43]">{gateway.code}</span>
              </div>
            );
          })}

          {visibleDevices.map((device, index) => {
            const location = device.locations?.[0];
            const left = `${Math.min(92, Math.max(8, location?.x ?? 16 + index * 8))}%`;
            const top = `${Math.min(86, Math.max(12, location?.y ?? 24 + (index % 4) * 16))}%`;
            const vitals = device.vitalSigns?.[0];
            const heartLevel = heartRateLevel(vitals?.heartRate);
            const oxygenLevel = spo2Level(vitals?.spo2);
            const hasVitalRisk = heartLevel === "critical" || oxygenLevel === "critical";
            const hasVitalWarning = heartLevel === "warning" || oxygenLevel === "warning";
            return (
              <div key={device.id} className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
                <div className={`grid h-11 w-11 place-items-center rounded-full border-2 text-[11px] font-bold ${hasVitalRisk || device.status === "offline" || device.status === "emergency" ? "border-[#a54848] bg-[#fff1f1] text-[#8a2e2e]" : hasVitalWarning || device.status === "warning" ? "border-[#b08a27] bg-[#fff8df] text-[#765600]" : "border-[#2f6f73] bg-white text-[#24575a]"}`}>
                  M
                </div>
                <div className="mt-1 rounded border border-[#d8dee4] bg-white px-2 py-1 text-[10px] text-[#2f3b43]">
                  <strong>{device.code}</strong> · {vitals?.heartRate ?? "N/D"} bpm · {vitals?.spo2 ?? "N/D"}%
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-4 left-5 right-5 grid gap-2 rounded border border-[#c7d0d8] bg-white p-3 text-xs text-[#52616b] md:grid-cols-4">
            <span><strong>N</strong>: nodo LoRa</span>
            <span><strong>M</strong>: wearable minero</span>
            <span>Coordenadas: Unity x/y</span>
            <span>Amarillo/rojo: alerta</span>
          </div>
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded bg-[#f8fafb] px-3 py-2">
      <span className="text-xs uppercase tracking-[0.12em] text-[#6b7a84]">{label}</span>
      <span className="max-w-[180px] truncate text-right font-medium text-[#172026]" title={value}>{value}</span>
    </div>
  );
}
