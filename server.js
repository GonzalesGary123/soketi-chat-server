const { Server } = require('@soketi/soketi');
const Pusher = require('pusher');

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

// Soketi options with HTTP webhooks enabled
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
    
    // Enable HTTP API
    'httpApi.enabled': true,
    'httpApi.acceptTraffic.memoryThreshold': 85,
    
    // Enable metrics
    'metrics.enabled': true,
    'metrics.port': 9601,
    
    // HTTP server options
    'httpApi.requestLimitInMb': 100,
    'httpApi.acceptTraffic': {
        memoryThreshold: 85,
    },
};

// Start Soketi
const soketiServer = new Server(soketiOptions);

soketiServer.start().then(() => {
    console.log('✅ Soketi WebSocket server is running!');
    console.log(`📡 Listening on: 0.0.0.0:${PORT}`);
    console.log(`🔑 App Key: ${apps[0].key}`);
    console.log(`🆔 App ID: ${apps[0].id}`);
    console.log(`🌐 WebSocket URL: ws://0.0.0.0:${PORT}`);
    console.log(`🔐 Production URL: wss://soketi-chat-server-production.up.railway.app`);
    
    // Initialize Pusher client for backend messaging
    const pusher = new Pusher({
        appId: apps[0].id,
        key: apps[0].key,
        secret: apps[0].secret,
        host: '127.0.0.1',
        port: PORT,
        useTLS: false
    });

    // Set up a simple interval to test broadcasting (optional - remove if not needed)
    console.log('\n🚀 Server is ready!');
    console.log('📨 You can now send messages via the Soketi HTTP API');
    console.log(`📍 Endpoint: http://0.0.0.0:${PORT}/apps/${apps[0].id}/events`);
    console.log('\n✨ Ready to handle WebSocket connections!\n');
    
    // Example: Broadcast a test message every 30 seconds (remove this in production)
    if (!IS_PRODUCTION) {
        setInterval(() => {
            pusher.trigger('test-channel', 'server-ping', {
                text: 'Server is alive!',
                timestamp: new Date().toISOString(),
                sender: 'System'
            }).then(() => {
                console.log('📡 Ping broadcast sent');
            }).catch(err => {
                console.error('❌ Ping broadcast failed:', err.message);
            });
        }, 30000);
    }

}).catch((error) => {
    console.error('❌ Failed to start Soketi server:', error);
    console.error(error.stack);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('⚠️ SIGINT received, shutting down gracefully...');
    process.exit(0);
});
