# **App Name**: EchoSphere

## Core Features:

- User Authentication and Custom Name: Fetches username from local storage or prompts for a custom display name (one-time setting). Connects the custom name and username with firebase.
- Public Chat: Displays messages in a chronological order, featuring custom display names. Supports text, images (via URLs), and timestamps. URLs from sites like YouTube or MediaFire in chat are transformed into 'Watch Video,' 'Visit Site,' or 'Download Now' links respectively.
- Moderation Tools: Detects and highlights usernames with specific codes (#225, #226, #227) with moderator, developer or system user styling respectively (styling does not expose codes). These privileged roles also gain enhanced moderation capabilities (delete, report, block)
- Reporting System: Enables users to report messages/users with specific reasons (hacking, abusive content, etc.) resulting in a temporary (30-minute) block. Displays a 'Thank you' feedback message after report submission.
- Friend Request and Private Messaging: Users can send/accept friend requests. Accepting creates a private chat channel between the two users.
- Dynamic UI/UX Enhancements: Features include typing indicators, message received sounds (from provided URL), a splash screen, message loading animations, background image (from provided URL) and notification indicators (red dots).
- Profile Management: Tool to update the profile with avatar. Uses reasoning to incorporate user profile or custom display name where appropriate, also handles friend requests and stores username for custom actions in firebase.

## Style Guidelines:

- Primary color: A vibrant azure blue (#4285F4) evokes a sense of calm communication and connection.
- Background color: Light blue-gray (#F0F4F8), provides a clean, modern backdrop.
- Accent color: A lively sky-blue (#03A9F4), will highlight interactive elements and notifications.
- Body and headline font: 'PT Sans', a humanist sans-serif that offers a blend of modern aesthetic with approachability and warmth
- Code font: 'Source Code Pro' for displaying code snippets.
- Use a set of consistent and clear icons from a modern icon set. Differentiate moderator/developer icons from the default user icon using distinct styling (e.g., a shield or badge).
- Implement smooth transitions and loading animations for a polished user experience. Employ subtle animations for new messages and user actions to improve engagement.