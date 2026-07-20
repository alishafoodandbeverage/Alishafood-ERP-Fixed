import React, { useState, useEffect } from "react";
import { Share2, Map, Users, LayoutDashboard, DownloadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { Branch } from "../types";
import { signInWithGoogleDrive, getAccessToken } from "../utils/firebase";

// Ensure @vis.gl/react-google-maps is installed
import { APIProvider, Map as GoogleMap, Marker } from "@vis.gl/react-google-maps";

function parseGoogleMapsInput(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  
  // 1. If it's an iframe embed code, extract the src attribute
  const iframeSrcMatch = trimmed.match(/src="([^"]+)"/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    let src = iframeSrcMatch[1];
    // Check if we can extract coordinate or query parameter from the embed URL
    const qMatch = src.match(/[?&]q=([^&]+)/);
    if (qMatch && qMatch[1]) {
      return decodeURIComponent(qMatch[1]);
    }
    const pbMatch = src.match(/!2d([0-9.-]+)!3d([0-9.-]+)/); // !2d is longitude, !3d is latitude
    if (pbMatch && pbMatch[1] && pbMatch[2]) {
      return `${pbMatch[2]},${pbMatch[1]}`;
    }
    return src;
  }

  // 2. If it's a long Google Maps URL containing coordinates like @22.8335031,91.1009949
  const coordUrlMatch = trimmed.match(/@([0-9.-]+),([0-9.-]+)/);
  if (coordUrlMatch && coordUrlMatch[1] && coordUrlMatch[2]) {
    return `${coordUrlMatch[1]},${coordUrlMatch[2]}`;
  }

  // 3. If it contains query parameter 'q' or 'query'
  try {
    const url = new URL(trimmed);
    const q = url.searchParams.get("q") || url.searchParams.get("query");
    if (q) return q;
  } catch (e) {
    // Not a valid URL, treat as plain text/address
  }

  // 4. If it's a coordinate pair directly (e.g. 22.8335, 91.1009)
  const directCoordMatch = trimmed.match(/^\s*([-+]?[0-9.]+)\s*,\s*([-+]?[0-9.]+)\s*$/);
  if (directCoordMatch && directCoordMatch[1] && directCoordMatch[2]) {
    return `${directCoordMatch[1]},${directCoordMatch[2]}`;
  }

  return trimmed;
}

interface IntegrationsViewProps {
  activeBranch?: Branch;
  onUpdateBranchLocation?: (newLocation: string) => void;
}

