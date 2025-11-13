const { Server } = require('@soketi/soketi');
const express = require('express');
const Pusher = require('pusher');
const cors = require('cors');

// ===== ENVIRONMENT CONFIGURATION =====
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 6001;

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
    debug: !IS_PRODUCTION,
    host: '0.0.0.0',
    port: PORT,
    'appManager.array.apps': apps,
    
    cors: {
        origin: ['*'],
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
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔑 App Key: ${apps[0].key}`);
    console.log(`🆔 App ID: ${apps[0].id}`);
    console.log(`🌍 Environment: ${IS_PRODUCTION ? 'Production' : 'Development'}`);
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
    port: PORT,
    useTLS: false
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok',
        service: 'Soketi Chat Server',
        soketi: 'running',
        backend: 'running',
        port: PORT,
        environment: IS_PRODUCTION ? 'production' : 'development'
    });
});

// API endpoint to send messages
app.post('/api/message', (req, res) => {
    const { text, timestamp, sender } = req.body;
    
    if (!text || !timestamp || !sender) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields: text, timestamp, sender' 
        });
    }
    
    console.log('📤 Broadcasting message from:', sender);
    
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

// Health check endpoint (alternative)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        soketi: 'running',
        backend: 'running',
        timestamp: new Date().toISOString()
    });
});

console.log(`✅ Express server integrated with Soketi on port ${PORT}`);
console.log(`🌐 API: http://localhost:${PORT}/api/message`);
console.log('\n🚀 Ready! The server handles both WebSocket and HTTP on the same port.\n');