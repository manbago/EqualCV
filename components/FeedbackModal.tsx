"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Send, Paperclip, Loader2, Bug, MessageSquare, Sparkles } from "lucide-react";

type FeedbackForm = {
    title: string;
    description: string;
    attachment: FileList;
};

export default function FeedbackModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [fileName, setFileName] = useState<string>("");
    const [showTooltip, setShowTooltip] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FeedbackForm>();

    const onSubmit = async (data: FeedbackForm) => {
        setIsSubmitting(true);
        try {
            let attachmentBase64 = "";

            if (data.attachment && data.attachment.length > 0) {
                const file = data.attachment[0];
                const reader = new FileReader();
                attachmentBase64 = await new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
            }

            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    attachment: attachmentBase64,
                }),
            });

            if (res.ok) {
                setSuccess(true);
                reset();
            } else {
                alert("Hubo un problema al enviar tu feedback. Inténtalo de nuevo.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                {/* Tooltip */}
                <div
                    className={`absolute bottom-full right-0 mb-3 transition-all duration-300 ${showTooltip ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                        }`}
                >
                    <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl relative whitespace-nowrap">
                        <p className="text-sm font-bold">🐛 ¿Has visto un bug?</p>
                        <p className="text-xs text-slate-300 mt-0.5">¡Cazalo y cuéntamelo!</p>
                        {/* Arrow */}
                        <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 transform rotate-45"></div>
                    </div>
                </div>

                {/* Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:shadow-blue-500/50 transition-all duration-300 group hover:-translate-y-2 hover:rotate-12"
                    aria-label="Enviar Feedback"
                >
                    <div className="relative w-6 h-6">
                        <MessageSquare className="w-6 h-6 group-hover:opacity-0 transition-opacity duration-300 absolute inset-0" />
                        <Bug className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-0 text-green-300 animate-bounce" />
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Decorative background blobs */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        setSuccess(false);
                        setFileName("");
                        reset();
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-1 rounded-full z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8 relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3 shadow-sm border border-blue-100 animate-bounce">
                        <Bug className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        ¿Feedback?
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                        Cuéntanos qué te parece la herramienta o reporta cualquier error que encuentres.
                    </p>
                </div>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center ring-8 ring-green-50">
                            <Send className="w-10 h-10 text-green-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-slate-900 font-bold text-xl">¡Mensaje Recibido!</p>
                            <p className="text-slate-500 text-sm mt-1">Gracias por tu colaboración.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Asunto</label>
                            <input
                                {...register("title", { required: true })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-sm"
                                placeholder="Ej: He encontrado un error..."
                            />
                            {errors.title && <span className="text-red-500 text-xs font-medium">Este campo es obligatorio</span>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Descripción</label>
                            <textarea
                                {...register("description", { required: true })}
                                rows={4}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none text-sm"
                                placeholder="Cuéntanos más detalles..."
                            />
                            {errors.description && <span className="text-red-500 text-xs font-medium">Este campo es obligatorio</span>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Adjuntar captura (Opcional)</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    {...register("attachment")}
                                    onChange={(e) => {
                                        const files = e.target.files;
                                        if (files && files.length > 0) {
                                            setFileName(files[0].name);
                                        } else {
                                            setFileName("");
                                        }
                                        // Call the original onChange from register
                                        register("attachment").onChange(e);
                                    }}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors text-sm"
                                >
                                    <span className={fileName ? "text-slate-900" : "text-slate-400"}>
                                        {fileName || "Ningún archivo seleccionado"}
                                    </span>
                                    <span className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors">
                                        <Paperclip className="w-3.5 h-3.5" />
                                        Seleccionar
                                    </span>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Enviar Feedback</span>
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
