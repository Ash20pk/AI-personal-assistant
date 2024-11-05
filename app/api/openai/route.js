import { WebSocket } from 'ws';
import { RealtimeClient } from '@openai/realtime-api-beta';

export const GET = (req) => {
  const wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', (ws) => {
    const realtimeClient = new RealtimeClient({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });

    console.log('Realtime client created',realtimeClient );

    realtimeClient.on('conversation.updated', (event) => {
      ws.send(JSON.stringify(event));
    });

    realtimeClient.on('conversation.item.appended', (event) => {
      ws.send(JSON.stringify(event));
    });

    realtimeClient.on('conversation.item.completed', (event) => {
      ws.send(JSON.stringify(event));
    });

    realtimeClient.on('conversation.interrupted', () => {
      ws.send(JSON.stringify({ type: 'conversation.interrupted' }));
    });

    realtimeClient.connect().then(() => {
      ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'sendUserMessageContent') {
          realtimeClient.sendUserMessageContent(data.content);
        } else if (data.type === 'appendInputAudio') {
          realtimeClient.appendInputAudio(data.audio);
        } else if (data.type === 'createResponse') {
          realtimeClient.createResponse();
        } else if (data.type === 'cancelResponse') {
          realtimeClient.cancelResponse(data.id, data.sampleCount);
        }
      });

      ws.on('close', () => {
        realtimeClient.disconnect();
      });

      ws.on('error', (error) => {
        console.error('WebSocket error internal:', error);
      });
    });
  });

  wss.handleUpgrade(req.socket, req.headers, (ws) => {
    wss.emit('connection', ws, req);
  });

  return new Response(null, { status: 101 });
};