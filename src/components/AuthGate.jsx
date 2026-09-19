import React, { useEffect, useState } from "react";
import { Button, Input, Panel } from "./ui";
import FormField from "./FormField";

export default function AuthGate({ children }) {
  const auth = window.hbmsDesktop?.auth;
  const [status, setStatus] = useState(null);
  const [setup, setSetup] = useState({ username: "", password: "", confirm: "" });
  const [login, setLogin] = useState({ username: "", password: "" });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("hbms_session") || "null"); } catch { return null; }
  });
  const [error, setError] = useState("");

  useEffect(() => { auth?.status().then(setStatus).catch((e) => setError(e.message)); }, [auth]);
  if (!auth) return children;
  if (!status) return <div className="grid min-h-screen place-items-center text-hm-text-muted">Loading secure login…</div>;
  if (user) return children;

  async function submitSetup(e) {
    e.preventDefault(); setError("");
    if (setup.password !== setup.confirm) return setError("Passwords do not match.");
    try { const loggedIn = await auth.setup(setup.username, setup.password); sessionStorage.setItem("hbms_session", JSON.stringify(loggedIn)); setUser(loggedIn); } catch (err) { setError(err.message); }
  }
  async function submitLogin(e) {
    e.preventDefault(); setError("");
    try { const loggedIn = await auth.login(login.username, login.password); sessionStorage.setItem("hbms_session", JSON.stringify(loggedIn)); setUser(loggedIn); } catch (err) { setError(err.message); }
  }
  const form = status.setupRequired ? setup : login;
  const setForm = status.setupRequired ? setSetup : setLogin;
  return <div className="grid min-h-screen place-items-center bg-hm-bg px-4"><Panel className="w-full max-w-md"><div className="p-6"><h1 className="text-hm-title text-hm-text">HBMS {status.setupRequired ? "Admin setup" : "Login"}</h1><p className="mt-1 text-hm-body text-hm-text-muted">{status.setupRequired ? "Create the first local administrator account." : "Sign in to manage your shop."}</p><form className="mt-5 space-y-3" onSubmit={status.setupRequired ? submitSetup : submitLogin}><FormField label="Username" required htmlFor="auth-username"><Input id="auth-username" autoFocus value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></FormField><FormField label="Password" required htmlFor="auth-password"><Input id="auth-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></FormField>{status.setupRequired && <FormField label="Confirm password" required htmlFor="auth-confirm"><Input id="auth-confirm" type="password" value={setup.confirm} onChange={(e) => setSetup({ ...setup, confirm: e.target.value })} /></FormField>}{error && <p className="rounded-hm-md bg-hm-danger-soft px-3 py-2 text-hm-meta text-hm-danger">{error}</p>}<Button className="w-full" type="submit">{status.setupRequired ? "Create admin account" : "Login"}</Button></form></div></Panel></div>;
}
