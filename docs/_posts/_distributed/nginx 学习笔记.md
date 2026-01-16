--- 
title: nginx 学习笔记
date: 2022-04-03
sidebar: true
categories:
  - 分布式
tags:
  - nginx
--- 
# 基本概念
以下内容都是我在大学不好好听课欠下的债

简单来说，nginx 最多的用法就是接受外部的请求，并且将请求分发到各个服务器上。这中间涉及到域名与 ip 地址的转换相关概念
## 域名与 IP
IP 地址与域名是一对多的关系。一个 ip 地址可以对应多个域名，但是一个域名只有一个 IP 地址。IP 地址是数字组成的，不方便记忆，所以有了域名，通过域名地址就能找到 ip 地址

在 Internet 上域名与 IP 地址之间是多对一的，域名虽然便于人们记忆，但机器之间只能互相认识 IP 地址，它们之间的转换工作称为域名解析，域名解析需要由专门的域名解析服务器来完成，DNS 就是进行域名解析的服务器。域名的最终指向是 IP

除了 DNS 服务器可以将域名转换为 IP，本地的 host 文件也可以静态的转换，比如你可以配置 1.1.1.1 www.baidu.com。以后访问百度的时候就会自动跳到1.1.1.1。而 nginx 作为服务器，也是可以配置域名的
## 内网与外网
即所说的局域网，比如学校的局域网，局域网内每台计算机的 IP 地址在本局域网内具有互异性，是不可重复的。但两个局域网内的内网IP可以有相同的

即互联网，局域网通过一台服务器或是一个路由器对外连接的网络，这个 IP 地址是惟一的。也就是说内网里所有的计算机都是连接到这一个外网 IP 上，通过这一个外网 IP 对外进行交换数据的。也就是说，一个局域网里所有电脑的内网 IP 是互不相同的,但共用一个外网 IP

## 子网掩码
即用来判断两台计算机的 IP 地址是否属于同一个网络段的判断。如果两台计算机处于同一个网络字段上，则这两台计算机就可以直接进行通信交流

屏蔽 IP 地址的一部分用来表示区别是网络标识和主机标识，以此来判断出 IP 地址是在局域网还是，Internet 网上，将整个巨大的 IP 网络划分成若干个小的子网

将计算机的 IP 地址和子网掩码都转化为二进制，进行 AND 运算，得出结果相同的话，则说明两台计算机处在同一个网络段，可以直接通信

子网掩码决定了你这个网络里能容纳多少台设备。掩码越短（1越少），网络越大，比如 255.0.0.0，这就像一个巨大的国家，里面能容纳1600多万台设备。掩码越长（1越多），网络越小，比如 255.255.255.252，这就像一个双人宿舍，里面只能容纳 2 台设备（通常用于路由器互联）

这就导致 IP 可能是一样的，但是由于掩码不一样，造成 IP 其实指向不同的机器
## 网关
通常指默认网关，比如通过子网掩码判断出两台计算机处于不同的网络字段，两台计算机就不能直接进行通信，为了能进行通信，这个时候网关就出现了，可以将不同网络频段的两台计算机联系在一起，从而进行通信

好了，这是网络层的知识，和本文的内容完全不相干，只是想稍微复习一下大学时网关的定义，接下来要讲解的网关作用在应用层，不是默认网关

- 默认网关只负责把数据包从一个局域网搬运到互联网。它不关心数据包里装的是 HTTP 请求还是视频流，它只负责把数据送到目的地
- ng 作为的网关是 API 网关，作用于应用层（Layer 7）。本质是 一台运行着 Nginx 软件的服务器，负责业务流量的分发、管理、限流、降级、负载均衡等操作
# 重要概念
Nginx 是一个高性能的 HTTP 和反向代理 web 服务器，采用 C 语言编写，其特点是占有内存少，并发能力强
## 正向代理
客户端本来可以直接通过 HTTP 协议访问某网站应用服务器，但是也可以在浏览器配置一个代理服务器，客户端请求代理服务器，并指定目标(原始服务器)，代理服务器请求应用服务器，然后将结果返回给客户端。这种情况叫正向代理

