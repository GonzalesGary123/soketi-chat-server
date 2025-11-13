const express = require('express');
const cors = require('cors');
const { Server } = require('@soketi/soketi');

// Environment configuration
const PORT = parseInt(process.env.PORT) || 6001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

console.log('🚀 Starting Soketi Chat Server...');
console.log(`📍 Port: ${PORT}`);
console.log(`🌍 Environment: ${IS_PRODUCTION ? 'Production' : 'Development'}`);

// Soketi configuration
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

// Initialize Soketi - it will create its own HTTP server
const soketiOptions = {
    debug: !IS_PRODUCTION,
    host: '0.0.0.0',  // CRITICAL: Must be 0.0.0.0 for Railway
    port: PORT,
    'appManager.array.apps': apps,
    
    cors: {
        origin: ['*'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Origin', 'Content-Type', 'X-Auth-Token', 'X-Requested-With', 'Accept', 'Authorization'],
    },
    
    'adapter.driver': 'local',
    'cache.driver': 'memory',
    'queue.driver': 'sync',
    'metrics.enabled': true,
    'metrics.port': 9601,
};

// Start Soketi first
const soketiServer = new Server(soketiOptions);

soketiServer.start().then(() => {
    console.log('✅ Soketi WebSocket server initialized!');
    console.log(`🔑 App Key: ${apps[0].key}`);
    console.log(`🆔 App ID: ${apps[0].id}`);
    
    // Get Soketi's HTTP server instance
    const httpServer = soketiServer.httpServer;
    
    // Create Express app and attach it to Soketi's server
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Express routes
    app.get('/', (req, res) => {
        res.json({ 
            status: 'ok',
            service: 'Soketi Chat Server',
            port: PORT,
            host: '0.0.0.0',
            environment: IS_PRODUCTION ? 'production' : 'development',
            websocket: 'available',
            timestamp: new Date().toISOString()
        });
    });

    app.get('/api/health', (req, res) => {
        res.json({ 
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    });

    // Initialize Pusher client for backend messaging
    const Pusher = require('pusher');
    const pusher = new Pusher({
        appId: apps[0].id,
        key: apps[0].key,
        secret: apps[0].secret,
        host: '127.0.0.1',
        port: PORT,
        useTLS: false
    });

    // Message relay endpoint
    app.post('/api/message', (req, res) => {
        const { text, timestamp, sender } = req.body;
        
        if (!text || !timestamp || !sender) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: text, timestamp, sender' 
            });
        }
        
        console.log('📤 Broadcasting message from:', sender);
        
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

    // Attach Express middleware to Soketi's HTTP server
    // This allows Express routes to coexist with WebSocket connections
    httpServer.on('request', (req, res) => {
        // Only handle non-WebSocket HTTP requests with Express
        if (!req.headers.upgrade) {
            app(req, res);
        }
    });

    console.log('🚀 Server is ready and listening!');
    console.log(`📡 HTTP/WS Server: http://0.0.0.0:${PORT}`);
    console.log(`🌐 API Endpoint: http://0.0.0.0:${PORT}/api/message`);
    console.log('\n✨ Ready to handle WebSocket and HTTP requests!\n');

}).catch((error) => {
    console.error('❌ Failed to start Soketi server:', error);
    console.error(error.stack);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received, shutting down gracefully...');
    if (soketiServer) {
        soketiServer.stop().then(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    }
});
