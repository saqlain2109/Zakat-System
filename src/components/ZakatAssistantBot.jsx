import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useZakat } from '../context/ZakatContext';
import { formatINR, formatCompactINR, formatPercent } from '../utils/formatters';
import { MULTI_YEAR_ARCHIVE } from '../data/seedData';
import {
  Bot,
  X,
  Send,
  Maximize2,
  Minimize2,
  RotateCcw,
  User,
  CheckCircle2,
  Clock,
  GraduationCap,
  Package,
  Building,
  HelpCircle,
  Search,
  Calendar
} from 'lucide-react';

export const ZakatAssistantBot = () => {
  const {
    financialYear,
    plannedAnnualBudget,
    totalZakatPaid,
    totalPendingZakat,
    overallUtilization,
    categoryMetrics,
    distributions,
    beneficiaries,
    fundingAccounts,
    referencePersons,
    currentYearDistributions
  } = useZakat();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Initial welcome message in simple, friendly English
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'bot',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Hello! I am your **Zakat Assistant**.

You can ask me anything about the system data:
• Ask for a **Yearly Report** to see multi-year comparisons (2020 to 2026).
• Search for any **Person or Record** (e.g., "Tell me about Basit Khan" or "Status of BEN-01").
• Check **Pending Payments** or **School Fees**.
• Check **Food & Ration Kits** or **Bank Account Balances**.

Click any quick button below or type your question!`
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Pre-calculate pending & paid distributions
  const pendingDistributions = useMemo(() => {
    return currentYearDistributions.filter(d => d.paymentStatus !== 'Paid');
  }, [currentYearDistributions]);

  const paidDistributions = useMemo(() => {
    return currentYearDistributions.filter(d => d.paymentStatus === 'Paid');
  }, [currentYearDistributions]);

  // Natural Language & Database Query Engine
  const processQuery = (rawQuery) => {
    const q = rawQuery.toLowerCase().trim();

    // -------------------------------------------------------------
    // 1. MULTI-YEAR / YEARLY BASES REPORT (2020 - 2026)
    // -------------------------------------------------------------
    const isYearlyReport =
      q.includes('yearly') ||
      q.includes('multi year') ||
      q.includes('year wise') ||
      q.includes('year-wise') ||
      q.includes('all years') ||
      q.includes('historical') ||
      q.includes('compare years') ||
      (q.includes('year') && (q.includes('bases') || q.includes('basis') || q.includes('comparison') || q.includes('trend') || q.includes('history')));

    if (isYearlyReport) {
      const rows = MULTI_YEAR_ARCHIVE.map(y => [
        `FY ${y.year}`,
        formatINR(y.grandTotal),
        formatINR(y.zakatIndia),
        formatINR(y.zakatDubai),
        formatINR(y.sadqaIndia)
      ]);

      const grandTotalAllYears = MULTI_YEAR_ARCHIVE.reduce((sum, y) => sum + y.grandTotal, 0);

      return {
        text: `### 📊 Multi-Year Financial Report (2020 – 2026)
Here is the complete year-on-year breakdown of all welfare and education aid:

- **Total Recorded Years:** 7 Assessment Cycles (2020 to 2026)
- **Cumulative Welfare Aid Disbursed:** ${formatINR(grandTotalAllYears)}
- **Current Active Year:** FY ${financialYear}

#### Year-Wise Summary:`,
        table: {
          headers: ['Year', 'Total Disbursed (₹)', 'India Zakat (₹)', 'Gulf Zakat (₹)', 'Sadaqah (₹)'],
          rows
        },
        footer: `Note: The 2026 cycle is currently active with ${beneficiaries.length} registered beneficiaries.`
      };
    }

    // -------------------------------------------------------------
    // 2. SPECIFIC YEAR REPORT (e.g. "2024 report", "2025 details")
    // -------------------------------------------------------------
    const yearMatch = q.match(/\b(202[0-9])\b/);
    if (yearMatch && (q.includes('report') || q.includes('data') || q.includes('summary') || q.includes('hisaab') || q.includes('budget') || q.includes('status') || q.includes('detail'))) {
      const targetYear = parseInt(yearMatch[1], 10);
      const archivedYear = MULTI_YEAR_ARCHIVE.find(y => y.year === targetYear);

      if (archivedYear) {
        const catRows = Object.entries(archivedYear.categories || {}).map(([catName, amount]) => [
          catName,
          formatINR(amount)
        ]);

        return {
          text: `### 📅 Financial Summary for Assessment Year ${targetYear}
- **Total Disbursed:** ${formatINR(archivedYear.grandTotal)}
- **India Zakat:** ${formatINR(archivedYear.zakatIndia)}
- **Gulf / Dubai Zakat:** ${formatINR(archivedYear.zakatDubai)}
- **Sadaqah:** ${formatINR(archivedYear.sadqaIndia)}

#### Category Breakdown for FY ${targetYear}:`,
          table: {
            headers: ['Category / Purpose', 'Amount (₹)'],
            rows: catRows
          }
        };
      }
    }

    // -------------------------------------------------------------
    // 3. SPECIFIC BENEFICIARY / PERSON / RECORD SEARCH
    // (e.g., "Tell me about Basit Khan", "BEN-01", "Pasha Aapa", "Zaid")
    // -------------------------------------------------------------
    // Clean query to isolate possible search terms
    const cleanSearchTerm = q
      .replace(/tell me about/g, '')
      .replace(/show record of/g, '')
      .replace(/record for/g, '')
      .replace(/details of/g, '')
      .replace(/information about/g, '')
      .replace(/who is/g, '')
      .replace(/search for/g, '')
      .replace(/status of/g, '')
      .replace(/check/g, '')
      .replace(/profile/g, '')
      .trim();

    if (cleanSearchTerm.length >= 2) {
      // Find matching beneficiaries
      const matchedBeneficiaries = beneficiaries.filter(b => {
        const nameMatch = b.fullName.toLowerCase().includes(cleanSearchTerm);
        const idMatch = b.id.toLowerCase() === cleanSearchTerm;
        const phoneMatch = b.phone && b.phone.includes(cleanSearchTerm);
        const schoolMatch = b.schoolName && b.schoolName.toLowerCase().includes(cleanSearchTerm);
        const guardianMatch = b.guardianName && b.guardianName.toLowerCase().includes(cleanSearchTerm);
        return nameMatch || idMatch || phoneMatch || schoolMatch || guardianMatch;
      });

      // Exactly 1 person found: return a rich, detailed record card
      if (matchedBeneficiaries.length === 1) {
        const b = matchedBeneficiaries[0];
        const dist = distributions.find(d => d.beneficiaryId === b.id && d.financialYear === financialYear);

        let historyLines = [];
        if (b.history) {
          historyLines = Object.entries(b.history)
            .map(([yr, amt]) => `${yr}: ${formatINR(amt)}`)
            .join(' | ');
        }

        return {
          text: `### 👤 Beneficiary Record: ${b.fullName} (${b.id})
- **Category:** ${b.classification} ${b.subCategory ? `(${b.subCategory})` : ''}
- **Verification Status:** ${b.verificationStatus || 'Verified'}
- **Coordinator:** ${b.referencePerson || 'Akbar Sir'}
- **Phone Contact:** ${b.phone || 'No phone recorded'}
- **Location / Colony:** ${b.location || 'Not specified'}
${b.standard || b.guardianName || b.schoolName ? `- **Education Info:** Class: ${b.standard || '—'} | Parent: ${b.guardianName || '—'} | School: ${b.schoolName || '—'}\n` : ''}${b.auditNotes ? `- **Audit Notes:** "${b.auditNotes}"\n` : ''}
#### 💳 Current Payment Record (FY ${financialYear}):
- **Allocated Amount:** ${formatINR(dist ? dist.amountAllocated : 0)}
- **Paid Amount:** ${formatINR(dist ? dist.amountPaid : 0)}
- **Payment Status:** ${dist ? dist.paymentStatus : 'Pending'}
- **Payment Method:** ${dist ? dist.paymentMethod : 'Direct Cash'}
${dist && dist.remarks ? `- **Payment Remarks:** ${dist.remarks}\n` : ''}
#### 📜 Past Assistance History:
${historyLines || 'No previous year records on file.'}`
        };
      }

      // Between 2 and 8 matches: return a clean matching list table
      if (matchedBeneficiaries.length > 1 && matchedBeneficiaries.length <= 8) {
        const rows = matchedBeneficiaries.map(b => [
          b.id,
          b.fullName,
          b.classification,
          b.referencePerson || '—',
          b.phone || '—',
          b.verificationStatus || 'Verified'
        ]);

        return {
          text: `### 🔍 Found ${matchedBeneficiaries.length} matching records for "${cleanSearchTerm}":
Click on any name or search by exact ID (e.g. "${matchedBeneficiaries[0].id}") to see full details:`,
          table: {
            headers: ['ID', 'Full Name', 'Category', 'Coordinator', 'Phone', 'Status'],
            rows
          }
        };
      }
    }

    // -------------------------------------------------------------
    // 4. COORDINATOR / TEAM MEMBER SEARCH (e.g. "Akbar Sir", "Rehan")
    // -------------------------------------------------------------
    const matchedRef = referencePersons.find(r => q.includes(r.name.toLowerCase()));
    if (matchedRef || q.includes('coordinator') || q.includes('reference person')) {
      const refName = matchedRef ? matchedRef.name : referencePersons[0]?.name;
      const refBeneficiaries = beneficiaries.filter(b => (b.referencePerson || '').toLowerCase() === refName.toLowerCase());
      const refDistributions = currentYearDistributions.filter(d =>
        refBeneficiaries.some(b => b.id === d.beneficiaryId)
      );
      const totalAllocated = refDistributions.reduce((sum, d) => sum + (Number(d.amountAllocated) || 0), 0);

      const rows = refBeneficiaries.slice(0, 10).map(b => [
        b.id,
        b.fullName,
        b.classification,
        b.phone || '—'
      ]);

      return {
        text: `### 👨‍💼 Coordinator Record: ${refName}
- **Assigned Beneficiaries:** ${refBeneficiaries.length} people
- **Total Funds Allocated in FY ${financialYear}:** ${formatINR(totalAllocated)}
- **Contact:** ${matchedRef?.phone || 'Central Office'}

#### Sample Recipients under ${refName}:`,
        table: {
          headers: ['ID', 'Beneficiary Name', 'Category', 'Phone'],
          rows
        },
        footer: refBeneficiaries.length > 10 ? `*Showing top 10 of ${refBeneficiaries.length} beneficiaries.*` : null
      };
    }

    // -------------------------------------------------------------
    // 5. PENDING PAYMENTS (e.g. "Who is pending?", "Pending status")
    // -------------------------------------------------------------
    if (q.includes('pending') || q.includes('unpaid') || q.includes('due') || q.includes('not paid') || q.includes('baaki') || q.includes('baki')) {
      const totalPendingAmt = pendingDistributions.reduce((sum, d) => sum + (Number(d.amountAllocated) || 0), 0);

      const tableRows = pendingDistributions.slice(0, 15).map(d => ({
        name: d.beneficiaryName,
        category: d.classification,
        amount: formatINR(d.amountAllocated),
        method: d.paymentMethod
      }));

      return {
        text: `### ⏳ Pending Payments Summary (FY ${financialYear})
- **Pending Recipients Count:** ${pendingDistributions.length} people
- **Total Pending Amount:** ${formatINR(totalPendingAmt || totalPendingZakat)}

Here is the list of pending recipients:`,
        table: {
          headers: ['Recipient Name', 'Category', 'Pending Amount', 'Payment Method'],
          rows: tableRows.map(r => [r.name, r.category, r.amount, r.method])
        },
        footer: pendingDistributions.length > 15 ? `*Showing 15 of ${pendingDistributions.length} pending records. View Payments Ledger for full list.*` : null
      };
    }

    // -------------------------------------------------------------
    // 6. SCHOOL FEES & EDUCATION GRANTS
    // -------------------------------------------------------------
    if (q.includes('school') || q.includes('fee') || q.includes('student') || q.includes('education') || q.includes('class')) {
      const schoolCat = categoryMetrics.find(c => c.name.toLowerCase().includes('school')) || categoryMetrics[0];
      const schoolDistributions = currentYearDistributions.filter(d =>
        (d.classification && d.classification.toLowerCase().includes('school')) ||
        d.categoryId === 'CAT-07'
      );

      const rows = schoolDistributions.map(d => [
        d.beneficiaryName,
        formatINR(d.amountAllocated),
        d.paymentStatus,
        d.remarks || 'School Fee'
      ]);

      return {
        text: `### 🎓 Student School Fees Report (FY ${financialYear})
- **Total Education Budget:** ${formatINR(schoolCat?.plannedBudget || 235500)}
- **Fees Actually Paid:** ${formatINR(schoolCat?.totalPaid || 0)}
- **Pending School Grants:** ${formatINR(schoolCat?.pending || 0)}
- **Total Enrolled Students:** ${schoolDistributions.length} Students

Student fee disbursements detail:`,
        table: {
          headers: ['Student Name', 'Amount (₹)', 'Payment Status', 'Details / Notes'],
          rows: rows.length > 0 ? rows : [['No school records recorded for this year', '—', '—', '—']]
        }
      };
    }

    // -------------------------------------------------------------
    // 7. FOOD & RATION KITS
    // -------------------------------------------------------------
    if (q.includes('ration') || q.includes('food') || q.includes('kit') || q.includes('aurangabad') || q.includes('mumbra') || q.includes('slum')) {
      const rationDistributions = currentYearDistributions.filter(d =>
        (d.classification && d.classification.toLowerCase().includes('ration')) ||
        d.categoryId === 'CAT-06' || d.categoryId === 'CAT-02'
      );
      const rationBeneficiaries = beneficiaries.filter(b =>
        (b.classification && b.classification.toLowerCase().includes('ration')) ||
        b.categoryId === 'CAT-06' || b.categoryId === 'CAT-02'
      );

      return {
        text: `### 📦 Food & Ration Kits Program (FY ${financialYear})
- **Total Ration Families Registered:** ${rationBeneficiaries.length} Families
- **Unit Cost per Grocery Kit:** ₹4,076 / kit
- **Active Ration Allocations in Ledger:** ${rationDistributions.length} recorded
- **Key Coverage Areas:** Aurangabad Slum Colonies, Kat Kat Gate, Hilal Colony, and Mumbra widow families

You can record new ration kits anytime from the **New Payment** screen.`
      };
    }

    // -------------------------------------------------------------
    // 8. BANK ACCOUNTS & BALANCES
    // -------------------------------------------------------------
    if (q.includes('bank') || q.includes('account') || q.includes('balance') || q.includes('hdfc') || q.includes('icici') || q.includes('cash')) {
      const rows = fundingAccounts.map(a => [
        a.name,
        a.accountHolder || '—',
        a.bankName || '—',
        formatINR(a.balance)
      ]);

      return {
        text: `### 🏦 Funding Bank Accounts & Available Balances
Here is the active list of bank and cash accounts used for payments:`,
        table: {
          headers: ['Account Name', 'Account Holder', 'Bank Name', 'Current Balance (₹)'],
          rows
        }
      };
    }

    // -------------------------------------------------------------
    // 9. GENERAL CATEGORY / ANNUAL SUMMARY REPORT
    // -------------------------------------------------------------
    if (q.includes('report') || q.includes('summary') || q.includes('category') || q.includes('budget') || q.includes('overview')) {
      const rows = categoryMetrics.map(c => [
        c.name,
        formatINR(c.plannedBudget),
        formatINR(c.totalPaid),
        formatINR(c.pending),
        `${formatPercent(c.utilization)}`
      ]);

      return {
        text: `### 📊 Annual Financial Summary Report (FY ${financialYear})
- **Total Planned Budget:** ${formatINR(plannedAnnualBudget)}
- **Total Actually Paid:** ${formatINR(totalZakatPaid)} (${formatPercent(overallUtilization)})
- **Total Pending Balance:** ${formatINR(totalPendingZakat)}
- **Registered Beneficiaries:** ${beneficiaries.length} Recipients

#### Category-Wise Breakdown:`,
        table: {
          headers: ['Category Name', 'Planned Budget', 'Paid Amount', 'Pending Amount', 'Utilization %'],
          rows
        }
      };
    }

    // -------------------------------------------------------------
    // 10. DEFAULT FRIENDLY FALLBACK WITH EXAMPLES
    // -------------------------------------------------------------
    return {
      text: `I am here to help you navigate and query all welfare data. 

Here are some helpful things you can ask me:
1. **"Give yearly bases report"** → Full historical comparison table from 2020 to 2026.
2. **"Tell me about [Person Name]"** → Look up profile, contact, and payment history for any person.
3. **"Who is pending?"** → List of all unpaid payments and amounts.
4. **"School fees report"** → Students enrolled and fee payment status.
5. **"Bank balances"** → Funding bank accounts and current balances.
6. **"Category report"** → Budget and spending breakdown for the current year.`
    };
  };

  const handleSendMessage = (textToSend = inputMessage) => {
    const text = textToSend.trim();
    if (!text) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    // Instant query execution
    setTimeout(() => {
      const botResponseData = processQuery(text);
      const botMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...botResponseData
      };
      setMessages(prev => [...prev, botMsg]);
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'msg-init',
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Chat reset. Ask me any question about people, payments, yearly reports, or bank accounts!`
      }
    ]);
  };

  const quickPrompts = [
    { label: '📊 Yearly Report (2020-2026)', query: 'Give yearly bases report' },
    { label: '⏳ Pending Payments', query: 'Who is pending?' },
    { label: '📋 Category Summary', query: 'Category summary report' },
    { label: '🎓 School Fees', query: 'School fees status' },
    { label: '🏦 Bank Balances', query: 'Bank account balances' },
    { label: '📦 Food & Ration Kits', query: 'Ration kits status' },
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          id="zakat-assistant-widget"
          onClick={() => setIsOpen(true)}
          className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group border-2 border-white/80"
          title="Open Zakat Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-blue-600 rounded-full" />
          </div>
          <span className="text-xs font-bold tracking-wide pr-1">Zakat Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div
          id="zakat-assistant-modal"
          className={`no-print fixed z-50 bottom-4 right-4 bg-white border border-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isExpanded
              ? 'w-[95vw] sm:w-[680px] h-[85vh] max-h-[850px]'
              : 'w-[92vw] sm:w-[460px] h-[580px] max-h-[90vh]'
          }`}
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <span>Zakat Assistant</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded text-[9px] font-mono">
                    LIVE SYSTEM DATA
                  </span>
                </h3>
                <p className="text-[11px] text-blue-100/80">
                  Instant reports, people lookup & financial audits
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Reset Chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.query)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-semibold whitespace-nowrap transition-all shadow-2xs"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 shadow-2xs leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    {/* Render Text */}
                    <div className="whitespace-pre-wrap font-sans text-xs">
                      {msg.text}
                    </div>

                    {/* Render Structured Table if Present */}
                    {msg.table && (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 my-2 shadow-2xs">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 text-slate-700 uppercase text-[9px] border-b border-slate-200">
                            <tr>
                              {msg.table.headers.map((h, i) => (
                                <th key={i} className="py-2 px-2.5 font-bold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/70 font-medium text-slate-800">
                            {msg.table.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-white">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="py-1.5 px-2.5">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {msg.footer && (
                      <p className="text-[10px] text-slate-400 italic pt-1">{msg.footer}</p>
                    )}

                    <div className={`text-[9px] text-right pt-0.5 ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.time}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything (e.g. 'Yearly report', 'Tell me about Basit', 'Who is pending?')..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-colors shrink-0 shadow-2xs"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
