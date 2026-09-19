import React, { useEffect, useState } from "react";
import { Database, Download, FolderOpen } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { Button, Panel } from "../components/ui";
import { Input } from "../components/ui";
import FormField from "../components/FormField";
import { useAppData } from "../context/AppDataContext";

export default function ShopSettings() {
  const desktop = window.hbmsDesktop;
  const { shopSettings = {}, updateCollection } = useAppData();
  const [shopName, setShopName] = useState(shopSettings.shopName || "");
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
  async function importData() {
    try {
      const value = await desktop?.import();
      if (value) {
        setMessage("Data imported successfully. Reloading the application…");
        window.setTimeout(() => window.location.reload(), 250);
      }
    } catch (error) {
      setMessage(error?.message || "Import failed. Please select a valid HBMS backup file.");
    }
  }
  function saveShopName() {
    updateCollection("shopSettings", { shopName: shopName.trim() });
    setMessage("Shop name saved.");
  }

  return <div className="space-y-4">
    <PageHeader title="Administration" subtitle="Manage your shop identity, local data location, and backups." />
    <Panel><div className="space-y-5 p-5"><div className="max-w-xl"><FormField label="Shop name" hint="This name is saved with your local shop data." htmlFor="shop-name"><Input id="shop-name" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Honda Bike Shop" /></FormField><Button className="mt-3" onClick={saveShopName}>Save shop name</Button></div><div className="flex items-start gap-3"><Database size={20} className="mt-0.5 text-hm-primary" /><div><h2 className="text-hm-title text-hm-text">Local SQL database</h2><p className="mt-1 text-hm-body text-hm-text-muted">Every transaction and administration setting is stored in the selected local database.</p><p className="mt-2 break-all rounded-hm-md border border-hm-border bg-hm-surface-2 px-3 py-2 text-hm-meta text-hm-text-subtle">Data location: {location}</p></div></div><div className="flex flex-wrap gap-2"><Button onClick={chooseLocation}><FolderOpen size={15} /> Choose data location</Button><Button variant="secondary" onClick={backup}><Download size={15} /> Export backup</Button><Button variant="secondary" onClick={importData}><FolderOpen size={15} /> Import data</Button></div>{message && <p className="text-hm-meta text-hm-success">{message}</p>}</div></Panel>
  </div>;
}