为什么要这么做呢？比如我们现在想要访问谷歌，但是由于某些原因，无法直接访问到谷歌，我们可以通过连接一台代理服务器，代理服务将我们的请求提交到谷歌，然后再将谷歌的响应反馈给我们

上面的例子说的就是 VPN， 是在客户端设置的(并不是在远端的服务器设置)。浏览器先访问 vpn 地址，vpn 地址转发请求，并最后将请求结果原路返回来

注意，因为此时做的是**代理**（四层以上的操作），此时真实服务器、代理服务器、客户端三者之间是维持着两条独立的 TCP 通道来维持通信的，因此请求的来回都需要经过代理
## 反向代理
外部机器只需要将请求发送给反向代理服务器，代理服务器根据不同的请求（不同的域名）找到不同的机器，得到数据后返回给用户

反向代理是作用在服务器端的，是一个虚拟 ip(VIP)。对于用户的一个请求，会转发到多个后端处理器中的一台来处理该具体请求

正向代理更像是一对一的访问，反向代理更偏向一对多，反向代理的典型使用就是负载均衡，因为可以将请求**按条件**发送给不同的服务器，可以起到分流的作用

正向代理与反向代理的区别就是**针对哪一方是可知的**。这个可知的可以理解成哪一方知道请求是发送给了谁。比如正向代理是在客户端设置的，客户端就知道请求发送给了代理；反向代理是在服务端设置的，客户端不知道请求发送给了谁，只知道一个域名，而服务器明确的知道请求返回给了代理
## 负载均衡
当网站访问量非常大，一台服务器已经不够用时，可以将相同的应用部署在多台服务器上，将大量用户的请求分配给多台机器处理。此时需要一种机制来让所有的请求平均分配给所有服务器，不能让某个服务器承受过多请求

nginx 支持负载均衡，它的负载均衡一般使用轮询算法或者加权轮询来实现
## 动静分离
动静分离指将动态请求和静态请求分离开来以获得更良好的访问效率，将静态资源和动态资源放置在不同的服务器上是比较主流的实现方式（也可以让动态资源和静态资源放在一起发布，通过 nginx 分离开来）
## 高可用
为了实现高可用，需要配置集群，不同与其他集群会实现主从复制、读写分离、集群扩容等额外功能，nginx 集群只用来做主备模式

nginx 也不像 ZK、Redis 提供了监视其他机器存活的功能，为了让 nginx 实现宕机时自动切换功能，需要 keepalived 这一软件的支持

注意这个软件叫 keepalived，不是 keepalive（心跳校验机制）

keepalived 还提供了另外一个非常重要的功能，网关，外部访问 nginx 集群时只会访问一个 IP，内部的 IP 切换由 keepalived 自动实现
## 限流
ng 可以做限流功能：

1，ng 可以使用漏桶算法，对全局的流量做控制
2，ng 可以配置每个转发的 ip 的最大连接数和请求的总数

使用了 ng 后我们还可以使用业务网关，ng 类似一个全局网关，业务网关中通常可以用令牌桶算法做一些限流熔断降级等高可用策略
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/e7e2813bfabe422787663df4144147a1.png)
# 安装
可以安装在 Windows 系统中，比较简单方便，但是推荐安装在 linux 系统下，功能更强大（windows 无法使用 IO 多路复用功能）

菜鸟教程安装：
https://www.runoob.com/linux/nginx-install-setup.html

安装 Nginx 源

执行以下命令：
```
rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
```
安装该 rpm 后，我们就能在 /etc/yum.repos.d/ 目录中看到一个名为 nginx.repo 的文件

