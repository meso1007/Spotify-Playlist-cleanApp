// src/components/Header.tsx
"use client";

import { signOut } from "next-auth/react";

type Playlist = {
    id: string;
    name: string;
};

type HeaderProps = {
    userImage?: string | null;
    playlists: Playlist[];

    // Clean Target (掃除する場所)
    selectedPlaylistId: string | null;
    onPlaylistSelect: (id: string | null) => void;

    // Order (並び順)
    isDeepClean: boolean;
    setIsDeepClean: (isDeep: boolean) => void;

    // Destination (保存先 - 上スワイプ用) ⭐ここ重要
    destinationPlaylistId: string | null;
    setDestinationPlaylistId: (id: string) => void;
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
    return (
        <header className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-md border-b border-gray-800 shadow-lg">
            <div className="max-w-md mx-auto px-4 py-3">

                {/* Row 1: Logo & User */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                        Spoticlean
                    </h1>
                    {userImage && (
                        <div className="flex items-center gap-2">
                            <img
                                src={userImage}
                                alt="User"
                                className="w-8 h-8 rounded-full border border-gray-600"
                            />
                            <button
                                onClick={() => signOut()}
                                className="text-xs text-gray-400 hover:text-white underline"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>

                {/* Row 2: Controls */}
                <div className="flex flex-col gap-3">

                    {/* Source & Sort */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <label className="block text-[10px] text-gray-400 mb-1">CLEAN TARGET (SOURCE)</label>
                            <select
                                className="w-full bg-gray-800 text-white text-xs rounded-md px-2 py-2 border border-gray-700 outline-none focus:border-green-500"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    onPlaylistSelect(val === "liked" ? null : val);
                                }}
                                value={selectedPlaylistId || "liked"}
                            >
                                <option value="liked">❤️ Liked Songs</option>
                                {playlists.map((pl) => (
                                    <option key={pl.id} value={pl.id}>{pl.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex flex-col items-end">
                            <label className="block text-[10px] text-gray-400 mb-1">ORDER</label>
                            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                                <button
                                    onClick={() => setIsDeepClean(false)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${!isDeepClean ? "bg-gray-600 text-white shadow-sm" : "text-gray-500"
                                        }`}
                                >
                                    New
                                </button>
                                <button
                                    onClick={() => setIsDeepClean(true)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${isDeepClean ? "bg-purple-600 text-white shadow-sm" : "text-gray-500"
                                        }`}
                                >
                                    Old
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Destination (Up Swipe) ⭐この機能は維持 */}
                    <div>
                        <label className="block text-[10px] text-blue-400 mb-1">⬆️ SWIPE UP TO ADD (DESTINATION)</label>
                        <select
                            className="w-full bg-blue-900/20 text-blue-100 text-xs rounded-md px-2 py-2 border border-blue-900/50 outline-none focus:border-blue-500"
                            onChange={(e) => setDestinationPlaylistId(e.target.value)}
                            value={destinationPlaylistId || ""}
                        >
                            <option value="" disabled>Select a playlist...</option>
                            {playlists.map((pl) => (
                                <option key={pl.id} value={pl.id}>{pl.name}</option>
                            ))}
                        </select>
                    </div>

                </div>
            </div>
        </header>
    );
}