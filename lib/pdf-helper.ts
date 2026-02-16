import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
// Removed top-level pdfjs-dist import to prevent SSR crashes

export interface TextItem {
    str: string;
    x: number;
    y: number; // PDF coordinates (0,0 is bottom-left usually, but pdf.js gives from top-left sometimes depending on viewport)
    width: number;
    height: number;
    pageIndex: number;
}

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    pageIndex: number;
    type?: 'text' | 'image-manual';
    text?: string;
}

export interface PageInfo {
    index: number;
    width: number;
    height: number;
}

export async function analyzePdf(file: File): Promise<{ textItems: TextItem[], pages: PageInfo[] }> {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist");

    // Initialize worker if needed
    if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
    const pdf = await loadingTask.promise;

    const textItems: TextItem[] = [];
    const pages: PageInfo[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 }); // 72 DPI, 1pt = 1px usually

        pages.push({
            index: i - 1,
            width: viewport.width,
            height: viewport.height
        });

        const textContent = await page.getTextContent();

        textContent.items.forEach((item: any) => {
            // item.transform is [scaleX, skewX, skewY, scaleY, x, y]
            // PDF coordinates: (0,0) is bottom-left.
            // PDF.js TextContent coordinates are PDF coordinates.
            const tx = item.transform;
            textItems.push({
                str: item.str,
                x: tx[4],
                y: tx[5],
                width: item.width,
                height: item.height,
                pageIndex: i - 1
            });
        });
    }

    return { textItems, pages };
}

