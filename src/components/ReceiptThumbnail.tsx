import { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReceiptThumbnailProps {
  receiptUrl: string | null;
}

export default function ReceiptThumbnail({ receiptUrl }: ReceiptThumbnailProps) {
  const [showModal, setShowModal] = useState(false);

  if (!receiptUrl) {
    return <span className="text-slate-300">—</span>;
  }

  const publicUrl = supabase.storage.from('receipts').getPublicUrl(receiptUrl).data.publicUrl;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-slate-200 transition hover:border-blue-400 hover:ring-2 hover:ring-blue-500/20"
        title="Lihat resit"
      >
        <img
          src={publicUrl}
          alt="Resit"
          className="h-full w-full object-cover"
        />
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-h-90vh max-w-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={publicUrl}
              alt="Resit saiz penuh"
              className="max-h-85vh max-w-full rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
