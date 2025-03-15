class Client {
    constructor() {
        //用户名字
        this.userName = null;
        //用户id
        this.id = null;
        this.ws = null;
        this.input = document.getElementById("input");
        this.btn = document.getElementById("btn");
        this.msgs = document.getElementById("msgs");
        this.btn.onclick = this.semdMessage.bind(this)
        window.addEventListener("keydown", (event) => {
            if (event.keyCode === 13) {
                this.semdMessage();
            }
        })
        this.init();
    }

    //内网穿透需需设置wss协议
    //使用ngrok内网穿透，前端服务，后台服务都使用ngrok，生成两个地址，一个是前端地址，一个是后台地址
    //官网htttps://ngrok.com下载，ngrok.yml，ngrok.bat放在ngrok.exe同一目录下
    //ngrok配置多个服务，修改ngrok.yml文件，添加多个服务，ngrok.bat添加服务名，启动运行即可
    //powershell 运行 New-NetFirewallRule -DisplayName "FrontendPort" -Direction Inbound -LocalPort 5500 -Protocol TCP -Action Allow
    init() {
        // this.ws = new WebSocket("wss://970c-14-19-93-78.ngrok-free.app");
        this.ws = new WebSocket("ws://localhost:3000");
        this.ws.onerror = (error) => {
            console.log(error);
            this.msgs.innerHTML += `<div class="tips">${JSON.stringify(error)}</div>`;
        };
        this.ws.onmessage = (event) => {
            console.log(event.data);
            const data = JSON.parse(event.data);
            //判断是否是首次打开
            if (data.type === "setName" && !this.userName) {
                this.id = data.id;
                this.input.placeholder = "输入你的名字...";
                return;
            }
            //判断是否是系统消息，是则显示
            if (data.type === "server") {
                if (data.id === this.id) {
                    this.msgs.innerHTML += `<div class="tips">你加入了群聊</div>`;
                } else {
                    this.msgs.innerHTML += `<div class="tips">${data.message}</div>`;
                }
                this.run();
                return;
            }
            //判断是否是自己发的消息，不是自己发的消息则显示
            if (data.id !== this.id) {
                this.msgs.innerHTML += `<div class="msg left">
            <div style="display: flex;justify-content: start;margin:10px">
            <div>${data.userName}</div>
            <div style="max-width: 50%;word-wrap: break-word;background:#ecedef;padding:10px;margin-left:10px;border-radius:5px;">${data.message}</div>
            </div>
          </div>`;
                this.run();
            }
            console.log(data);
        };
    }

    semdMessage() {
        if (this.ws && this.input.value) {
            console.log(this.input.value);
            if (!this.userName) {
                this.userName = this.input.value.trim();
                this.ws.send(JSON.stringify({userName: this.input.value.trim()}));
                this.input.placeholder = "输入你的消息...";
            } else {
                this.msgs.innerHTML += `<div class="msg right">
          <div style="display: flex;justify-content: end;margin:10px">
            <div style="max-width: 50%;word-wrap: break-word;background:#ecedef;padding:10px;margin-right:10px;border-radius:5px;">${this.input.value.trim()}</div>
            <div>你</div>
          </div>
            
            </div>`;
                this.ws.send(
                    JSON.stringify({
                        userName: this.userName,
                        message: this.input.value.trim(),
                    })
                );
                this.run();
            }
            this.input.value = "";
        }
    }

    //自动下滑
    run() {
        this.msgs.scrollTop = this.msgs.scrollHeight;
    }
}

new Client();
