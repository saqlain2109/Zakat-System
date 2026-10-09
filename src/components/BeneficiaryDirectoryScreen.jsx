import React, { useState, useMemo } from 'react';
import { useZakat } from '../context/ZakatContext';
import { useAuth } from '../context/AuthContext';
import { formatINR, exportToCSV, exportToExcel, printReport } from '../utils/formatters';
import {
  Users2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Download,
  ShieldCheck,
  AlertTriangle,
  GraduationCap,
  MapPin,
  CheckCircle2,
  X,
  User,
  Building,
  SlidersHorizontal,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  History,
  FileSpreadsheet,
  Printer,
  ChevronDown
} from 'lucide-react';
import { VersionHistoryModal } from './VersionHistoryModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const DEFAULT_BENEFICIARY_COLUMNS = [
  { id: 'id', label: 'ID', visible: true, width: 'w-16' },
  { id: 'fullName', label: 'Recipient Profile', visible: true, width: '' },
  { id: 'classification', label: 'Category & Sub-Category', visible: true, width: '' },
  { id: 'referencePerson', label: 'Coordinator', visible: true, width: '' },
  { id: 'verificationStatus', label: 'Status', visible: true, width: 'text-center' },
  { id: 'location', label: 'Location & Contact', visible: true, width: '' },
  { id: 'phone', label: 'Phone', visible: false, width: '' },
  { id: 'guardianName', label: 'Parent / Guardian', visible: false, width: '' },
  { id: 'schoolName', label: 'School / Institute', visible: false, width: '' },
  { id: 'standard', label: 'Class / Standard', visible: false, width: '' },
  { id: 'auditNotes', label: 'Audit Notes', visible: false, width: '' },
  { id: 'actions', label: 'Actions', visible: true, width: 'text-center w-28' }
];

// Helper to provide dynamic sub-category recommendations based on the selected Category
const getSubCategoryOptions = (categoryName = '') => {
  const name = categoryName.toLowerCase();
  if (name.includes('school') || name.includes('education')) {
    return [
      'School Student Fee (1st - 10th)',
      'Junior College Grant (11th - 12th)',
      'Convent / Special School Student',
      'Madrasa / Hifz Student Assistance',
      'Higher Degree / University Grant',
      'Orphan Student Full Sponsorship'
    ];
  }
  if (name.includes('ration') || name.includes('food') || name.includes('aurangabad') || name.includes('khairkhwani')) {
    return [
      'Aurangabad Slum Colony Food Kit',
      'Mumbra Widow Family Ration',
      'Destitute / Single Earner Family Kit',
      'Ramzan Grocery Food Package',
      'Disabled / Paralyzed Head Family Ration'
    ];
  }
  if (name.includes('trust') || name.includes('mesco') || name.includes('anjuman')) {
    return [
      'MESCO Trust (Mumbai Central)',
      'Anjuman-I-Islam Sahara Trust',
      'Ummeed Foundation Special School',
      'Registered Charity Grant'
    ];
  }
  if (name.includes('madrasa') || name.includes('daarul') || name.includes('asma') || name.includes('sadqa')) {
    return [
      'Daarul Falah Madrasa (Kausa)',
      'Darul Yatama Asma Lil Banat Yateem Khana',
      'Orphan Girls Vocational Care',
      'Local Hifz Student Sponsorship'
    ];
  }
  if (name.includes('dubai') || name.includes('gulf') || name.includes('appeal')) {
    return [
      'Yemen Appeal — One Ummah',
      'Gaza Palestine Direct Relief',
      'Syria Winter Warmth Appeal',
      'Afghan Emergency Relief Fund'
    ];
  }
  // Default Poor Family
  return [
    'Widow Family Living Support',
    'Medical / Cancer / Dialysis Patient',
    'Handicapped / Elderly Dependent',
    'Day Laborer / Street Vendor Assistance',
    'Orphan Family Household Support'
  ];
};

