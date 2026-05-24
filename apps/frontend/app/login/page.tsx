"use client";

import { FormEvent, useState } from "react";
import { BrandLogo } from "../components/BrandLogo";

type LoginState = "idle" | "loading" | "success" | "error";

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? `http://${window.location.hostname}:4000`;
}

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [state, setState] = useState<LoginState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error("Credenciales invalidas");
      }

      const data = await response.json();
      localStorage.setItem("minerguard_token", data.token);
      localStorage.setItem("minerguard_user", JSON.stringify(data.user));
      setState("success");
      setMessage(`Sesion iniciada como ${data.user.username}`);
      window.location.href = "/dashboard";
    } catch (error) {
      setState("error");
      setMessage((error as Error).message);
    }
  }

  return (
    <main className="network-bg grid min-h-screen bg-[#f4f6f8] px-5 py-8 text-[#172026] lg:grid-cols-[1fr_420px]">
      <section className="hidden items-center justify-center border-r border-[#d8dee4] px-10 lg:flex">
        <div className="max-w-xl">
          <BrandLogo />
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Acceso operativo al monitoreo minero
          </h1>
          <p className="mt-4 text-base leading-7 text-[#52616b]">
            Autenticacion interna para administradores, operadores, editores y usuarios de
            visualizacion.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[420px] rounded border border-[#d8dee4] bg-white p-6"
        >
          <div className="space-y-5">
            <BrandLogo />
            <div className="border-t border-[#e5e9ed] pt-5">
            <h2 className="text-xl font-semibold">Iniciar sesion</h2>
            </div>
          </div>

          <label className="mt-6 block text-sm font-medium" htmlFor="username">
            Usuario
          </label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded border border-[#c7d0d8] px-3 py-2 outline-none focus:border-[#2f6f73]"
            autoComplete="username"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="password">
            Contrasena
          </label>
          <input
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded border border-[#c7d0d8] px-3 py-2 outline-none focus:border-[#2f6f73]"
            type="password"
            autoComplete="current-password"
          />

          <button
            disabled={state === "loading"}
            className="mt-6 w-full rounded bg-[#2f6f73] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            type="submit"
          >
            {state === "loading" ? "Validando..." : "Ingresar"}
          </button>

          {message ? (
            <p
              className={`mt-4 rounded border px-3 py-2 text-sm ${
                state === "success"
                  ? "border-[#8bbf9f] bg-[#eef8f1] text-[#285b35]"
                  : "border-[#d59b9b] bg-[#fff1f1] text-[#8a2e2e]"
              }`}
            >
              {message}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
