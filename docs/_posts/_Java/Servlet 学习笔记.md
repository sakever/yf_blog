---
title: Servlet 学习笔记
date: 2021-09-05
categories:
  - Java
tags:
  - Servlet
---
很多成熟的框架底层封装了 servlet，我们只需要简单了解一些即可
# Servlet 接口
用户跳转网页时，一些需要后端处理的请求应该送到servlet处，让服务器进行操作后将数据返回到视图，然后发送给用户

经过Servlet转发的请求直接地址是Servlet，而不是页面

实现Servlet接口就是一个Servlet了，让Servlet起作用需要在web.xml中配置

Servlet接口有6种方法，Servlet的生命周期是：
构造方法 -》 初始化方法 -》 service方法 -》 销毁方法
```java
public class helloServlet implements Servlet {

    public helloServlet() {
        super();
    }

    @Override
    public void init(ServletConfig servletConfig) throws ServletException {

    }

    @Override
    public ServletConfig getServletConfig() {
        return null;
    }

    //service用来执行请求与响应
    @Override
    public void service(ServletRequest servletRequest, ServletResponse servletResponse) throws ServletException, IOException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) servletRequest;
        httpServletRequest.getMethod();
    }

    @Override
    public String getServletInfo() {
        return null;
    }

    @Override
    public void destroy() {

    }
}
```

## service方法
这个方法用来接受请求并进行响应

# ServiceContext
在init方法中，有ServletConfig类，这个类是配置类，Servlet根据这个类中的信息进行初始化
```java
public interface ServletConfig {
    String getServletName();

    ServletContext getServletContext();

    String getInitParameter(String var1);

    Enumeration<String> getInitParameterNames();
}
```
使用ServletConfig可以得到ServletContext对象，这个对象像Map一样储存数据，一个工程只有一个上下文对象

# HttpServlet
继承这个类直接重写doPost与doGet对象可以处理两种请求，因为这个类将这两种请求分开了
```java
//这个抽象类实现了Servlert接口，做了很多空实现，并补充了一些功能
public abstract class GenericServlet implements Servlet, ServletConfig, Serializable

//HttpServlet继承自GenericServlet，实现了doGet与doPost
public abstract class HttpServlet extends GenericServlet
```

# HttpServletRequest 请求
HttpServletRequest 继承了 ServletRequest，Tomcat 解析 http 请求后，将所有的数据都存放在这个类中，通过这个类，可以找到所有的请求相关信息

想拿到请求报文的信息，比如 cookie 等东西，只需要在方法的入参中加入该类即可，之后调用 request 的各种方法获取相关信息
```java
	@PostMapping("/download")
	public Result<Void> download(@RequestBody Param param,
									HttpServletRequest request) {
									......
	}
```

该类使用的场景还是非常多的，以下是常见方法
```java
        //获取请求方式，是 post 还是 get，是 delete 还是 put
        req.getMethod();
        //获取请求的项目名称以及具体需求（如果是 URL，则会加入项目地址）
        req.getRequestURI();
        //设置编码方式，客户端与服务端的编码方式可能不一样，会出现乱码问题，因此需要这个方法
        req.setCharacterEncoding("UTF-8");
        
        //得到请求体中的具体信息，该方法只能获得对应值的第一个数据
        req.getParameter("username");
        req.getParameter("password");
        //如果某个数据是个数组，使用这个方法获取所有的数据信息
        req.getParameterValues("hobby");
        //向这个请求中加东西，在转发的时候有用
        req.setAttribute("what", "whatever");
        req.getAttribute("what");
```
# HttpServletResponse 响应
通过这个servlet，返回给用户的响应报文的信息都在这个类中，可以用字节流（二进制，一般用来传输文件）或者字符流（字符串，常用）返回数据给用户

以下是常见方法
```java
        //使用这两个函数来获得流对象
        //这两个方法不可以一起使用
        Writer writer = resp.getWriter();
        OutputStream outputStream = resp.getOutputStream();
        //因为客户端与服务器的编码方式不一样所以才导致乱码问题
        //不管用过滤器、设置编码等方式解决，都需要将客户端的编码与服务器显示编码设置相同才不会乱码

        //得到和设置cookie
        Cookie cookie = new Cookie("what", "value");
        resp.addCookie(cookie);
        Cookie[] c = req.getCookies();
```

由于 MVC 底层就是包装 Servlet 的，因此我们可以直接在接口中获取 HttpServletResponse 与 HttpServletRequest 对象
```java
    @RequestMapping("/download.json")
    public void downloadConfig(HttpServletRequest request, HttpServletResponse response) {
    // do something
    }
```
# Cookie
这个类储存键值对，可以将cookie放入响应报文中发给用户，用户端的浏览器会存储cookie，下次访问时将cookie放在请求头中直接发送给服务器

cookie的path属性会过滤，哪些可以发送给服务器，哪些不发送

cookie在响应报文的Cookie那一行
```java
        //得到和设置cookie
        Cookie cookie = new Cookie("what", "value");
        resp.addCookie(cookie);
        Cookie[] c = req.getCookies();
        cookie.getName();
        cookie.getValue();
        //设置存活时间，负数代表浏览器关闭cookie死亡
        cookie.setMaxAge(7*24*60*60);
```

# Session
每一个客户端都有一个Session会话，这个session保存在服务器，与cookie配合使用

cookie中某一项的值保存了session的ID，每个session的ID唯一确定，因此才知道用户的信息

每个session，默认保存30分钟，可以在web.xml中修改
```java
        //第一次调用是新建一个session，后面每次调用都是得到创建过的session对象
        Session session = req.getSession();
        session.getID();
        //向session中存放数据，比如用户名等信息
        session.setAttribute("key", value);
```

# Filter
过滤器接口，用来拦截请求，过滤响应，实现这个接口并重写方法就可以实现拦截器，在web.xml中配置拦截路径就能生效，如果有多个过滤器，谁先配置谁先生效

FilterChain是过滤器链，类中的doFilter方法表示执行下一个Filter（或者目标资源），本质上是调用了下一个方法

```java
public class MyFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {

    }

    //在这个方法下配置怎么拦截
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {

        filterChain.doFilter(servletRequest, servletResponse);
    }

    @Override
    public void destroy() {

    }
}
```