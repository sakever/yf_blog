---
title: WebSocket 长连接
date: 2023-09-01
sidebar: ture
categories:
  - 计算机网络
tags:
  - WebSocket
---
## 介绍
WebSocket 是一种网络传输协议，可在单个 TCP 连接上进行全双工通信（允许数据同时在两个方向上传输），位于 OSI 模型的应用层

早期，很多网站为了实现推送技术，所用的技术都是轮询（也叫短轮询）。轮询是指由浏览器每隔一段时间向服务器发出 HTTP 请求，然后服务器返回最新的数据给客户端。常见的轮询方式分为**轮询**与**长轮询**

在这种情况下，HTML5 定义了 WebSocket 协议，能更好的节省服务器资源和带宽（因为 HTTP 请求可能会包含较长的头部，但真正有效的可能只有小部分），并且能够更实时地进行通讯，该协议在连接期间会一直占用一个端口。Websocket 使用 ws 或 wss 的统一资源标志符（URI），其中 wss 表示使用了 TLS 的 Websocket，ws 与 HTTP 协议有良好的兼容性

WS 协议和 WSS 协议两个均是 WebSocket 协议，两者一个是非安全的，一个是安全的。就好比 HTTP 协议和 HTTPS 协议的差别，非安全的没有证书，安全的如同 HTTPS 一样需要 SSL 证书，证书当然是配置在 ng 上的
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/9f2db7832c31b8e25fd2be3d35a12244.png)
### 创建过程
WebSocket 是先通过 http 创建的，随后才使用 WebSocket 的包来传输数据，创建过程如下：

- 首先建立 TCP 链接，三次握手，构建传输层的链接
- **使用 http（如果是 wss 使用 https）来传递基础信息**，比如所使用的 webSocket 版本、Sec-WebSocket-Key 等信息
- 服务器接受信息后会返回带有特殊信息的响应，表示已经接收到了 webSocket 建立请求
```java
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: 
Sec-WebSocket-Protocol: chat
```
- 客户端收到连接成功的消息后，开始借助于 TCP 传输信道进行全双工通信。通信阶段使用独立的 WebSocket 协议

我们在进行信息传输的过程中可能会走 ng 做网关，如果 ng 不支持我们的信息的话会导致长连接连不上，常见的 ng 问题见下文
### 优点
普遍认为，WebSocket 的优点有如下几点：

- 较少的控制开销：在连接创建后，服务器和客户端之间交换数据时，用于协议控制的数据包头部相对较小
- 更强的实时性：由于协议是全双工的，所以服务器可以随时主动给客户端下发数据。相对于 HTTP 请求需要等待客户端发起请求服务端才能响应，延迟明显更少
- 更好的二进制支持：WebSocket 定义了二进制帧，相对 HTTP，可以更轻松地处理二进制内容
## Java 中实现 webSocket
java 中实现 webSocket 一般有两种方法，一种是使用 WebSocket 的一个子协议 stomp，另外一个是使用 Socket.IO 协议实现。我们先介绍 stomp 实现方法

WebSocket 协议是一种相当低级的协议。它定义了如何将字节流转换为帧。帧可以包含文本或二进制消息。由于消息本身不提供有关如何路由或处理它的任何其他信息，因此很难在不编写其他代码的情况下实现更复杂的应用程序。幸运的是，WebSocket 规范允许在更高的应用程序级别上使用子协议。STOMP 是其中之一

STOMP：Simple (or Streaming) Text Orientated Messaging Protocol，即简单文本定向消息协议。它被用于定义常用消息传递的格式，STOMP 可以用于任何可靠的双向流网络协议，如 TCP 和 WebSocket，虽然 STOMP 是一个面向文本的协议，但消息可以是文本或二进制

使用 stomp 模式实现的 webSocket 更加简单便捷，在低链接数的情况下，比 Socket.IO 消耗更少的资源
### 依赖以及配置类
```xml
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-websocket</artifactId>
        </dependency>
        <dependency>
            <groupId>javax.websocket</groupId>
            <artifactId>javax.websocket-api</artifactId>
        </dependency>
```
配置类里将我们写的规则类注册进去

