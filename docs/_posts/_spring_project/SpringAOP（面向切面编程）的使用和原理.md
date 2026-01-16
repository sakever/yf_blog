---
title: Spring AOP 的使用和原理
date: 2023-02-03

categories:
  - Spring 项目
tags:
  - SpringAOP
---

使用一个代理对象，执行目标方法，同时代理对象会执行一些其他方法（通用操作），直观上的感受就是，在执行原方法的同时，在原方法的前后切入了另一些方法

Spring AOP 基于动态代理，如果代理对象有接口，使用 jdk 动态代理；如果没有，会使用 cglib

那 AOP 有什么好处呢？它将一些类似日志操作等大量在项目中重复的代码独立出来，降低模块间的耦合度，有利于未来的可拓展性和可维护性
# 静态代理与动态代理
**静态代理：每一个方法都需要写一个代理方法**，可以通过 Impl 或者子类实现，代理类和目标类实现相同的接口，代理类持有目标对象的引用，并在方法调用前后进行额外的操作

动态代理：所有方法都可以公用一个代理方法，通过 java 给定的类实现

比如，现在我有一个 User 接口，有一个 UserImpl 的实现
```java
public interface User {
    public void name(String str);
}

public class UserImpl implements User {

    @Override
    public void name(String str) {
        System.out.println(str);
    }
}
```
现在我想在每一个 name 方法调用后执行一条语句

如果是静态代理的方式，需要使用类似装饰器模式的操作，使用一个类来继承它
```java
public class StaticProxyUser extends UserImpl {

    @Override
    public void name(String str) {
        super.name(str);
        System.out.println("代理语句执行");
    }
}
```
像这么写的话代码的可重用性不高，如果其他接口也像使用代理每个接口都需要写这样一段代码
## JDK 动态代理
被代理的类实现了接口的时候才能使用，**生成的代理类是实现了相同接口的同级代理类**，调用代理类方法的时候，事实上 jdk 调用了我们的接口实现类方法并且把我们写在代理类中的方法缝合在了一个新类中

通过 Proxy 的 newProxyInstance 生成代理类，这个代理类的方法都会视为代理增强后的方法
```java
class Invocation implements InvocationHandler {
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        //重写这个方法，然后把这个类传入newProxyInstance的第三个参数中
        return null;
    }
}
```
我们先来简单实现一下动态代理，以下是代理类，这里面的 method.invoke 方法执行了原方法，外面包的就是额外执行的方法
```java
public class JDKProxyUser implements InvocationHandler {

    User user;

    public JDKProxyUser(User user) {
        this.user = user;
    }
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        method.invoke(user, args);
        System.out.println("代理语句执行");
        return null;
    }
}
```
调用类创建
```java
    @Test
    void proxyTest() {
        User user = new UserImpl();
        Class[] classes = {User.class};
        User user1 = (User) Proxy.newProxyInstance(User.class.getClassLoader(), classes, new JDKProxyUser(user));
        user1.name("yifanxie");
    }
```
可以看见这时候的 user 可以传入任何实现类对象，不必再一个个去写子类实现了，这样程序的可扩展性就大大增加了

