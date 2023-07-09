require('dotenv').config();

var mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/dynamic-chat-app");

const app = require('express')(); 
const http = require('http').Server(app);

const userRoute = require('./routes/userRoute');

const User = require('./models/userModel');
const Chat = require('./models/chatModel');

app.use('/', userRoute);

const io = require('socket.io')(http);

var usp = io.of('/user-namespace');

usp.on('connection', async function(socket){
    console.log("User Connected!");
    var userId = socket.handshake.auth.token;
    await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: '1' } });
    // User broadcast online status
    socket.broadcast.emit('getOnlineUser', { user_id: userId });
    socket.on('disconnect', async function(){
        console.log("User Disconnected!");
        var userId = socket.handshake.auth.token;
        await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: '0' } });
        // User broadcast online status
        socket.broadcast.emit('getOfflineUser', { user_id: userId });
    });
    // chating implementation
    socket.on('newChat', function(data){
        socket.broadcast.emit('loadNewChat', data);
    });

    // load old chats
    socket.on('existsChat', async function(data){
        var chats = await Chat.find({$or: [
            { sender_id: data.sender_id, receiver_id: data.receiver_id },
            { sender_id: data.receiver_id, receiver_id: data.sender_id }
        ]});

        socket.emit('loadChats', { chats: chats });
    });
    // delete chats
    socket.on('chatDeleted', function(id){
        socket.broadcast.emit('chatMessageDeleted', id);
    });
    // update chats
    socket.on('chatUpdated', function(data){
        socket.broadcast.emit('chatMessageUpdated', data);
    });
});

http.listen(3000, function(){
    console.log("Server is running");
});


/*
omswami.2005@gmail.com
om123

prathm@gmail.com
prathm123

akshayGitte@gmail.com
akshay123

socket IO front end link
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.2/socket.io.js" integrity="sha512-VJ6+sp2E5rFQk05caiXXzQd1wBABpjEj1r5kMiLmGAAgwPItw1YpqsCCBtq8Yr1x6C49/mTpRdXtq8O2RcZhlQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>

<div class="current-user-chat">
    <h5>Hii</h5>
</div>
<div class="distance-user-chat">
    <h5>Hii</h5>
</div>


*/
