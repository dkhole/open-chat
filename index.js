const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use(express.static(__dirname + '/public'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', (ws, req) => {
  console.log('client connected');
  //send list of clients

  ws.on('message', (data) => {
    const dataJSON = JSON.parse(data);
    //if username broadcast new user to clients
    if (dataJSON.type === 'username') {
      clients.push({
        client: ws,
        username: dataJSON.value,
        color: dataJSON.color,
      });
      const sendData = JSON.stringify({ ...dataJSON, clientList: clients });
      broadcast(ws, sendData);
    } else if (dataJSON.type === 'message') {
      //if recieve message broadcast same message
      broadcastExceptSelf(ws, data);
    }
  });

  ws.on('close', () => {
    console.log('client disconnected');
    let removeIndex = -1;
    let clientName = '';

    for (let i = 0; i < clients.length; i++) {
      if (clients[i].client === ws) {
        //broadcase user has logged out
        clientName = clients[i].username;

        // remove from clients
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

function broadcast(ws, sendMsg) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(sendMsg);
    }
  });
}