调用这个代理类的方法其实是调用了 InvocationHandler 的 invoke 方法，我们来解析一下它是怎么实现的，newProxyInstance 源码如下
```java
	@CallerSensitive
    public static Object newProxyInstance(ClassLoader loader,
                                          Class<?>[] interfaces,
                                          InvocationHandler h)
        throws IllegalArgumentException
    {
        Objects.requireNonNull(h);
 
        final Class<?>[] intfs = interfaces.clone();
        final SecurityManager sm = System.getSecurityManager();
        if (sm != null) {
            checkProxyAccess(Reflection.getCallerClass(), loader, intfs);
        }
 
        /*
         * Look up or generate the designated proxy class.
         */
        Class<?> cl = getProxyClass0(loader, intfs);
 
        /*
         * Invoke its constructor with the designated invocation handler.
         */
        try {
            if (sm != null) {
                checkNewProxyPermission(Reflection.getCallerClass(), cl);
            }
 
            final Constructor<?> cons = cl.getConstructor(constructorParams);
            final InvocationHandler ih = h;
            if (!Modifier.isPublic(cl.getModifiers())) {
                AccessController.doPrivileged(new PrivilegedAction<Void>() {
                    public Void run() {
                        cons.setAccessible(true);
                        return null;
                    }
                });
            }
            return cons.newInstance(new Object[]{h});
        } catch (IllegalAccessException|InstantiationException e) {
            throw new InternalError(e.toString(), e);
        } catch (InvocationTargetException e) {
            Throwable t = e.getCause();
            if (t instanceof RuntimeException) {
                throw (RuntimeException) t;
            } else {
                throw new InternalError(t.toString(), t);
            }
        } catch (NoSuchMethodException e) {
            throw new InternalError(e.toString(), e);
        }
    }
```
这个类很流弊，它在里面构建了一个完全不存在我们代码中的类 Class<?> cl，这个类就是最终执行的、被增强的类

这个类需要关联两部分消息，一个是原类的方法 UserImpl，另外一个是增强的额外消息，这个被生成的增强类可以理解成下面这个
```java
class UserAspect implements User, InvocationHandler {
	void name(String v1) {}
}
```
因此，我们得出这些结论：

- 在需要继承 proxy 类获得有关方法和 InvocationHandler 构造方法传参时，我们需要和想要代理的类建立联系，而这两部分信息都是通过接口关联起来的
- 需要反射获得代理类的有关参数，必须要通过某个类，反射获取有关方法
- 我们只能代理实现接口后实现的方法，实现类自己的方法也是不可以代理的
- 反射其实可以直接拿到类中的每一个方法，但是 jdk 没有这么做，是因为需要满足 java 的设计规约，保证封装性
- **由于我们在代码中生成了 class，因此 jdk 动态代理属于运行时增强**，这种增强在重复调用的时候，会比 CGlib 增强消耗更多性能。但是在 Spring 中，由于代理对象已经放在 IOC 容器中了，因此不会消耗太多性能
## CGlib 动态代理
CGLIB 是一个开源、高性能、高质量的 Code 生成类库（代码生成包），**它可以在运行期扩展 Java 类与实现 Java 接口**。CGLIB 的底层是通过使用一个小而快的字节码处理框架 ASM，来转换字节码并生成新的类。但不鼓励大家直接使用 ASM 框架，因为对底层技术要求比较高

被代理的类是代理类的父类，如果被代理的类有一些属性或方法被 final 定义，或者有**一些方法定义为 private** 等等情况，是不能成功代理的。因为我们事实上访问的方法，是其子类的方法，但是子类不能访问到被代理类的方法

通过 Proxy 被手动重写的子类产生代理类，这个代理类的方法都会视为代理增强后的方法。调用这个代理类的方法其实是调用了 MethodInterceptor 的 intercept（拦截）方法