export default function IntegrationsView({ activeBranch, onUpdateBranchLocation }: IntegrationsViewProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editLocationValue, setEditLocationValue] = useState(activeBranch?.location || "");

  useEffect(() => {
    setEditLocationValue(activeBranch?.location || "");
  }, [activeBranch?.location]);

  const handleSignIn = async () => {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      await signInWithGoogleDrive();
      setIsAuthenticated(true);
    } catch (error: any) {
      setAuthError(error.message || "Failed to sign in to Google Drive.");
    } finally {
      setLoadingAuth(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-600" />
            Integrations & Media
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage Google Drive backups, locations, and social media channels for {activeBranch?.name || "the factory"}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Drive Integration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Google Drive Backup</h3>
            <p className="text-sm text-slate-500 mt-2">
              Connect your Google Drive to enable direct PDF uploads for factory data, sales reports, and expenses. Data is organized by factory name.
            </p>
          </div>

          <div className="mt-6">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Connected to Google Drive
              </div>
            ) : (
              <div>
                {authError && (
                  <div className="flex items-center gap-2 p-2 mb-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-100">
                    <AlertCircle className="w-4 h-4" />
                    {authError}
                  </div>
                )}
                <button
                  onClick={handleSignIn}
                  disabled={loadingAuth}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {loadingAuth ? "Connecting..." : "Connect Google Drive"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Social Media Integration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Social Channels</h3>
            <p className="text-sm text-slate-500 mt-2">
              Manage your factory's online presence. Link your Facebook Page and WhatsApp Business account for easy sharing.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </div>
                <span className="font-bold text-slate-700 text-sm">Facebook Page</span>
              </div>
              <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">Open</span>
            </a>
            
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </div>
                <span className="font-bold text-slate-700 text-sm">WhatsApp Business</span>
              </div>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">Message</span>
            </a>
          </div>
        </div>

        {/* Factory Location & Maps */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Map className="w-5 h-5 text-emerald-600" />
                Factory Location Map
              </h3>
              {isEditingLocation ? (
                <div className="mt-3 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200 w-full md:min-w-[500px]">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">লোকেশন ও ম্যাপ প্রিভিউ সেট করুন</p>
                  
                  <div className="space-y-3 text-left">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">১. টেক্সট লোকেশন / ঠিকানা (যেমন: বিসিক শিল্প নগরী, নোয়াখালী)</label>
                      <input
                        type="text"
                        value={editLocationValue}
                        onChange={(e) => setEditLocationValue(e.target.value)}
                        placeholder="এখানে কারখানার ঠিকানা বা নাম লিখুন"
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-emerald-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                          }
                        }}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-50 px-2 text-slate-400 font-bold text-[10px]">অথবা সরাসরি লিংক/কোড পেস্ট করুন</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        ২. গুগল ম্যাপস এম্বেড কোড বা লিংক পেস্ট করুন (Paste Maps Link / Embed HTML / Coordinates)
                      </label>
                      <textarea
                        placeholder={`এখানে Google Maps থেকে কপি করা HTML কোড (যেমন: <iframe src="..." />) অথবা কোঅর্ডিনেট পেস্ট করুন।`}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          if (val) {
                            const parsed = parseGoogleMapsInput(val);
                            setEditLocationValue(parsed);
                          }
                        }}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-emerald-500 font-mono h-20"
                      />
                    </div>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100 text-[11px] text-slate-700 space-y-1 text-left">
                    <p className="font-bold text-emerald-800">💡 কিভাবে ম্যাপের নির্দিষ্ট পিন প্রিভিউ আনবেন:</p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>
                        <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">
                          এখানে ক্লিক করে Google Maps খুলুন
                        </a>।
                      </li>
                      <li>আপনার কারখানা বা নির্দিষ্ট লোকেশনটি সার্চ করে সিলেক্ট করুন।</li>
                      <li>ম্যাপে <b>Share (শেয়ার)</b> বাটনে ক্লিক করুন।</li>
                      <li><b>Embed a map</b> ট্যাব সিলেক্ট করে <b>Copy HTML</b> এ ক্লিক করুন এবং উপরোক্ত ২নং ঘরে পেস্ট করুন।</li>
                    </ol>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setEditLocationValue(activeBranch?.location || "");
                        setIsEditingLocation(false);
                      }}
                      className="px-4 py-2 text-xs font-bold bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (onUpdateBranchLocation) onUpdateBranchLocation(editLocationValue);
                        setIsEditingLocation(false);
                      }}
                      className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Save & Show Map
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <p className="text-sm text-slate-500 flex items-center flex-wrap gap-2">
                    {activeBranch?.location ? (
                      <span className="font-semibold text-slate-700 break-all max-w-md">
                        Location: {activeBranch.location.startsWith("http") ? "Custom Embedded Map Link" : activeBranch.location}
                      </span>
                    ) : (
                      "No location set."
                    )}
                  </p>
                  <button 
                    onClick={() => setIsEditingLocation(true)}
                    className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Change / Set Map Link
                  </button>
                </div>
              )}
            </div>
            
            {activeBranch?.location && (
              <a
                href={activeBranch.location.startsWith("http") && !activeBranch.location.includes("google.com/maps/embed")
                  ? activeBranch.location
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeBranch.location)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 px-3 py-2 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors self-start"
              >
                Open in Google Maps
              </a>
            )}
          </div>
          
          <div className="h-64 sm:h-96 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative flex items-center justify-center">
            {activeBranch?.location ? (
              <iframe
                title="Google Maps Preview"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={activeBranch.location.startsWith("http") && (activeBranch.location.includes("google.com/maps/embed") || activeBranch.location.includes("google.com/maps/search"))
                  ? activeBranch.location 
                  : `https://maps.google.com/maps?q=${encodeURIComponent(activeBranch.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                }
              />
            ) : (
              <div className="text-center p-6">
                <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Map Preview Unavailable</p>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">Please set a branch location to view the map preview.</p>
                <div className="flex gap-2 justify-center mt-4">
                  <button 
                    onClick={() => setIsEditingLocation(true)}
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-block cursor-pointer"
                  >
                    Set Location
                  </button>
                  <a 
                    href="https://www.google.com/maps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block cursor-pointer"
                  >
                    Open Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
