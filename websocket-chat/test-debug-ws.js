const ws = new WebSocket('ws://localhost:3002/?test=1');

ws.onopen = function() {
    console.log('✅ Debug WebSocket connected!');
    ws.close();
};

ws.onmessage = function(event) {
    console.log('📨 Received:', event.data);
};

ws.onerror = function(error) {
    console.log('❌ Debug WebSocket error:', error);
};

ws.onclose = function() {
    console.log('Debug WebSocket closed');
    process.exit(0);
};

setTimeout(() => {
    console.log('❌ Debug connection timeout');
    process.exit(1);
}, 5000);