来看看过程，我们先实现 MethodInterceptor 接口：
```java
public class LogInterceptor implements MethodInterceptor {

    /**
     *
     * @param obj 表示要进行增强的对象
     * @param method 表示拦截的方法
     * @param objects 数组表示参数列表，基本数据类型需要传入其包装类型，如int-->Integer、long-Long、double-->Double
     * @param methodProxy 表示对方法的代理，invokeSuper方法表示对被代理对象方法的调用
     * @return 执行结果
     * @throws Throwable 异常
     */
    @Override
    public Object intercept(Object obj, Method method, Object[] objects, MethodProxy methodProxy) throws Throwable {
        before(method.getName());
        // 注意这里是调用invokeSuper而不是invoke，否则死循环;
        // methodProxy.invokeSuper执行的是原始类的方法;
        // method.invoke执行的是子类的方法;
        Object result = methodProxy.invokeSuper(obj, objects);
        after(method.getName());
        return result;
    }

    /**
     * 调用invoke方法之前执行
     */
    private void before(String methodName) {
        System.out.println("调用方法" + methodName +"之【前】的日志处理");
    }

    /**
     * 调用invoke方法之后执行
     */
    private void after(String methodName) {
        System.out.println("调用方法" + methodName +"之【后】的日志处理");
    }
}
```
调用函数：
```java
public class CglibTest {

    public static void main(String[] args) {

        // 通过CGLIB动态代理获取代理对象的过程
        // 创建Enhancer对象，类似于JDK动态代理的Proxy类
        Enhancer enhancer = new Enhancer();
        // 设置目标类的字节码文件
        enhancer.setSuperclass(UserDao.class);
        // 设置回调函数
        enhancer.setCallback(new LogInterceptor());
        // create方法正式创建代理类
        UserDao userDao = (UserDao) enhancer.create();
        // 调用代理类的具体业务方法
        userDao.findAllUsers();
        userDao.findUsernameById(1);
    }
}
```
此时编译后的 target 中已经生成了增强后的代码了，我们在 target 中可以看到以下三个 class 文件：
```
UserDao$$EnhancerByCGLIB$$1169c462.class
UserDao$$EnhancerByCGLIB$$1169c462$$FastClassByCGLIB$$22cae79c.class
UserDao$$FastClassByCGLIB$$197ae7fa.class
```
部分反编译代码如下
```java
public class UserDao$$EnhancerByCGLIB$$1169c462 extends UserDao implements Factory {
    private boolean CGLIB$BOUND;
    public static Object CGLIB$FACTORY_DATA;
    private static final ThreadLocal CGLIB$THREAD_CALLBACKS;
    private static final Callback[] CGLIB$STATIC_CALLBACKS;
    private MethodInterceptor CGLIB$CALLBACK_0;
    private static Object CGLIB$CALLBACK_FILTER;
    private static final Method CGLIB$findAllUsers$0$Method;
    private static final MethodProxy CGLIB$findAllUsers$0$Proxy;
    private static final Object[] CGLIB$emptyArgs;
    private static final Method CGLIB$findUsernameById$1$Method;
    private static final MethodProxy CGLIB$findUsernameById$1$Proxy;
    private static final Method CGLIB$equals$2$Method;
    private static final MethodProxy CGLIB$equals$2$Proxy;
    private static final Method CGLIB$toString$3$Method;
    private static final MethodProxy CGLIB$toString$3$Proxy;
    private static final Method CGLIB$hashCode$4$Method;
    private static final MethodProxy CGLIB$hashCode$4$Proxy;
    private static final Method CGLIB$clone$5$Method;
    private static final MethodProxy CGLIB$clone$5$Proxy;

    public final void findAllUsers() {
        MethodInterceptor var10000 = this.CGLIB$CALLBACK_0;
        if (var10000 == null) {
            CGLIB$BIND_CALLBACKS(this);
            var10000 = this.CGLIB$CALLBACK_0;
        }

        if (var10000 != null) {
            var10000.intercept(this, CGLIB$findAllUsers$0$Method, CGLIB$emptyArgs, CGLIB$findAllUsers$0$Proxy);
        } else {
            super.findAllUsers();
        }
    }

    final String CGLIB$findUsernameById$1(int var1) {
        return super.findUsernameById(var1);
    }

    public final String findUsernameById(int var1) {
        MethodInterceptor var10000 = this.CGLIB$CALLBACK_0;
        if (var10000 == null) {
            CGLIB$BIND_CALLBACKS(this);
            var10000 = this.CGLIB$CALLBACK_0;
        }

        return var10000 != null ? (String)var10000.intercept(this, CGLIB$findUsernameById$1$Method, new Object[]{new Integer(var1)}, CGLIB$findUsernameById$1$Proxy) : super.findUsernameById(var1);
    }

    // ...
}
```
由此，我们看到了，增强在 class 中已经处理完毕，进入虚拟机时，重复调用该方法的效率会比 jdk 代理高。同时，CGlib 的实现是调用被代理对象的子类，通过生成代码的方式来实现动态代理的

## Spring AOP 自调用问题
线上出现过这个问题，当一个方法被标记了 @Transactional 注解的时候，**Spring 事务管理器只会在被其他类方法调用的时候生效，而不会在同一个类的方法调用中生效**。同时。如果方法不标记为 public 也不会生效，这个在写代码的时候注意一下

