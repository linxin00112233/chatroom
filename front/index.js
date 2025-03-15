class Client {
    constructor() {
        //用户名字
        this.userName = null;
        //用户id
        this.id = null;
        //websocket
        this.ws = null;
        //输入框
        this.input = document.getElementById("input");
        //发送按钮
        this.btn = document.getElementById("btn");
        //消息列表
        this.msgs = document.getElementById("msgs");
        //发送按钮点击事件，this指向为Client，不用则指向这个按钮
        this.btn.onclick = this.sendMessage.bind(this)
        //文件选择框，使用bind修改this的this指向，this指向为Client，不用则指向这个文件选择框
        this.fileSelect = document.getElementById("file");
        //文件选择事件，与上面bind同理
        this.fileSelect.onchange = this.sendFiles.bind(this)
        //键盘回车事件
        window.addEventListener("keydown", (event) => {
            if (event.keyCode === 13) {
                this.sendMessage();
            }
        })

        //初始化websocket
        this.init();
    }


    //内网穿透需需设置wss协议
    //使用ngrok内网穿透，前端服务，后台服务都使用ngrok，生成两个地址，一个是前端地址，一个是后台地址
    //官网https://ngrok.com下载，ngrok.yml，ngrok.bat放在ngrok.exe同一目录下
    //ngrok配置多个服务，修改ngrok.yml文件，添加多个服务，ngrok.bat添加服务名，启动运行即可
    //powershell 运行 New-NetFirewallRule -DisplayName "FrontendPort" -Direction Inbound -LocalPort 5500 -Protocol TCP -Action Allow
    init() {
        // this.ws = new WebSocket("wss://970c-14-19-93-78.ngrok-free.app");
        this.ws = new WebSocket("ws://localhost:3000");
        //连接错误回调函数
        this.ws.onerror = (error) => {
            console.log(error);
            this.msgs.innerHTML += `<div class="tips">${JSON.stringify(error)}</div>`;
        };
        // 接收消息
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
                    this.msgs.innerHTML += `<div class="tips">${data.message}${this.formatTime(data.timestamp)}</div>`;
                }
                this.run();
                return;
            }
            if (data.id === this.id) return;
            //渲染图片
            if (data.msgtype === 'img') {
                this.msgs.innerHTML += `<div class="msg left">
            <div class="flex-start">
            <div>${data.userName}</div>
            <div class="common2">
             <img class="sendimg" src="${data.message}" alt=""/>
</div>
            </div>
          </div>`;
                this.downImgs()
                this.run();
                return
            }

            //渲染其他文件
            if (data.msgtype === 'file') {
                const blob = new Blob([this.base64ToArrayBuffer(data.message)], {type: data.fileType});
                const url = URL.createObjectURL(blob);
                this.msgs.innerHTML += `<div class="msg left">
                    <div class="flex-start">
                        <div>${data.userName}</div>
                        <div class="common2">
                            <a class="sendfile" href="${url}" download="${data.fileName}">${data.fileName}</a>
                        </div>
                    </div>
                </div>`;
                this.run();
                return;
            }

            //渲染视频和音频
            if (data.msgtype === 'audio' || data.msgtype === 'video') {
                const blob = new Blob([this.base64ToArrayBuffer(data.message)], {type: data.fileType});
                const url = URL.createObjectURL(blob);
                if (data.msgtype === 'audio') {
                    this.msgs.innerHTML += `<div class="msg left">
                    <div class="flex-start">
                        <div>${data.userName}</div>
                        <div class="common2">
                            <audio src="${url}" controls></audio>
                        </div>
                    </div>
                </div>`;
                } else {
                    this.msgs.innerHTML += `<div class="msg left">
                    <div class="flex-start">
                        <div>${data.userName}</div>
                        <div class="common2">
                            <video src="${url}" controls></video>
                        </div>
                    </div>
                </div>`;
                }

                this.run();
                return;
            }
            //判断是否是自己发的消息，不是自己发的消息则显示

            this.msgs.innerHTML += `<div class="msg left">
            <div class="flex-start">
            <div>${data.userName}</div>
            <div class="common2">${data.message}</div>
            </div>
          </div>`;
            this.run();
            console.log(data);
        };
    }

    //发送文字消息
    sendMessage() {
        if (this.ws && this.input.value) {
            console.log(this.input.value);
            if (!this.userName) {
                // 去除空格
                this.userName = this.input.value.trim();
                if (this.userName.length > 5) {
                    this.userName = null;
                    alert("用户名不能超过5个字符")
                    return
                }
                this.ws.send(JSON.stringify({userName: this.input.value.trim()}));
                this.input.placeholder = "输入你的消息...";
            } else {
                this.msgs.innerHTML += `<div class="msg right">
          <div class="flex-end">
            <div class="common1">${this.input.value.trim()}</div>
            <div>我</div>
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

    //发送文件
    sendFiles(e) {
        // console.log(e)
        if (!this.userName) {
            alert("请先输入用户名!")
            return
        }
        if (!this.ws || e.target.files.length === 0) {
            return
        }
        const file = e.target.files[0];
        console.log(file)

        //图片
        if (file.type.includes('image')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                this.msgs.innerHTML += `<div class="msg right">
          <div class="flex-end">
            <div class="common1">
                <img class="sendimg" src="${base64}" alt=""/>
           </div>
            <div>我</div>
          </div>
            </div>`;
                this.run();
                this.downImgs();
                this.ws.send(
                    JSON.stringify({
                        userName: this.userName,
                        message: base64,
                        msgtype: 'img'
                    })
                );

            };
            reader.readAsDataURL(file);
            return
        }

        //音频、视频
        if (file.type.includes('audio') || file.type.includes('video')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const arrayBuffer = event.target.result;
                const blob = new Blob([arrayBuffer], {type: file.type});
                const url = URL.createObjectURL(blob);
                const base64 = this.arrayBufferToBase64(arrayBuffer);
                if (file.type.includes('audio')) {
                    this.msgs.innerHTML += `<div class="msg right">
                    <div class="flex-end">
                        <div class="common1">
                            <audio src="${url}" controls></audio>
                        </div>
                        <div>我</div>
                    </div>
                </div>`;
                } else {
                    this.msgs.innerHTML += `<div class="msg right">
                    <div class="flex-end">
                        <div class="common1">
                            <video src="${url}" controls></video>
                        </div>
                        <div>我</div>
                    </div>
                </div>`;
                }
                this.ws.send(
                    JSON.stringify({
                        userName: this.userName,
                        message: base64,
                        msgtype: file.type.includes('audio') ? 'audio' : 'video',
                    })
                );
                this.run()
            };
            reader.readAsArrayBuffer((file))
            return
        }

        //其他文件
        const reader = new FileReader();
        reader.onload = (event) => {
            const arrayBuffer = event.target.result;
            const blob = new Blob([arrayBuffer], {type: file.type});
            const url = URL.createObjectURL(blob);
            const base64 = this.arrayBufferToBase64(arrayBuffer);
            this.msgs.innerHTML += `<div class="msg right">
                    <div class="flex-end">
                        <div class="common1">
                            <a class="sendfile" href="${url}" download="${file.name}">${file.name}</a>
                        </div>
                        <div>我</div>
                    </div>
                </div>`;
            this.run()
            console.log(arrayBuffer)
            this.ws.send(
                JSON.stringify({
                    userName: this.userName,
                    message: base64,
                    msgtype: 'file',
                    fileName: file.name
                })
            );
        }
        reader.readAsArrayBuffer((file))
    }

    //将arrayBuffer转base64
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // 将base64转arrayBuffer
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    //用于遍历所有图片，下载图片
    downImgs() {
        //获取所有图片,点击图片触发下载功能
        let imgs = this.msgs.querySelectorAll('img')
        console.log(imgs)
        imgs.forEach(img => {
            img.onclick = () => {
                const a = document.createElement('a');
                a.href = img.src;
                a.download = 'image.jpg';
                a.click();
                a.remove();
            }
        })
    }

    //格式化时间
    formatTime(time) {
        const date = new Date(time);
        const year = date.getFullYear();
        const month = date.getMonth() + 1 > 10 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1);
        const day = date.getDate() > 10 ? date.getDate() : '0' + date.getDate();
        const hour = date.getHours() > 10 ? date.getHours() : '0' + date.getHours();
        const minute = date.getMinutes() > 10 ? date.getMinutes() : '0' + date.getMinutes();
        const second = date.getSeconds() > 10 ? date.getSeconds() : '0' + date.getSeconds();
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }

    //自动下滑
    run() {
        this.msgs.scrollTo(0, this.msgs.scrollHeight)
    }


}

new Client();
