## Spoticlean

Spoticlean is a swipe-first Spotify library cleaner that helps you quickly organize or prune your liked songs and playlists with a simple, Tinder-style interface.

### What you can do

- **Clean up liked songs and playlists**  
  Swipe through tracks one by one and decide what to keep, remove, or move.
- **Fast triage with gestures**  
  Use intuitive gestures (left / right / up) to perform actions without touching small buttons.
- **Deep clean old tracks**  
  Switch between newest-first and oldest-first order to revisit forgotten songs.
- **Move tracks between playlists**  
  Send tracks from your current cleaning target to another playlist with a single gesture.
- **Preview playback with the Spotify Web Playback SDK**  
  Play tracks directly in your browser using your Spotify account.

### Skillset / Tech Stack

- **Frontend Framework**: Next.js (App Router)
- **Language & Runtime**: TypeScript, React
- **Authentication**: NextAuth.js with Spotify provider
- **Music Platform Integration**: Spotify Web API + Spotify Web Playback SDK
- **UI & UX**:
  - Mobile-first, swipe-based interaction
  - Keyboard shortcuts for desktop usage
  - Custom gradients, overlays, and motion to visualize swipe directions
- **State & Logic**:
  - Custom hooks for Spotify player control
  - Track fetching and pagination for playlists / liked songs
  - Undo history for recently removed tracks

### High-level Flow

1. **Sign in with Spotify** to authorize Spoticlean to access your library.
2. **Choose a cleaning target** (liked songs or a specific playlist).
3. **Optionally choose an "Up" destination playlist** to send tracks to.
4. **Start the deck** and swipe through tracks:
   - Left: remove from library / playlist
   - Right: keep (and move to the next track)
   - Up: add to the selected destination playlist
5. **Use undo** to restore the last removed track if you change your mind.

### Project Goals

- Make Spotify library cleanup **feel as light as swiping cards**, not managing tables.
- Provide an **opinionated but minimal interface**: a single deck, clear actions, and strong visual feedback.
- Stay close to Spotify’s official APIs and playback SDK for reliability.

