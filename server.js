const { Server } = require('@soketi/soketi');
const express = require('express');
const Pusher = require('pusher');
const cors = require('cors');

// ===== SOKETI SERVER CONFIGURATION =====

const apps = [
    {
        id: 'APP-test',
        key: 'KEY-test',
        secret: 'SECRET-test',
        maxConnections: 10000,
        enableClientMessages: true,
        enabled: true,
        maxBackendEventsPerSecond: 1000,
        maxClientEventsPerSecond: 1000,
        maxReadRequestsPerSecond: 1000,
    },
];

const soketiOptions = {
    debug: true,
    host: '0.0.0.0',
    port: process.env.PORT || 6001,
    'appManager.array.apps': apps,
    
    // ✅ FIXED CORS Configuration
    cors: {
        origin: ['*'],  // Correct property name
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'Content-Type',
            'X-Auth-Token',
            'X-Requested-With',
            'Accept',
            'Authorization'
        ],
    },
    
    'metrics.enabled': true,
    'metrics.port': 9601,
};

// Start Soketi Server
const soketiServer = new Server(soketiOptions);

soketiServer.start().then(() => {
    console.log('✅ Soketi WebSocket server is running!');
    console.log(`📡 WebSocket: ws://localhost:${soketiOptions.port}`);
    console.log(`🔑 App Key: ${apps[0].key}`);
    console.log(`🆔 App ID: ${apps[0].id}`);
}).catch((error) => {
    console.error('❌ Failed to start Soketi server:', error);
    process.exit(1);
});

// ===== EXPRESS BACKEND SERVER (Message Relay) =====

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Pusher client (for backend to send messages)
const pusher = new Pusher({
    appId: apps[0].id,
    key: apps[0].key,
    secret: apps[0].secret,
    host: '127.0.0.1',
    port: 6001,
    useTLS: false
});

// API endpoint to send messages
app.post('/api/message', (req, res) => {
    const { text, timestamp, sender } = req.body;
    
    console.log('📤 Broadcasting message:', text);
    
    // Broadcast message to all connected clients
    pusher.trigger('test-channel', 'new-message', {
        text,
        timestamp,
        sender
    })
    .then(() => {
        console.log('✅ Message broadcasted successfully');
        res.json({ success: true });
    })
    .catch((error) => {
        console.error('❌ Error broadcasting message:', error);
        res.status(500).json({ success: false, error: error.message });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        soketi: 'running',
        backend: 'running'
    });
});

// Start Express server
const BACKEND_PORT = 3000;
app.listen(BACKEND_PORT, () => {
    console.log(`✅ Backend API server running on port ${BACKEND_PORT}`);
    console.log(`🌐 API: http://localhost:${BACKEND_PORT}/api/message`);
    console.log('\n🚀 Ready to test! Open test.html in your browser.\n');
});