这是因为 Spring AOP 工作原理决定的。因为 Spring AOP 使用动态代理来实现事务的管理，它会在运行的时候为带有 @Transactional 注解的方法生成代理对象，并在方法调用的前后应用事物逻辑。如果该方法被其他类调用我们的代理对象就会拦截方法调用并处理事务

但是在一个类中的其他方法内部调用的时候，我们代理对象就无法拦截到这个内部调用，因为 SpringAOP 是调用的方法的同级或者子级，因此事务也就失效了

那我们应该怎么办呢？很简单，把事务写在其他方法里就行了
# AspectJ 的使用
Spring AOP 现在已经集成了 AspectJ，AspectJ 算的上是 Spring 生态系统中最完整的 AOP 框架

AspectJ 代理不同与 Spring 代理，Spring AOP 属于运行时增强（基于 java 提供的类在运行时实现），而 AspectJ 是编译时增强（基于字节码操作在生成 class 文件时就进行改变），因此 AspectJ 在处理大量请求时性能上比 SpringAOP 好很多，因为在运行时不用读取二进制代理文件

与此同时，cglib 和 jdk 动态代理的很多痛点也被解决了，比如拦截 private 方法、拦截静态方法、拦截内部调用等等，在之前都不能实现的事情，使用 AspectJ 就可以处理
## 相关名词
增强（advice，也叫通知）：对原方法额外进行的操作，一共有5种类型
- 前置通知：目标对象的方法调用之前触发
- 后置通知：目标对象的方法返回结果之后触发
- 最终通知：无论目标对象的方法触发了异常通知还是后置通知，都会触发最终通知
- 异常通知：目标对象的方法运行中抛出 / 触发异常后触发。异常通知和后置通知两者互斥。如果方法调用成功无异常，则会有返回值；如果方法抛出了异常，则不会有返回值
- 环绕通知：编程式控制目标对象的方法调用。环绕通知是所有通知类型中可操作范围最大的一种，因为它可以直接拿到目标对象，以及要执行的方法，所以环绕通知可以任意的在目标对象的方法调用前后搞事，甚至不调用目标对象的方法

连接点：可以被增强（进行AOP操作）的方法叫做连接点，几乎所有的方法都可以被称为连接点

切入点：实际上被增强的方法

切面：这不是一个名词，这是一个动词，使用 AOP 增强切入点的这样一个操作叫切面

目标：被通知的对象
## 例子以及注解说明
@Aspect：表示这是一个增强类
@Before：前置通知，后面 value 跟着的是切入点表达式
@After：最终通知
@AfterReturning：后置通知
@AfterThrowing：异常通知
@Around：环绕通知，其中 proceedingJoinPoint.proceed() 语句代表执行被增强的方法，这就是为什么说它可以直接拿到目标对象以及要执行的方法
@Component：原件的意思，把该类实例化放入到 spring 容器中
```java
@Component
@Aspect
public class ProxyUser {

    @Before(value = "execution(* com.example.demo.UserImpl.name(..))")
    public void before() {
        System.out.println("before......");
    }

    @After(value = "execution(* com.example.demo.UserImpl.name(..))")
    public void after() {
        System.out.println("after......");
    }

    @AfterReturning(value = "execution(* com.example.demo.UserImpl.name(..))")
    public void afterReturning() {
        System.out.println("afterReturning......");
    }

    @AfterThrowing(value = "execution(* com.example.demo.UserImpl.name(..))")
    public void afterThrowing() {
        System.out.println("AfterThrowing......");
    }

    @Around(value = "execution(* com.example.demo.UserImpl.name(..))")
    public void around(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
        System.out.println("Around before......");
        proceedingJoinPoint.proceed();
        System.out.println("Around after......");
    }
}
```
## PointCut
我们发现上面的5种增强里的路径都是一样的，在修改路径时太麻烦了，有没有可以将这些路径抽取出来的方法？

