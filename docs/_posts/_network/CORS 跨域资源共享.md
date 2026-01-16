---
title: CORS 跨域资源共享
date: 2023-08-22
sidebar: ture
categories:
  - 计算机网络
tags:
  - CORS
---
浏览器一般使用 CORS（跨域资源共享）来处理跨域问题。同源导致了不同源数据不能互相访问，而在开发中我们很多时候需要用第一个页面的脚本访问第二个页面里的数据，所以制定了一些允许跨域的策略
# 跨域
## 同源策略
在了解真正的网络攻击之前，我们先了解一下前置知识，互联网使用同源策略来防御跨域攻击

同源策略 SOP（Same origin policy）是一种约定，由 Netscape 公司 1995 年引入浏览器，它是浏览器最核心也最基本的安全功能，现在所有支持 JavaScript 的浏览器都会使用这个策略。如果缺少了同源策略，浏览器很容易受到 XSS、 CSFR 等攻击

在这个策略下，web 浏览器允许第一个页面的脚本访问第二个页面里的数据，但是也只有在两个页面有相同的源时。源是由 **URI，主机名，端口号**组合而成的。这个策略可以阻止一个页面上的恶意脚本通过页面的 DOM 对象获得访问另一个页面上敏感信息的权限

同源策略是为了安全，确保一个应用中的资源只能被本应用的资源访问

我们只要不满足任意一个条件，也就是说当 url、主机名、端口号只要有一个不一样的时候，在某个页面的脚本访问第二个页面的脚本时，就会出现跨域问题，网站访问不上或者接口访问不了

跨域一般来说是一种浏览器行为，浏览器收到某个请求的响应数据之后，会判断响应数据的源和当前页面的源是否是属于同源。针对不同源，如果后端没有对响应字段进行处理，则响应回的数据会被浏览器直接过滤掉
## 为什么有跨域限制
为什么要这么做呢？一般是为了处理安全问题

- 为了防止恶意网页可以获取其他网站的本地数据。
- 为了防止恶意网站 iframe 其他网站的时候，获取数据。
- 为了防止恶意网站在自已网站有访问其他网站的权利，以免通过 cookie 免登，拿到数据
## 发生跨域时，允许进行的操作
值得一提的是，客户端和服务端处于不同的域名下，这种情况，客户端是可以正常地向服务端发出请求的。但是，由于浏览器的同源限制策略，服务端响应的数据会被浏览器过滤掉，并抛出常见的跨域报错

- 通常允许跨域写操作（link、redirect、表单提交）
- 通常允许跨域资源嵌入（script、img、video...）
- 通常禁止跨域读操作(ajax)
- 可以正常发送请求，可以携带 Cookie(withCredentials)，但是浏览器会限制来自于不同域的资源的接收
## 跨域限制的资源
- 数据存储限制：Cookie, LocalStorage, IndexDB 无法读取
- 脚本 API 限制：DOM 无法操作
- 网络请求限制：XHR 请求无法接收响应
## 处理跨域常用的方法
- CORS（跨域资源共享）：使用专用的 HTTP 头，服务器（api.baidu.com）告诉浏览器，特定 URL（baidu.com）的 ajax 请求可以直接使用，不会激活同源策略
- JSONP：因为 js 调用（实际上是所有拥有 src 属性的 <\script>、<\img>、<\iframe>）是不会经过同源策略，例如 baidu.com 引用了 CDN 的 jquery。所以通过调用 js 脚本的方式，从服务器上获取 JSON 数据绕过同源策略
- nginx 反向代理：当你访问 baidu.com/api/login 的时候，通过在 baidu.com 的 nginx 服务器会识别你是 api 下的资源，会自动代理到 api.baidu.com/login，浏览器本身是不知道我实际上是访问的 api.baidu.com 的数据，和前端资源同源，所以也就不会触发浏览器的同源策略
# CORS 请求
CORS（Cross-origin resource sharing，跨域资源共享）是一个 W3C 标准，定义了在必须访问跨域资源时，浏览器与服务器应该如何沟通

其核心思想是使用自定义的 HTTP 头部让浏览器与服务器进行沟通，来决定请求或响应是应该成功，还是失败。**决定请求成功或者失败是由浏览器来判断的**

整个 CORS 通信过程，都是浏览器自动完成，不需要用户参与。对于开发者来说，CORS 通信与同源的 AJAX 通信没有差别，代码一样。浏览器一旦发现 AJAX 请求跨源，就会自动添加一些附加的头信息，有时还会多出一次附加的请求，但用户不会有感觉

对于非简单请求与简单请求，CORS 的处理方式是不一样的。只要请求方法是 get、head、post 这三种方法之一，并且 HTTP 的头信息不超出规定的几种字段：
Accept、Accept-Language、Content-Language、Last-Event-ID、Content-Type 就可以认为是简单请求
## 简单请求
对于简单请求的处理，在请求头中需要附加一个额外的 Origin 字段，其中包含请求页面的源信息（协议、域名和端口），以便服务器根据这个头部信息来决定是否给予响应。例如：Origin: http://www.laixiangran.cn

