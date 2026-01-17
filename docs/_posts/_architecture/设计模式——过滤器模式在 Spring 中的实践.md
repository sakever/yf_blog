---
title: 设计模式——过滤器模式在 Spring 中的实践
date: 2025-02-28
sidebar: true
categories:
  - 架构设计
tags:
  - 设计模式
  - Spring
---
## 基础介绍
过滤器模式（Filter Pattern），也称为标准模式（Criteria Pattern），是结构型设计模式之一，旨在通过应用多个条件标准来筛选对象集合。此模式的核心思想是允许对象集合按照不同的标准被过滤，并可以灵活组合这些标准进行复杂的筛选操作。在开发中，尤其是在需要根据多种动态条件对数据进行筛选时，这种模式具有极大的灵活性和可扩展性

这个模式特别适合以下场景：

- 有大量对象集合，需要根据不同标准进行筛选
- 筛选条件是动态的或组合复杂度较高
- 希望筛选逻辑与对象本身的结构解耦，从而保持代码清晰、可扩展

## 模块介绍
- 过滤器接口（Filter/Criteria）：定义过滤行为的接口，所有的标准都需要实现这个接口
- 具体过滤器类（ConcreteFilter/ConcreteCriteria）：实现标准接口，封装具体的筛选逻辑
- 对象集合（Items/Objects to be filtered）：要被过滤的对象集合。这些对象通常是具有共同属性的实例，例如一组人、一组产品等
- 客户端（Client）：使用具体过滤器类来筛选对象集合。客户端将对象集合和过滤器结合起来，以获得符合条件的对象

![请添加图片描述](https://i-blog.csdnimg.cn/direct/b2867ab1e3754c96a9805a28a4833554.png)

## 简单实现
定义实体类
```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class Person {
   /**
    * 名称
    */
   private String name;
   /**
    * 性别
    */
   private String gender;
   /**
    * 婚姻状况
    */
   private String maritalStatus;
}
```
接口：
```java
/**
 * 过滤器，进行筛选
 */
public interface Filter {
   /**
    * 筛选出符合标准的返回
    * @param persons 集合
    * @return 返回符合标准的集合
    */
   List<Person> filter(List<Person> persons);
}
```
子类
```java
/**
 * 筛选出男性
 */
public class FilterMale implements Filter {

   @Override
   public List<Person> filter(List<Person> persons) {
      List<Person> malePersons = new ArrayList<Person>();
      for (Person person : persons) {
         if(person.getGender().equalsIgnoreCase("男")){
            malePersons.add(person);
         }
      }
      return malePersons;
   }
}

/**
 * 筛选出女性
 */
public class FilterFemale implements Filter {

   @Override
   public List<Person> filter(List<Person> persons) {
      List<Person> femalePersons = new ArrayList<Person>();
      for (Person person : persons) {
         if(person.getGender().equalsIgnoreCase("女")){
            femalePersons.add(person);
         }
      }
      return femalePersons;
   }
}
```

测试：
```java
    public static void main(String[] args) {
        List<Person> persons = getPerson();

        //男性
        Criteria male = new CriteriaMale();
        //单身
        Criteria single = new CriteriaSingle();
        //女性
        CriteriaFemale criteriaFemale = new CriteriaFemale();

        printPersons("女性: ", criteriaFemale.meetCriteria(persons));
        printPersons("单身: ", single.meetCriteria(persons));
    }
```

## 业务落地
在真实业务中，肯定不能写向上面 case 一样的代码，在真实场景落地的时候，我们会遇到以下痛点：

- spring 容器管理依赖，但是使用过滤器模式时，我们可能需要一个 POJO 的类，来管理过滤过程中的各种数据。我们可能在过滤的过程中，需要查询 缓存、db 中的各种数据，这个时候我们可以在构造函数中将依赖传入，或者使用类似 SpringUtil 的组件获取，那在该场景中需要如何优雅的让非 spring 管理的类去访问 spring 容器中的类呢
- 上面的 case 除了 persons 没有其它任何信息，在实际使用的过程中，我们可能需要传入一些额外信息，来辅助过滤。我们应该如何处理呢

为此，我们可能需要做以下改动：

接口：
```java
/**
 * 过滤器，进行筛选
 */
public interface Filter<T, A> {
   /**
    * 筛选出符合标准的返回
    * @param persons 集合
    * @return 返回符合标准的集合
    */
    List<T> filter(List<T> data, A additionalData);

    /**
     * 获取过滤器策略
     *
     * @return 过滤器策略
     */
    FilterStrategyEnum getFilterStrategy();
}
```
枚举类就不用特地贴出来了，我们来看看实现类：
```java
/**
 * 筛选出男性
 */
@Slf4j
@Service
public class FilterMale implements Filter<Person, MaleFilterEntity> {
    @Resource
    private UserCommentService userCommentService;

   @Override
   public List<Person> filter(List<Person> persons, MaleFilterEntity additionalData) {
      List<Person> malePersons = new ArrayList<Person>();
      // 可能需要做一些查询操作
      userCommentService.query(additionalData.getCity());
      for (Person person : persons) {
      	 // 查出性别为男并且身高大于 x 的人
         if (person.getGender().equalsIgnoreCase("男") && person.getLength() > additionalData.getLength()){
            malePersons.add(person);
         }
      }
      return malePersons;
   }

    @Override
    public FilterStrategyEnum getFilterStrategy() {
        return FilterStrategyEnum.MALE;
    }
}
```
在业务中，我们可能需要使用一个 chain 来注册或者使用拦截器

```java
public class FilterChain<T> {

    private List<T> data;

    public FilterChain(List<T> data) {
        this.data = data;
    }

    public <A> FilterChain<T> filter(FilterStrategyEnum strategyEnum, A additionalData) {
        Filter filter = FILTER_MAP.get(strategyEnum);
        if (filter == null) {
            return this;
        }
        data = filter.filter(data, additionalData);
        return this;
    }

    public List<T> getData() {
        return data;
    }
}
```

我们要有一个地方管理枚举和实现类的对应关系：
```java
@Configuration
public class FilterContext {

    public static final Map<FilterStrategyEnum, Filter> FILTER_MAP = new HashMap<>();

    @Resource
    private List<Filter> filters;

    @PostConstruct
    public void init() {
        filters.forEach(handler -> FILTER_MAP.put(handler.getFilterStrategy(), handler));
    }
}
```
至此，我们将过滤器模式嵌入工程中了，它与我们的业务代码完全解耦合，并且提供了可插排式的逻辑功能

## 额外问题
那么问题来了，上面的代码和下面代码，功能实现上一模一样，为什么还需要用上面的实现呢：

```java
    public void filter(HashSet<FilterStrategyEnum> enumsSet) {
        if (CollectionUtils.isEmpty(persons)) {
            return;
        }
        if (enumsSet.contains(FilterStrategyEnum.MALE)) {
            filterMaleStrategy();
        }
        if (enumsSet.contains(FilterStrategyEnum.FEMALE)) {
            filterFemaleStrategy();
        }
    }
```