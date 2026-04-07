import React from 'react';
import { Mail, X, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailSent: boolean;
  emailForm: {
    email: string;
    includeIngredients: boolean;
    includeMeals: boolean;
    includeBriefs: boolean;
  };
  setEmailForm: (val: any) => void;
  handleSendEmail: (e: React.FormEvent) => void;
  isSendingEmail: boolean;
  getFormattedDate: () => string;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  emailSent,
  emailForm,
  setEmailForm,
  handleSendEmail,
  isSendingEmail,
  getFormattedDate
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-md rounded-none border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
          >
            <div className="p-6 border-b-4 border-black flex items-center justify-between bg-emerald-500 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Mail className="w-6 h-6" />
                Email Meal Plan
              </h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black rounded-none transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-8 space-y-8">
              {emailSent ? (
                <div className="py-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-none border-4 border-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-3xl font-black uppercase tracking-tighter">Email Sent!</h4>
                  <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">Your meal plan for the week of {getFormattedDate()} has been sent.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-black uppercase tracking-[0.2em]">Email Address</label>
                    <input
                      required
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full px-4 py-4 bg-white border-2 border-black rounded-none focus:outline-none focus:bg-emerald-50 font-bold transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-black uppercase tracking-[0.2em]">Include in Email</label>
                    <div className="space-y-3">
                      {[
                        { id: 'includeIngredients', label: 'Ingredients to Buy' },
                        { id: 'includeMeals', label: 'Meals to Cook' },
                        { id: 'includeBriefs', label: 'Recipe Briefs' }
                      ].map((option) => (
                        <label key={option.id} className="flex items-center gap-4 p-4 bg-white border-2 border-black rounded-none cursor-pointer hover:bg-emerald-50 transition-all">
                          <input
                            type="checkbox"
                            checked={emailForm[option.id as keyof typeof emailForm] as boolean}
                            onChange={(e) => setEmailForm({ ...emailForm, [option.id]: e.target.checked })}
                            className="w-6 h-6 rounded-none border-2 border-black text-emerald-500 focus:ring-0"
                          />
                          <span className="text-sm font-black uppercase tracking-widest text-black">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="w-full bg-black hover:bg-emerald-500 text-white py-5 rounded-none font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-6 h-6" />
                        Send Meal Plan
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
