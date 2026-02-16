"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (username === "lrnegocio" && password === "135796lR@") {
      localStorage.setItem("adminAuth", "true");

      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 100);

    } else {
      alert("Usuário ou senha incorretos!");
    }
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Login Administrativo - Léo TV</h2>

      <input
        type="text"
        placeholder="Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>
        Entrar
      </button>
    </div>
  );
}
