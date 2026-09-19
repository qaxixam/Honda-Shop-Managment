import React, { useEffect, useState } from "react";
import { Database, Download, FolderOpen } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { Button, Panel } from "../components/ui";

export default function ShopSettings() {
  const desktop = window.hbmsDesktop;
  const [location, setLocation] = useState("Browser storage");
  const [message, setMessage] = useState("");
  useEffect(() => { desktop?.location().then((value) => value && setLocation(value)); }, [desktop]);

  async function chooseLocation() {
    const value = await desktop?.chooseLocation();
    if (value) {
      setLocation(value.path);
      setMessage("Shop database location updated. Reloading data from the selected location…");
      window.setTimeout(() => window.location.reload(), 250);
    }
  }
  async function backup() {
    const value = await desktop?.backup();
    if (value) setMessage(`Backup saved to ${value}`);
  }

  return <div className="space-y-4">
    <PageHeader title="Shop & Backup" subtitle="Choose where your local shop database is stored and create backups." />
    <Panel><div className="space-y-5 p-5"><div className="flex items-start gap-3"><Database size={20} className="mt-0.5 text-hm-primary" /><div><h2 className="text-hm-title text-hm-text">Local SQL database</h2><p className="mt-1 text-hm-body text-hm-text-muted">Every transaction is stored in the selected local SQLite database.</p><p className="mt-2 break-all rounded-hm-md border border-hm-border bg-hm-surface-2 px-3 py-2 text-hm-meta text-hm-text-subtle">{location}</p></div></div><div className="flex flex-wrap gap-2"><Button onClick={chooseLocation}><FolderOpen size={15} /> Choose shop location</Button><Button variant="secondary" onClick={backup}><Download size={15} /> Backup database</Button></div>{message && <p className="text-hm-meta text-hm-success">{message}</p>}</div></Panel>
  </div>;
}
