"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Send, Paperclip, Loader2, Bug, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackForm = {
    title: string;
    description: string;
    attachment: FileList;
};

export default function FeedbackModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
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
                setTimeout(() => {
                    setSuccess(false);
                    setIsOpen(false);
                    reset();
                }, 2000);
            } else {
                alert("Houston, we have a problem sending your feedback.");
            }
        } catch (error) {
            console.error(error);
            alert("Translation error. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform hover:rotate-3 group border border-slate-700/50"
                title="Send Feedback"
            >
                <MessageSquare className="w-6 h-6 group-hover:hidden" />
                <Bug className="w-6 h-6 hidden group-hover:block text-green-400" />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-6 overflow-hidden">
                {/* Geometrical decorative elements */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Feedback Terminal
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Report bugs or request cool features!</p>
                </div>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Send className="w-8 h-8 text-green-400" />
                        </div>
                        <p className="text-green-400 font-mono text-lg">Transmission Received!</p>
                        <p className="text-slate-500 text-sm">Over and out.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-slate-500 uppercase tracking-wider">Subject</label>
                            <input
                                {...register("title", { required: true })}
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600 font-mono text-sm"
                                placeholder="e.g. Bug found in sector 7..."
                            />
                            {errors.title && <span className="text-red-400 text-xs">This field is required</span>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono text-slate-500 uppercase tracking-wider">Intel</label>
                            <textarea
                                {...register("description", { required: true })}
                                rows={4}
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600 resize-none font-mono text-sm"
                                placeholder="Detailed intel on the anomaly..."
                            />
                            {errors.description && <span className="text-red-400 text-xs">This field is required</span>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono text-slate-500 uppercase tracking-wider">Evidence (Optional)</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    {...register("attachment")}
                                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 cursor-pointer bg-slate-900/50 border border-slate-800 rounded-lg p-1"
                                />
                                <Paperclip className="absolute right-3 top-2.5 w-4 h-4 text-slate-600 pointer-events-none" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group mt-4 relative overflow-hidden"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Transmit Data</span>
                                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
