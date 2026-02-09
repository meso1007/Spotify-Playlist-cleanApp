"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Layers, ArrowUp, ChevronDown, Sparkles, Check, SlidersHorizontal, X } from "lucide-react";

type Playlist = { id: string; name: string; };

type HeaderProps = {
    userImage?: string | null;
    playlists: Playlist[];
    selectedPlaylistId: string | null;
    onPlaylistSelect: (id: string | null) => void;
    isDeepClean: boolean;
    setIsDeepClean: (isDeep: boolean) => void;
    destinationPlaylistId: string | null;
    setDestinationPlaylistId: (id: string) => void;
};

// ▼ カスタムドロップダウンコンポーネント
const CustomSelect = ({
    label,
    icon: Icon,
    options,
    value,
    onChange,
    placeholder = "Select..."
}: {
    label: string,
    icon: any,
    options: { value: string | null, label: string }[],
    value: string | null,
    onChange: (val: string | null) => void,
    placeholder?: string
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 外側クリックで閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

    return (
        <div className="relative" ref={containerRef}>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                <Icon size={12} /> {label}
            </label>

            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-white/5 text-xs rounded-xl px-4 py-3 border border-white/10 transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98] ${isOpen ? "ring-1 ring-emerald-500/50 border-emerald-500/50 bg-white/10" : ""}`}
            >
                <span className={`font-medium truncate ${!value && placeholder !== "Liked Songs" ? "text-neutral-500" : "text-white"}`}>
                    {selectedLabel}
                </span>
                <ChevronDown size={14} className={`text-neutral-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-500" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                    {options.map((option) => (
                        <button
                            key={option.value || "null"}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 text-left text-xs text-neutral-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                        >
                            <span className="truncate">{option.label}</span>
                            {value === option.value && <Check size={12} className="text-emerald-500 shrink-0 ml-2" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Header({
    userImage,
    playlists,
    selectedPlaylistId,
    onPlaylistSelect,
    isDeepClean,
    setIsDeepClean,
    destinationPlaylistId,
    setDestinationPlaylistId,
}: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // プレイリストの選択肢データ作成
    const sourceOptions = [
        { value: null, label: "Liked Songs" }, // null = Liked Songs
        ...playlists.map(p => ({ value: p.id, label: p.name }))
    ];

    const destOptions = playlists.map(p => ({ value: p.id, label: p.name }));

    return (
        <header className="fixed top-0 w-full z-50 bg-[#121212]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all duration-300">
            <div className="max-w-6xl mx-auto px-6 py-4">

                {/* Top Row */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                            <Sparkles className="w-4 h-4 text-emerald-500" />
                        </div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent tracking-tight">
                            Spoticlean
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`md:hidden p-2 transition rounded-full ${isMenuOpen ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"}`}
                        >
                            {isMenuOpen ? <X size={20} /> : <SlidersHorizontal size={20} />}
                        </button>

                        {/* User */}
                        {userImage && (
                            <div className="hidden md:flex items-center gap-3 pl-6 border-l border-white/5">
                                <img src={userImage} alt="User" className="w-8 h-8 rounded-full ring-2 ring-[#121212]" />
                                <button onClick={() => signOut()} className="text-xs font-bold text-neutral-500 hover:text-white transition uppercase tracking-wider">Logout</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls Area (Responsive Accordion) */}
                <div className={`md:flex md:items-end md:gap-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMenuOpen
                        ? "max-h-[500px] opacity-100 mt-6 pb-2 overflow-visible"
                        : "max-h-0 opacity-0 overflow-hidden md:max-h-none md:opacity-100 md:mt-0 md:overflow-visible"
                    }`}>
                    {/* 1. Clean Target */}
                    <div className="flex-1 md:w-64 min-w-0 mb-4 md:mb-0">
                        <CustomSelect
                            label="Clean Target"
                            icon={Layers}
                            options={sourceOptions}
                            value={selectedPlaylistId}
                            onChange={onPlaylistSelect}
                        />
                    </div>

                    {/* 2. Destination */}
                    <div className="flex-1 md:w-64 min-w-0 mb-4 md:mb-0">
                        <CustomSelect
                            label="Up Destination"
                            icon={ArrowUp}
                            options={destOptions}
                            value={destinationPlaylistId}
                            onChange={(val) => val && setDestinationPlaylistId(val)}
                            placeholder="Select Playlist..."
                        />
                    </div>

                    {/* 3. Sort Order (Segmented Control) */}
                    <div className="md:w-auto">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 md:text-right">Sort Order</label>
                        <div className="flex bg-[#0A0A0A] p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => setIsDeepClean(false)}
                                className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-[10px] font-bold transition-all duration-300 ${!isDeepClean ? "bg-neutral-800 text-white shadow-lg shadow-black/50" : "text-neutral-500 hover:text-neutral-300"}`}
                            >
                                Newest
                            </button>
                            <button
                                onClick={() => setIsDeepClean(true)}
                                className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-[10px] font-bold transition-all duration-300 ${isDeepClean ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" : "text-neutral-500 hover:text-neutral-300"}`}
                            >
                                Oldest
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </header>
    );
}