export const BeneficiaryDirectoryScreen = ({ setActiveTab }) => {
  const {
    beneficiaries,
    categories,
    referencePersons,
    updateBeneficiary,
    addBeneficiary,
    deleteBeneficiary,
    checkDuplicates
  } = useZakat();

  const { isAuditor, isReadOnly } = useAuth();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Column Customizer State
  const [columns, setColumns] = useState(DEFAULT_BENEFICIARY_COLUMNS);
  const [showColumnModal, setShowColumnModal] = useState(false);

  // Check if any filter is active
  const isFilterActive =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
  };

  // Column reordering & visibility handlers
  const toggleColumnVisibility = (colId) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, visible: !c.visible } : c));
  };

  const moveColumn = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    const newCols = [...columns];
    const temp = newCols[index];
    newCols[index] = newCols[targetIndex];
    newCols[targetIndex] = temp;
    setColumns(newCols);
  };

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState(null);

  // Notification Banner
  const [notice, setNotice] = useState('');
  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  // Form states for NEW beneficiary
  const defaultCategory = categories[0]?.name || 'Zakat Poor Family';
  const [newBen, setNewBen] = useState({
    fullName: '',
    classification: defaultCategory,
    categoryId: categories[0]?.id || 'CAT-05',
    subCategory: getSubCategoryOptions(defaultCategory)[0] || 'Poor Family',
    standard: '',
    guardianName: '',
    schoolName: '',
    location: '',
    referencePerson: referencePersons[0]?.name || 'Akbar Sir',
    verificationStatus: 'Verified',
    phone: '',
    auditNotes: ''
  });

  // Dynamic subcategories for Add Form
  const addSubCatOptions = useMemo(() => {
    return getSubCategoryOptions(newBen.classification);
  }, [newBen.classification]);

  const isAddSchoolCase = useMemo(() => {
    const c = (newBen.classification || '').toLowerCase();
    return c.includes('school') || c.includes('education');
  }, [newBen.classification]);

  // Dynamic subcategories for Edit Form
  const editSubCatOptions = useMemo(() => {
    if (!editingBeneficiary) return [];
    return getSubCategoryOptions(editingBeneficiary.classification);
  }, [editingBeneficiary?.classification]);

  const isEditSchoolCase = useMemo(() => {
    if (!editingBeneficiary) return false;
    const c = (editingBeneficiary.classification || '').toLowerCase();
    return c.includes('school') || c.includes('education');
  }, [editingBeneficiary?.classification]);

  // Duplicate Check against existing beneficiaries
  const potentialDuplicates = useMemo(() => {
    if (!newBen.fullName.trim() && !newBen.phone.trim()) return [];
    return checkDuplicates(newBen);
  }, [newBen, checkDuplicates]);

  // Filtered List
  const filteredList = useMemo(() => {
    return beneficiaries.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.fullName.toLowerCase().includes(q) ||
        (b.classification && b.classification.toLowerCase().includes(q)) ||
        (b.subCategory && b.subCategory.toLowerCase().includes(q)) ||
        (b.location && b.location.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q)) ||
        (b.schoolName && b.schoolName.toLowerCase().includes(q)) ||
        (b.guardianName && b.guardianName.toLowerCase().includes(q));

      const matchesCat =
        categoryFilter === 'ALL' ||
        b.classification === categoryFilter ||
        b.categoryId === categoryFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (b.verificationStatus && b.verificationStatus.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [beneficiaries, searchQuery, categoryFilter, statusFilter]);

  // Handle Add Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newBen.fullName.trim()) return;

    const catObj = categories.find(c => c.name === newBen.classification);
    const refObj = referencePersons.find(r => r.name === newBen.referencePerson);

    addBeneficiary({
      ...newBen,
      categoryId: catObj?.id || 'CAT-05',
      referenceId: refObj?.id || 'REF-01',
      history: { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 }
    });

    setShowAddModal(false);
    showNotice(`Beneficiary "${newBen.fullName}" registered successfully!`);

    setNewBen({
      fullName: '',
      classification: defaultCategory,
      categoryId: categories[0]?.id || 'CAT-05',
      subCategory: getSubCategoryOptions(defaultCategory)[0] || 'Poor Family',
      standard: '',
      guardianName: '',
      schoolName: '',
      location: '',
      referencePerson: referencePersons[0]?.name || 'Akbar Sir',
      verificationStatus: 'Verified',
      phone: '',
      auditNotes: ''
    });
  };

  // Handle Edit Save
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingBeneficiary || !editingBeneficiary.fullName.trim()) return;

    const catObj = categories.find(c => c.name === editingBeneficiary.classification);
    const refObj = referencePersons.find(r => r.name === editingBeneficiary.referencePerson);

    updateBeneficiary({
      ...editingBeneficiary,
      categoryId: catObj?.id || editingBeneficiary.categoryId || 'CAT-05',
      referenceId: refObj?.id || editingBeneficiary.referenceId || 'REF-01'
    });

    showNotice(`Profile for "${editingBeneficiary.fullName}" updated successfully!`);
    setEditingBeneficiary(null);
  };

  // Handle Delete
  const handleDelete = (b) => {
    if (window.confirm(`Are you sure you want to delete beneficiary "${b.fullName}"?`)) {
      deleteBeneficiary(b.id);
      showNotice(`Beneficiary "${b.fullName}" removed.`);
    }
  };

  // Version History, Safe Delete, and Export States
  const [historyRecord, setHistoryRecord] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const getExportData = () => {
    return filteredList.map(b => ({
      ID: b.id,
      'Full Name': b.fullName,
      Category: b.classification,
      'Sub-Category': b.subCategory || '',
      Standard: b.standard || '',
      'Guardian / Parent': b.guardianName || '',
      'School / Institute': b.schoolName || '',
      Coordinator: b.referencePerson,
      'Verification Status': b.verificationStatus,
      Location: b.location || '',
      Phone: b.phone || '',
      'Audit Notes': b.auditNotes || ''
    }));
  };

  const handleExportCSV = () => {
    exportToCSV(getExportData(), 'Beneficiaries_Directory.csv');
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    exportToExcel(getExportData(), 'Beneficiaries_Directory.xls');
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    printReport(
      getExportData(),
      'Beneficiary Master Directory',
      `Category Filter: ${categoryFilter} • Verification Status: ${statusFilter} • Total Profiles: ${filteredList.length}`
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="w-5 h-5 text-blue-600" />
            <span>Beneficiary Directory</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Verified master profiles with category classifications, student guardian records, and audit history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Column Customizer Trigger */}
          <button
            onClick={() => setShowColumnModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
            title="Configure table columns"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Columns</span>
            <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-slate-100 text-slate-600 rounded-full font-bold">
              {columns.filter(c => c.visible).length}
            </span>
          </button>

          {/* Multi-Format Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
              title="Download or print filtered beneficiaries"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export ({filteredList.length})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-1.5 text-xs animate-fadeIn">
                <button
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel Sheet (.xls)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>CSV File (.csv)</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium border-t border-slate-100"
                >
                  <Printer className="w-4 h-4 text-purple-600" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            )}
          </div>

          {!isAuditor && !isReadOnly && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Beneficiary</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification */}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, colony, school..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dynamic Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Categories ({beneficiaries.length})</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* Verification Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Verification Statuses</option>
          <option value="Verified">Verified (Approved)</option>
          <option value="Under Re-Verification">Under Re-Verification</option>
          <option value="Cancel / Rejected">Cancel / Rejected</option>
          <option value="New Applicant">New Applicant</option>
        </select>

        {/* 1-Click Clear Filters Button */}
        {isFilterActive && (
          <button
            onClick={clearAllFilters}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors shrink-0"
            title="Reset search and filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* DIRECTORY TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                {columns.filter(c => c.visible).map(col => (
                  <th key={col.id} className={`py-3 px-3.5 font-semibold ${col.width || ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={columns.filter(c => c.visible).length || 1} className="py-12 text-center text-slate-400 text-xs">
                    No beneficiary records found matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredList.map(b => {
                  const isVerified = (b.verificationStatus || '').toLowerCase().includes('verified') && !(b.verificationStatus || '').toLowerCase().includes('re-verification');
                  const isCancel = (b.verificationStatus || '').toLowerCase().includes('cancel') || (b.verificationStatus || '').toLowerCase().includes('reject');
                  const isSchool = (b.classification || '').toLowerCase().includes('school') || (b.classification || '').toLowerCase().includes('education');

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      {columns.filter(c => c.visible).map(col => {
                        if (col.id === 'id') {
                          return <td key={col.id} className="py-3 px-3.5 font-mono text-slate-400 font-bold">{b.id}</td>;
                        }
                        if (col.id === 'fullName') {
                          return (
                            <td key={col.id} className="py-3 px-3.5">
                              <div className="font-bold text-slate-900 text-xs">{b.fullName}</div>
                              {isSchool && (b.standard || b.guardianName || b.schoolName) && (
                                <div className="text-[11px] text-blue-700 mt-0.5 flex flex-wrap items-center gap-1.5">
                                  {b.standard && <span className="bg-blue-50 px-1.5 py-0.2 rounded font-semibold">{b.standard}</span>}
                                  {b.guardianName && <span>Parent: {b.guardianName}</span>}
                                  {b.schoolName && <span className="text-slate-500">({b.schoolName})</span>}
                                </div>
                              )}
                              {b.auditNotes && (
                                <div className="text-[11px] text-slate-500 italic truncate max-w-xs mt-0.5">
                                  "{b.auditNotes}"
                                </div>
                              )}
                            </td>
                          );
                        }
                        if (col.id === 'classification') {
                          return (
                            <td key={col.id} className="py-3 px-3.5">
                              <span className="font-semibold text-slate-900 block">{b.classification}</span>
                              <span className="text-[11px] text-slate-500 block truncate max-w-xs">{b.subCategory}</span>
                            </td>
                          );
                        }
                        if (col.id === 'referencePerson') {
                          return <td key={col.id} className="py-3 px-3.5 text-slate-800">{b.referencePerson}</td>;
                        }
                        if (col.id === 'verificationStatus') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isVerified
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isCancel
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {b.verificationStatus}
                              </span>
                            </td>
                          );
                        }
                        if (col.id === 'location') {
                          return (
                            <td key={col.id} className="py-3 px-3.5">
                              <div className="text-slate-700 text-xs truncate max-w-xs">{b.location || '—'}</div>
                              <div className="text-[11px] font-mono text-slate-500">{b.phone || 'No Phone'}</div>
                            </td>
                          );
                        }
                        if (col.id === 'phone') {
                          return <td key={col.id} className="py-3 px-3.5 font-mono text-slate-700">{b.phone || '—'}</td>;
                        }
                        if (col.id === 'guardianName') {
                          return <td key={col.id} className="py-3 px-3.5 text-slate-700">{b.guardianName || '—'}</td>;
                        }
                        if (col.id === 'schoolName') {
                          return <td key={col.id} className="py-3 px-3.5 text-slate-700">{b.schoolName || '—'}</td>;
                        }
                        if (col.id === 'standard') {
                          return <td key={col.id} className="py-3 px-3.5 text-slate-700">{b.standard || '—'}</td>;
                        }
                        if (col.id === 'auditNotes') {
                          return <td key={col.id} className="py-3 px-3.5 text-slate-600 text-[11px] truncate max-w-xs">{b.auditNotes || '—'}</td>;
                        }
                        if (col.id === 'actions') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setHistoryRecord({ id: b.id, title: `${b.fullName} (${b.classification})` })}
                                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                                  title="View Version History & Audit Log"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                                {!isAuditor && !isReadOnly && (
                                  <>
                                    <button
                                      onClick={() => setEditingBeneficiary({ ...b })}
                                      className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                                      title="Edit Profile"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setItemToDelete(b)}
                                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                                      title="Move to Recycle Bin"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          );
                        }
                        return null;
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COLUMN CUSTOMIZER MODAL */}
      {showColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  Customize Directory Columns
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Show/hide columns and reorder position (Move Up / Down).
                </p>
              </div>
              <button
                onClick={() => setShowColumnModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2 divide-y divide-slate-100">
              {columns.map((col, index) => (
                <div key={col.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => toggleColumnVisibility(col.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className={`font-medium ${col.visible ? 'text-slate-900' : 'text-slate-400'}`}>
                      {col.label}
                    </span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveColumn(index, -1)}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === columns.length - 1}
                      onClick={() => moveColumn(index, 1)}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setColumns(DEFAULT_BENEFICIARY_COLUMNS)}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BENEFICIARY PROFILE */}
      {editingBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Beneficiary Profile ({editingBeneficiary.id})</span>
              </h3>
              <button onClick={() => setEditingBeneficiary(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingBeneficiary.fullName}
                  onChange={(e) => setEditingBeneficiary({ ...editingBeneficiary, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Category (Dynamic) */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                  <select
                    value={editingBeneficiary.classification}
                    onChange={(e) => {
                      const newCatName = e.target.value;
                      const newSubOptions = getSubCategoryOptions(newCatName);
                      setEditingBeneficiary({
                        ...editingBeneficiary,
                        classification: newCatName,
                        subCategory: newSubOptions[0] || 'Assistance'
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sub-Category (Dynamic based on Category) */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sub-Category / Type</label>
                  <select
                    value={editingBeneficiary.subCategory || ''}
                    onChange={(e) => setEditingBeneficiary({ ...editingBeneficiary, subCategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    {editSubCatOptions.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                    <option value={editingBeneficiary.subCategory}>Custom: {editingBeneficiary.subCategory}</option>
                  </select>
                </div>
              </div>

              {/* SPECIAL FIELDS: If School Fees / Student (Minor Details) */}
              {isEditSchoolCase && (
                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2.5">
                  <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Student Minor & School Details</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-blue-900 font-semibold text-[11px] mb-0.5">Standard / Class</label>
                      <input
                        type="text"
                        value={editingBeneficiary.standard || ''}
                        onChange={(e) => setEditingBeneficiary({ ...editingBeneficiary, standard: e.target.value })}
                        placeholder="e.g. 5th Std / Class 8"
                        className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-900 font-semibold text-[11px] mb-0.5">Parent / Guardian Name</label>
                      <input
                        type="text"
                        value={editingBeneficiary.guardianName || ''}
                        onChange={(e) => setEditingBeneficiary({ ...editingBeneficiary, guardianName: e.target.value })}
                        placeholder="Father / Mother name"
                        className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-900 font-semibold text-[11px] mb-0.5">School / College Name</label>
                      <input
                        type="text"
                        value={editingBeneficiary.schoolName || ''}
                        onChange={(e) => setEditingBeneficiary({ ...editingBeneficiary, schoolName: e.target.value })}
                        placeholder="e.g. Holy Fatima Convent"
                        className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 text-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Field Coordinator</label>
                  <select
                    value={editingBeneficiary.referencePerson}
                    onChange={(e) => setEditingBeneficiary({ ...editingBeneficiary, referencePerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    {referencePersons.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Verification Status</label>
                  <select
                    value={editingBeneficiary.verificationStatus}
                    onChange={(e) => setEditingBeneficiary({ ...editingBeneficiary, verificationStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold"
                  >
                    <option value="Verified">Verified (Approved)</option>
                    <option value="Under Re-Verification">Under Re-Verification</option>
                    <option value="Cancel / Rejected">Cancel / Rejected</option>
                    <option value="New Applicant">New Applicant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Location / Colony Address</label>
                  <input
                    type="text"
                    value={editingBeneficiary.location || ''}
                    onChange={(e) => setEditingBeneficiary({ ...editingBeneficiary, location: e.target.value })}
                    placeholder="e.g. Sonaji Nagar, Mumbra"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingBeneficiary.phone || ''}
                    onChange={(e) => setEditingBeneficiary({ ...editingBeneficiary, phone: e.target.value })}
                    placeholder="e.g. 9820123456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Notes / Household Condition</label>
                <textarea
                  rows={2}
                  value={editingBeneficiary.auditNotes || ''}
                  onChange={(e) => setEditingBeneficiary({ ...editingBeneficiary, auditNotes: e.target.value })}
                  placeholder="Verification notes, medical situation, family size, etc."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingBeneficiary(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER BENEFICIARY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Register New Beneficiary Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              {potentialDuplicates.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Possible Duplicate Detected ({potentialDuplicates.length})</span>
                  </div>
                  {potentialDuplicates.map((dup, i) => (
                    <p key={i} className="text-amber-800 leading-tight">
                      • {dup.reason}
                    </p>
                  ))}
                  <p className="text-[10px] text-amber-700 italic pt-0.5">
                    Please verify if this recipient already exists before saving to avoid duplicate records.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newBen.fullName}
                  onChange={(e) => setNewBen({ ...newBen, fullName: e.target.value })}
                  placeholder="e.g. Fatima Bano / Master Zaid"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Category Selection (Dynamic) */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                  <select
                    value={newBen.classification}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const subOpts = getSubCategoryOptions(newCat);
                      setNewBen({
                        ...newBen,
                        classification: newCat,
                        subCategory: subOpts[0] || 'General'
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 font-medium"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Sub-Category */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sub-Category</label>
                  <select
                    value={newBen.subCategory}
                    onChange={(e) => setNewBen({ ...newBen, subCategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    {addSubCatOptions.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SPECIAL FIELDS: If School Fees / Student (Minor Details) */}
              {isAddSchoolCase && (
                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2.5">
                  <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Student Minor & School Details</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-blue-900 font-semibold text-[11px] mb-0.5">Standard / Class</label>
                      <input
                        type="text"
                        value={newBen.standard}
                        onChange={(e) => setNewBen({ ...newBen, standard: e.target.value })}
                        placeholder="e.g. 5th Std / Class 8"
                        className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-900 font-semibold text-[11px] mb-0.5">Parent / Guardian Name</label>
                      <input
                        type="text"
                        value={newBen.guardianName}
                        onChange={(e) => setNewBen({ ...newBen, guardianName: e.target.value })}
                        placeholder="Father / Mother name"
                        className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-900 font-semibold text-[11px] mb-0.5">School / College Name</label>
                      <input
                        type="text"
                        value={newBen.schoolName}
                        onChange={(e) => setNewBen({ ...newBen, schoolName: e.target.value })}
                        placeholder="e.g. Holy Fatima Convent"
                        className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 text-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Field Coordinator</label>
                  <select
                    value={newBen.referencePerson}
                    onChange={(e) => setNewBen({ ...newBen, referencePerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    {referencePersons.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Verification Status</label>
                  <select
                    value={newBen.verificationStatus}
                    onChange={(e) => setNewBen({ ...newBen, verificationStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="Verified">Verified (Approved)</option>
                    <option value="Under Re-Verification">Under Re-Verification</option>
                    <option value="Cancel / Rejected">Cancel / Rejected</option>
                    <option value="New Applicant">New Applicant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Location / Colony Address</label>
                  <input
                    type="text"
                    value={newBen.location}
                    onChange={(e) => setNewBen({ ...newBen, location: e.target.value })}
                    placeholder="e.g. Sonaji Nagar, Mumbra"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newBen.phone}
                    onChange={(e) => setNewBen({ ...newBen, phone: e.target.value })}
                    placeholder="e.g. 9820123456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Notes / Household Condition</label>
                <textarea
                  rows={2}
                  value={newBen.auditNotes}
                  onChange={(e) => setNewBen({ ...newBen, auditNotes: e.target.value })}
                  placeholder="Details of physical verification, genuine poverty assessment, or school receipt..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {historyRecord && (
        <VersionHistoryModal
          recordId={historyRecord.id}
          recordTitle={historyRecord.title}
          onClose={() => setHistoryRecord(null)}
        />
      )}

      {/* CONFIRM DELETE MODAL */}
      {itemToDelete && (
        <ConfirmDeleteModal
          isOpen={!!itemToDelete}
          title={`Delete Beneficiary "${itemToDelete.fullName}"`}
          subtitle="This profile and case history will be safely moved to the Recycle Bin."
          warningDetails={{ count: 1, amount: itemToDelete.classification }}
          confirmText="Move to Recycle Bin"
          onConfirm={() => {
            deleteBeneficiary(itemToDelete.id);
            setItemToDelete(null);
            showNotice(`Beneficiary "${itemToDelete.fullName}" moved to Recycle Bin.`);
          }}
          onCancel={() => setItemToDelete(null)}
        />
      )}
    </div>
  );
};
