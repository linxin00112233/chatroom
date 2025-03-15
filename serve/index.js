import {WebSocketServer} from "ws";
import http from "http";
import {v4 as uuidv4} from "uuid";

const server = http.createServer();
const wss = new WebSocketServer({server});

const port = 3000;

//用于存储用户信息
const Users = new Set();

wss.on("connection", (ws) => {
    //添加用户
    Users.add(ws);
    //用户名,id,id是唯一的
    const User = {userName: "", id: uuidv4()};
    ws.send(
        JSON.stringify({
            type: "setName",
            message: "欢迎加入聊天室，请输入你的名字",
            timestamp: new Date().toISOString(),
            id: User.id,
        })
    );
    //接收消息
    ws.on("message", (message) => {
        const data = JSON.parse(message);
        console.log(`收到消息: ${message}`);
        //判断用户是否是首次打开，首次打开则需通知其他人，系统消息，不是首次打开则正常发送消息
        if (!User.userName) {
            User.userName = data.userName;
            systemMessage({
                type: "server",
                message: `欢迎${User.userName}加入聊天室`,
                timestamp: new Date().toISOString(),
                ...User,
            });
        } else {
            userMessage({
                type: "user",
                ...User,
                message: data.message,
                timestamp: new Date().toISOString(),
                msgtype: data.msgtype, //文件类型
                fileName: data.fileName, //文件名
            });
        }
    });
    //用户关闭连接
    ws.onclose = () => {
        //用户关闭连接，删除用户
        if (!User.userName) return;
        Users.delete(ws);
        systemMessage({
            type: "server",
            message: `${User.userName}离开聊天室`,
            timestamp: new Date().toISOString(),
            ...User,
        });
    };
});

//系统消息
function systemMessage(text) {
    //遍历所有用户，发送消息
    Users.forEach((user) => {
        user.send(JSON.stringify(text));
    });
}

//用户消息
function userMessage(text) {
    //遍历所有用户，发送消息
    Users.forEach((user) => {
        user.send(JSON.stringify(text));
    });
}

// 添加CORS中间件
server.on("request", (req, res) => {
    cors({
        origin: "*",
        methods: ["GET", "POST"],
    })(req, res, () => {
    });
});
server.listen(port, "0.0.0.0", () => {
    console.log(`服务已开启ws://localhost:${port}`);
});
