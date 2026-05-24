"use client";

import { useEffect } from "react";
import { BrandLogo } from "./components/BrandLogo";

export default function HomePage() {
  useEffect(() => {
    const token = localStorage.getItem("minerguard_token");
    window.location.replace(token ? "/dashboard" : "/login");
  }, []);

  return (
    <main className="network-bg grid min-h-screen place-items-center bg-[#f4f6f8] px-5 text-[#172026]">
      <div className="rounded border border-[#d8dee4] bg-white p-6 text-center shadow-sm">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <p className="mt-5 text-sm text-[#52616b]">Preparando acceso operativo...</p>
      </div>
    </main>
  );
}
