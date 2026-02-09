// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

// 必要な権限リスト
const scopes = [
    "user-read-email",
    "user-read-private",
    "user-library-read",   // Liked Songsを見る
    "user-library-modify", // Liked Songsを削除する
    "playlist-modify-public",
    "playlist-modify-private",
    "streaming",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing"
].join(" ");

export const authOptions: NextAuthOptions = {
    providers: [
        SpotifyProvider({
            clientId: process.env.SPOTIFY_CLIENT_ID!,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
            authorization: {
                params: { scope: scopes },
            },
        }),
    ],
    callbacks: {
        // JWTトークンが作られる時に呼ばれる
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at;
                token.id = account.providerAccountId;
            }
            return token;
        },
        // セッションがクライアントに渡される時に呼ばれる
        async session({ session, token }) {
            // @ts-ignore
            session.accessToken = token.accessToken;
            // @ts-ignore
            session.user.id = token.id;
            return session;
        },
    },
    // pages: {
    //     signIn: "/login", // カスタムログインページを作る場合
    // },
};