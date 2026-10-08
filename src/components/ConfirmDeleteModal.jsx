import React from 'react';
import { AlertTriangle, Trash2, X, RotateCcw } from 'lucide-react';

export const ConfirmDeleteModal = ({
  isOpen,
  title,
  subtitle,
  warningDetails,
  confirmText = 'Move to Recycle Bin',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header with Warning Icon */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {title || 'Confirm Deletion'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {subtitle || 'This action will move the record to the Recycle Bin.'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Details Callout Box */}
        {warningDetails && (
          <div className="mx-6 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>⚠️ Important Impact Notice:</span>
            </div>
            <div className="text-amber-800 text-[11px] leading-relaxed">
              {typeof warningDetails === 'string' ? (
                <p>{warningDetails}</p>
              ) : (
                <div className="space-y-1">
                  {warningDetails.count !== undefined && (
                    <p>• Contains <strong className="font-bold">{warningDetails.count} transactions</strong>.</p>
                  )}
                  {warningDetails.amount !== undefined && (
                    <p>• Total recorded disbursement amount: <strong className="font-bold">{warningDetails.amount}</strong>.</p>
                  )}
                  <p>• These transactions will be safely packed into a single bundle.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reassurance Notice */}
        <div className="mx-6 my-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-[11px] text-slate-600">
          <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>You can restore this record anytime within <strong>30 days</strong> from the Recycle Bin.</span>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
