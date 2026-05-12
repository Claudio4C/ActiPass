import React, { useRef, useState, useEffect } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { api } from '../lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvatarUploadProps {
  currentUrl?: string | null
  name?: string                          // Pour les initiales si pas d'image
  color?: string                         // Couleur de fond des initiales
  shape?: 'circle' | 'square'           // circle → utilisateurs, square → logos orgs
  size?: 'md' | 'lg' | 'xl'
  hintClassName?: string                 // Override classe du texte hint (ex: sur fond sombre)
  onUpload: (url: string) => void | Promise<void>
}

// ─── Tailles ─────────────────────────────────────────────────────────────────

const SIZES = {
  md: { wrapper: 'w-20 h-20', text: 'text-2xl',  icon: 'w-5 h-5',  camera: 'w-6 h-6'  },
  lg: { wrapper: 'w-28 h-28', text: 'text-3xl',  icon: 'w-6 h-6',  camera: 'w-7 h-7'  },
  xl: { wrapper: 'w-36 h-36', text: 'text-4xl',  icon: 'w-7 h-7',  camera: 'w-8 h-8'  },
}

const ACCEPTED = 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
const MAX_BYTES = 5 * 1024 * 1024 // 5 Mo

// ─── Component ────────────────────────────────────────────────────────────────

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentUrl,
  name = '?',
  color = 'hsl(217,91%,60%)',
  shape = 'circle',
  size = 'md',
  hintClassName,
  onUpload,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync preview when currentUrl prop changes externally
  useEffect(() => { setPreview(currentUrl ?? null) }, [currentUrl])

  const sz = SIZES[size]
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-2xl'

  const handleFile = async (file: File) => {
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont acceptées.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Image trop lourde (max 5 Mo).')
      return
    }

    // Aperçu immédiat (FileReader)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const url = await api.upload(file)
      await onUpload(url)
    } catch {
      setError('Erreur lors du téléchargement. Réessayez.')
      setPreview(currentUrl ?? null) // revert
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { handleFile(file) }
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) { handleFile(file) }
  }

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Zone d'upload */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        disabled={uploading}
        className={`
          relative ${sz.wrapper} ${radius} overflow-hidden group
          border-2 transition-all duration-200
          ${preview ? 'border-transparent' : 'border-dashed border-border hover:border-primary/50'}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          active:scale-95 disabled:cursor-wait
        `}
      >
        {/* Image ou initiales */}
        {preview ? (
          <img
            src={preview}
            alt={name}
            className={`w-full h-full object-cover ${radius}`}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center font-display font-bold text-white ${sz.text}`}
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>
        )}

        {/* Overlay au hover */}
        <div className={`
          absolute inset-0 flex flex-col items-center justify-center gap-1
          bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity
          ${uploading ? 'opacity-100' : ''}
        `}>
          {uploading ? (
            <Loader2 className={`${sz.camera} text-white animate-spin shrink-0`} />
          ) : (
            <>
              <Camera className={`${sz.camera} text-white shrink-0`} />
              <span className="text-[10px] font-bold text-white leading-none">Modifier</span>
            </>
          )}
        </div>
      </button>

      {/* Input fichier caché */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleChange}
      />

      {/* Hint + erreur */}
      {error ? (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <X className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <p className={hintClassName ?? 'text-[11px] text-muted-foreground text-center'}>
          JPG, PNG, WebP · max 5 Mo
        </p>
      )}
    </div>
  )
}

export default AvatarUpload
