import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    selectedFile?: File | null;
    onClear?: () => void;
}

export default function FileUploader({ onFileSelect, selectedFile, onClear }: FileUploaderProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        maxFiles: 1,
        disabled: !!selectedFile
    });

    if (selectedFile) {
        return (
            <Card className="p-6 flex items-center justify-between bg-blue-50/30 border-blue-100 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                </div>
                {onClear && (
                    <Button variant="ghost" size="icon" onClick={onClear} className="h-10 w-10 text-slate-400 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                    </Button>
                )}
            </Card>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`
                relative overflow-hidden cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-12 text-center
                ${isDragActive
                    ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                    : "border-slate-200 bg-slate-50/30 hover:border-blue-400 hover:bg-slate-50 hover:shadow-inner"
                }
            `}
        >
            <input {...getInputProps()} />

            {/* Decorative background element */}
            <div className="absolute -right-10 -bottom-10 text-slate-100/50 rotate-12 transition-transform pointer-events-none">
                <UploadCloud size={140} />
            </div>

            <div className="relative flex flex-col items-center gap-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 ring-4 ring-blue-50/50">
                    <UploadCloud className={`${isDragActive ? "animate-bounce" : ""}`} size={30} />
                </div>

                <div className="space-y-2">
                    <p className="text-lg font-bold text-slate-800">
                        {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra y suelta tu CV en PDF aquí'}
                    </p>
                    <p className="text-sm text-slate-500 max-w-[280px] mx-auto">
                        o haz clic para seleccionar
                    </p>
                </div>


            </div>
        </div>
    );
}
