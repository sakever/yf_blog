---
title: Java Http 访问框架
date: 2023-04-17
sidebar: true
categories:
  - Java
tags:
  - Http
---
## 介绍
在项目中，当我们需要远程调用一个 HTTP 接口时，我们经常会用到 RestTemplate 这个类。这个类是 Spring 框架提供的一个工具类，异常好用。所备选的 http 访问组件有 OkHttp（性能优秀、易于使用）、HttpClient（内置于 JDK，无需额外依赖），WebClient（支持异步和非阻塞操作） 其他的访问框架不考虑

本篇文章对比这些框架的优缺点

## RestTemplate
该类提供三组接口

- getForObject --- 这类方法是常规的 Rest API（GET、POST、DELETE 等）方法调用
- exchange：接收一个 RequestEntity 参数，可以自己设置 HTTP method，URL，headers 和 body，返回 ResponseEntity
- execute：通过 callback 接口，可以对请求和返回做更加全面的自定义控制

该工具关注请求数据的构建，以及返回数据的处理
### 简单接口调用（getForObject）
我们只需要一行代码即可实现 get 与 post 的请求
```java
        // get 请求的构建
        String result = restTemplate.getForObject(
                "https://example.com/hotels/{hotel}/rooms/{hotel}", String.class, "hotel1", "hotel1");

        String url = "http://127.0.0.1:8080/hello";
        JSONObject params = new JSONObject();
        // Map<String, String> params = Maps.newHashMap();
        // restTemplate 会根据 params 的具体类型，调用合适的 HttpMessageConvert 将请求参数写到请求体 body 中，并在请求头中添加合适的 content-type；
        // 也会根据 responseType 的类型（本列子中是 JSONObject），设置 head 中的 accept 字段，当响应返回的时候再调用合适的 HttpMessageConvert 进行响应转换
        ResponseEntity<JSONObject> responseEntity = restTemplate.postForEntity(url, params, JSONObject.class);
```
获取返回的数据
```java
        // 可以通过 responseEntity 提供的各种方法来获取返回的各种信息
        Integer statusCodeValue = responseEntity.getStatusCodeValue();
        HttpHeaders headers = responseEntity.getHeaders();
        JSONObject body = responseEntity.getBody();
```
### 添加 Header 和 Cookie（exchange）
有时候，我们需要在请求中的 Head 中添加值或者将某些值通过 cookie 传给服务端

```java
        // 建立目标地址
        UriComponents uriComponents = UriComponentsBuilder.fromHttpUrl("127.0.0.1:8080").
                path("/test").build(true);
        URI uri = uriComponents.toUri();
        // 建立请求
        RequestEntity<JSONObject> requestEntity = RequestEntity.post(uri).
                        // 添加 cookie
                        header(HttpHeaders.COOKIE, "key1=value1").
                        // 添加 header
                        header("MyRequestHeader", "MyValue").
                        accept(MediaType.APPLICATION_JSON).
                        contentType(MediaType.APPLICATION_JSON).
                        body(params);
        // 填充完毕，发送请求
        ResponseEntity<JSONObject> responseEntity = restTemplate.exchange(requestEntity, JSONObject.class);
```

### post 请求
```java
    public static String post(String url, Map<String, String> headers, Map<String, String> body) {
        HttpHeaders requestHeaders = new HttpHeaders();
        requestHeaders.setContentType(MediaType.APPLICATION_JSON);
        headers.forEach(requestHeaders::set);

        // 将请求体转换为 JSON 字符串
        ObjectMapper objectMapper = new ObjectMapper();
        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert body to JSON", e);
        }

        // 设置请求体
        HttpEntity<String> httpEntity = new HttpEntity<>(jsonBody, requestHeaders);

        ResponseEntity<String> response = new RestTemplate()
                .exchange(url, HttpMethod.POST, httpEntity, String.class);
        return response.getBody();
    }
```