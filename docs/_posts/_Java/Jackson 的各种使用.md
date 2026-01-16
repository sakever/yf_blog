---
title: Jackson 的各种使用
date: 2022-12-27
sidebar: ture
categories:
  - Java
tags:
  - Jackson
---
总结一下 java 中 json 的相互转换，以及 jackson 的部分底层原理
# JSON 转换为 Java 对象
有以下特点：

- 大多数情况下我们只要使用ObjectMapper 这个类就能完成大部分 JSON 相关的工作
- JSON 转换时，JSON 的来源在对应的 POJO 中一定要有，否则塞入的时候会报异常，但是 POJO 中的其他属性可以在 JSON 中没有
- 如果 POJO 的属性是另外一个对象、链表、数组，jackson 也会自动嵌套的使用反射将对应的属性塞进去，非常的方便
## JSON 转换为对象
从JSON字符串读取Java对象非常容易。 JSON字符串作为第一个参数传递给 ObjectMapper 的 readValue() 方法
```java
ObjectMapper objectMapper = new ObjectMapper();

String carJson =
    "{ \"brand\" : \"Mercedes\", \"doors\" : 5 }";

Car car = objectMapper.readValue(carJson, Car.class);
```
这里额外说一下，JSON 的来源 jackson 也做了抽象化，我们可以直接使用字符串传入，也可以使用其他来源，只要可以获取01字符串就行了，比如可以从流或文件中解析JSON
```java
ObjectMapper objectMapper = new ObjectMapper();

String carJson =
        "{ \"brand\" : \"Mercedes\", \"doors\" : 4 }";
Reader reader = new StringReader(carJson);

Car car = objectMapper.readValue(reader, Car.class);
```
## JSON 转换为对象数组
```java
String jsonArray = "[{\"brand\":\"ford\"}, {\"brand\":\"Fiat\"}]";

ObjectMapper objectMapper = new ObjectMapper();

Car[] cars2 = objectMapper.readValue(jsonArray, Car[].class);
```
需要将Car数组类作为第二个参数传递给readValue()方法

读取对象数组还可以与字符串以外的其他 JSON 源一起使用。 例如，文件，URL，InputStream，Reader等
## JSON 转换为 list
我们也可以将 JSON 字符串转换为 list，这需要借助 TypeReference，注意一个项目中可能有多个 TypeReference，需要使用 jackson 中的
```java
 String jsonArray = "[{\"brand\":\"ford\"}, {\"brand\":\"Fiat\"}]";

 ObjectMapper objectMapper = new ObjectMapper();

 List<Car> cars1 = objectMapper.readValue(jsonArray, new TypeReference<List<Car>>(){});
```
该过程是，JSON.parseObject(planJson, new TypeReference<Plan>(){}) 是把字符串 planjson 转化为相应的 JSONObject 对象，“键值对”形式

然后通过 new TypeReference<Plan>(){ } 匿名内部类来把 planjson 的 JSONObject 转化为 Plan 对象，通过 TypeReference 只把属于 plan 对象属性的参数和值组装成 plan 对象

泛型抽象类 TypeReference 用于通过子类获取完整的泛型类型信息，其原理是通过 getClass().getGenericSuperclass() 获取父类中的参数化类型，如果父类是参数化类型，则返回的 Type 对象可准确反映源代码中使用的实际 type 参数
```java
protected TypeReference()
    {
        Type superClass = getClass().getGenericSuperclass();
        _type = ((ParameterizedType) superClass).getActualTypeArguments()[0];
    }
```

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/c40788e896ff18f573e58327086cc05d.png)

## JSON 转换为 map
如果事先不知道将要解析的确切JSON结构，这种方法是很有用的。 通常，会将JSON对象读入Java Map。 JSON对象中的每个字段都将成为Java Map中的键，值对
```java
String jsonObject = "{\"brand\":\"ford\", \"doors\":5}";

ObjectMapper objectMapper = new ObjectMapper();
Map<String, Object> jsonMap = objectMapper.readValue(jsonObject,
    new TypeReference<Map<String,Object>>(){});
```
# Java 对象转换为 JSON
Jackson ObjectMapper也可以用于从对象生成JSON。 可以使用以下方法之一进行操作：

- writeValue()
- writeValueAsString()
- writeValueAsBytes()

