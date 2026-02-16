"use client";

import { useState } from "react";
import FileUploader from "@/components/FileUploader";
import PDFViewer from "@/components/PDFViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { analyzePdf, findMatches, generateAnonymizedPDF, TextItem, PageInfo, BoundingBox } from "@/lib/pdf-helper";
import { Loader2, Download, CheckCircle, ArrowRight, ShieldCheck, FileText, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";

export default function Home() {
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<"upload" | "analyzing" | "review" | "processing" | "done">("upload");

    // Analysis Data
    const [textItems, setTextItems] = useState<TextItem[]>([]);
    const [pages, setPages] = useState<PageInfo[]>([]);

    // Redaction State
    const [redactions, setRedactions] = useState<BoundingBox[]>([]);
    const [keywords, setKeywords] = useState<string>("");
    const [initials, setInitials] = useState<string>("");

    // Results
    const [finalPdf, setFinalPdf] = useState<Uint8Array | null>(null);

    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile);
        setStep("analyzing");

        try {
            const data = await analyzePdf(selectedFile);
            setTextItems(data.textItems);
            setPages(data.pages);
            setStep("review");
        } catch (error) {
            console.error("Error analyzing PDF:", error);
            alert("Error analyzing PDF. Please try another file.");
            setStep("upload");
            setFile(null);
        }
    };

    const handleKeywordSearch = () => {
        if (!textItems.length) return;
        const keywordList = keywords.split(",").map(k => k.trim()).filter(k => k);
        const matches = findMatches(textItems, keywordList);

        setRedactions(prev => {
            const manuals = prev.filter(r => r.type === 'image-manual');
            return [...manuals, ...matches];
        });
    };

    const handleProcess = async () => {
        if (!file) return;
        setStep("processing");

        await new Promise(r => setTimeout(r, 800)); // Slight delay for UX

        try {
            const pdfBytes = await generateAnonymizedPDF(file, redactions, initials);
            setFinalPdf(pdfBytes);
            setStep("done");
        } catch (error) {
            console.error(error);
            alert("Error generating PDF");
            setStep("review");
        }
    };

    const handleDownload = () => {
        if (!finalPdf || !file) return;
        const blob = new Blob([finalPdf as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `anonimizado_${file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <main className="min-h-screen font-sans flex flex-col bg-slate-50/50">
            <Header />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 w-full relative">

                {/* Background Gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl" />
                </div>

                {/* Hero Section */}
                {step === "upload" && (
                    <div className="text-center mb-10 max-w-3xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        <Badge variant="secondary" className="mb-2">v1.1.9 Private Beta</Badge>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">Anonimización de CVs <br /><span className="text-blue-600">Profesional y Segura</span></h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed text-balance">
                            Elimina sesgos en tus procesos de selección. Nuestra herramienta procesa documentos en tu dispositivo, garantizando máxima privacidad.
                        </p>
                    </div>
                )}

                <div className={`w-full ${step === "review" ? "max-w-7xl h-[80vh]" : "max-w-xl"} animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200`}>
                    <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden backdrop-blur-sm bg-white/80 h-full flex flex-col">

                        {/* UPLOAD STEP */}
                        {step === "upload" && (
                            <>
                                <CardHeader>
                                    <CardTitle>Subir Documento</CardTitle>
                                    <CardDescription>Formatos soportados: PDF (Máx 10MB)</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FileUploader onFileSelect={handleFileSelect} />
                                </CardContent>
                                <CardFooter className="bg-slate-50/50 border-t border-slate-100 py-4 justify-center">
                                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <ShieldCheck size={12} /> Tus archivos nunca salen de tu dispositivo
                                    </p>
                                </CardFooter>
                            </>
                        )}

                        {/* ANALYZING STEP */}
                        {step === "analyzing" && (
                            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                                <h3 className="text-xl font-medium text-slate-900">Analizando documento...</h3>
                                <p className="text-slate-500">Detectando texto y estructura</p>
                            </div>
                        )}

                        {/* REVIEW STEP */}
                        {step === "review" && (
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 h-full overflow-hidden">
                                {/* Side Controls */}
                                <div className="lg:col-span-1 border-r border-slate-100 p-6 flex flex-col space-y-6 overflow-y-auto bg-slate-50/30">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-slate-900">Configuración</h3>
                                        <p className="text-xs text-slate-500">Define qué datos ocultar</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Iniciales:</label>
                                        <Input
                                            placeholder="Ej: M,B,C"
                                            value={initials}
                                            className="bg-white"
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                                                const formatted = raw.split('').slice(0, 5).join(',');
                                                setInitials(formatted);
                                            }}
                                        />
                                        <p className="text-[10px] text-slate-400">
                                            Cabecera PDF: {initials ? initials.split(',').join('.') + '.' : ''}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Censura Automática:</label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Ej: Nombre, Empresa"
                                                className="bg-white"
                                                value={keywords}
                                                onChange={(e) => setKeywords(e.target.value)}
                                            />
                                            <Button onClick={handleKeywordSearch} variant="secondary" size="sm">
                                                Buscar
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-blue-800 space-y-2">
                                        <p className="font-semibold flex items-center gap-2">
                                            <ShieldCheck size={14} /> Modo Manual
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-xs opacity-80">
                                            <li><strong>Click</strong> para ocultar texto.</li>
                                            <li><strong>Arrastra</strong> para censurar áreas.</li>
                                        </ul>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 mt-auto">
                                        <div className="flex justify-between items-center text-sm mb-4">
                                            <span className="text-slate-500">Elementos:</span>
                                            <Badge variant="secondary">{redactions.length}</Badge>
                                        </div>
                                        <Button className="w-full gap-2 shadow-lg shadow-blue-600/20" size="lg" onClick={handleProcess}>
                                            Anonimizar PDF <ArrowRight size={16} />
                                        </Button>
                                    </div>
                                </div>

                                {/* PDF Viewer Area */}
                                <div className="lg:col-span-3 h-full bg-slate-200/50 relative">
                                    <PDFViewer
                                        file={file}
                                        initialTextItems={textItems}
                                        pages={pages}
                                        onRedactionChange={setRedactions}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => { setFile(null); setStep("upload"); }}
                                        className="absolute top-4 right-4 bg-white/80 backdrop-blur hover:bg-white shadow-sm"
                                    >
                                        <X size={16} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* PROCESSING STEP */}
                        {step === "processing" && (
                            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                                <h3 className="text-xl font-medium text-slate-900">Aplicando censura...</h3>
                                <p className="text-slate-500">Generando nuevo PDF seguro</p>
                            </div>
                        )}

                        {/* DONE STEP */}
                        {step === "done" && (
                            <div className="text-center p-8 pt-10 flex flex-col items-center justify-center">
                                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Proceso Completado!</h2>
                                <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                                    Se han detectado y ocultado <Badge variant="secondary" className="mx-1">{redactions.length}</Badge> elementos sensibles en tu documento.
                                </p>

                                <div className="grid gap-3 w-full max-w-sm">
                                    <Button onClick={handleDownload} size="lg" className="w-full gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
                                        <Download size={18} /> Descargar PDF Protegido
                                    </Button>
                                    <Button variant="outline" onClick={() => { setFile(null); setStep("upload"); }}>
                                        Procesar otro archivo
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 border-t border-slate-200 bg-white">
                <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
                    © 2026 EquaCV. Todos los derechos reservados.
                </div>
            </footer>
        </main>
    );
}
