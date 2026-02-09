// src/app/page.tsx
"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import TinderCard from "react-tinder-card";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { SavedTrack, SpotifyPager } from "@/types/spotify";
import Header from "@/components/Header";
import { X, Heart, ArrowUp, Undo2, PlayCircle, Music2, ArrowRight } from "lucide-react";

type Playlist = { id: string; name: string; };

export default function Home() {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<SavedTrack[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [destinationPlaylistId, setDestinationPlaylistId] = useState<string | null>(null);
  const [isDeepClean, setIsDeepClean] = useState(false);
  const [deletedHistory, setDeletedHistory] = useState<SavedTrack[]>([]);

  const { deviceId, playTrack } = useSpotifyPlayer(session?.accessToken);
  const cardRefs = useRef<any[]>([]);
  const React = require('react');

  // --- API Logics (変更なし) ---
  useEffect(() => {
    if (session?.accessToken) {
      fetch("https://api.spotify.com/v1/me/playlists?limit=50", { headers: { Authorization: `Bearer ${session.accessToken}` } })
        .then((res) => res.json()).then((data) => { if (data.items) { setPlaylists(data.items); if (data.items.length > 0) setDestinationPlaylistId(data.items[0].id); } });
    }
  }, [session]);

  useEffect(() => {
    if (!session?.accessToken) return;
    const fetchTracks = async () => {
      try {
        let offset = 0;
        const baseUrl = selectedPlaylistId ? `https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks` : "https://api.spotify.com/v1/me/tracks";
        if (isDeepClean) {
          const initialRes = await fetch(`${baseUrl}?limit=1`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
          const initialData = await initialRes.json();
          const total = initialData.total || 0;
          if (total > 50) offset = total - 50;
        }
        const finalRes = await fetch(`${baseUrl}?offset=${offset}&limit=50`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
        const finalData = await finalRes.json();
        let items = finalData.items || [];
        items = items.filter((item: any) => item.track && item.track.id);
        if (isDeepClean) items = items.reverse();
        setTracks(items);
        if (items.length > 0) { cardRefs.current = Array(items.length).fill(0).map(() => React.createRef()); }
      } catch (e) { console.error(e); }
    };
    fetchTracks();
  }, [session, selectedPlaylistId, isDeepClean]);

  const addToPlaylist = async (trackUri: string) => {
    if (!session?.accessToken || !destinationPlaylistId) { alert("Please select a destination playlist first!"); return; }
    await fetch(`https://api.spotify.com/v1/playlists/${destinationPlaylistId}/tracks`, { method: "POST", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ uris: [trackUri] }) });
  };
  const removeTrack = async (trackUri: string) => {
    if (!session?.accessToken) return;
    const trackId = trackUri.split(":")[2];
    let url = selectedPlaylistId ? `https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks` : "https://api.spotify.com/v1/me/tracks";
    let body = selectedPlaylistId ? { tracks: [{ uri: trackUri }] } : { ids: [trackId] };
    await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  };
  const undoLastAction = async () => {
    if (deletedHistory.length === 0) return;
    const trackToRestore = deletedHistory[deletedHistory.length - 1];
    setDeletedHistory((prev) => prev.slice(0, -1));
    setTracks((prev) => [...prev, trackToRestore]);
    if (selectedPlaylistId) { await fetch(`https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks`, { method: "POST", headers: { Authorization: `Bearer ${session?.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ uris: [trackToRestore.track.uri] }) }); } else { await fetch(`https://api.spotify.com/v1/me/tracks`, { method: "PUT", headers: { Authorization: `Bearer ${session?.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ ids: [trackToRestore.track.id] }) }); }
    playTrack(trackToRestore.track.uri);
  };
  const onCardLeftScreen = (myIdentifier: string) => { setTracks((prev) => prev.filter((t) => t.track.id !== myIdentifier)); };
  const onSwipe = (direction: string, trackUri: string, index: number) => {
    const swipedTrack = tracks[index];
    const nextIndex = index - 1;
    if (nextIndex >= 0 && tracks[nextIndex]) playTrack(tracks[nextIndex].track.uri);
    if (direction === "left") { removeTrack(trackUri); if (swipedTrack) setDeletedHistory((prev) => [...prev, swipedTrack]); } else if (direction === "up") { addToPlaylist(trackUri); }
  };
  const handleStart = () => { if (tracks.length > 0) { playTrack(tracks[tracks.length - 1].track.uri); setHasStarted(true); } };
  const swipe = async (dir: string) => { const topCardIndex = tracks.length - 1; if (topCardIndex >= 0 && cardRefs.current[topCardIndex]) { await cardRefs.current[topCardIndex].swipe(dir); } };
  const handlePlaylistSelect = (id: string | null) => { setSelectedPlaylistId(id); setHasStarted(false); setDeletedHistory([]); };

  if (!session) return (
    <div className="flex min-h-screen items-center justify-center bg-[#121212] text-white">
      <button onClick={() => signIn("spotify")} className="bg-[#1DB954] text-black px-8 py-4 rounded-full font-bold text-xl">Login with Spotify</button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-[#121212] overflow-hidden select-none relative">

      {/* 1. Header (Collapsible on Mobile, Full on PC) */}
      <Header
        userImage={session.user?.image}
        playlists={playlists}
        selectedPlaylistId={selectedPlaylistId}
        onPlaylistSelect={handlePlaylistSelect}
        isDeepClean={isDeepClean}
        setIsDeepClean={setIsDeepClean}
        destinationPlaylistId={destinationPlaylistId}
        setDestinationPlaylistId={setDestinationPlaylistId}
      />

      {/* 2. Main Area (Card & Buttons) */}
      {/* Mobile: Flex Column / PC: Relative Container */}
      <main className="flex-1 flex flex-col md:block relative w-full h-full pt-16 md:pt-20">

        {/* --- Card Area --- */}
        {/* Mobile: Takes available space. PC: Centered absolutely. */}
        <div className="flex-1 flex items-center justify-center relative w-full md:absolute md:inset-0 md:z-10">
          <div className="relative w-[90%] max-w-[340px] aspect-[3/4] md:w-[400px] md:h-[540px]">
            {tracks.map((item, index) => (
              <TinderCard
                // @ts-ignore
                ref={(el) => (cardRefs.current[index] = el)}
                key={item.track.id}
                onSwipe={(dir) => onSwipe(dir, item.track.uri, index)}
                onCardLeftScreen={() => onCardLeftScreen(item.track.id)}
                swipeRequirementType="position"
                swipeThreshold={40}
                className="absolute top-0 left-0 w-full h-full"
              >
                <div className="w-full h-full bg-neutral-900 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden group">
                  {/* Art */}
                  <img
                    src={item.track.album.images[0]?.url}
                    className="w-full h-full object-cover pointer-events-none"
                    alt="Art"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                  {/* Up Hint */}
                  <div className="absolute top-4 w-full flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-sky-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Up to Add</span>
                  </div>

                  {/* Text */}
                  <div className="absolute bottom-0 w-full p-6 text-left">
                    <h2 className="text-2xl font-black text-white leading-tight drop-shadow-md line-clamp-2">{item.track.name}</h2>
                    <p className="text-lg text-neutral-300 font-medium drop-shadow-md line-clamp-1">{item.track.artists[0].name}</p>
                  </div>
                </div>
              </TinderCard>
            ))}
            {tracks.length === 0 && hasStarted && (
              <div className="flex flex-col items-center justify-center h-full text-neutral-600 gap-4 animate-pulse">
                <Music2 size={64} />
                <p>No tracks...</p>
              </div>
            )}
          </div>
        </div>

        {/* --- Controls --- */}

        {/* Mobile: Footer Bar (Cardの下に配置) */}
        <div className="md:hidden w-full px-6 pb-8 pt-4 flex items-center justify-between z-20 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent">
          <button onClick={() => swipe("left")} className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition">
            <X size={32} />
          </button>
          <div className="flex gap-4">
            <button onClick={undoLastAction} disabled={deletedHistory.length === 0} className={`w-12 h-12 rounded-full flex items-center justify-center border transition ${deletedHistory.length > 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-white/5 border-white/5 text-neutral-700"}`}><Undo2 size={20} /></button>
            <button onClick={() => swipe("up")} className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 text-sky-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition"><ArrowUp size={24} /></button>
          </div>
          <button onClick={() => swipe("right")} className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition">
            <Heart size={32} fill="currentColor" />
          </button>
        </div>

        {/* PC: Side Flanks (画面左右に配置) */}
        <div className="hidden md:block">
          {/* Left: Delete */}
          <button onClick={() => swipe("left")} className="absolute left-10 top-1/2 -translate-y-1/2 w-20 h-20 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center hover:scale-110 hover:bg-rose-500 hover:text-white transition-all duration-300 z-20">
            <X size={40} strokeWidth={3} />
          </button>

          {/* Right: Keep */}
          <button onClick={() => swipe("right")} className="absolute right-10 top-1/2 -translate-y-1/2 w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-full flex items-center justify-center hover:scale-110 hover:bg-emerald-500 hover:text-white transition-all duration-300 z-20">
            <Heart size={40} fill="currentColor" />
          </button>

          {/* Bottom Center: Undo & Up */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-6 z-20">
            <button onClick={undoLastAction} disabled={deletedHistory.length === 0} className={`w-14 h-14 rounded-full flex items-center justify-center border transition hover:scale-110 ${deletedHistory.length > 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white" : "bg-white/5 border-white/5 text-neutral-700"}`}>
              <Undo2 size={24} />
            </button>
            <button onClick={() => swipe("up")} className="w-14 h-14 bg-sky-500/10 border border-sky-500/30 text-sky-500 rounded-full flex items-center justify-center hover:scale-110 hover:bg-sky-500 hover:text-white transition">
              <ArrowUp size={28} />
            </button>
          </div>
        </div>

      </main>

      {/* Start Overlay */}
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#121212]/95 backdrop-blur-xl p-8">
          <div className="text-center space-y-6 max-w-sm">
            <h2 className="text-4xl font-black text-white tracking-tighter">SPOTICLEAN</h2>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <p className="text-neutral-500 text-xs uppercase font-bold mb-2">Current Target</p>
              <p className="text-white font-bold text-2xl">
                {selectedPlaylistId ? playlists.find(p => p.id === selectedPlaylistId)?.name : "Liked Songs"}
              </p>
            </div>
            {!deviceId ? (
              <p className="text-emerald-500 animate-pulse font-bold">Connecting...</p>
            ) : (
              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-black px-8 py-4 text-xl font-bold rounded-full hover:scale-105 transition shadow-xl"
              >
                <PlayCircle size={24} fill="black" /> START
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}