const ws = new WebSocket('ws://localhost:3001/?username=TestUser');

ws.onopen = function() {
    console.log('✅ Test WebSocket connected successfully!');
    ws.send('Hello from client');
};

ws.onmessage = function(event) {
    console.log('📨 Received:', event.data);
    ws.close();
};

ws.onerror = function(error) {
    console.log('❌ Test WebSocket error:', error);
};

ws.onclose = function() {
    console.log('Test WebSocket closed');
    process.exit(0);
};

setTimeout(() => {
    console.log('❌ Test connection timeout');
    process.exit(1);
}, 5000);