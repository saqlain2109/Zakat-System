import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useZakat } from '../context/ZakatContext';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const ExcelImportModal = ({ isOpen, onClose }) => {
  const { beneficiaries, batchImportRecords, checkDuplicates, financialYear } = useZakat();
  const { currentUser } = useAuth();

  const [fileData, setFileData] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [rawRows, setRawRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    nameCol: '',
    amountCol: '',
    categoryCol: '',
    phoneCol: '',
    locationCol: '',
    statusCol: ''
  });
  const [importStep, setImportStep] = useState(1); // 1: Upload, 2: Map & Preview, 3: Review & Summary
  const [importSummary, setImportSummary] = useState(null);

  if (!isOpen) return null;

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        setFileData(wb);
        setSheetNames(wb.SheetNames);
        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        loadSheetRows(wb, firstSheet);
        setImportStep(2);
      } catch (err) {
        console.error(err);
        alert('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const loadSheetRows = (wb, sheetName) => {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
    setRawRows(data);

    // Auto-detect column headers
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      setColumnMapping({
        nameCol: keys.find(k => /name|student|beneficiary/i.test(k)) || keys[0] || '',
        amountCol: keys.find(k => /amount|fee|paid|allocated|cost/i.test(k)) || '',
        categoryCol: keys.find(k => /categor|class|program/i.test(k)) || '',
        phoneCol: keys.find(k => /phone|contact|mobile/i.test(k)) || '',
        locationCol: keys.find(k => /location|address|city|area/i.test(k)) || '',
        statusCol: keys.find(k => /status|paid/i.test(k)) || ''
      });
    }
  };

  // Perform Final Import
  const handleExecuteImport = () => {
    let processed = 0;
    let imported = 0;
    let duplicates = 0;
    const newBens = [];
    const newDists = [];

    rawRows.forEach((row, idx) => {
      processed++;
      const name = String(row[columnMapping.nameCol] || '').trim();
      if (!name) return;

      const phone = String(row[columnMapping.phoneCol] || '').trim();
      const location = String(row[columnMapping.locationCol] || '').trim();
      const category = String(row[columnMapping.categoryCol] || 'Zakat poor family').trim();
      const amount = Number(row[columnMapping.amountCol]) || 0;
      const statusRaw = String(row[columnMapping.statusCol] || '').toLowerCase();
      const isPaid = statusRaw.includes('paid') || statusRaw.includes('done');

      // Duplicate Check
      const dupMatches = checkDuplicates({ fullName: name, phone, location });
      if (dupMatches.length > 0) {
        duplicates++;
      }

      const benId = `BEN-IMP-${Date.now().toString().slice(-4)}-${idx + 1}`;
      newBens.push({
        id: benId,
        fullName: name,
        classification: category,
        subCategory: 'Imported Record',
        location,
        referencePerson: 'Akbar Sir',
        verificationStatus: 'Verified',
        phone,
        auditNotes: 'Imported via Excel Batch Upload',
        history: { [financialYear]: amount }
      });

      if (amount > 0) {
        newDists.push({
          id: `DIS-IMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
          beneficiaryId: benId,
          beneficiaryName: name,
          classification: category,
          categoryId: 'CAT-05',
          financialYear: Number(financialYear),
          amountAllocated: amount,
          amountPaid: isPaid ? amount : 0,
          paymentStatus: isPaid ? 'Paid' : 'Not Paid',
          paymentMethod: 'Bank Transfer',
          sourceAccountId: 'ACC-01',
          sourceAccountName: 'Employees acc',
          paidDate: isPaid ? new Date().toISOString().split('T')[0] : null,
          remarks: 'Imported batch voucher'
        });
      }

      imported++;
    });

    batchImportRecords({ beneficiaries: newBens, distributions: newDists }, currentUser?.name || 'Admin');

    setImportSummary({
      processed,
      imported,
      duplicates,
      skipped: processed - imported
    });
    setImportStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Excel Workbook Import Engine</h3>
              <p className="text-slate-500 text-xs">Import records from "Zakat File 2026.xlsx" or CSV into structured database</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* STEP 1: UPLOAD FILE */}
        {importStep === 1 && (
          <div className="space-y-4 py-4 text-center">
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 transition-colors flex flex-col items-center justify-center gap-3 bg-slate-50">
              <Upload className="w-10 h-10 text-blue-600" />
              <div>
                <strong className="text-slate-900 text-sm block">Choose Excel or CSV File</strong>
                <span className="text-slate-500 text-xs">Supports .xlsx, .xls, and .csv formats</span>
              </div>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="mt-2 text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Note: The importer will parse sheet tables, detect duplicates by phone & name, and map directly into normalized records.
            </p>
          </div>
        )}

        {/* STEP 2: SHEET SELECTION, COLUMN MAPPING & PREVIEW */}
        {importStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700">Select Sheet from Workbook:</span>
              <select
                value={selectedSheet}
                onChange={(e) => {
                  setSelectedSheet(e.target.value);
                  loadSheetRows(fileData, e.target.value);
                }}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
              >
                {sheetNames.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Column Mapping Inputs */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-blue-700 block uppercase tracking-wider text-[11px]">
                Column Mapping (Detected Headers):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.keys(columnMapping).map((mapKey) => (
                  <div key={mapKey}>
                    <label className="block text-slate-600 text-[10px] uppercase font-semibold mb-1">
                      {mapKey.replace('Col', ' Column')}
                    </label>
                    <select
                      value={columnMapping[mapKey]}
                      onChange={(e) => setColumnMapping({ ...columnMapping, [mapKey]: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1 text-slate-800 text-xs"
                    >
                      <option value="">-- None / Default --</option>
                      {rawRows.length > 0 && Object.keys(rawRows[0]).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview First 5 Rows */}
            <div className="space-y-1.5">
              <span className="text-slate-600 font-semibold block text-[11px]">
                Preview (First 5 Rows of {rawRows.length} total rows):
              </span>
              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 p-2">
                <table className="w-full text-left text-[11px]">
                  <thead className="text-slate-600 uppercase text-[9px] border-b border-slate-200">
                    <tr>
                      <th className="py-1 px-2">Name</th>
                      <th className="py-1 px-2">Category</th>
                      <th className="py-1 px-2">Phone</th>
                      <th className="py-1 px-2">Location</th>
                      <th className="py-1 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {rawRows.slice(0, 5).map((r, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2 font-medium">{r[columnMapping.nameCol] || '—'}</td>
                        <td className="py-1.5 px-2 text-slate-600">{r[columnMapping.categoryCol] || '—'}</td>
                        <td className="py-1.5 px-2 text-slate-600 font-mono">{r[columnMapping.phoneCol] || '—'}</td>
                        <td className="py-1.5 px-2 text-slate-600">{r[columnMapping.locationCol] || '—'}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-emerald-700 font-bold">
                          {r[columnMapping.amountCol] || '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setImportStep(1)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>Process & Import ({rawRows.length} Rows)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUMMARY */}
        {importStep === 3 && importSummary && (
          <div className="space-y-4 py-3 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div>
              <h4 className="text-lg font-bold text-slate-900">Import Completed Successfully!</h4>
              <p className="text-slate-500 text-xs">Records have been merged into the central system state.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-md mx-auto">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Processed</span>
                <strong className="text-slate-900 text-base font-mono">{importSummary.processed}</strong>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 uppercase block font-semibold">Imported</span>
                <strong className="text-emerald-700 text-base font-mono">{importSummary.imported}</strong>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-700 uppercase block font-semibold">Duplicates</span>
                <strong className="text-amber-700 text-base font-mono">{importSummary.duplicates}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Skipped</span>
                <strong className="text-slate-700 text-base font-mono">{importSummary.skipped}</strong>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
              >
                Done & View Records
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
