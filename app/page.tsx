"use client";

import { useState } from "react";
import FileUploader from "@/components/FileUploader";
import PDFViewer from "@/components/PDFViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { analyzePdf, findMatches, generateAnonymizedPDF, TextItem, PageInfo, BoundingBox } from "@/lib/pdf-helper";
import { Loader2, Download, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";

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

        // Merge with existing manual redactions (preserve manual images)
        setRedactions(prev => {
            const manuals = prev.filter(r => r.type === 'image-manual');
            // Filter out old text matches? Or keep them? 
            // Ideally we re-run search.
            // Let's just add new matches that aren't already there?
            // Simpler: Replace text matches, keep manual.
            return [...manuals, ...matches];
        });
    };

    const handleProcess = async () => {
        if (!file) return;
        setStep("processing");

        // Wait a bit for UI update
        await new Promise(r => setTimeout(r, 500));

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
        <main className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <ShieldCheck className="text-white w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">AnonimiCV</h1>
                </div>
                {step !== "upload" && (
                    <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                        Nuevo Archivo
                    </Button>
                )}
            </header>

            <div className="flex-1 container mx-auto p-6 max-w-6xl">

                {/* STATUS BAR */}
                <div className="mb-8 flex justify-center">
                    {/* Breadcrumbs or Steps could go here */}
                </div>

                {/* UPLOAD STEP */}
                {step === "upload" && (
                    <div className="max-w-xl mx-auto mt-12">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Elimina datos sensibles de tus CVs</h2>
                            <p className="text-slate-500 text-lg">Procesamiento seguro en tu navegador. Arrastra un PDF para comenzar.</p>
                        </div>
                        <Card>
                            <CardContent className="pt-6">
                                <FileUploader onFileSelect={handleFileSelect} />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ANALYZING STEP */}
                {step === "analyzing" && (
                    <div className="flex flex-col items-center justify-center h-[50vh]">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <h3 className="text-xl font-medium text-slate-900">Analizando documento...</h3>
                        <p className="text-slate-500">Detectando texto y estructura</p>
                    </div>
                )}

                {/* REVIEW STEP */}
                {step === "review" && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[80vh]">

                        {/* SIDEBAR CONTROLS */}
                        <Card className="lg:col-span-1 h-full flex flex-col">
                            <CardHeader>
                                <CardTitle>Configuración</CardTitle>
                                <CardDescription>Define qué datos ocultar</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 flex-1 overflow-y-auto">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Iniciales candidata/o:</label>
                                    <Input
                                        placeholder="Ej: M,B,C"
                                        value={initials}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                                            const formatted = raw.split('').slice(0, 5).join(',');
                                            setInitials(formatted);
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Aparecerán en la cabecera del PDF: {initials ? initials.split(',').join('.') + '.' : ''}
                                    </p>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800 space-y-2">
                                    <p className="font-medium flex items-center gap-2">
                                        <ShieldCheck size={14} /> Modo Manual
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Haz <strong>click</strong> en el texto para ocultarlo/mostrarlo.</li>
                                        <li><strong>Arrastra</strong> el ratón para crear un área de censura (imágenes).</li>
                                    </ul>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Elementos a ocultar:</span>
                                        <span className="font-bold">{redactions.length}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="p-6 pt-0 mt-auto">
                                <Button className="w-full" size="lg" onClick={handleProcess}>
                                    Anonimizar PDF
                                </Button>
                            </div>
                        </Card>

                        {/* PDF VIEWER */}
                        <div className="lg:col-span-3 h-full bg-slate-100 rounded-xl border overflow-hidden">
                            <PDFViewer
                                file={file}
                                initialTextItems={textItems}
                                pages={pages}
                                onRedactionChange={setRedactions}
                            />
                        </div>
                    </div>
                )}

                {/* PROCESSING STEP */}
                {step === "processing" && (
                    <div className="flex flex-col items-center justify-center h-[50vh]">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <h3 className="text-xl font-medium text-slate-900">Aplicando censura...</h3>
                        <p className="text-slate-500">Generando nuevo PDF seguro</p>
                    </div>
                )}

                {/* DONE STEP */}
                {step === "done" && (
                    <div className="max-w-md mx-auto mt-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">¡Listo!</h2>
                        <p className="text-slate-500 mb-8">
                            Tu documento ha sido anonimizado correctamente. Se han ocultado {redactions.length} elementos.
                        </p>

                        <div className="space-y-3">
                            <Button className="w-full" size="lg" onClick={handleDownload}>
                                <Download className="mr-2 h-4 w-4" /> Descargar PDF
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                                Procesar otro archivo
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}