WebSocketHandlerRegistry 的 addHandler 方法是将 WebSocketHandler 和对应的 URL 路径注册到 WebSocketHandlerRegistry 中，以供后续的 WebSocket 连接请求进行匹配和处理。当有 WebSocket 连接请求到达时，WebSocketHandlerRegistry 会根据请求的 URL 路径找到对应的 WebSocketHandler，并将请求交给该 Handler 进行处理
```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private MyWsHandler myWsHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(myWsHandler, "/ws/voice/remind.json")
                //允许跨域
                .setAllowedOrigins("*");
    }
}
```
### 实现
继承 AbstractWebSocketHandler，实现方法，即可自定义在连接、传入、中断等时候分别可以执行的操作。这里我们选择继承其子类 TextWebSocketHandler 来处理文本消息
```java
@Component
@Slf4j
public class MyWsHandler extends TextWebSocketHandler {

    /**
     * 这个是管理 session 的类
     */
    @Resource
    WsSessionManager wsSessionManager;

    /**
     * 定义了客户端链接服务器的时候会执行什么操作
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("建立ws连接");
        wsSessionManager.add(session.getId(), session);
    }

    /**
     * handleTextMessage 方法是用来处理收到的文本消息的。当客户端发送文本消息到服务器端时，服务器端会调用 handleTextMessage 方法来处理该消息。在该方法中，开发者可以编写自定义的业务逻辑来处理文本消息，例如解析消息内容、调用其他服务进行处理等。同时，开发者还可以在该方法中向客户端发送文本消息，以实现双向通信
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        log.info("发送文本消息");
        // 获得客户端传来的消息
        String payload = message.getPayload();
        log.info("server 接收到消息 " + payload);
        session.sendMessage(new TextMessage("server 发送给的消息 " + payload + "，发送时间:" + LocalDateTime.now().toString()));
        // 推荐写法
        // 浏览器关闭后再写数据会触发异常，这里的死循环就会中断
        while (true) {
            Monitor.count("websocket.voice-remind-polling");
            // 回写真实数据前写个空数据判断连接是否正常
            // 1是为了在浏览器页面关闭时能及时中断循环，2是长时间不回写数据连接会中断（NG设置的2分钟超时）
            session.sendMessage(heartBeatResMsg);
            onTextMessage(session, message, userName);
        }
    }

    /**
     * 出现错误与异常的时候执行的操作
     */
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("异常处理");
        wsSessionManager.removeAndClose(session.getId());
    }

    /**
     * 连接中断后执行的操作
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("关闭ws连接");
        wsSessionManager.removeAndClose(session.getId());
    }
}
```
我们能在建立连接的时候将一些信息放在 session 里，WebSocketSession::getAttributes 是一个获取 WebSocketSession 对象的属性的方法，这个方法返回一个 Map<String, Object> 对象，其中包含了 WebSocketSession 对象中所有的属性。这些属性是在 WebSocketSession 对象创建时通过 WebSocketHandler 的 afterConnectionEstablished 方法存储的

在 afterConnectionEstablished 方法中，WebSocketSession 对象被创建并存储在内存中。此时，WebSocketSession 对象的属性可以通过调用 WebSocketSession 的 setAttribute 方法进行设置。setAttribute 方法接受两个参数，第一个参数是属性的名称，第二个参数是属性的值

我们在处理的时候需要解决心跳检测机制，用户关闭浏览器后我们应该关闭链接，如果是后端实现后端可以不停的写空数据（比如空的中括号大括号什么的）。浏览器关闭后再写数据会触发异常，死循环就会中断，websocket 会关闭
## 使用 Socket.IO 实现
Socket.IO 在 WebSocket 上封装了一些东西，让 WebSocket 的使用更加便捷，因此 Socket.IO 是 WebSocket 的升级版，包含：

- 每个数据包添加了额外的元数据。这就是为什么 WebSocket 客户端将无法成功连接到 Socket.IO 服务器，而 Socket.IO 客户端也将无法连接到普通 WebSocket 服务器
- 使用 netty 提供 IO 多路复用，使得一个选择器（线程）可以管理多个套接字链接，减少了线程数，并且尽可能的减少了等待数据的阻塞时间
- 如果不能建立 WebSocket 连接，连接将退回到 HTTP 长轮询
- 包含一个内置的**心跳机制**，它会定期检查连接的状态。如果校验失败会告知前后端，让业务去做后续处理，比如重新连接等等

在大量用户连接到服务器时，使用 Socket.IO 是个不错的选择，比如手机端的操作以及公共聊天室的实现
### 消息事件处理器
```java
@Component
public class MessageEventHandler {

    private final SocketIOServer server;

    private static final Logger logger = LoggerFactory.getLogger(MessageEventHandler.class);

    @Autowired
    public MessageEventHandler(SocketIOServer server) {
        this.server = server;
    }

    //添加connect事件，当客户端发起连接时调用
    @OnConnect
    public void onConnect(SocketIOClient client) {
        if (client != null) {
            String username = client.getHandshakeData().getSingleUrlParam("username");
            String password = client.getHandshakeData().getSingleUrlParam("password");
            String sessionId = client.getSessionId().toString();
            logger.info("连接成功, username=" + username + ", password=" + password + ", sessionId=" + sessionId);
        } else {
            logger.error("客户端为空");
        }
    }

    //添加@OnDisconnect事件，客户端断开连接时调用，刷新客户端信息
    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        logger.info("客户端断开连接, sessionId=" + client.getSessionId().toString());
        client.disconnect();
    }

    // 消息接收入口
    @OnEvent(value = "chatevent")
    public void onEvent(SocketIOClient client, AckRequest ackRequest, ChatMessage chat) {
        logger.info("接收到客户端消息");
        if (ackRequest.isAckRequested()) {
            // send ack response with data to client
            ackRequest.sendAckData("服务器回答chatevent, userName=" + chat.getUserName() + ",message=" + chat.getMessage());
        }
    }

    // 登录接口
    @OnEvent(value = "login")
    public void onLogin(SocketIOClient client, AckRequest ackRequest, LoginRequest message) {
        logger.info("接收到客户端登录消息");
        if (ackRequest.isAckRequested()) {
            // send ack response with data to client
            ackRequest.sendAckData("服务器回答login", message.getCode(), message.getBody());
        }
    }
}
```
启动器
```java
@Component
@Order(1)
public class ServerRunner implements CommandLineRunner {
    private final SocketIOServer server;
    private static final Logger logger = LoggerFactory.getLogger(ServerRunner.class);

    @Autowired
    public ServerRunner(SocketIOServer server) {
        this.server = server;
    }

    @Override
    public void run(String... args) {
        logger.info("ServerRunner 开始启动啦...");
        server.start();
    }
}
```
### Socket.IO 原理
简单聊一下 Socket.IO 的底层原理，它是使用了 netty 框架来实现 NIO 的，因此核心原理就是选择器。和 WebSocket 不一样，不是一个连接对应一个线程，我们在这直接加一层选择器来让多个连接映射少量线程，大大减少了线程资源，NIO Socket 工作流程：

