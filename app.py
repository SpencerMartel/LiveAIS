from flask import Flask, render_template, request
from flask_socketio import SocketIO
from threading import Lock
import json
import asyncio
import websockets
from private import secrets

thread = None
thread_lock = Lock()

connected_clients = []

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')

bounding_boxes = {
    "Vancouver" : [[49.0065807923, -125.3776406487], [49.8160633836, -122.683243676]],
    "Los Angeles": [[33.57448, -118.440615], [33.788177, -117.991549]],
}

async def connect_ais_stream():
    async with websockets.connect("wss://stream.aisstream.io/v0/stream") as websocket:
        subscribe_message = {"APIKey": secrets["ais_key"],
                            "BoundingBoxes": [bounding_boxes["Vancouver"]],
                            "FilterMessageTypes": ["PositionReport"]}

        subscribe_message_json = json.dumps(subscribe_message)
        await websocket.send(subscribe_message_json)
        async for message_json in websocket:
            if len(connected_clients) != 0:
                message = json.loads(message_json)
                print(message)
                print("\n")
                send_message(message)

def send_message(message):
    socketio.emit("newBoatLocated", {"value": message})

def background_thread():
    asyncio.run(connect_ais_stream())

"""
Serve root index file
"""
@app.route('/')
def index():
    return render_template('index.html')

"""
Decorator for connect
"""
@socketio.on('connect')
def connect():
    global thread
    print(f"\nClient connected: {request.sid}\n")
    connected_clients.append(request.sid)

    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(background_thread)
            

"""
Decorator for disconnect
"""
@socketio.on('disconnect')
def disconnect():
    print(f"\nClient disconnected: {request.sid}\n")
    connected_clients.remove(request.sid)
    print(len(connected_clients))

if __name__ == '__main__':
    Flask.run(app, debug=True, host='0.0.0.0', port=8080)