export async function generateAnonymizedPDF(
    originalFile: File,
    redactions: BoundingBox[],
    initials: string = "",
    showGenericLogo: boolean = true
): Promise<Uint8Array> {
    // Dynamic import
    const pdfjsLib = await import("pdfjs-dist");

    // Initialize worker if needed
    if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await originalFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
    const originalPdf = await loadingTask.promise;

    // Create new PDF document
    const newPdfDoc = await PDFDocument.create();
    const helveticaFont = await newPdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Format initials: M,B,C -> M.B.C.
    const formattedInitials = initials
        ? initials.split(',').map(i => i.trim().toUpperCase()).join('.') + (initials ? '.' : '')
        : '';

    // Rasterize each page
    for (let pageNum = 1; pageNum <= originalPdf.numPages; pageNum++) {
        const page = await originalPdf.getPage(pageNum);
        const scale = 2.0; // High quality scale
        const viewport = page.getViewport({ scale });

        // Create canvas for rendering
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");

        if (!context) continue;

        // Render PDF page to canvas
        await page.render({
            canvasContext: context,
            viewport: viewport,
        }).promise;

        // Apply Redactions (Burn into image)
        const pageIndex = pageNum - 1;
        const pageRedactions = redactions.filter(r => r.pageIndex === pageIndex);

        pageRedactions.forEach(r => {
            // Calculate Canvas Coordinates
            // PDF: (0,0) bottom-left. Canvas: (0,0) top-left.
            // r.y is bottom Y of the rect in PDF coords.
            const x = r.x * scale;
            const y = viewport.height - (r.y + r.height) * scale;
            const w = r.width * scale;
            const h = r.height * scale;

            // Draw White Mask
            context.fillStyle = "white";
            context.fillRect(x, y, w, h);

            if (r.type === 'text') {
                // Draw '#' characters
                context.fillStyle = "black";
                const fontSize = h * 0.8;
                context.font = `${fontSize}px Helvetica, Arial, sans-serif`;
                context.textBaseline = "middle";
                const charWidth = fontSize * 0.6; // Approx width
                const numChars = r.text ? r.text.length : Math.floor(w / charWidth);
                const text = "#".repeat(Math.max(1, numChars));

                // Draw text centered in rect
                context.fillText(text, x, y + h / 2);
            } else if (r.type === 'image-manual') {
                // Image Redaction Indicator (Red Box with X)
                // Since this is burned in, we can make it look like a placeholder
                context.strokeStyle = "black";
                context.lineWidth = 2 * scale;
                context.strokeRect(x, y, w, h);

                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x + w, y + h);
                context.moveTo(x, y + h);
                context.lineTo(x + w, y);
                context.stroke();
            }
        });

        // Convert canvas to image
        const imgDisplayHeight = viewport.height / scale;
        const imgDisplayWidth = viewport.width / scale;
        const imgDataUrl = canvas.toDataURL("image/jpeg", 0.85); // JPEG 85% quality
        const imgBytes = await fetch(imgDataUrl).then(res => res.arrayBuffer());

        // Embed image into new PDF
        const jpgImage = await newPdfDoc.embedJpg(imgBytes);

        // Add Header Space
        const HEADER_HEIGHT = 80;
        const newPageHeight = imgDisplayHeight + HEADER_HEIGHT;

        const newPage = newPdfDoc.addPage([imgDisplayWidth, newPageHeight]);

        // Draw the rasterized page image (content at bottom)
        newPage.drawImage(jpgImage, {
            x: 0,
            y: 0, // Bottom alignment
            width: imgDisplayWidth,
            height: imgDisplayHeight,
        });

        // Draw Header
        const headerY = newPageHeight - 70;

        // Draw Initials on the right
        if (formattedInitials) {
            const initialsSize = 20;
            const initialsWidth = helveticaBold.widthOfTextAtSize(formattedInitials, initialsSize);
            newPage.drawText(formattedInitials, {
                x: imgDisplayWidth - initialsWidth - 20,
                y: newPageHeight - 40,
                size: initialsSize,
                font: helveticaBold,
                color: rgb(0, 0, 0)
            });
        }

        newPage.drawText("CV Anonimizado", {
            x: 200,
            y: newPageHeight - 35,
            size: 18,
            font: helveticaBold,
            color: rgb(0.2, 0.2, 0.2)
        });

        newPage.drawText("Candidata/o en proceso de selección", {
            x: 200,
            y: newPageHeight - 55,
            size: 11,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5)
        });

        // Logo
        if (showGenericLogo) {
            // Logo Placeholder
            newPage.drawRectangle({
                x: 20,
                y: headerY,
                width: 150,
                height: 50,
                color: rgb(0.9, 0.9, 0.9)
            });
            newPage.drawText("LOGO", {
                x: 70,
                y: headerY + 20,
                size: 12,
                font: helveticaFont,
                color: rgb(0.5, 0.5, 0.5)
            });
        } else {
            try {
                // Use absolute URL if possible to avoid issues with some browsers/environments
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                const logoUrl = `${baseUrl}/logo.png`;

                const response = await fetch(logoUrl);
                if (!response.ok) throw new Error(`Failed to fetch logo: ${response.statusText}`);

                const logoBytes = await response.arrayBuffer();
                let logoImage;

                try {
                    // Try PNG first
                    logoImage = await newPdfDoc.embedPng(logoBytes);
                } catch (pngError) {
                    // Fallback to JPG
                    try {
                        logoImage = await newPdfDoc.embedJpg(logoBytes);
                    } catch (jpgError) {
                        throw new Error('Image format not supported (must be PNG or JPG)');
                    }
                }

                const dims = logoImage.scaleToFit(150, 50);
                newPage.drawImage(logoImage, {
                    x: 20,
                    y: headerY + (50 - dims.height) / 2,
                    width: dims.width,
                    height: dims.height,
                });
            } catch (error) {
                console.error("Error loading logo.png:", error);

                // Visible fallback in PDF to indicate error during development
                newPage.drawRectangle({
                    x: 20,
                    y: headerY,
                    width: 150,
                    height: 50,
                    color: rgb(0.95, 0.95, 0.95),
                    borderColor: rgb(0.8, 0.2, 0.2),
                    borderWidth: 1
                });
                newPage.drawText("Error logo", {
                    x: 45,
                    y: headerY + 20,
                    size: 10,
                    font: helveticaFont,
                    color: rgb(0.8, 0.2, 0.2)
                });
            }
        }
    }

    // Set Metadata
    newPdfDoc.setProducer("AnonimiCV");
    newPdfDoc.setCreator("AnonimiCV");

    return await newPdfDoc.save();
}
