const express = require('express');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use(express.static(__dirname + '/public'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new WebSocket.Server({ server });

//TODO: change to map
let clients = [];

wss.on('connection', (ws, req) => {
  console.log('client connected');

  //TODO: send list of clients to check if username is unique

  ws.on('message', (data) => {
    const dataJSON = JSON.parse(data);

    if (dataJSON.type === 'username') {
      clients.push({
        client: ws,
        username: dataJSON.value,
        color: dataJSON.color,
      });

      broadcast(JSON.stringify({ ...dataJSON, clientList: clients }));
    } else if (dataJSON.type === 'message') {
      broadcastExceptSelf(ws, data);
    }
  });

  ws.on('close', () => {
    console.log('client disconnected');
    let removeIndex = -1;
    let clientName = '';

    //get username
    for (let i = 0; i < clients.length; i++) {
      if (clients[i].client === ws) {
        clientName = clients[i].username;
        removeIndex = i;
        break;
      }
    }

    if (removeIndex != -1) {
      clients.splice(removeIndex, 1);
    }

    const disconnected = JSON.stringify({
      type: 'disconnect',
      value: clientName,
      clientList: clients,
    });

    broadcastExceptSelf(ws, disconnected);
  });
});

function broadcastExceptSelf(ws, sendMsg) {
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(sendMsg);
    }
  });
}

function broadcast(sendMsg) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(sendMsg);
    }
  });
}