此时我们可以使用使用 PointCut 注解做公共切入点抽取，使用的时候将被注解的方法放进 value 中即可
```java
    @Pointcut(value = "execution(* com.example.demo.UserImpl.name(..))")
    private void pointCut() {}

    @Before(value = "pointCut()")
    public void before() {
        System.out.println("before......");
    }
```
同时，你使用静态变量也可以
```java
    private final static String EXPRESSION = "execution(* com.apesource.service.impl.*.create*(..))";
 
    //前置通知   
    @Before(EXPRESSION)
    public void beforeAdvice(JoinPoint joinPoint){
        System.out.println("========== 【Aspectj前置通知】 ==========");
    }
```
## 优先级
每个增强类最多有5种增强，而一个切入点可能被很多个增强类增强，我们现在想控制多个切面的执行顺序，怎么办？

我们可以在增强类上使用 Order 注解，Order 之中的数字越小，说明优先级越高，也就越先执行
```java
@Order(1)
@Service
@Aspect
public class ProxyUser {...}
```
也可以对该类实现 Ordered 类
```java
public class ProxyUser {

    @Override
    public int getOrder() {
        return 1;
    }
	...
}
```

# 切入点表达式
## execution
execution 是使用的最多的注解，用于根据方法的全限定名做匹配，格式如下：
```
execution([权限修饰符] 返回值类型 包名.类名.方法名(参数列表))
```
说明：

- 这里的 execution 后跟着的就是切入点
- 权限修饰符就是切入点的权限修饰符，可以省略，而且一般都会省略，省略的话会包含所有的类型
- 返回值类型可以指定类型，也可以用*代替，表示所有的返回值，不能省略
- 包名可以写两个点，表示当前包里所有的类或者子包下的类。比如 com..aop；包名可以使用*，表示当前包下所有东西
- 类名、方法名可以用*代替，表示所有的类
- 参数类型可以指定类型。比如：String，Integer 表示第一个参数是 String，第二个参数是 Integer；* 表示任意类型；可以使用 .. 表示任意个数、任意类型的参数