如果服务器认为这个请求可以接受，就在 Access-Control-Allow-Origin (这个字段是必须的) 字段中回发相同的源信息，例如：Access-Control-Allow-Origin：http://www.laixiangran.cn

之后，浏览器需要写一些策略来支持跨域
## 复杂请求
对于复杂请求，浏览器在发送真正的请求之前，会先发送一个预检请求给服务器，该请求的大致作用是用于请求服务器对于某些接口等资源的支持情况的，包括各种请求方法、头部的支持情况，仅作查询使用。这种请求使用 OPTIONS 方法，当 OPTIONS 请求成功返回后，真正的 AJAX 请求才会再次发起

该请求的请求头部包含下列内容：

- Origin：与简单的请求相同
- Access-Control-Request-Method: 请求自身使用的方法
- Access-Control-Request-Headers: （可选）自定义的头部信息，多个头部以逗号分隔

发送这个请求后，服务器可以决定是否允许这种类型的请求。服务器通过在响应头添加如下信息与浏览器进行沟通：

- Access-Control-Allow-Origin：与简单的请求相同
- Access-Control-Allow-Methods: 允许的方法，多个方法以逗号分隔
- Access-Control-Allow-Headers: 允许的头部，多个方法以逗号分隔
- Access-Control-Max-Age: 应该将这个 Preflight 请求缓存多长时间（以秒表示）

除了以上的标签，返回的其他标签也可以作为判断信息来使用，以下是一个例子：
```
->>> curl -X OPTIONS https://xxxx.com/micro/share/getShareRecord -i

HTTP/1.1 200 OK
Server: nginx/1.13.3
Date: Mon, 30 Jul 2018 12:50:08 GMT
Content-Length: 0
Connection: keep-alive
Allow: GET, HEAD, POST, PUT, DELETE, TRACE, OPTIONS, PATCH
X-Frame-Options: SAMEORIGIN
Access-Control-Allow-Origin: 0
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: X-Requested-With
```

# 后端支持跨域代码
也许之后会补充前端的

后端可以使用以下几种方式支持跨域：
## 支持 CORS
重写 WebMvcConfigurer 支持**全局跨域**
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                //是否发送Cookie
                .allowCredentials(true)
                //放行哪些原始域
                .allowedOrigins("*")
                .allowedMethods(new String[]{"GET", "POST", "PUT", "DELETE"})
                .allowedHeaders("*")
                .exposedHeaders("*");
    }
}
```
使用注解 **@CrossOrigin**，默认情况下，它使方法具备接受所有域，所有请求消息头的请求。这个注解的作用，应当就是接受请求的 origin，并且在响应中添加 Access-Control-Allow-Origin
```java
	@RequestMapping("/hello")
    @CrossOrigin(origins = "*")
     //@CrossOrigin(value = "http://localhost:8081") //指定具体ip允许跨域
    public String hello() {
        return "hello world";
    }
```
手动设置响应头，既然可以使用注解设置，我们也可以手动设置
```java
    @RequestMapping("/index")
    public String index(HttpServletResponse response) {
        response.addHeader("Access-Allow-Control-Origin","*");
        return "index";
    }
```

## 支持 JSONP
jsonp 是 JSON with Padding，早期处理跨域的方式之一，主要利用了 HTML 中 &lt;script> 标签的特殊性来实现跨域请求，**浏览器允许 &lt;script> 标签加载来自不同域的 JavaScript 文件**

只要返回是 json，前端就可以通过脚本获取数据，因此，我们写个拦截器，将所有的返回转换成 json 就行了
```java
public class Vm2JsonHandlerInterceptor extends HandlerInterceptorAdapter {
    private static final Logger log = LoggerFactory.getLogger(Vm2JsonHandlerInterceptor.class);
    private static final String PARAMETER_JSON = "json";
    private static final String OPEN_JSON = "on";

    public Vm2JsonHandlerInterceptor() {
    }

    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        if ("on".equals(request.getParameter("json"))) {
            try {
                response.setContentType("application/json;charset=UTF-8");
                ServletOutputStream os = response.getOutputStream();
                Vm2JsonHandlerInterceptor.Data data = new Vm2JsonHandlerInterceptor.Data();
                data.setViewName(modelAndView.getViewName());
                data.setData(modelAndView.getModelMap());
                String serializeData = JsonMapper.mapString(data);
                if (serializeData != null) {
                    os.write(serializeData.getBytes());
                }

                os.flush();
                os.close();
                return;
            } catch (Exception var8) {
                log.warn("输出json异常", var8);
            }
        }

        super.postHandle(request, response, handler, modelAndView);
    }

    static class Data {
        private String viewName;
        private ModelMap data;

        Data() {
        }

        public String getViewName() {
            return this.viewName;
        }

        public void setViewName(String viewName) {
            this.viewName = viewName;
        }

        public ModelMap getData() {
            return this.data;
        }

        public void setData(ModelMap data) {
            this.data = data;
        }
    }
}
```
## 支持 ng
后端配置一个 ng，前端在访问的时候访问原域名下的接口，但是这个接口走了 ng 转发到了其他域名。此时后端可以正常返回数据，前端也可以正常使用数据，而我们做了个类似于欺骗浏览器的行为，让它误以为自己请求了原域名下的接口