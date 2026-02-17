"use client";

import { useEffect, useRef, useState } from "react";
// Remove top-level pdfjs-dist import
import { TextItem, PageInfo, BoundingBox } from "@/lib/pdf-helper";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface PDFViewerProps {
    file: File | null;
    initialTextItems: TextItem[];
    pages: PageInfo[];
    onRedactionChange: (redactions: BoundingBox[]) => void;
}

export default function PDFViewer({ file, initialTextItems, pages, onRedactionChange }: PDFViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1.2);
    const [redactions, setRedactions] = useState<BoundingBox[]>([]);
    const [manualSelection, setManualSelection] = useState<{ start: { x: number, y: number }, end: { x: number, y: number }, pageIndex: number } | null>(null);

    // Initialize worker
    useEffect(() => {
        const initWorker = async () => {
            if (typeof window !== "undefined") {
                const pdfjsLib = await import("pdfjs-dist");
                if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
                }
            }
        };
        initWorker();
    }, []);

    // Helper: Toggle Text Redaction
    const toggleTextRedaction = (item: TextItem) => {
        setRedactions(prev => {
            const exists = prev.find(r => r.x === item.x && r.y === item.y && r.pageIndex === item.pageIndex && r.type === 'text');
            if (exists) {
                return prev.filter(r => r !== exists);
            } else {
                return [...prev, {
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height,
                    pageIndex: item.pageIndex,
                    type: 'text',
                    text: item.str
                }];
            }
        });
    };

    // Propagate changes
    useEffect(() => {
        onRedactionChange(redactions);
    }, [redactions, onRedactionChange]);

    // Handle Manual Selection (Image/Block)
    const handleMouseDown = (e: React.MouseEvent, pageIndex: number, pageHeight: number) => {
        // Only if clicking on background (not text)
        if ((e.target as HTMLElement).tagName !== 'CANVAS' && !(e.target as HTMLElement).classList.contains('page-overlay')) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        // PDF Y is dependent on coordinate system.
        // Assuming standard PDF (0,0 bottom-left), but PDF.js renders top-left 0,0 usually.
        // Our text items from analyzePdf come from pdf.js textContent which are usually PDF coords (bottom-left 0,0).
        // BUT we need to convert mouse (top-left) to PDF (bottom-left).
        const yTop = (e.clientY - rect.top) / scale;
        const yBottom = pageHeight - yTop; // Convert to PDF coords?

        // Wait, let's verify textItem coords. 
        // If textItems are used for overlay, we need to know their system.
        // Usually pdf.js textContent: x, y are lower-left corner of text.

        setManualSelection({
            start: { x: x, y: yBottom }, // Saving start point in PDF coords
            end: { x: x, y: yBottom },
            pageIndex
        });
    };

    const handleMouseMove = (e: React.MouseEvent, pageHeight: number) => {
        if (!manualSelection) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const yTop = (e.clientY - rect.top) / scale;
        const yBottom = pageHeight - yTop;

        setManualSelection(prev => prev ? { ...prev, end: { x, y: yBottom } } : null);
    };

    const handleMouseUp = () => {
        if (!manualSelection) return;

        const { start, end, pageIndex } = manualSelection;

        // Normalize rect
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y); // Bottom-left Y
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);

        if (width > 5 && height > 5) {
            setRedactions(prev => [...prev, {
                x, y, width, height, pageIndex, type: 'image-manual'
            }]);
        }
        setManualSelection(null);
    };

    // Remove manual redaction
    const removeRedaction = (index: number) => {
        setRedactions(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-col items-center gap-8 w-fit min-w-full min-h-full bg-slate-200/30 py-8 px-2 md:px-16" ref={containerRef}>
            {file && pages.map((page) => (
                <div key={page.index} className="relative shadow-lg ring-1 ring-black/5 bg-white">
                    <PDFPage
                        file={file}
                        pageIndex={page.index}
                        scale={scale}
                        width={page.width}
                        height={page.height}
                    />

                    {/* Overlay Layer */}
                    <div
                        className="absolute inset-0 page-overlay cursor-crosshair"
                        style={{ width: page.width * scale, height: page.height * scale }}
                        onMouseDown={(e) => handleMouseDown(e, page.index, page.height)}
                        onMouseMove={(e) => handleMouseMove(e, page.height)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Text Items */}
                        {initialTextItems
                            .filter(item => item.pageIndex === page.index)
                            .map((item, idx) => {
                                // Conversion: PDF (bottom-left) -> CSS (top-left)
                                // y in PDF is from bottom. CSS top = pageHeight - y - height
                                const isRedacted = redactions.some(r => r.x === item.x && r.y === item.y && r.type === 'text');

                                return (
                                    <div
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); toggleTextRedaction(item); }}
                                        className={cn(
                                            "absolute cursor-pointer transition-colors hover:bg-yellow-200/50",
                                            isRedacted ? "bg-black text-transparent hover:bg-black/80" : ""
                                        )}
                                        style={{
                                            left: item.x * scale,
                                            top: (page.height - item.y - item.height) * scale, // Adjust coordinate
                                            width: item.width * scale,
                                            height: item.height * scale,
                                            userSelect: 'none' // Prevent native text selection
                                        }}
                                        title={item.str}
                                    />
                                );
                            })}

                        {/* Manual Redactions (Images) */}
                        {redactions
                            .filter(r => r.pageIndex === page.index && r.type === 'image-manual')
                            .map((r, idx) => (
                                <div
                                    key={`manual-${idx}`}
                                    className="absolute border-2 border-red-500 bg-white/80 flex items-center justify-center"
                                    style={{
                                        left: r.x * scale,
                                        top: (page.height - r.y - r.height) * scale,
                                        width: r.width * scale,
                                        height: r.height * scale
                                    }}
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeRedaction(redactions.indexOf(r)); }}
                                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                    >
                                        <X size={12} />
                                    </button>
                                    <div className="absolute inset-0 pointer-events-none">
                                        <svg width="100%" height="100%">
                                            <line x1="0" y1="0" x2="100%" y2="100%" stroke="red" strokeWidth="1" />
                                            <line x1="0" y1="100%" x2="100%" y2="0" stroke="red" strokeWidth="1" />
                                        </svg>
                                    </div>
                                </div>
                            ))
                        }

                        {/* Drag Selection Visual */}
                        {manualSelection && manualSelection.pageIndex === page.index && (
                            <div
                                className="absolute border-2 border-blue-500 bg-blue-200/30"
                                style={{
                                    left: Math.min(manualSelection.start.x, manualSelection.end.x) * scale,
                                    // CSS Top calculation from PDF Y (bottom-left)
                                    // yBottom = specified PDF Y.
                                    // top = pageHeight - yBottom - height
                                    // Hmm, during drag we track 'y' as PDF coordinate (bottom-left) ? 
                                    // start.y is PDF coord. end.y is PDF coord.
                                    // height = abs(start.y - end.y)
                                    // top = pageHeight - max(start.y, end.y) 
                                    top: (page.height - Math.max(manualSelection.start.y, manualSelection.end.y)) * scale,
                                    width: Math.abs(manualSelection.end.x - manualSelection.start.x) * scale,
                                    height: Math.abs(manualSelection.end.y - manualSelection.start.y) * scale
                                }}
                            />
                        )}

                    </div>
                </div>
            ))}
        </div>
    );
}

function PDFPage({ file, pageIndex, scale, width, height }: { file: File, pageIndex: number, scale: number, width: number, height: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<any>(null);

    useEffect(() => {
        const renderPage = async () => {
            if (!canvasRef.current || !file) return;

            const pdfjsLib = await import("pdfjs-dist");

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(pageIndex + 1);

            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            const renderTask = page.render(renderContext as any);
            renderTaskRef.current = renderTask;

            try {
                await renderTask.promise;
            } catch (e: any) {
                if (e.name !== 'RenderingCancelledException') {
                    console.error(e);
                }
            }
        };

        renderPage();

        return () => {
            if (renderTaskRef.current) renderTaskRef.current.cancel();
        };

    }, [file, pageIndex, scale]);

    return <canvas ref={canvasRef} className="block" />;
}
