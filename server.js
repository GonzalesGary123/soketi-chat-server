const { Server } = require('@soketi/soketi');
const Pusher = require('pusher');

// Environment configuration
const PORT = parseInt(process.env.PORT) || 6001;
const HOST = process.env.HOST || process.env.SOKETI_HOST || '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// CRITICAL: Force host binding for Railway
process.env.HOST = HOST;
process.env.SOKETI_HOST = HOST;

console.log('🚀 Starting Soketi Chat Server...');
console.log(`📍 Port: ${PORT}`);
console.log(`🏠 Host: ${HOST}`);
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

// Soketi options
const soketiOptions = {
    debug: !IS_PRODUCTION,
    host: HOST,  // Use the forced HOST variable
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
    
    // Enable metrics
    'metrics.enabled': true,
    'metrics.port': 9601,
};

// Start Soketi
const soketiServer = new Server(soketiOptions);

soketiServer.start().then(() => {
    console.log('✅ Soketi WebSocket server is running!');
    console.log(`📡 Listening on: ${HOST}:${PORT}`);
    console.log(`🔑 App Key: ${apps[0].key}`);
    console.log(`🆔 App ID: ${apps[0].id}`);
    console.log(`🌐 WebSocket: ws${IS_PRODUCTION ? 's' : ''}://${HOST}:${PORT}`);
    
    // Initialize Pusher client for backend messaging
    const pusher = new Pusher({
        appId: apps[0].id,
        key: apps[0].key,
        secret: apps[0].secret,
        host: '127.0.0.1',
        port: PORT,
        useTLS: false
    });

    console.log('\n🚀 Server is ready!');
    console.log(`📨 You can broadcast messages using Pusher client`);
    console.log(`📍 Soketi HTTP API: http://0.0.0.0:${PORT}/apps/${apps[0].id}/events`);
    console.log('\n✨ Ready to handle WebSocket connections!\n');
    
    // Optional: Send a test ping every 30 seconds (remove in production)
    if (!IS_PRODUCTION) {
        let pingCount = 0;
        setInterval(() => {
            pingCount++;
            pusher.trigger('test-channel', 'server-ping', {
                text: `Server ping #${pingCount}`,
                timestamp: new Date().toISOString(),
                sender: 'System'
            }).then(() => {
                console.log(`📡 Ping #${pingCount} sent to test-channel`);
            }).catch(err => {
                console.error('❌ Ping failed:', err.message);
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
