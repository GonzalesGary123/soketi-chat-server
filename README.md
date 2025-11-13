# Soketi Real-Time Chat Server

A real-time WebSocket server using Soketi (Pusher alternative) with Express backend relay.

## Features

- ✅ Real-time messaging
- ✅ WebSocket communication
- ✅ Backend message relay
- ✅ No usage limits (self-hosted)
- ✅ Pusher-compatible protocol

## Local Development

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/soketi-chat-server.git
cd soketi-chat-server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will start on:
- WebSocket Server: `ws://localhost:6001`
- Backend API: `http://localhost:3000`

### Testing Locally

Open `test.html` in multiple browser tabs to test real-time messaging.

## Deployment

### Deploy to Railway

1. Push to GitHub
2. Go to [Railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub"
4. Select this repository
5. Railway will auto-detect and deploy!

### Environment Variables

Set these in your hosting platform:

- `PORT` - WebSocket server port (default: 6001)
- `BACKEND_PORT` - API server port (default: 3000)

## API Endpoints

### Send Message
```
POST /api/message
Content-Type: application/json

{
  "text": "Hello World",
  "timestamp": "2025-11-13T00:00:00.000Z",
  "sender": "User-123"
}
```

### Health Check
```
GET /api/health
```

## Client Connection
```javascript
const pusher = new Pusher('KEY-test', {
  wsHost: 'your-server.railway.app',
  wsPort: 443,
  wssPort: 443,
  forceTLS: true,
  encrypted: true,
  enabledTransports: ['ws', 'wss'],
  cluster: 'mt1'
});

const channel = pusher.subscribe('test-channel');
channel.bind('new-message', (data) => {
  console.log('Received:', data);
});
```

## Project Structure
```
soketi-chat-server/
├── node_modules/
├── .gitignore
├── package.json
├── server.js          # Main server file
├── test.html          # Local testing (not deployed)
└── README.md
```

## Tech Stack

- **Soketi** - WebSocket server (Pusher alternative)
- **Express** - Backend API
- **Pusher** - Backend client library
- **CORS** - Cross-origin support

## License

MIT

## Author

Your Name