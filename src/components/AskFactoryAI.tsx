import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, User, CornerDownLeft, MessageSquare, Loader2, RefreshCw, DownloadCloud, CloudUpload, Image as ImageIcon, Mic, MicOff, Volume2 } from "lucide-react";
import { Branch } from "../types";
import { jsPDF } from "jspdf";
import { uploadPdfToDrive } from "../utils/googleDrive";
import AlishaLogo from "./AlishaLogo";
import AlishaIcon from "./AlishaIcon";

interface Message {
  role: "user" | "model";
  text: string;
  image?: string;
}

interface AskFactoryAIProps {
  activeBranch: Branch;
  isFloating?: boolean;
  onClose?: () => void;
}

export default function AskFactoryAI({ activeBranch, isFloating = false, onClose }: AskFactoryAIProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Voice Assistant states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const starterQuestions = [
    { text: "Summarize active branch performance.", label: "Performance Summary" },
    { text: "Check for any low-stock products.", label: "Low-Stock Check" },
    { text: "Analyze recent sales transactions.", label: "Sales Analysis" },
    { text: "Compare expenses vs total sales.", label: "Financial Review" },
  ];

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Voice setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "bn-BD"; // Set to Bengali

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setPrompt(transcript);
          handleSend(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, [activeBranch]); // Re-bind if needed, though mostly static

  const speak = useCallback(async (text: string, lang = "bn-BD") => {
    try {
      setIsSpeaking(true);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: lang, voice: "Aoede" }),
      });
      if (!res.ok) throw new Error("Failed to generate audio");
      
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        
        // Save to ref so we can stop it later
        if (recognitionRef.current) {
          (recognitionRef.current as any).audioInstance = audio;
        }
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error("TTS Error:", err);
      setIsSpeaking(false);
    }
  }, []);

  // Initial greeting
  useEffect(() => {
    const hasGreetedToday = sessionStorage.getItem("alisha_ai_greeted");
    if (!hasGreetedToday) {
      sessionStorage.setItem("alisha_ai_greeted", "true");
      // Add a small delay to ensure voices are loaded
      setTimeout(() => {
        const greeting = "হ্যালো স্যার, আপনার দিনটি শুভ হোক। আমি আপনার ফ্যাক্টরির এআই অ্যাসিস্ট্যান্ট বলছি। আপনার যদি কোনো তথ্যের প্রয়োজন হয় বা কোনো বিষয় নিয়ে আলোচনা করতে চান, তাহলে আমাকে জানাতে পারেন।";
        setMessages([{ role: "model", text: greeting }]);
        speak(greeting);
      }, 1000);
    }
  }, [speak]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setPrompt("");
      recognitionRef.current?.start();
      setIsListening(true);
      if (isSpeaking) {
        if (recognitionRef.current && (recognitionRef.current as any).audioInstance) {
          ((recognitionRef.current as any).audioInstance as HTMLAudioElement).pause();
        }
        setIsSpeaking(false);
      }
    }
  };

  const stopSpeaking = () => {
    if (recognitionRef.current && (recognitionRef.current as any).audioInstance) {
      ((recognitionRef.current as any).audioInstance as HTMLAudioElement).pause();
    }
    setIsSpeaking(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async (textToSend: string) => {
    if ((!textToSend.trim() && !selectedImage) || loading) return;

    setError(null);
    const userMessage: Message = { role: "user", text: textToSend, image: selectedImage || undefined };
    setMessages((prev) => [...prev, userMessage]);
    
    const currentImage = selectedImage;
    setPrompt("");
    setSelectedImage(null);
    setLoading(true);

    try {
      // Map previous messages to the history format expected by our server
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textToSend,
          image: currentImage,
          branchData: activeBranch,
          history: chatHistory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate AI response.");
      }

      if (data.text) {
        setMessages((prev) => [...prev, { role: "model", text: data.text }]);
        // Speak the response if the user recently used voice, or just always speak if possible
        speak(data.text);
      } else {
        throw new Error("Empty response received from AI.");
      }
    } catch (err: any) {
      console.error("AI Error:", err);
      setError(err.message || "Something went wrong while communicating with the AI.");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const generatePDFBlob = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 210, 20, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`ALISHA FACTORY AI CHAT: ${activeBranch.name}`, 10, 14);
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    
    let y = 30;
    messages.forEach(m => {
      // Basic text wrapping
      const textLines = doc.splitTextToSize(`${m.role === "user" ? "You" : "AI"}: ${m.text}`, 190);
      
      // If we are close to bottom, add new page
      if (y + (textLines.length * 5) > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont("helvetica", m.role === "user" ? "bold" : "normal");
      doc.text(textLines, 10, y);
      y += (textLines.length * 5) + 5;
    });
    
    return doc.output("blob");
  };

  const handleDownload = () => {
    if (messages.length === 0) {
      alert("No messages to download.");
      return;
    }
    const blob = generatePDFBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AI_Chat_${activeBranch.name.replace(/ /g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDriveUpload = async () => {
    if (messages.length === 0) {
      alert("No messages to upload.");
      return;
    }
    setIsUploading(true);
    try {
      const blob = generatePDFBlob();
      const link = await uploadPdfToDrive(blob, `AI_Chat_${activeBranch.name.replace(/ /g, "_")}.pdf`, "Alisha Factory Exports");
      alert(`Successfully uploaded to Google Drive!\nLink: ${link}`);
    } catch (err: any) {
      alert(`Drive upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      id={isFloating ? "ask-factory-ai-floating" : "ask-factory-ai-card"}
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full ${
        isFloating ? "max-h-[500px]" : "min-h-[450px]"
      }`}
    >
      {/* Header bar */}
      <div className="px-4.5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center scale-90 w-8 h-8">
            <AlishaLogo size="sm" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Ask Factory AI</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {activeBranch.name} Co-pilot
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button 
                onClick={handleDownload}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                title="Download Chat PDF"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleDriveUpload}
                disabled={isUploading}
                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all disabled:opacity-50"
                title="Upload Chat to Google Drive"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={clearChat}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                title="Clear Conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50 backdrop-blur-xs">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <div className="flex items-center justify-center mb-5 scale-150">
              <AlishaLogo size="sm" />
            </div>
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest mb-1">
              Ask about Alisha data
            </h4>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed mb-4">
              I have full real-time knowledge of stock levels, customer outstanding dues, expenses, and sales. Try clicking a shortcut below:
            </p>

            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {starterQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.text)}
                  className="p-2.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-100 rounded-xl text-left text-[10px] font-bold text-slate-600 hover:text-emerald-800 transition-all cursor-pointer shadow-3xs"
                >
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                    {q.label}
                  </span>
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, idx) => {
              const isAI = m.role === "model";
              return (
                <div key={idx} className={`flex gap-2.5 ${isAI ? "justify-start" : "justify-end"}`}>
                  {isAI && (
                    <div className="flex items-center justify-center shrink-0 self-start mt-0.5 scale-75 w-7 h-7">
                      <AlishaLogo size="sm" />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-3xs leading-relaxed ${
                      isAI
                        ? "bg-slate-50 border border-slate-100 text-slate-800"
                        : "bg-emerald-600 text-white font-medium"
                    }`}
                  >
                    {isAI ? (
                      <div className="prose prose-sm max-w-none font-sans whitespace-pre-wrap">
                        {m.text}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {m.image && (
                          <img src={m.image} alt="User Upload" className="max-w-full rounded-xl object-contain max-h-48" />
                        )}
                        {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                      </div>
                    )}
                  </div>
                  {!isAI && (
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-slate-100 flex items-center justify-center shrink-0 self-start mt-0.5 text-[10px] font-bold">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="flex items-center justify-center shrink-0 self-start scale-75 w-7 h-7">
                  <AlishaLogo size="sm" />
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2 shadow-3xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    Analyzing factory data...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => handleSend(messages[messages.length - 1]?.text)}
                  className="px-2 py-1 bg-white hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input Section */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex flex-col gap-2">
        {selectedImage && (
          <div className="relative inline-block self-start">
            <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(prompt);
          }}
          className="relative flex items-center"
        >
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="absolute left-1.5 p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors z-10"
            title="Attach product image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask AI or describe image..."}
            className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-24 py-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400 shadow-3xs"
            disabled={loading}
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Stop speaking"
              >
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isListening ? 'text-rose-500 bg-rose-50 animate-pulse' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              title={isListening ? "Stop listening" : "Start voice assistant"}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button
              type="submit"
              disabled={(!prompt.trim() && !selectedImage) || loading}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-all cursor-pointer shadow-3xs flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
