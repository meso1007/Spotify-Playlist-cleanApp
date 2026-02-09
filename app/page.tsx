"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import TinderCard from "react-tinder-card";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { SavedTrack, SpotifyPager } from "@/types/spotify";
import Header from "@/components/Header"; // 👈 作ったコンポーネントをインポート

type Playlist = {
  id: string;
  name: string;
};

export default function Home() {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<SavedTrack[]>([]);
  const [hasStarted, setHasStarted] = useState(false);

  // プレイリスト管理
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [destinationPlaylistId, setDestinationPlaylistId] = useState<string | null>(null); // ⭐機能維持
  const [isDeepClean, setIsDeepClean] = useState(false);

  // 履歴
  const [deletedHistory, setDeletedHistory] = useState<SavedTrack[]>([]);

  // SDK
  const { deviceId, playTrack } = useSpotifyPlayer(session?.accessToken);
  const cardRefs = useRef<any[]>([]);

  // 1. プレイリスト一覧取得
  useEffect(() => {
    if (session?.accessToken) {
      fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.items) {
            setPlaylists(data.items);
            if (data.items.length > 0) setDestinationPlaylistId(data.items[0].id);
          }
        });
    }
  }, [session]);

  // 2. 曲データ取得
  useEffect(() => {
    if (!session?.accessToken) return;
    const fetchTracks = async () => {
      try {
        let offset = 0;
        const baseUrl = selectedPlaylistId
          ? `https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks`
          : "https://api.spotify.com/v1/me/tracks";

        if (isDeepClean) {
          const initialRes = await fetch(`${baseUrl}?limit=1`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          });
          const initialData = await initialRes.json();
          const total = initialData.total || 0;
          if (total > 50) offset = total - 50;
        }

        const finalRes = await fetch(`${baseUrl}?offset=${offset}&limit=50`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const finalData = await finalRes.json();
        let items = finalData.items || [];
        items = items.filter((item: any) => item.track && item.track.id);
        if (isDeepClean) items = items.reverse();

        setTracks(items);
        if (items.length > 0) {
          // @ts-ignore
          cardRefs.current = Array(items.length).fill(0).map(() => React.createRef());
        }
      } catch (e) { console.error(e); }
    };
    fetchTracks();
  }, [session, selectedPlaylistId, isDeepClean]);

  // ▼ 上スワイプ：指定したプレイリストに追加 (⭐機能維持)
  const addToPlaylist = async (trackUri: string) => {
    if (!session?.accessToken || !destinationPlaylistId) {
      alert("Please select a destination playlist first!");
      return;
    }
    try {
      await fetch(`https://api.spotify.com/v1/playlists/${destinationPlaylistId}/tracks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uris: [trackUri] }),
      });
      console.log(`Added to playlist ${destinationPlaylistId}`);
    } catch (e) { console.error("Error adding to playlist", e); }
  };

  const removeTrack = async (trackUri: string) => {
    if (!session?.accessToken) return;
    const trackId = trackUri.split(":")[2];
    try {
      let url = selectedPlaylistId ? `https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks` : "https://api.spotify.com/v1/me/tracks";
      let body = selectedPlaylistId ? { tracks: [{ uri: trackUri }] } : { ids: [trackId] };
      await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch (e) { console.error("Error removing track", e); }
  };

  const undoLastAction = async () => {
    if (deletedHistory.length === 0) return;
    const trackToRestore = deletedHistory[deletedHistory.length - 1];
    setDeletedHistory((prev) => prev.slice(0, -1));
    setTracks((prev) => [...prev, trackToRestore]);
    try {
      if (selectedPlaylistId) {
        await fetch(`https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks`, { method: "POST", headers: { Authorization: `Bearer ${session?.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ uris: [trackToRestore.track.uri] }) });
      } else {
        await fetch(`https://api.spotify.com/v1/me/tracks`, { method: "PUT", headers: { Authorization: `Bearer ${session?.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ ids: [trackToRestore.track.id] }) });
      }
      playTrack(trackToRestore.track.uri);
    } catch (e) { console.error("Undo failed", e); }
  };

  const onCardLeftScreen = (myIdentifier: string) => { setTracks((prev) => prev.filter((t) => t.track.id !== myIdentifier)); };

  const onSwipe = (direction: string, trackUri: string, index: number) => {
    const swipedTrack = tracks[index];
    const nextIndex = index - 1;
    if (nextIndex >= 0 && tracks[nextIndex]) playTrack(tracks[nextIndex].track.uri);

    if (direction === "left") {
      removeTrack(trackUri);
      if (swipedTrack) setDeletedHistory((prev) => [...prev, swipedTrack]);
    } else if (direction === "up") {
      // ⬆️ 上スワイプ処理 (⭐機能維持)
      addToPlaylist(trackUri);
    }
  };

  const handleStart = () => { if (tracks.length > 0) { playTrack(tracks[tracks.length - 1].track.uri); setHasStarted(true); } };
  const swipe = async (dir: string) => {
    const topCardIndex = tracks.length - 1;
    if (topCardIndex >= 0 && cardRefs.current[topCardIndex]) {
      // @ts-ignore
      await cardRefs.current[topCardIndex].swipe(dir);
    }
  };

  // Headerに渡すためのハンドラー
  const handlePlaylistSelect = (id: string | null) => {
    setSelectedPlaylistId(id);
    setHasStarted(false);
    setDeletedHistory([]);
  };

  const React = require('react');

  if (!session) return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <button onClick={() => signIn("spotify")} className="rounded-full bg-green-500 px-8 py-4 font-bold">
        Login with Spotify
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 overflow-hidden select-none pb-20">

      {/* 👇 Headerコンポーネントを使用（ここに機能を集約） */}
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

      {/* カードコンテナ (Headerの分だけ下に下げる) */}
      <div className="relative w-80 h-[400px] mt-48">
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
            <div
              className="touch-none w-full h-full bg-white rounded-xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                backgroundImage: `url(${item.track.album.images[0]?.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* 上スワイプのヒント */}
              <div className="absolute top-4 w-full text-center">
                <span className="bg-blue-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg backdrop-blur-sm">
                  Up to Add
                </span>
              </div>

              <div className="absolute bottom-0 w-full p-6 text-left text-white">
                <h2 className="text-2xl font-bold leading-tight mb-1 drop-shadow-md truncate">
                  {item.track.name}
                </h2>
                <p className="text-lg text-gray-200 drop-shadow-md truncate">
                  {item.track.artists[0].name}
                </p>
              </div>
            </div>
          </TinderCard>
        ))}
        {tracks.length === 0 && hasStarted && (
          <div className="text-white text-center mt-20 animate-pulse">
            No more tracks...
          </div>
        )}
      </div>

      {/* 操作ボタンエリア (機能維持) */}
      <div className="flex gap-5 mt-8 z-10 items-center justify-center">
        <button onClick={() => swipe("left")} className="bg-red-500 text-white rounded-full w-14 h-14 text-2xl shadow-lg hover:scale-110 transition flex items-center justify-center">✕</button>
        <button
          onClick={undoLastAction}
          disabled={deletedHistory.length === 0}
          className={`rounded-full w-12 h-12 text-lg shadow-lg flex items-center justify-center transition ${deletedHistory.length > 0 ? "bg-yellow-400 text-black hover:scale-110" : "bg-gray-800 text-gray-600"}`}
        >
          ↩
        </button>
        {/* 上スワイプボタン */}
        <button onClick={() => swipe("up")} className="bg-blue-500 text-white rounded-full w-14 h-14 text-2xl shadow-lg hover:scale-110 transition flex items-center justify-center">⬆️</button>
        <button onClick={() => swipe("right")} className="bg-green-500 text-white rounded-full w-14 h-14 text-2xl shadow-lg hover:scale-110 transition flex items-center justify-center">♥</button>
      </div>

      {/* Start Overlay */}
      {!hasStarted && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <h2 className="mb-8 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 tracking-tighter">SPOTICLEAN</h2>
          <div className="text-center mb-8">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Current Target</p>
            <p className="text-white font-bold text-xl px-4">
              {selectedPlaylistId ? playlists.find(p => p.id === selectedPlaylistId)?.name : "Liked Songs"}
            </p>
          </div>
          {!deviceId ? (
            <p className="animate-pulse text-green-400">Connecting to Player...</p>
          ) : (
            <button
              onClick={handleStart}
              className="rounded-full bg-green-500 px-12 py-4 text-xl font-bold text-white shadow-green-500/40 shadow-2xl transition hover:scale-105 active:scale-95"
            >
              START CLEANING
            </button>
          )}
        </div>
      )}
    </div>
  );
}