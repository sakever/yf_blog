---
title: Server-Sent Events (SSE)
date: 2024-10-16
sidebar: true
categories:
  - 计算机网络
tags:
  - SSE
---
有一个需求，这个需求希望如果用户触发了下单操作，就对b端的管理员发送一次弹窗，如果想让前端源源不断的接受到后端发送的实时数据，这种需求可以使用什么技术来实现

可以采用以下几种技术方案：

1，WebSocket：WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议，它允许网页和后端进行双端通信
2，Server-Sent Events (SSE)：SSE 是一种让服务器向浏览器推送更新的技术。它基于 HTTP 协议，只需要服务器端发送一个特殊的 HTTP 响应头即可建立连接。与 WebSocket 相比，SSE 更加简单易用，但只能从服务器向客户端发送数据（单向通信）
3，轮询 (Polling)：传统的轮询方式是指客户端定期向服务器发送请求以检查是否有新数据。这种方式实现起来比较简单，但是效率较低，尤其是在数据更新不频繁的情况下，会造成不必要的网络流量消耗。轮询这里又区分长轮询和短轮询，长轮询请求到服务器后，服务器可能不会立刻返回数据，可能会等待一段时间后返回，即保持连接打开直到有新数据可发送，短轮询则是我们平常意义上的轮询

这里的 SSE 就是本文主要介绍的技术
## Spring Boot 中使用 SSE
Server-Sent Events (SSE) 是 HTML5 引入的一种轻量级的服务器向浏览器客户端单向推送实时数据的技术。在 Spring Boot 框架中，我们可以很容易地集成并利用 SSE 来实现实时通信

```xml
        <!-- 集成beetl -->
        <dependency>
            <groupId>com.ibeetl</groupId>
            <artifactId>beetl-framework-starter</artifactId>
            <version>1.2.30.RELEASE</version>
        </dependency>
 
        <!-- 集成hutool工具类简便操作 -->
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>5.3.10</version>
        </dependency>
```
核心的 SSE Client 代码
```java
@Slf4j
@Component
public class SseClient {
    private static final Map<String, SseEmitter> sseEmitterMap = new ConcurrentHashMap<>();
    /**
     * 创建连接
     */
    public SseEmitter createSse(String uid) {
        //默认30秒超时,设置为0L则永不超时
        SseEmitter sseEmitter = new SseEmitter(0l);
        //完成后回调
        sseEmitter.onCompletion(() -> {
            log.info("[{}]结束连接...................", uid);
            sseEmitterMap.remove(uid);
        });
        //超时回调
        sseEmitter.onTimeout(() -> {
            log.info("[{}]连接超时...................", uid);
        });
        //异常回调
        sseEmitter.onError(
                throwable -> {
                    try {
                        log.info("[{}]连接异常,{}", uid, throwable.toString());
                        sseEmitter.send(SseEmitter.event()
                                .id(uid)
                                .name("发生异常！")
                                .data("发生异常请重试！")
                                .reconnectTime(3000));
                        sseEmitterMap.put(uid, sseEmitter);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
        );
        try {
            sseEmitter.send(SseEmitter.event().reconnectTime(5000));
        } catch (IOException e) {
            e.printStackTrace();
        }
        sseEmitterMap.put(uid, sseEmitter);
        log.info("[{}]创建sse连接成功！", uid);
        return sseEmitter;
    }
 
    /**
     * 给指定用户发送消息
     *
     */
    public boolean sendMessage(String uid,String messageId, String message) {
        if (StrUtil.isBlank(message)) {
            log.info("参数异常，msg为null", uid);
            return false;
        }
        SseEmitter sseEmitter = sseEmitterMap.get(uid);
        if (sseEmitter == null) {
            log.info("消息推送失败uid:[{}],没有创建连接，请重试。", uid);
            return false;
        }
        try {
            sseEmitter.send(SseEmitter.event().id(messageId).reconnectTime(1*60*1000L).data(message));
            log.info("用户{},消息id:{},推送成功:{}", uid,messageId, message);
            return true;
        }catch (Exception e) {
            sseEmitterMap.remove(uid);
            log.info("用户{},消息id:{},推送异常:{}", uid,messageId, e.getMessage());
            sseEmitter.complete();
            return false;
        }
    }
 
    /**
     * 断开
     * @param uid
     */
    public void closeSse(String uid){
        if (sseEmitterMap.containsKey(uid)) {
            SseEmitter sseEmitter = sseEmitterMap.get(uid);
            sseEmitter.complete();
            sseEmitterMap.remove(uid);
        }else {
            log.info("用户{} 连接已关闭",uid);
        }
 
    }
 
}
```
这里可以看到在业务端需要维护用户 id 和 SSE Client 的对应关系

当客户端断开连接时，SseEmitter 会抛出 IOException，所以务必捕获并处理这种异常，通常情况下我们会调用 emitter.complete 或 emitter.completeWithError 来关闭 SseEmitter

SSE 连接是持久性的，长时间保持连接可能需要处理超时和重连问题。**我们需要在业务中实现心跳检测机制，避免如果连接在中途断了的问题**，由于 SSE 是单向的，只能后端向前端发生消息，比如空数组，如果失败后端进行清理连接的逻辑，前端校验到后端没消息了，进行清理和重试逻辑
## 原理
SSE 的底层原理相对简单，主要基于 HTTP1.1 协议，并且遵循以下几个关键点：

1，HTTP 长连接：SSE 使用标准的 HTTP 请求来建立连接。客户端（通常是浏览器）通过发送一个带有 Accept 头的 GET 请求来请求一个 SSE 连接。服务器响应这个请求并保持连接打开，以便后续发送数据
2，MIME 类型：服务器在响应中返回一个 MIME 类型为 text/event-stream 的内容。这种 MIME 类型告诉客户端这是一个 SSE 连接，客户端会解析并处理这些数据
3，数据格式：SSE 数据以简单的文本格式发送，每条消息由一个或多个字段组成。常见的字段包括：

- data: 消息的主要内容。
- event: 指定事件类型，默认为 message。
- id: 为每个事件分配一个唯一标识符，用于重新连接时恢复状态
- retry: 指定在连接断开后重新连接的等待时间（以毫秒为单位）
- 重连机制：如果连接中断，客户端会自动尝试重新连接。重连的时间间隔可以通过 retry 字段来控制。如果指定了 id 字段，服务器可以使用这个标识符来恢复之前的状态

因此每条消息必须遵循以下格式：
```
event: customEvent\n    ← 可选：事件类型
id: 123\n               ← 可选：消息ID（用于断点续传）
retry: 10000\n          ← 可选：重连间隔（毫秒）
data: 消息内容第一行\n
data: 消息内容第二行\n  ← 多行数据
\n                      ← 空行表示消息结束
```
