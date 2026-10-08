import React, { useState, useMemo } from 'react';
import { useZakat } from '../context/ZakatContext';
import { formatINR, exportToCSV } from '../utils/formatters';
import {
  GraduationCap,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Download,
  Check,
  Edit2,
  FileCheck,
  Building2
} from 'lucide-react';

export const EducationAssistanceScreen = () => {
  const { educationRecords, updateEducationItem, addEducationItem, financialYear } = useZakat();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newStudent, setNewStudent] = useState({
    studentName: '',
    schoolName: 'Holy Fatima Convent School',
    standard: 'Class 5',
    academicYear: '2025-2026',
    totalAnnualFees: 18000,
    requestedAmount: 18000,
    approvedAmount: 15000,
    paidAmount: 0,
    status: 'approved',
    receiptNo: '',
    guardianName: '',
    referenceName: 'Zahira Miss',
    notes: 'Single earner parent'
  });

  // Scoped to active assessment year
  const yearEducationList = useMemo(() => {
    return educationRecords.filter(e => !e.year || e.year === Number(financialYear));
  }, [educationRecords, financialYear]);

  // Unique Schools
  const schools = useMemo(() => {
    return Array.from(new Set(yearEducationList.map(e => e.schoolName))).filter(Boolean);
  }, [yearEducationList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return yearEducationList.filter(e => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || e.studentName.toLowerCase().includes(q) || e.schoolName.toLowerCase().includes(q) || e.standard.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
      const matchesSchool = schoolFilter === 'ALL' || e.schoolName === schoolFilter;
      return matchesSearch && matchesStatus && matchesSchool;
    });
  }, [yearEducationList, searchQuery, statusFilter, schoolFilter]);

  // Auto Calculations
  const stats = useMemo(() => {
    const totalStudents = yearEducationList.length;
    const totalFees = yearEducationList.reduce((sum, e) => sum + (Number(e.totalAnnualFees) || 0), 0);
    const approvedBudget = yearEducationList.reduce((sum, e) => sum + (Number(e.approvedAmount) || 0), 0);
    const totalPaid = yearEducationList.reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);
    const pendingBalance = approvedBudget - totalPaid;
    return { totalStudents, totalFees, approvedBudget, totalPaid, pendingBalance };
  }, [yearEducationList]);

  // Direct 1-Click Pay Fee Toggle
  const handleTogglePaidFull = (item) => {
    const isFull = item.status === 'paid_full';
    updateEducationItem({
      ...item,
      status: isFull ? 'approved' : 'paid_full',
      paidAmount: isFull ? 0 : item.approvedAmount,
      receiptNo: isFull ? '' : (item.receiptNo || `REC-${Date.now().toString().slice(-5)}`)
    });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newStudent.studentName.trim()) return;

    addEducationItem({
      ...newStudent,
      totalAnnualFees: Number(newStudent.totalAnnualFees) || 0,
      approvedAmount: Number(newStudent.approvedAmount) || 0,
      paidAmount: newStudent.status === 'paid_full' ? Number(newStudent.approvedAmount) : 0,
      year: Number(financialYear)
    });

    setShowAddModal(false);
    setNewStudent({
      studentName: '',
      schoolName: 'Holy Fatima Convent School',
      standard: 'Class 5',
      academicYear: '2025-2026',
      totalAnnualFees: 18000,
      requestedAmount: 18000,
      approvedAmount: 15000,
      paidAmount: 0,
      status: 'approved',
      receiptNo: '',
      guardianName: '',
      referenceName: 'Zahira Miss',
      notes: ''
    });
  };

  const handleExportCSV = () => {
    const data = filteredList.map(e => ({
      ID: e.id,
      'Student Name': e.studentName,
      School: e.schoolName,
      Class: e.standard,
      'Academic Year': e.academicYear,
      'Total Annual Fees (INR)': e.totalAnnualFees,
      'Approved Amount (INR)': e.approvedAmount,
      'Paid Amount (INR)': e.paidAmount,
      'Pending Balance (INR)': Math.max(0, e.approvedAmount - e.paidAmount),
      Status: e.status,
      'Receipt No': e.receiptNo || 'Pending',
      Reference: e.referenceName
    }));
    exportToCSV(data, `Education_Assistance_${financialYear}.csv`);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span>School Fees & Education Grants</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Student fee sponsorships, school fee cards, and direct school assistance tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student Grant</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Sponsored Students</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats.totalStudents} <span className="text-xs font-normal text-slate-500">Enrolled</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Annual Fees: <strong className="text-slate-700">{formatINR(stats.totalFees)}</strong>
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Approved Grant Aid</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {formatINR(stats.approvedBudget)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Budgeted assistance pool
          </span>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">Actually Disbursed</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            {formatINR(stats.totalPaid)}
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block font-semibold">
            Transferred to schools
          </span>
        </div>

        <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 block">Pending Fee Balance</span>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">
            {formatINR(stats.pendingBalance)}
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block font-semibold">
            Awaiting 2nd term fees
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shadow-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, school, standard..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Schools & Institutions ({schools.length})</option>
          {schools.map(sch => (
            <option key={sch} value={sch}>{sch}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="paid_full">Fully Paid (Green)</option>
          <option value="approved">Approved / Pending Payment (Yellow)</option>
          <option value="pending_receipt">Pending Fee Card (Red)</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 font-semibold w-16">ID</th>
                <th className="py-3 px-3.5 font-semibold">Student Name</th>
                <th className="py-3 px-3.5 font-semibold">School & Standard</th>
                <th className="py-3 px-3.5 font-semibold text-right">Annual Fees (₹)</th>
                <th className="py-3 px-3.5 font-semibold text-right">Approved Aid (₹)</th>
                <th className="py-3 px-3.5 font-semibold text-right">Paid (₹)</th>
                <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                <th className="py-3 px-3.5 font-semibold">Receipt / Voucher</th>
                <th className="py-3 px-3.5 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No education records match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const isPaid = item.status === 'paid_full';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-slate-400 font-bold">{item.id}</td>
                      <td className="py-3 px-3.5">
                        <strong className="text-slate-900 text-xs block">{item.studentName}</strong>
                        {item.referenceName && (
                          <span className="text-[11px] text-slate-500 block">Ref: {item.referenceName}</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="text-slate-900 block font-semibold">{item.schoolName}</span>
                        <span className="text-[11px] text-slate-500">{item.standard} • {item.academicYear}</span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                        {formatINR(item.totalAnnualFees)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800">
                        {formatINR(item.approvedAmount)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                        {formatINR(item.paidAmount)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isPaid ? 'Fully Paid' : 'Approved'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        {item.receiptNo ? (
                          <span className="font-mono text-[11px] text-slate-700 font-bold flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>{item.receiptNo}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No voucher yet</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {/* 1-Click Status Action */}
                        <button
                          onClick={() => handleTogglePaidFull(item)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto ${
                            isPaid
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isPaid ? 'Unmark' : 'Disburse Fee'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add Student Fee Sponsorship</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStudent.studentName}
                  onChange={(e) => setNewStudent({ ...newStudent, studentName: e.target.value })}
                  placeholder="e.g. Mohammed Zaid"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">School / College</label>
                  <input
                    type="text"
                    value={newStudent.schoolName}
                    onChange={(e) => setNewStudent({ ...newStudent, schoolName: e.target.value })}
                    placeholder="e.g. Municipal School"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Class / Standard</label>
                  <input
                    type="text"
                    value={newStudent.standard}
                    onChange={(e) => setNewStudent({ ...newStudent, standard: e.target.value })}
                    placeholder="e.g. Class 7"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Annual Fee (₹)</label>
                  <input
                    type="number"
                    value={newStudent.totalAnnualFees}
                    onChange={(e) => setNewStudent({ ...newStudent, totalAnnualFees: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Approved Grant (₹)</label>
                  <input
                    type="number"
                    value={newStudent.approvedAmount}
                    onChange={(e) => setNewStudent({ ...newStudent, approvedAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Coordinator / Ref</label>
                  <input
                    type="text"
                    value={newStudent.referenceName}
                    onChange={(e) => setNewStudent({ ...newStudent, referenceName: e.target.value })}
                    placeholder="e.g. Zahira Miss"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Receipt / Voucher No</label>
                  <input
                    type="text"
                    value={newStudent.receiptNo}
                    onChange={(e) => setNewStudent({ ...newStudent, receiptNo: e.target.value })}
                    placeholder="e.g. REC-2026-44"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Initial Status</label>
                <select
                  value={newStudent.status}
                  onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                >
                  <option value="approved">Approved (Pending Payout)</option>
                  <option value="paid_full">Fully Paid (Transferred to School)</option>
                </select>
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
                  Add Student Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
