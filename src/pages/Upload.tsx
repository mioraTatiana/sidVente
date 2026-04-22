import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { SalesRecord } from '../types';
import Papa from 'papaparse';

const UploadPage: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<SalesRecord[]>([]);
  const [sending, setSending] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileId, setFileId] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'sent' | 'nifi'>('upload');
  const { addData } = useData(); // fallback add
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const newData: SalesRecord[] = results.data
            .map((row: any) => ({
              id_ventestocke: 0,
              date_vente: row.date_vente || '',
              produit: row.produit || '',
              categorie: row.categorie || '',
              quantite_vendue: parseInt(row.quantite_vente || '0'),
              prix_unitaire: parseFloat(row.prix_unitaire || '0'),
              quantite_stock: parseInt(row.quantite_stock || '0'),
            }))
            .filter(r => r.produit.trim() && r.quantite_vente > 0);
          setParsedData(newData);
          setStep('upload');
        },
      });
    }
  };

  const handleEnvoyer = async () => {
    if (!parsedData.length) {
      alert("Sélectionnez un fichier CSV valide.");
      return;
    }
    setSending(true);
    try {
      const formData = new FormData();
      const file = fileRef.current?.files?.[0];
      if (file) formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const { fileId: id, count } = await res.json();
        setFileId(id);
        setStep('sent');
        alert(`${count} lignes envoyées. Prêt NiFi.`);
      }
    } catch (err) {
      alert("Erreur backend. Check console.");
    } finally {
      setSending(false);
    }
  };

  const pollStatus = async (id: string) => {
    const check = async () => {
      try {
        const res = await fetch(`/api/status/${id}`);
        const { done } = await res.json();
        if (done) {
          addData(parsedData); // sync local
          alert("NiFi terminé ! Fichier dans output/.");
          navigate('/');
        } else {
          setTimeout(check, 1500);
        }
      } catch {
        setTimeout(check, 1500);
      }
    };
    check();
  };

  const handleLancerNiFi = () => {
    if (!fileId || step !== 'sent') {
      alert("Envoyez d'abord le fichier.");
      return;
    }
    setProcessing(true);
    setStep('nifi');
    pollStatus(fileId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-12 text-center">
          📁 Upload CSV Ventes
        </h1>

        <div className="space-y-8">
          <div>
            <label className="block text-xl font-semibold text-gray-800 mb-6 text-center">
              Choisir fichier CSV (format: date_vente,produit,categorie,quantite_vente,prix_unitaire,quantite_stock)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full p-6 border-2 border-dashed border-indigo-300 rounded-2xl bg-indigo-50 hover:border-indigo-400 transition-all text-center file:mr-4 file:py-3 file:px-8 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white cursor-pointer"
            />
            {fileName && <p className="mt-4 text-lg font-medium text-green-700 bg-green-100 p-3 rounded-xl text-center">{fileName} - {parsedData.length} produits OK ✅</p>}
          </div>

          {parsedData.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6 p-6 bg-green-50 rounded-2xl">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{parsedData.reduce((sum, r) => sum + r.quantite_vente, 0)}</div>
                <p>Quantité totale vendue</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{parsedData.length}</div>
                <p>Lignes prêtes</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleEnvoyer}
              disabled={sending || !parsedData.length}
              className="px-12 py-4 bg-indigo-600 text-white font-bold rounded-2xl text-lg shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? '📤 Envoi...' : '📤 Envoyer Backend'}
            </button>
            <button
              onClick={handleLancerNiFi}
              disabled={!fileId || processing || step !== 'sent'}
              className="px-12 py-4 bg-green-600 text-white font-bold rounded-2xl text-lg shadow-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? '⚙️ NiFi en cours...' : '🚀 Lancer NiFi'}
            </button>
          </div>

          {step === 'nifi' && (
            <div className="text-center p-8 bg-yellow-50 rounded-2xl">
              <div className="text-2xl">⏳ Attente NiFi...</div>
              <p>Fichier output: processed-{fileId?.slice(0,8)}...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;