--- 
title: netty 学习笔记
date: 2022-02-08

sidebar: ture
categories:
  - Java
tags:
  - netty
--- 
IO 就是计算机内部与外部进行数据传输的过程，比如网络 IO 与磁盘 IO

所有 IO 都需要系统调用，由操作系统代理执行，并经历从IO设备拷贝到内核空间拷到用户空间的环节（java 中有管理堆外内存的类，是个特例）

在内核收到调用请求之后，会有数据准备、数据就绪、数据拷贝的阶段
## 常用的 IO 模型
### BIO：同步阻塞 IO
同步阻塞 IO 模型中，应用程序某个线程发起 read 调用后，会一直阻塞，直到在内核把数据拷贝到用户空间

在这个模型中，一个线程对应一组操作，这组操作中的阻塞操作与非阻塞操作都会让线程阻塞，这样是非常浪费效率的
#### java 中的 BIO
传统的 IO 编程

每一个客户端连接都使用一个线程，在这个连接不传输信息的时候也会占用线程，此外所有调用都是阻塞的
```java
        try {
            ServerSocket serverSocket = new ServerSocket(666);
            Socket socket = serverSocket.accept();
            OutputStream outputStream = socket.getOutputStream();
            //.......
            outputStream.close();
            socket.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
```

### NIO：同步非阻塞 IO
上面的代码是一个经典的每连接每线程的模型，之所以使用多线程，主要原因在于 socket.accept()、socket.read()、socket.write() 三个主要函数都是同步阻塞的，当一个连接在处理 IO 的时候，系统是阻塞的，如果是单线程的话必然就挂死在那里；但 CPU 是被释放出来的，开启多线程，就可以让 CPU 去处理更多的事情

现在的多线程一般都使用线程池，可以让线程的创建和回收成本相对较低。在活动连接数不是特别高（小于单机1000）的情况下，这种模型是比较不错的，可以让每一个连接专注于自己的 I/O 并且编程模型简单，也不用过多考虑系统的过载、限流等问题。线程池本身就是一个天然的漏斗，可以缓冲一些系统处理不了的连接或请求。

不过，这个模型最本质的问题在于，严重依赖于线程。但线程是很贵的资源，主要表现在线程的创建和销毁成本很高，并且线程本身占用较大内存，像 Java 的线程栈，一般至少分配512K～1M的空间，如果系统中的线程数过千，恐怕整个 JVM 的内存都会被吃掉一半

有没有一种技术可以降低线程数的同时，保证如此高量的连接请求呢？有的，想想 redis 做的 IO 复用，我们参照这个改改代码就行了

说一下 NIO 的原理，NIO 的主要事件有几个：读就绪、写就绪、有新连接到来。主要的参与对象有几个：处理器、事件选择器

我们首先需要注册当这几个事件到来的时候所对应的处理器。然后在合适的时机告诉事件选择器，我对这个事件感兴趣。对于写操作，就是写不出去的时候对写事件感兴趣；对于读操作，就是完成连接和系统没有办法承载新读入的数据时；对于 accept，一般是服务器刚启动的时候；而对于 connect，一般是 connect 失败需要重连或者直接异步调用 connect 的时候

然后，用一个死循环选择就绪的事件，会执行系统调用，还会阻塞的等待新事件的到来。新事件到来的时候，会在选择器上注册标记位，标示可读、可写或者有连接到来

注意，select 是阻塞的，无论是通过操作系统的通知（epoll）还是不停的轮询（sellect，poll），这个函数是阻塞的。所以你可以放心大胆地在一个 while(true) 里面调用这个函数而不用担心 CPU 空转
#### java 中的 NIO
java 中的 NIO、Radis 中的单线程、Netty 框架就是 IO 多路复用

传统的 BIO 里面 socket.read()，如果 TCP RecvBuffer 里没有数据，函数会一直阻塞，直到收到数据，返回读到的数据。表现为我们需要传入一个 x 参数给 socket，socket 读取 x 后或者链接关闭了，才会返回

但是对于 NIO，如果 TCP RecvBuffer 有数据，就把数据从网卡读到内存，并且返回给用户；反之则直接返回0，永远不会阻塞。这个是给 socket 设置了非阻塞的条件，让其从套接字中，能读多少数据读多少数据，这样的话方法永远不会关闭，示例代码如下：
```java
// 像餐厅叫号系统：一个服务员管理多个客人，谁准备好了服务谁
Selector selector = Selector.open();
ServerSocketChannel serverChannel = ServerSocketChannel.open();
serverChannel.configureBlocking(false);  // ✅ 非阻塞模式
serverChannel.register(selector, SelectionKey.OP_ACCEPT);

while (true) {
    selector.select();  // 等待就绪的事件
    Set<SelectionKey> keys = selector.selectedKeys();
    for (SelectionKey key : keys) {
        if (key.isAcceptable()) {  // 有连接到达
            acceptConnection(key);
        } else if (key.isReadable()) {  // 有数据可读
            readData(key);
        }
    }
}
// 优点：一个线程管理成千上万个连接！
```