我们可以将对象、数组、list、map 转换为 JSON
```java
ObjectMapper objectMapper = new ObjectMapper();

  Car car = new Car();
  car.setBrand("BMW");
  car.setDoors(4);

  objectMapper.writeValue(
      new FileOutputStream("data/output-2.json"), car);
```
数组与 list 转换为 JSON 的方法与上面一模一样
```java
        String a = "[{\"name\":\"00101\",\"value\":\"0101\"},{\"name\":\"00102\",\"value\":\"0102\"}]";
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            System.out.println(objectMapper.writeValueAsString(objectMapper.readValue(a, TopicClassify[].class)));
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
```

# JSON 树模型
Jackson 具有内置的树模型，可用于表示 JSON 对象。 如果不知道接收到的 JSON 的格式，或者由于某种原因而不能（或者只是不想）创建一个类来表示它，那么就要用到 Jackson 的树模型

Jackson 树模型由 JsonNode 类表示

这种方式在解析 JSON 字符串时，会构建一个内存中的树形结构，允许你以更灵活的方式访问和操作 JSON 数据。虽然 JsonNode 提供了更多的灵活性，**但在某些情况下可能会比直接反序列化为对象稍微慢一些，因为需要维护整个 JSON 树的结构**
## 生成 JsonNode
可以用 JSON 生成 JsonNode，只需将 JsonNode.class 作为第二个参数传递给 readValue() 方法即可
```java
  String carJson =
          "{ \"brand\" : \"Mercedes\", \"doors\" : 5 }";

  ObjectMapper objectMapper = new ObjectMapper();

  try {

      JsonNode jsonNode = objectMapper.readValue(carJson, JsonNode.class);

  } catch (IOException e) {
      e.printStackTrace();
  }
```
还可以使用 readTree 方法直接解析
```java
String carJson =
        "{ \"brand\" : \"Mercedes\", \"doors\" : 5 }";

ObjectMapper objectMapper = new ObjectMapper();

try {

    JsonNode jsonNode = objectMapper.readTree(carJson);

} catch (IOException e) {
    e.printStackTrace();
}
```
可以使用Jackson ObjectMapper将Java对象转换为JsonNode，而JsonNode是转换后的Java对象的JSON表示形式。 可以通过Jackson ObjectMapper valueToTree()方法将Java对象转换为JsonNode

```java
ObjectMapper objectMapper = new ObjectMapper();

Car car = new Car();
car.brand = "Cadillac";
car.doors = 4;

JsonNode carJsonNode = objectMapper.valueToTree(car);
```
## JsonNode 的使用
无论访问的是字段，数组还是嵌套对象，都可以使用 JsonNode 类的 get() 方法，该方法会返回一个 JsonNode。 通过将字符串作为参数提供给 get() 方法，可以访问 JsonNode 的字段。 如果 JsonNode 表示数组，则需要将索引传递给 get() 方法。 索引指定要获取的数组元素
```java
String carJson =
        "{ \"brand\" : \"Mercedes\", \"doors\" : 5," +
        "  \"owners\" : [\"John\", \"Jack\", \"Jill\"]," +
        "  \"nestedObject\" : { \"field\" : \"value\" } }";

ObjectMapper objectMapper = new ObjectMapper();

try {

    JsonNode jsonNode = objectMapper.readValue(carJson, JsonNode.class);

    JsonNode brandNode = jsonNode.get("brand");
    String brand = brandNode.asText();
    System.out.println("brand = " + brand);

    JsonNode doorsNode = jsonNode.get("doors");
    int doors = doorsNode.asInt();
    System.out.println("doors = " + doors);

    JsonNode array = jsonNode.get("owners");
    JsonNode jsonNode = array.get(0);
    String john = jsonNode.asText();
    System.out.println("john  = " + john);

    JsonNode child = jsonNode.get("nestedObject");
    JsonNode childField = child.get("field");
    String field = childField.asText();
    System.out.println("field = " + field);

} catch (IOException e) {
    e.printStackTrace();
}
```
## JsonNode 的转换
可以使用 Jackson ObjectMapper treeToValue() 方法将 JsonNode 转换为 Java 对象。 这类似于使用 Jackson Jackson 的 ObjectMapper 将 JSON 字符串（或其他来源）解析为 Java 对象
```java
ObjectMapper objectMapper = new ObjectMapper();

String carJson = "{ \"brand\" : \"Mercedes\", \"doors\" : 5 }";

JsonNode carJsonNode = objectMapper.readTree(carJson);

Car car = objectMapper.treeToValue(carJsonNode);
```
## ObjectNode
ObjectNode 是 JsonNode 的子类，因为 JsonNode 类是不可变的。 要创建 JsonNode 对象图，必须能够更改图中的 JsonNode 实例，例如设置属性值和子 JsonNode 实例等。由于是不可变的，因此无法直接使用JsonNode来实现
```java
ObjectMapper objectMapper = new ObjectMapper();

ObjectNode objectNode = objectMapper.createObjectNode();
```
我们可以对 ObjectNode 中的各个属性，也就是键值对进行增加删除操作
```java
ObjectMapper objectMapper = new ObjectMapper();
ObjectNode parentNode = objectMapper.createObjectNode();

JsonNode childNode = readJsonIntoJsonNode();

// 使用 set 或者 put 进行添加
parentNode.set("child1", childNode);
objectNode.put("field1", "value1");

// 使用 remove 进行删除
objectNode.remove("fieldName");
```

