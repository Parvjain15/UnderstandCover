'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface UploadZoneProps {
  readonly onFile: (file: File) => void
  readonly file: File | null
  readonly onRemove: () => void
}

const MAX_SIZE_MB = 20
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export function UploadZone({ onFile, file, onRemove }: UploadZoneProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { errors: readonly { code: string }[] }[]) => {
      setError(null)
      if (rejectedFiles.length > 0) {
        const code = rejectedFiles[0]?.errors[0]?.code
        if (code === 'file-too-large') setError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`)
        else if (code === 'file-invalid-type') setError('Please upload a PDF file.')
        else setError('Invalid file. Please upload a PDF under 20MB.')
        return
      }
      if (acceptedFiles[0]) onFile(acceptedFiles[0])
    },
    [onFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_SIZE_BYTES,
    maxFiles: 1,
  })

  if (file) {
    return (
      <div className="border-2 border-green-300 border-dashed rounded-xl p-8 bg-green-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-green-600" />
          <div>
            <p className="font-medium text-slate-900">{file.name}</p>
            <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove} type="button">
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <p className="font-medium text-slate-700 mb-1">
          {isDragActive ? 'Drop your PDF here' : 'Drag your PDF here, or click to browse'}
        </p>
        <p className="text-sm text-slate-400">PDF only, up to {MAX_SIZE_MB}MB</p>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
