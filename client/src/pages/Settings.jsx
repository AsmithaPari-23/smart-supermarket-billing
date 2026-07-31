import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Database, 
  Download, 
  Upload, 
  Check, 
  AlertCircle,
  Sliders,
  ShieldAlert
} from 'lucide-react';

const Settings = () => {
  const { isAdmin } = useAuth();

  // Settings State
  const [formData, setFormData] = useState({
    storeName: '',
    address: '',
    phone: '',
    gstNumber: '',
    receiptFooter: '',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 18
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Restore State
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreMessage, setRestoreMessage] = useState('');
  const [restoreError, setRestoreError] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/settings');
      if (data.success) {
        setFormData(data.settings);
      }
    } catch (err) {
      console.error(err);
      setError('Could not fetch settings details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Map currency symbol
    let symbol = '$';
    if (formData.currency === 'INR') symbol = '₹';
    if (formData.currency === 'EUR') symbol = '€';
    if (formData.currency === 'GBP') symbol = '£';

    const payload = { ...formData, currencySymbol: symbol };

    try {
      const { data } = await axios.put('/api/settings', payload);
      if (data.success) {
        setMessage('Store settings updated successfully.');
        setFormData(data.settings);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating settings');
    }
  };

  // Backup Trigger
  const handleBackup = async () => {
    try {
      const { data } = await axios.post('/api/settings/backup');
      if (data.success) {
        // Create file download link in browser
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data.backup, null, 2)
        )}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `apex_erp_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        alert('Database backup JSON generated and downloaded successfully!');
      }
    } catch (err) {
      alert('Backup failed.');
    }
  };

  // Restore trigger
  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    setRestoreMessage('');
    setRestoreError('');

    if (!restoreFile) {
      setRestoreError('Please select a JSON backup file first.');
      return;
    }

    if (!window.confirm('WARNING: Restoring will overwrite all existing catalog products, users, CRM accounts, and billing logs. Do you want to proceed?')) return;

    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        const { data } = await axios.post('/api/settings/restore', { backupData: parsedData });
        if (data.success) {
          setRestoreMessage(data.message);
          setRestoreFile(null);
          fetchSettings(); // reload settings
        }
      } catch (err) {
        setRestoreError(err.response?.data?.message || 'Invalid JSON file structure.');
      }
    };
    fileReader.readAsText(restoreFile);
  };

  if (loading) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-brand-muted">Loading Store Configurations...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none pb-6">
      {/* Left side Store Configuration */}
      <div className="lg:col-span-2 glass-card p-6 rounded-[20px] border border-brand-border">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-dark mb-5 border-b border-brand-border pb-3">
          <Sliders size={18} className="text-brand-primary" />
          Supermarket Store Metadata & Invoice Settings
        </div>

        {message && <div className="p-3.5 mb-4 bg-brand-success/10 border border-brand-success/20 text-brand-success text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5"><Check size={16} />{message}</div>}
        {error && <div className="p-3.5 mb-4 bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5"><AlertCircle size={16} />{error}</div>}

        <form onSubmit={handleSettingsSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase block">Supermarket Store Name *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase block">Contact Phone *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-brand-muted uppercase block">Supermarket Outlet Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase block">GSTIN / Tax Registration No</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase block">POS Receipt Footer Note</label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase block">Default Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase block">Default Tax Rate (GST %)</label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-2">
              <button
                type="submit"
                className="glass-btn-primary py-2.5 px-6 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                Save Store Configuration
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Right side Backup/Restore database */}
      <div className="glass-card p-6 rounded-[20px] border border-brand-border space-y-6">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-dark border-b border-brand-border pb-3">
          <Database size={18} className="text-brand-primary" />
          System Maintenance & Backups
        </div>

        {/* Database Backup */}
        <div className="space-y-3 bg-brand-bg/80 border border-brand-border p-4 rounded-2xl">
          <h4 className="text-xs font-bold text-brand-dark flex items-center gap-2">
            <Download size={14} className="text-brand-primary" /> Database Backup JSON
          </h4>
          <p className="text-[11px] text-brand-muted leading-relaxed">
            Download a full snapshot backup file containing products, CRM profiles, cashiers, and checkout invoice logs.
          </p>
          <button
            onClick={handleBackup}
            className="w-full glass-btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2"
          >
            <Download size={14} />
            Export Database Backup
          </button>
        </div>

        {/* Database Restore */}
        {isAdmin && (
          <div className="space-y-3 bg-brand-danger/5 border border-brand-danger/20 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-brand-danger flex items-center gap-1.5">
              <ShieldAlert size={16} />
              Restore Database Snapshot
            </h4>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              Upload a JSON backup file. This will restore the database to that snapshot state.
            </p>

            {restoreMessage && <div className="p-2.5 bg-brand-success/10 border border-brand-success/20 text-brand-success text-[10px] font-bold rounded-xl text-center">{restoreMessage}</div>}
            {restoreError && <div className="p-2.5 bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-[10px] font-bold rounded-xl text-center">{restoreError}</div>}

            <form onSubmit={handleRestoreSubmit} className="space-y-3">
              <input
                type="file"
                accept=".json"
                onChange={(e) => setRestoreFile(e.target.files[0])}
                className="w-full border border-brand-border bg-white rounded-xl p-2 text-[11px] font-semibold text-brand-dark"
              />
              <button
                type="submit"
                className="w-full bg-brand-danger hover:bg-brand-danger/90 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Upload size={14} />
                Restore Snapshot
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