java 中的 NIO 通信是 IO 多路复用的一种实现，reactor 模式是其一种实现的思想

使用选择器，缓冲区、通道来实现，通道将用户数据拷贝到缓冲区中，选择器让程序读取缓冲区中数据

java 中一个线程对应一个选择器，一个选择器对应多个连接（通道），选择器选择那个通道是由事件确定的

Buffer 是一个内存块，底层用数组实现，要么是输入状态要么是输出状态，每一个通道都要注册到选择器中，选择器检查是否有事件发生来进行通道的选择
#### Reactor 模式
又叫分发者模式，反应器模式，**通知者模式，这个是高性能 IO 的基石**，Reactor 模式又分为三种子模式

- 单 Reactor 单线程：这个模式下处理连接与业务的只有一个线程，Reactor 进行阻塞操作的分离，并将需要线程处理的业务交给 Handler 进行处理，这种模式可以应对较少客户端连接下快速业务的处理，比如 Redis 的 IO 多路复用
- 单 Reactor 多线程：Reactor 由一个线程控制，将业务交给线程池控制的 Handler 处理，这种模式在多线程情况下容易出现性能瓶颈（因为只有一个 Handler）
- 主从 Reactor：主 Reactor 负责建立连接，从 Reactor 负责处理连接，Handler 负责处理业务，分为三层处理业务较大的提高了效率，netty 就是使用了这种模式
```java
// 1. 创建Selector（Java层的）
Selector selector = Selector.open();

// 2. 注册Channel和感兴趣的事件（Java -> 操作系统）
SocketChannel channel = SocketChannel.open();
channel.configureBlocking(false); // 必须非阻塞
channel.register(selector, SelectionKey.OP_READ); // 注册读事件

// 3. 轮询：
while (true) {
    // select() 是阻塞的，会等待直到有事件
    int readyCount = selector.select(); // 这里会阻塞
    
    if (readyCount > 0) {
        Set<SelectionKey> readyKeys = selector.selectedKeys();
        // 处理事件...
    }
}
```
Reactor 模式的思路是基于一个选择器的死循环线程（select/poll/epoll）。同时基于事件驱动，将 IO 封装成不同的事件，每个事件配置对应的回调函数
## 异步非阻塞 I/O
异步非阻塞I/O 是一种高效的 I/O 模型，它允许程序在等待 I/O 操作完成时不被阻塞，而是继续执行其他任务。这种方式特别适合处理大量并发连接的场景，因为它可以显著减少线程的数量和上下文切换的开销

netty 的异步非阻塞 I/O 工作原理如下：

1，注册事件：应用程序向操作系统注册感兴趣的 I/O 事件（如读就绪、写就绪）。注册的接口是操作系统提供的
2，事件轮询：操作系统使用选择器（Selector）来监控多个 I/O 通道（Channel），并等待其中一个或多个通道准备好进行 I/O 操作
3，事件通知：当某个通道准备好了，操作系统会执行通知，此时选择器会知道那些通道里面有事件。此时需要应用程序不断轮询选择器
4，处理事件：应用程序处理该事件，如读取数据或写入数据
## 事件驱动模型
事件驱动模型是一种编程范式，其中程序的流程由外部事件（如用户输入、网络请求、定时器等）驱动。在这种模型中，程序通常会注册一系列事件处理器，当特定事件发生时，相应的处理器会被调用

netty 的事件驱动模型工作原理是事件队列中有了待处理的事件后，会不断从事件队列中取出事件并分发给相应的事件处理器，事件处理器就是处理具体事件的代码逻辑

这里事件处理器会不断的等待事件的到来，在传统的多线程模型中，每个任务都需要一个线程，这会导致大量的上下文切换和资源消耗。事件驱动模型通过少量的线程处理多个事件，减少了线程的开销

同时 netty 使用了**零拷贝**技术做了优化，减少了上下文切换和数据复制的次数
## 典型应用
netty 是高性能基石，很多高性能的框架都是基于 netty 做的。需要处理高并发连接（如万级 TCP 长连接）、低延迟、高吞吐量的网络服务，推荐使用

典型应用：

- WebSocket 服务器：实时推送（如股票行情、在线游戏）
- RPC 框架底层：Dubbo、gRPC 的通信层
- 自定义协议服务器：物联网（IoT）设备接入（如 MQTT、Modbus）
## 组件
### 解码器
解码器（Decoder）是 ChannelInboundHandler 的一种，负责将原始字节流（ByteBuf）转换为应用层协议对象（如 String、POJO）

我们解决 TCP 粘包/半包问题或者解析自定义二进制协议时需要使用到这个，常见的解码器包含：

