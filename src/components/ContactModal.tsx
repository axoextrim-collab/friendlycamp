import React, { useState } from 'react';
import { X, Headphones, PhoneCall, Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'سلام! به پشتیبانی آنلاین باشگاه طبیعت‌گردی فرندلی کمپ (Friendly Camp) خوش آمدید. چگونه می‌توانیم در رزرو تور کمپینگ یا پاسخ به سوالات شما کمک کنیم؟' }
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText;
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');

    // Auto support response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'پیام شما دریافت شد! سرپرست تورهای فرندلی کمپ هم‌اکنون در حال بررسی درخواست شماست. همچنین می‌توانید مستقیماً با ۰۹۲۱۵۰۱۴۴۷۴ تماس بگیرید.'
        }
      ]);
    }, 1000);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="تماس با فرندلی کمپ" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col h-[550px] text-right">
        
        {/* Header */}
        <div className="bg-[#14382c] text-white p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-slate-950 flex items-center justify-center font-bold">
              <Headphones size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#f59e0b]">پشتیبانی آنلاین فرندلی کمپ</h4>
              <span className="text-[10px] text-emerald-100/80 font-medium dir-ltr block">
                ۰۹۲۱۵۰۱۴۴۷۴ • پاسخگویی ۲۴/۷
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#14382c] text-white self-start rounded-tr-none'
                  : 'bg-white text-slate-800 shadow-sm border border-slate-200 self-end rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        {/* Direct Phone Call Strip */}
        <div className="bg-amber-50 px-4 py-2 border-t border-amber-200 flex items-center justify-between text-xs font-bold text-amber-900">
          <span>تماس مستقیم با لیدرهای کمپ:</span>
          <a href="tel:09215014474" className="text-[#14382c] font-mono hover:underline font-extrabold">
            ۰۹۲۱۵۰۱۴۴۷۴ 📞
          </a>
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-xs text-slate-800 font-medium outline-none focus:ring-2 focus:ring-[#14382c]"
          />
          <button
            type="submit"
            className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold p-2.5 rounded-full shadow transition cursor-pointer"
          >
            <Send size={16} />
          </button>
        </form>

      </div>
    </div>
  );
};
