# AI-Powered Call Assistant

A full-stack, AI-driven Virtual Assistant tailored with a hyper-realistic Indian female voice that answers calls, handles smart voicemails, filtering, and real-time urgency routing.

## Features
- **Realistic Voice**: Uses `Polly.Kajal` (Indian Female Voice) with natural pauses and polite conversational tone.
- **Smart IVR**: Distinguishes VIP callers, prompts for a menu (1 for voicemail, 2 for urgent call forwarding).
- **Socket Dashboard**: Real-time web panel updating seamlessly when a call arrives, voicemail is recorded, or an urgent escalation is triggered.
- **Glassmorphic UI**: High-end minimalist design aesthetics built with standard CSS.

## Getting Started

### 1. Requirements
- Node.js installed
- A [Twilio](https://www.twilio.com/) Account equipped with Voice capabilities
- [Ngrok](https://ngrok.com/) to expose your local backend to Twilio Webhooks.

### 2. Installation
Run the following from the root directory to install all dependencies for both backend and frontend:
\`\`\`bash
npm install
cd backend && npm install
cd ../frontend && npm install
\`\`\`

### 3. Setup Ngrok & Twilio Webhook
1. Start ngrok on port 3001:
\`\`\`bash
ngrok http 3001
\`\`\`
2. Copy the forwarding URL from ngrok (e.g., `https://xxxx.ngrok.io`).
3. Go to your Twilio Console -> Active Numbers -> Your Phone Number.
4. Under "Voice & Fax", put your ngrok webhook + `/voice` in the "A CALL COMES IN" url box. Example: `https://xxxx.ngrok.io/voice` (via POST).

### 4. Running the application
Start both the API Backend and React Frontend concurrently:
\`\`\`bash
npm start
\`\`\`

- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`

### Next steps to make it truly LLM conversational (using OpenAI Real-Time Streams)
Currently, this system uses Twilio's standard `TwiML` <Gather> and <Say> architecture for stability.
If you desire continuous, unstructured conversation with LLMs (e.g., using GPT-4 API), you will need to replace the `POST /voice` webhook to establish a Twilio `<Connect><Stream>` WebSocket object linked directly to OpenAI's real-time API. This is not included by default due to high setup steps (WebSockets, Base64 conversion, OpenAI billing), but the architecture and dashboard are fully ready and extensible!
