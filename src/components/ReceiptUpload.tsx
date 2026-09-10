import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

interface ReceiptUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic'];
const MAX_SIZE_MB = 5;

export default function ReceiptUpload({
  value,
  onChange,
  label = 'Resit / Lampiran',
}: ReceiptUploadProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value);

  const publicUrl = value
    ? supabase.storage.from('receipts').getPublicUrl(value).data.publicUrl
    : null;

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showToast('Format fail tidak disokong. Sila guna PNG, JPG, WEBP, atau HEIC.', 'error');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      showToast(`Saiz fail terlalu besar. Maksimum ${MAX_SIZE_MB}MB.`, 'error');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const path = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, file, { contentType: file.type });

    setUploading(false);

    if (uploadError) {
      showToast(`Gagal muat naik: ${uploadError.message}`, 'error');
      return;
    }

    onChange(path);
    setPreview(publicUrl);
    showToast('Resit berjaya dimuat naik.', 'success');
  }

  function handleRemove() {
    onChange(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const displayUrl = preview ?? publicUrl;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {displayUrl ? (
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt="Resit"
            className="h-28 w-28 rounded-xl border border-slate-200 object-cover shadow-sm"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition hover:bg-red-600"
            title="Buang resit"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          ) : (
            <Upload className="h-6 w-6 text-slate-400" />
          )}
          <span className="text-xs font-medium text-slate-500">
            {uploading ? 'Memuat naik...' : 'Klik untuk muat naik resit'}
          </span>
          <span className="text-xs text-slate-400">PNG, JPG, WEBP — max {MAX_SIZE_MB}MB</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