# 注解
这么好用的框架提供了一些注解，可以使用这些注解来设置将 JSON 读入对象的方式或从对象生成什么 JSON 的方式

jackson 提供的注解大部分用来重新定义从其他对象转换为 JSON 以及从 JSON 转换为其他对象的过程

以下是几个常用注解

## @JsonProperty
作用于属性，这个注解泛用性非常强，功能是可以把属性的名称序列化与反序列化时转换为另外一个名称，同时在 json 转换为这个类的时候也会自动映射。示例：
```java 
@JsonProperty("birth_date")
private Date birthDate; 
```
该注解还可以指定在序列化时忽略某属性(如Password)，或者在反序列化时忽略某属性(如HashedPassword)。通过设置JsonProperty的access属性来确定当前属性是不是需要自动序列化/反序列化

- WRITE_ONLY:仅做反序列化操作
- READ_ONLY：仅做序列化操作
```java
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String mobile;
```
## @JsonFormat
这个注解也非常泛用，大体作用接受将一些数据按特定的方式进行格式化，一般用于属性或者方法或者枚举，把属性的格式序列化时转换成指定的格式，一般向前端传参的时候会用到这个注解。示例：  
```java
@JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm")  
public Date getBirthDate();
```
ObjectMapper 默认将枚举类型 Enum 转换为它的名称，亦即为字符串，比如将枚举 ENABLE(0, “启用”)，输出为 “ENABLE”，但是前台想要的是对象类型的格式 {“value”:“1”,“name”:“禁用”}，这种时候加个 @JsonFormat 注解即可。在返回给前端的时候，直接将该枚举返回即可。同时还支持其他两种方式：JsonFormat.Shape.NUMBER（返回序号的形式）、JsonFormat.Shape.STRING（返回 name）
```java
import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum TemplateStateEnum {
    ENABLE(0, "启用"),
    DISABLE(1, "禁用");
    // 值
    private int value;
    // 名称
    private String name;
	......
}
```

```java
public class Dto {
    @JsonFormat(shape = JsonFormat.Shape.NUMBER)
    TemplateStateEnum templateStateEnum;
}
```
## @JsonPropertyOrder
@JsonPropertyOrder：用于类， 指定属性在序列化时 json 中的顺序 ， 示例： 
```java
@JsonPropertyOrder({"birth_Date", "name" })  
public class Person;
```

# JsonMapperUtil
一个很简单的工具类，在工程里可以直接导入
```java
public class CoZeJsonMapperUtil {

    // 定义jackson对象
    private static final ObjectMapper MAPPER = new ObjectMapper();

    static {
        // 遇到未知字段不失败
        MAPPER.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        MAPPER.disable(DeserializationFeature.FAIL_ON_INVALID_SUBTYPE);
        // 忽略无效字段
        MAPPER.enable(com.fasterxml.jackson.core.JsonParser.Feature.IGNORE_UNDEFINED);
        // 允许 json 中带注释
        MAPPER.enable(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_COMMENTS);
        MAPPER.registerModule(new ParameterNamesModule());
    }

    public static String toJson(Object obj) {
        if (obj == null) {
            return null;
        } else {
            try {
                return MAPPER.writeValueAsString(obj);
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        }
    }

    public static <T> T fromJson(Object value, Class<T> valueType) {
        if (value == null) {
            return null;
        } else {
            return MAPPER.convertValue(value, valueType);
        }
    }

    public static <T> T fromJson(String rawValue, TypeReference<T> type) {
        try {
            return MAPPER.readValue(rawValue, type);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    public static <T> T fromJson(Object rawValue, TypeReference<T> type) {
        try {
            return MAPPER.readValue(toJson(rawValue), type);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
```
# Jackson 原理
## 反射获取方法
jackson 的序列化原理可能与其他的序列化工具不一定是相同的原理，不可套用

