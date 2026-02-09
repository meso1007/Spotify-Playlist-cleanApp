// src/app/page.tsx
"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import TinderCard from "react-tinder-card";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { SavedTrack, SpotifyPager } from "@/types/spotify";

export default function Home() {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<SavedTrack[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  // ▼ これを追加：Spotify APIを叩いて本当に削除する関数
  const removeFromSpotify = async (trackId: string) => {
    if (!session?.accessToken) return;

    try {
      const res = await fetch("https://api.spotify.com/v1/me/tracks", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: [trackId], // 配列で渡すルールです
        }),
      });

      if (res.ok) {
        console.log(`Deleted track ${trackId} from Spotify!`);
      } else {
        console.error("Failed to delete", await res.json());
      }
    } catch (e) {
      console.error("Error removing track", e);
    }
  };
  // SDKの初期化
  const { deviceId, playTrack } = useSpotifyPlayer(session?.accessToken);

  // refsを保持（ボタン操作用）
  const cardRefs = useRef<any[]>([]);

  // データ取得
  useEffect(() => {
    if (session?.accessToken) {
      // プレイリストやSaved Tracksを取得
      fetch("https://api.spotify.com/v1/me/tracks?limit=50", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
        .then((res) => res.json())
        .then((data: SpotifyPager<SavedTrack>) => {
          setTracks(data.items);
          // refsの配列をデータ数分確保
          cardRefs.current = Array(data.items.length)
            .fill(0)
            .map(() => React.createRef());
        });
    }
  }, [session]);

  // ▼ カードが画面から消えた後の処理（ここでデータを消す！）
  const onCardLeftScreen = (myIdentifier: string) => {
    // 画面から消えたカードを、stateの配列からも削除する
    setTracks((prevTracks) => {
      return prevTracks.filter((track) => track.track.id !== myIdentifier);
    });
  };

  // ▼ onSwipeを修正
  const onSwipe = (direction: string, trackUri: string, index: number) => {
    console.log(`You swiped ${direction} on ${trackUri}`);

    // ... (再生ロジックはそのまま) ...
    const nextIndex = index - 1;
    if (nextIndex >= 0 && tracks[nextIndex]) {
      playTrack(tracks[nextIndex].track.uri);
    }

    // ⚠️ 左スワイプなら、APIを叩いて削除！
    if (direction === "left") {
      // uri (spotify:track:xxxx) から ID (xxxx) を取り出す
      const trackId = trackUri.split(":")[2];
      removeFromSpotify(trackId);
    }
  };

  // スタートボタン
  const handleStart = () => {
    if (tracks.length > 0) {
      // 一番上のカード（配列の最後）を再生
      const topCardIndex = tracks.length - 1;
      playTrack(tracks[topCardIndex].track.uri);
      setHasStarted(true);
    }
  };

  // ボタンでのスワイプ操作
  const swipe = async (dir: string) => {
    const topCardIndex = tracks.length - 1;
    if (topCardIndex >= 0 && cardRefs.current[topCardIndex]) {
      // @ts-ignore
      await cardRefs.current[topCardIndex].swipe(dir);
    }
  };

  // React.createRefを使うためのimport追加
  const React = require('react');

  if (!session) return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <button onClick={() => signIn("spotify")} className="rounded-full bg-green-500 px-8 py-4 font-bold">
        Login with Spotify
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 overflow-hidden select-none">
      <h1 className="text-white mb-4 font-bold text-xl">Spoticlean</h1>

      {/* カードコンテナ */}
      <div className="relative w-80 h-[400px]">
        {tracks.map((item, index) => (
          <TinderCard
            // @ts-ignore
            ref={(el) => (cardRefs.current[index] = el)}
            key={item.track.id}
            onSwipe={(dir) => onSwipe(dir, item.track.uri, index)}
            onCardLeftScreen={() => onCardLeftScreen(item.track.id)} // 👈 これが最重要！
            swipeRequirementType="position"
            swipeThreshold={40} // 軽く設定
            // preventSwipe={["up", "down"]} // 斜め許可のためにコメントアウト
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
              <div className="absolute bottom-0 w-full p-6 text-left text-white">
                <h2 className="text-2xl font-bold leading-tight mb-1 drop-shadow-md">
                  {item.track.name}
                </h2>
                <p className="text-lg text-gray-200 drop-shadow-md">
                  {item.track.artists[0].name}
                </p>
              </div>
            </div>
          </TinderCard>
        ))}

        {tracks.length === 0 && hasStarted && (
          <div className="text-white text-center mt-20">No more tracks!</div>
        )}
      </div>

      {/* 操作ボタン */}
      <div className="flex gap-8 mt-10 z-10">
        <button
          onClick={() => swipe("left")}
          className="bg-red-500 text-white rounded-full w-16 h-16 text-2xl shadow-lg hover:scale-110 transition flex items-center justify-center"
        >
          ✕
        </button>
        <button
          onClick={() => swipe("right")}
          className="bg-green-500 text-white rounded-full w-16 h-16 text-2xl shadow-lg hover:scale-110 transition flex items-center justify-center"
        >
          ♥
        </button>
      </div>

      {/* Start Overlay */}
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
          <h2 className="mb-8 text-3xl font-bold text-white tracking-widest">SPOTICLEAN</h2>
          {!deviceId ? (
            <p className="animate-pulse text-green-400">Connecting to Player...</p>
          ) : (
            <button
              onClick={handleStart}
              className="rounded-full bg-green-500 px-12 py-4 text-xl font-bold text-white shadow-green-500/50 shadow-lg transition hover:scale-105 active:scale-95"
            >
              START
            </button>
          )}
        </div>
      )}
    </div>
  );
}