- 固定长度解码器（FixedLengthFrameDecoder）：每个数据包长度固定
- 分隔符解码器（DelimiterBasedFrameDecoder）：按特殊字符拆分消息
- 长度字段解码器（LengthFieldBasedFrameDecoder）：处理包含长度字段的自定义协议（如 Dubbo）
### Channel 通道
Channel 是 Netty 网络通信的核心抽象，**代表一个开放的连接**（如 TCP Socket、UDP 或文件 IO），封装了底层操作，提供以下能力：

- 数据读写，通过 Channel.write() 和 Channel.read() 实现
- 事件通知：如连接建立（channelActive）、数据到达（channelRead）、异常捕获（exceptionCaught）
- 配置参数：如 TCP 缓冲区大小、Nagle 算法开关（ChannelOption.TCP_NODELAY）

此外还有 ChannelHandlerContext，它是一个处理环节的执行上下文。包含 Handler 引用、前后环节、Channel 引用，生命周期是 Handler 添加到 Pipeline → Handler 移除，主要用来执行 Handler 逻辑、传递数据
## 常见问题
### JDK NIO 的空轮询 Bug
在 Linux 系统下，JDK 的 Selector.select() 方法可能会在没有就绪事件时被唤醒（返回 0），导致 CPU 空转（100% 占用）。触发条件为某些 Linux 内核版本（如 2.6.x）的 epoll 实现存在缺陷或者网络连接异常，比如连接被对端重置但未关闭

**Netty 通过 Selector 重建机制和空轮询检测解决该问题**，核心思路如下：

1，空轮询次数统计，在 NioEventLoop 中，每次 select() 返回 0 时，计数器 selectCnt 递增。如果 selectCnt 超过阈值（默认 512），判定为空轮询 Bug 触发

2，重建 Selector，很简单，就是关闭旧的 Selector，创建新的 Selector。将原有 Channel 重新注册到新 Selector

### 半包和粘包
**TCP 粘包是指发送方多次发送的小数据包被接收方一次性接收**，从接收缓冲区看，后一包数据的头紧接着前一包数据的尾，导致应用层不知道这个包从哪里结束了

**半包则指发送方的一个大数据包被接收方拆分成多次接收**，为什么会出现这种情况呢？TCP 是面向流的协议，本身没有消息边界的概念，数据像水流一样连续传输

**这个问题出现的核心原因是 TCP 是字节流服务，TCP 不知道消息之间的界限，不知道一次性提取多少字节的数据所造成的**
```
// 从 TCP 的视角看数据
发送方：发送了 3 条消息
Message1: "Hello"
Message2: "World"  
Message3: "Netty"

// TCP 看到的只是字节流：
字节流： "HelloWorldNetty"

// 接收方可能收到：
情况1： "HelloWorldNetty"           // 粘包（3条粘成1条）
情况2： "He" "lloWorld" "Netty"     // 半包+粘包
情况3： "Hello" "World" "Netty"     // 理想情况（但不可靠）
```
UDP 不可能出现粘包问题，因为它不用窗口接受，不是面向字节流的，每次只接受一个数据包，每个 UDP 段都是一条消息，应用程序必须以消息为单位提取数据，而 TCP 是套接字传输方式

TCP 粘包发生的表面原因有两点：

1，发送方如果有连续几次发送的数据都很少，通常 TCP 会根据优化算法把这些数据合成一包后一次发送出去

2，接收方如果未及时清理缓冲区的数据，造成多个包同时接收

根本原因还是因为 netty 是面向字节流的传输协议，只负责消息的传输，对消息的边界不关心

解决粘包问题有很多方案，以下提出部分方案，在 netty 中对应解码器：

1，定长发送 FixedLengthFrameDecoder，发送端在发送数据时都以 LEN 为长度进行分包。这样接收方都以固定的 LEN 进行接收，如此一来发送和接收就能一一对应了。分包的时候不一定能完整的恰好分成多个完整的 LEN 的包，最后一个包一般都会小于 LEN，这时候最后一个包可以在不足的部分填充空白字节

2，头尾部标记 DelimiterBasedFrameDecoder，在每个要发送的数据包的尾部设置一个特殊的字节序列，此序列带有特殊含义，跟字符串的结束符标识”\0”一样的含义，用来标示这个数据包的末尾，接收方可对接收的数据进行分析，通过尾部序列确认数据包的边界

头部标记则是定义一个用户报头，在报头中注明每次发送的数据包大小。接收方每次接收时先以报头的 size 进行数据读取，这必然只能读到一个报头的数据，从报头中得到该数据包的数据大小，然后再按照此大小进行再次读取

3，加入消息长度信息 LengthFieldBasedFrameDecoder（最常用），在收到头标志时，里面还可以带上消息长度，以此表明在这之后多少 byte 都是属于这个消息的。如果在这之后正好有符合长度的 byte，则取走，作为一个完整消息给应用层使用