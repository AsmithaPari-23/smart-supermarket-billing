import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Database, 
  Download, 
  Upload, 
  Check, 
  AlertCircle 
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
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
      {/* Left side Store Configuration */}
      <div className="lg:col-span-2 glass-card p-5 rounded-3xl border border-glass-border">
        <div className="flex items-center gap-2 text-sm font-bold font-heading text-text-primary mb-5 border-b border-glass-border pb-3">
          <SettingsIcon size={18} className="text-accent-primary animate-spin" style={{ animationDuration: '6s' }} />
          Store Metadata Settings
        </div>

        {message && <div className="p-3 mb-4 bg-green-500/10 border border-green-500/20 text-accent-success text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-1.5"><Check size={16} />{message}</div>}
        {error && <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-accent-danger text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-1.5"><AlertCircle size={16} />{error}</div>}

        <form onSubmit={handleSettingsSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Store Name *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Contact Phone *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Store Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">GSTIN / Tax Number</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Receipt Footer Note</label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Default Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Default Tax Rate (GST %)</label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
              />
            </div>
          </div>

          {isAdmin && (
            <button
              type="submit"
              className="bg-accent-primary hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition"
            >
              Save Store Config
            </button>
          )}
        </form>
      </div>

      {/* Right side Backup/Restore database */}
      <div className="glass-card p-5 rounded-3xl border border-glass-border space-y-6">
        <div className="flex items-center gap-2 text-sm font-bold font-heading text-text-primary border-b border-glass-border pb-3">
          <Database size={18} className="text-text-secondary" />
          ERP Maintenance
        </div>

        {/* Database Backup */}
        <div className="space-y-3 bg-white/35 border border-glass-border p-4 rounded-2xl">
          <h4 className="text-xs font-bold text-text-primary">Database Backup</h4>
          <p className="text-[10px] text-text-secondary leading-relaxed">
            Download a full snapshot backup file containing all products, CRM profiles, cashiers, and checkout invoice logs.
          </p>
          <button
            onClick={handleBackup}
            className="w-full bg-accent-primary hover:bg-blue-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <Download size={14} />
            Download JSON Backup
          </button>
        </div>

        {/* Database Restore */}
        {isAdmin && (
          <div className="space-y-3 bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-accent-danger flex items-center gap-1">
              <AlertCircle size={14} />
              Restore Database
            </h4>
            <p className="text-[10px] text-text-secondary leading-relaxed">
              Upload a previously downloaded JSON backup file. This will restore the database to that snapshot.
            </p>

            {restoreMessage && <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-accent-success text-[10px] font-semibold rounded-lg text-center">{restoreMessage}</div>}
            {restoreError && <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-accent-danger text-[10px] font-semibold rounded-lg text-center">{restoreError}</div>}

            <form onSubmit={handleRestoreSubmit} className="space-y-2.5">
              <input
                type="file"
                accept=".json"
                onChange={(e) => setRestoreFile(e.target.files[0])}
                className="w-full border border-glass-border bg-white rounded-lg p-1.5 text-[10px] font-semibold"
              />
              <button
                type="submit"
                className="w-full bg-accent-danger hover:bg-red-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition"
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