安装完 Nginx 源后，就可以正式安装 Nginx 了
```
yum install -y nginx
```
nginx 的配置路径一般在 etc/yum.repos.d 下，一般根据配置的不同 nginx 可以实现不同的功能。Linux 的 etc 目录是配置文件目录，例如“/etc/passwd”是系统用户配置文件，“/etc/group”是用户组配置文件。repo 是 repository 简写，仓库的意思，可以理解为存放资源的地方

找到 nginx 只需要输入 whereis nginx 即可

修改完 nginx 配置后需要 reload 一下，调用在 sbin 目录下的 nginx 来执行 ng 命令：
```
sudo /home/q/nginx/sbin/nginx -c /home/q/nginx/conf/nginx.conf -s reload
```
如果发现 nginx 实例不存，启动 nginx：
```
sudo /home/q/nginx/sbin/nginx -c /home/q/nginx/conf/nginx.conf
```
# nginx 配置以及使用
下载好 nginx 之后，在 /nginx/conf 的 /nginx.conf 中配置 nginx，主要分以下三个部分

- 全局块：在文件开头的配置可以对 nginx 整体造成影响
- event 块：在 event 大括号中的内容，这方面配置主要影响网络连接方面
- http 块：修改最频繁的地方

比如在下载 ng 之后，会默认出现这些内容（include vhost/*.conf；语句是后来加进去的，其他都没变）
```bash
#user  nobody;
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include vhost/*.conf;
    include       mime.types;
    default_type  application/octet-stream;

    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    #gzip  on;

    server {
        listen       80;
        server_name  localhost;

        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        location / {
            root   html;
            index  index.html index.htm;
        }

        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

        # proxy the PHP scripts to Apache listening on 127.0.0.1:80
        #
        #location ~ \.php$ {
        #    proxy_pass   http://127.0.0.1;
        #}

        # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        #location ~ \.php$ {
        #    root           html;
        #    fastcgi_pass   127.0.0.1:9000;
        #    fastcgi_index  index.php;
        #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
        #    include        fastcgi_params;
        #}

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        #
        #location ~ /\.ht {
        #    deny  all;
        #}
    }


    # another virtual host using mix of IP-, name-, and port-based configuration
    #
    #server {
    #    listen       8000;
    #    listen       somename:8080;
    #    server_name  somename  alias  another.alias;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}


    # HTTPS server
    #
    #server {
    #    listen       443 ssl;
    #    server_name  localhost;

    #    ssl_certificate      cert.pem;
    #    ssl_certificate_key  cert.key;

    #    ssl_session_cache    shared:SSL:1m;
    #    ssl_session_timeout  5m;

    #    ssl_ciphers  HIGH:!aNULL:!MD5;
    #    ssl_prefer_server_ciphers  on;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}

}
```

现在来配置一个最简单的请求转发，也就是反向代理。在 http 块中的 server 块中配置，可以在 server 块中使用 include 关键字，将其他配置文件引入该配置文件location 块中，定义了相应的转发规则，命中了什么语句，转发到哪，都可以在这里定义

比如在 vhost 文件夹下新建一个文件，test.conf，然后简单的配置一下
```bash
# upstream 里是需要转发的服务器地址
upstream test {
        server  111.11.11.111:1111;
}
# server 里是各种配置
server {
        listen 80;
        server_name  t1.test.com;
        charset utf8;
        gzip                    off;
        gzip_http_version       1.1;
        gzip_buffers            256 64k;
        gzip_comp_level         5;
        gzip_min_length         1000;
        gzip_types              application/x-javascript text/javascript text/plain text/xml text/css image/jpeg image/jpg image/png image/gif application/x-shockwave-flash image/x-icon;

         proxy_set_header  Host  $host;
         proxy_set_header  X-Real-IP  $remote_addr;
         proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header  'X-Real-Scheme'   $scheme;
        location /
        {
            proxy_pass      http://test/;
        }
}
```

# ClientAbortException: java.io.IOException: Broken pipe 问题
 这个问题是在 java 程序中报出的，但是核心是和 ng 有关系：

ng 服务器上出现很多499的错误，出现499错误的原因是客户端先关闭了连接

从服务器端视角看，问题描述如下：java 的工作线程还在执行代码，有可能是因为 IO 或者 dubbo 访问其他工程，导致工作线程很久才返回数据。这个时候因为 ng 和用户已经断开了，java 服务器回写返回值的时候就会抛出异常：Broken pipe（双方链接已经有一端断开）

如何关闭报499这个错误码呢？可以通过配置：proxy_ignore_client_abort来处理

proxy_ignore_client_abort：是否开启 proxy 忽略客户端中断。即如果此项设置为 on 开启，则服务器会忽略客户端中断，一直等着代理服务执行返回。并且如果执行没有发生错误，记录的日志是200日志。如果超时则会记录504

经过测试只有 ng 会出现这个问题，如果使用 postman 直接访问 java 程序，用户先断开链接后，服务器再返回数据，是不会出现这个问题的

参考链接：

https://stackoverflow.com/questions/43825908/org-apache-catalina-connector-clientabortexception-java-io-ioexception-apr-err
# SSL
想要网站可以使用 https 访问，SSL 证书必不可少，购买证书之后，就是申请绑定域名，申请成功之后，之后配置需要用到 pem 和 key 文件，相应的文件下载在"已签发"这块，点击下载，选择 Nginx 版本下载之后就可以了

- .crt 文件：是证书文件，crt 是 pem 文件的扩展名（有时候没有 crt 只有 pem 的，所以不要惊讶）
- .key 文件：证书的私钥文件（申请证书时如果没有选择自动创建 CSR，则没有该文件）
- .pem 扩展名的证书文件采用 Base64-encoded 的 PEM 格式文本文件，可根据需要修改扩展名

在 nginx 目录下直接建立 ssl  sslkey 这两个文件夹，在 ssl 文件夹下创建 server.crt  server.csr  server.key 这三个文件，将上面的三个复制一下即可

如果没有配置 SSL 证书的话，可能会出现以下错误
```
failed (SSL: error:02001002:system library:fopen:No such file or directory
```
# ng 的各种命令
- /conf 下是各种配置
- /sbin 里的 nginx，用于执行各种命令

我们就使用这个 nginx 来执行各种命令，比如重新加载配置文件
```linux
sudo /home/q/nginx/sbin/nginx -c /home/q/nginx/conf/nginx.conf
```
如果在执行该命令时出现报错 nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)，一般原因是 nginx 端口被占用了，我们可以执行如下命令：
```linux
ps -ef | grep nginx
kill pad

-- 或者执行以下命令
切换到nginx sbin目录
-- 停止
sudo ./nginx -s stop 
-- 启动
./nginx
```

重启 ng
```linux
sudo /home/q/nginx/sbin/nginx -s reload
```
检查配置是否正确
```linux
sudo /home/q/nginx/sbin/nginx -t
```
# 原理
启动一个 nginx 会启动多个进程（在任务管理器中就可以看见），有一个 master 进程与多个 worker 进程，实现了 IO 多路复用，master 收到请求后通过信号通知所有的 worker 进程，worker 进程去**抢夺**请求连接，如果抢到了就去处理它

这么做的好处有两点：一是实现了 nginx 的热部署（闲置的进程更新配置而其他进程继续工作），因为线上的处理器在部署之后，一般不会停止并且维护。ng 的这种方式，在 master 进程修改配置之后，重新启动 master 即可，真正做事情的 worker 不会受到影响

二是所有 worker 都是独立的，不需要加锁，并且其中一个遇到问题其他进程会继续执行，不会互相干扰

worker 的连接数是2（访问静态资源服务器）或者4（访问动态资源时，需要访问额外的服务器）