eg：
```java
// 匹配com.example.demo.UserImpl下所有方法
execution(* com.example.demo.UserImpl.*(..))
// 匹配目标类所有以To为后缀的方法
execution(* *To(..))
// 匹配包名前缀为com的任何包下类名后缀为Dao的方法，方法名必须以find为前缀
execution(* com..*Dao.find*(..))
```
## within 和 @within
我们还可以使用 within 做限制，他是一个对所命中路径下的所有方法都进行切面，我们可以使用 @within 对某个注解修饰的类下面的所有方法进行切面，也可以直接切包
```java
// 拦截包中任意方法，不包含子包中的方法
@After(value = "within(com.xyz.service.*)")
// 拦截包或者子包中定义的方法
@After(value = "within(com.xyz.service..*)")
// 假设 RpcExceptionHandler 是一个对类生效的注解，这样就可以拦截类中的所有方法
@After(value = @within(com.kuaishou.ad.industry.aigc.center.common.aspect.RpcExceptionHandler))
```
## args 与 @args
这两个用于对参数进行限制，args 用于匹配方法中的参数类型
```java
// 匹配只有一个参数，且类型为com.ms.aop.args.demo1.UserModel
@Pointcut("args(com.ms.aop.args.demo1.UserModel)")
// 匹配多个参数，下面匹配了 str、str、int 类型的参数方法
@After("args(type1,type2,typeN)")
public void after(String type1, String type2, Integer typeN) {
```
@args() 则是方法参数所属的类型上有指定的注解，被匹配。**注意是方法参数所属的类型上有指定的注解，不是方法参数中有注解**
```java
// 匹配1个参数，且第1个参数所属的类中有Anno1注解
@Pointcut("@args(com.ms.aop.jargs.demo1.Anno1)")
// 匹配多个参数，且多个参数所属的类型上都有指定的注解
@Pointcut("@args(com.ms.aop.jargs.demo1.Anno1, com.ms.aop.jargs.demo1.Anno2)")
```
## @annotation
这个非常的常见，直接通过注解进行的切面，用于匹配当前执行方法持有指定注解的方法。只需要在需要切面的方法上加上对应的注解就可以了。例如：
```java
	@Pointcut("@annotation(cn.hjljy.mlog.common.annotation.MlogLog)")
    public void logCut(){}
    
    @Around("logCut()")
    public Object validateParam(ProceedingJoinPoint joinPoint) throws Throwable {
        System.out.println("进入切面进行验证");
        Object obj = joinPoint.proceed();
        return obj;
    }

	@MlogLog
    public void test(){}
```
如果需要使用到注解中的值，不仅要使用切入点表达式，还需要使用参数名称做修饰
```java
@Aspect
@Component
public class AppendProcessor {
	@Pointcut("@annotation(cn.hjljy.mlog.common.annotation.Append)")
    public void logCut(){}

    @Around("logCut() && @annotation(appendAnnotation)")
    public String process(ProceedingJoinPoint joinPoint, Append appendAnnotation) throws Throwable{
        String res = appendAnnotation.word() + " " + joinPoint.proceed() + " " + appendAnnotation.word();
        return res;
    }
}

```
## 与并非
同时，Pointcut 定义时,还可以使用 &&、∣∣、! 运算符，用于联合多个限制条件
```java
@Pointcut("execution(* com.savage.aop.MessageSender.*(..)) && args(param)")
public void log(){
}
 
@Before("log(String param)") 
public void beforeLog(){
     //todo something....
}
 
@Before("execution(* com.savage.aop.MessageSender.*(..)) && args(param)") 
public void beforeLog(){
     //todo something....
}
```
# 实践
## 常用方法
我们在写 aop 切面时，常用的方法
```java
@Around(value = "pointCut()")
public Object logBefore(JoinPoint joinpoint) throws Throwable {
    System.out.println("----------环绕开始-----------");

    System.out.println("方法名："+ joinpoint.getSignature().getName());
    System.out.println("参数值集合："+ Arrays.asList(joinpoint.getArgs()));
    System.out.println("参数值类型："+ joinpoint.getArgs()[0].getClass().getTypeName());
    // 获取方法签名
    MethodSignature methodSignature = (MethodSignature) joinPoint.getSignature();
    // 获取返回类型
    Class<?> returnType = methodSignature.getReturnType();
	// 打印返回类型
    System.out.println("返回类型: " + returnType.getName());

    ProceedingJoinPoint point = (ProceedingJoinPoint) joinpoint;
    System.out.println("----------环绕结束-----------");
    return point.proceed(); //放行，执行接口方法
}
```
## 例子 @RedisCache
注解：

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RedisCache {

    String value() default "";

    long expireSeconds() default 60;
}
```
切面代码
```java
@Slf4j
@Aspect
@Component
public class RedisCacheAspect {

    @Resource
    private IndustryAigcCacheService industryAigcCacheService;

    @Pointcut("@annotation(com.kuaishou.ad.industry.aigc.center.common.cache.aop.RedisCache)")
    public void cacheCut() {
    }

    @Around("cacheCut() && @annotation(redisCache)")
    public Object getCache(ProceedingJoinPoint joinPoint, RedisCache redisCache) throws Throwable {
        if (Strings.isNullOrEmpty(redisCache.value())) {
            return joinPoint.proceed();
        }
        StringBuilder key = new StringBuilder(redisCache.value());
        Object[] args = joinPoint.getArgs();
        if (args.length != 0) {
            for (Object arg : args) {
                key.append("_").append(JsonMapperUtils.toJson(arg));
            }
        }
        String value = industryAigcCacheService.queryCacheString(key.toString());
        log.info("RedisCacheAspect key = {} value = {}", key, value);

        if (Strings.isNullOrEmpty(value)) {
            Object proceed = joinPoint.proceed();
            industryAigcCacheService.setEx(key.toString(), JsonMapperUtils.toJson(proceed), redisCache.expireSeconds());
            return proceed;
        }
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        return JsonMapperUtils.fromJson(value, signature.getReturnType());
    }
}
```