- 将 Channel 注册到 Selector 上；Channel 是操作系统内核数据在虚拟机中映射的对象，指的是已经从缓冲区读到操作系统内核区的数据（这个过程是由操作系统 poll、epoll 等方法完成的）。Selector 就是选择器
- 调用 Selector.select 方法，选择发生的操作 Ready 事件；如果没有触发操作 Ready 事件，则一直阻塞。如果 Ready 事件发生，则 select 方法底层会把各个 Channel 背后的 Ready 情况写入到 PollArrayWrapper 对应的 revents 中

PollArrayWrapper 是 Selector 内部维护的连续内存数组，用来动态维护 socket 的注册关系以及 socket 的 IO 操作 ready 情况，里面有 Channel 的 id，以及 events 和对应的 revents

events 指的是 socketChannel 中注册的操作类型，比如数据读、数据写等等操作

revents 是指 events 的就绪情况。在调用 selector.select 时，会触发本地方法调用获取注册的 socket 的操作就绪情况，并且将结果会更新到 revents 中。然后选择器会调用 selectedKeys，根据 events（注册的操作）和 revents（就绪操作）通过一定的算法判断是否匹配被选中的。如果被选中说明数据已经准备好了，指定线程来处理数据
## nginx 配置的各种问题
### 请求 400
如果使用 webSocket 并且使用 nginx 做转发的话，会报以下错误：
```
failed: Error during WebSocket handshake: Unexpected response code: 400
```
这个问题其实是由于客户端错误或不存在的域名导致的，如果代码没有错误的话，可能是 ng 的配置不对
### 在 https下使用 ws，提示不安全
```
Mixed Content: The page at 'https://www.joshua317.com/1.html' was loaded over HTTPS, but attempted to connect to the insecure WebSocket endpoint 'ws://im.joshua317.com/'. This request has been blocked; this endpoint must be available over WSS.

Uncaught DOMException: Failed to construct 'WebSocket': An insecure WebSocket connection may not be initiated from a page loaded over HTTPS.
```

问题出现在 nginx 的配置文件，需要修改 nginx.conf 文件。在 linux 终端中敲入 vim /etc/nginx/nginx.conf，找到 location 这个位置，配置文件如下所示：
```
server {
        listen       80;
        server_name  school.godotdotdot.com;
        charset utf-8;

        location / {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_http_version 1.1; 
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_connect_timeout 60;
            proxy_read_timeout 600;
            proxy_send_timeout 600;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

    }
```
其中最重要的是下面这三行
```
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```
**其中第一行是告诉 nginx 使用 HTTP/1.1 通信协议，这是 websoket 必须要使用的协议**

**第二行和第三行告诉 nginx，当它想要使用 WebSocket 时，响应 http 升级请求**

### 在不支持 ssl 的情况下，直接用 wss 链接
```
index.ts:8 WebSocket connection to 'ws://im.joshua317.com/' failed: Error in connection establishment: net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH
或者
failed: Error in connection establishment: net::ERR_CERT_COMMON_NAME_INVALID
```

因为 HTTPS 是基于 SSL 依靠证书来验证服务器的身份，并为浏览器和服务器之间的通信加密，所以在 HTTPS 站点调用某些非 SSL 验证的资源时浏览器可能会阻止，简单来说就是验证不过

所以这个问题其实是 ng 不支持 https 导致的，我们加个证书来让它支持
```
server {
    listen 80;
    server_name im.joshua317.com;
    #调整成自己的证书即可，重点重点重点
    ssl_certificate /usr/local/nginx/conf/ssl/xxxx.crt;
    ssl_certificate_key /usr/local/nginx/conf/ssl/xxxx.key;
    ssl_session_timeout 5m;
     #调整成自己的即可，重点重点重点
    ssl_ciphers xxxxxxxxxxxxx;
```

### 如果我们设置 location 不正确的时候
```
failed: Error during WebSocket handshake: Unexpected response code: 404
```
综上，websocket 的状态码和 http 的其实差不多