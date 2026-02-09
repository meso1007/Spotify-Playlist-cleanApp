import { useState, useEffect } from 'react';

declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady: () => void;
        Spotify: any;
    }
}

export const useSpotifyPlayer = (accessToken: string | undefined) => {
    const [player, setPlayer] = useState<any>(undefined);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [isPaused, setPaused] = useState(false);
    const [isActive, setActive] = useState(false);

    useEffect(() => {
        if (!accessToken) return;

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'Spoticlean Web Player',
                getOAuthToken: (cb: (token: string) => void) => { cb(accessToken); },
                volume: 0.5
            });

            player.addListener('ready', ({ device_id }: { device_id: string }) => {
                console.log('Ready with Device ID', device_id);
                setDeviceId(device_id);
            });

            player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
                console.log('Device ID has gone offline', device_id);
            });

            player.connect();
            setPlayer(player);
        };
    }, [accessToken]);

    // ▼ ここが修正ポイント！正しいURLに変更
    const playTrack = async (spotifyUri: string) => {
        if (!deviceId) return;
        if (!accessToken) return;

        try {
            // 公式APIのエンドポイント: /v1/me/player/play
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: [spotifyUri] }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
            });
        } catch (e) {
            console.error("Playback failed", e);
        }
    };

    return { player, deviceId, playTrack, isPaused };
};