jackson 在序列化的时候如何定义 key 呢？

jackson 会利用反射获取 field 对应的 get 方法方法名，比如 getXxx，然后进行将 get 进行截断，变成 Xxx，最后将其小写，变成 xxx

如何证明呢，源码中已经写明了，因此在工作中可能会出现这些问题：如果将对象的 get 与 set 方法都去掉，就会出现如下错误，说明 jackson 是利用反射方法取值的，而不是直接用反射属性取值
```java
com.fasterxml.jackson.databind.exc.InvalidDefinitionException: No serializer found for class 
com.pers.yifanxie.demo.pojo.TopicClassify and no properties discovered to create BeanSerializer (to avoid exception, disable 
SerializationFeature.FAIL_ON_EMPTY_BEANS)
```
如果我们将 xxx 改成 xXx，但是没有更改其 get 方法，key 仍然是 xxx，并不是我们期望的 xXx

拿到了这些重要的数据，我们就可以使用底层的工具做文章了

## JsonGenerator 生成器
jackson-core 模块提供了两种处理 JSON 的方式（纵缆整个 Jackson 共三种）：

1，流式 API：读取并将 JSON 内容写入作为离散事件 -> JsonParser 读取数据，而 JsonGenerator 负责写入数据
2，树模型：JSON 文件在内存里以树形式表示。此种方式也很灵活，它类似于 XML 的 DOM 解析，层层嵌套的

JsonGenerator 该生成器专门将普通的对象、字符串、数组等东西转换成 JSON，该对象的生成如下，createGenerator() 方法的第一个参数是生成的 JSON 的目标。 在上面的示例中，参数是 File 对象，而 createGenerator() 方法的第二个参数是生成 JSON 时使用的字符编码。 上面的示例使用 UTF-8
```java
JsonFactory factory = new JsonFactory();

JsonGenerator generator = factory.createGenerator(
    new File("data/output.json"), JsonEncoding.UTF8);
```
对于 JSON 生成器来说，写方法自然是它的灵魂所在。众所周知，JSON 属于K-V数据结构，因此针对于一个 JSON 来说，每一段都k额分为写key和写value两大阶段
```java
generator.writeStartObject();
generator.writeStringField("brand", "Mercedes");
generator.writeNumberField("doors", 5);
generator.writeEndObject();

generator.close();
```
该类的底层都是对字符串做的操作，以一个简单的 writeString 方法，写入字符串为例，其他的对对象、链表的操作也差不多
```java
    public void writeString(String text) throws IOException {
        this._verifyValueWrite("write a string");
        if (text == null) {
            this._writeNull();
        } else {
            int len = text.length();
            if (len > this._outputMaxContiguous) {
                this._writeStringSegments(text, true);
            } else {
                if (this._outputTail + len >= this._outputEnd) {
                    this._flushBuffer();
                }

                this._outputBuffer[this._outputTail++] = this._quoteChar;
                this._writeStringSegment((String)text, 0, len);
                if (this._outputTail >= this._outputEnd) {
                    this._flushBuffer();
                }

                this._outputBuffer[this._outputTail++] = this._quoteChar;
            }
        }
    }
```
## JsonParser 分析器
这个分析器只用于将 JSON 转换为对象、map 等东西，JsonParser 的抽象层级低于 Jackson ObjectMapper。 这使得 JsonParser 比 ObjectMapper 更快，但使用起来也比较麻烦
```java
tring carJson =
        "{ \"brand\" : \"Mercedes\", \"doors\" : 5 }";

JsonFactory factory = new JsonFactory();
JsonParser  parser  = factory.createParser(carJson);

while(!parser.isClosed()){
    JsonToken jsonToken = parser.nextToken();

    System.out.println("jsonToken = " + jsonToken);
}
```