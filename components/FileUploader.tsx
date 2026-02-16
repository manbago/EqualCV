import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
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
            <Card className="p-6 flex items-center justify-between bg-primary/5 border-primary/20">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-full shadow-sm border border-gray-100">
                        <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                </div>
                {onClear && (
                    <Button variant="ghost" size="icon" onClick={onClear} className="text-gray-400 hover:text-destructive">
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
                border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}
            `}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
                <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <Upload className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                        {isDragActive ? 'Drop PDF here' : 'Suelta tu CV aquí'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        o haz click para seleccionar (PDF)
                    </p>
                </div>
                <Button variant="outline" className="mt-2">
                    Seleccionar Archivo
                </Button>
            </div>
        </div>
    );
}
