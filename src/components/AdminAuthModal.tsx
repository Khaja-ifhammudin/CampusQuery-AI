import React, { useState, useEffect, useRef } from 'react';
import { Shield, Key, Check, AlertCircle, Eye, EyeOff, X, Lock } from 'lucide-react';
import { CampusApi } from '../services/api';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [adminKey, setAdminKey] = useState<string>(() => CampusApi.getAdminKey());
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;
    setAdminKey(CampusApi.getAdminKey());
    setStatusMessage(null);

    const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables && focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const elements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

        if (elements.length === 0) return;

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleVerifyAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = CampusApi.sanitizeToken(adminKey);
    if (!cleanKey) {
      setStatusMessage({ type: 'error', text: 'Please enter an Admin API Key.' });
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);
    try {
      const isValid = await CampusApi.verifyAdminKey(cleanKey);
      if (isValid) {
        CampusApi.setAdminKey(cleanKey);
        setAdminKey(cleanKey);
        setStatusMessage({
          type: 'success',
          text: 'Admin credential verified and held in browser memory for this session.',
        });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Authentication failed: Invalid key. Please verify against ADMIN_API_KEY in your local .env file.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Authentication error: ${err.message || 'Server unreachable'}`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    CampusApi.clearAdminKey();
    setAdminKey('');
    setStatusMessage({
      type: 'success',
      text: 'Admin credentials cleared from memory. Privileged operations revoked.',
    });
    if (onSuccess) onSuccess();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-auth-modal-title"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Security Access Control
              </span>
              <h3 id="admin-auth-modal-title" className="text-base font-bold text-white mt-0.5">
                Admin Credential Verification
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close admin authentication dialog"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleVerifyAndSave} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Privileged administrative operations (uploading policies, toggling indexes, and viewing telemetry) are protected by timing-safe server-side token authentication.
          </p>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-start space-x-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Admin API Key (from local .env) *
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Paste ADMIN_API_KEY..."
                className="w-full text-xs font-mono px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Locate <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">ADMIN_API_KEY</code> in your local project root <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">.env</code> file.
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
            <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Credentials are held in browser memory only for this page session. Refreshing the browser tab or closing the window immediately clears the key. No data is stored in persistent disk/session storage.
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between">
            {CampusApi.hasAdminKey() ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 hover:text-rose-800 underline font-semibold"
              >
                Revoke / Logout Admin
              </button>
            ) : <span />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying || !adminKey.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:bg-amber-400 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
              >
                {isVerifying ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Authorize Admin Session</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
