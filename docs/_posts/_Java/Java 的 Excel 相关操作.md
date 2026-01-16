---
title: Java 的 Excel 相关操作
date: 2023-04-03
sidebar: ture
categories:
  - Java
tags:
  - Excel
---
## Excel 的页面下载操作
在 response 中设置浏览器接受的样式为 application/vnd.ms-excal，即可返回 excal 的下载。然后需要定义一些其他设置
```java
        response.setContentType("application/vnd.ms-excel;charset=UTF-8");
		// 额外的设置
        String agent = request.getHeader("User-Agent");
        String filename = "xxx.xls";
        filename = filename.replaceAll("filename=","");
        
        if (agent != null && agent.contains("Windows"))
            filename = new String(filename.getBytes("GB2312"), "ISO_8859_1");
        else
            filename = new String(filename.getBytes("UTF-8"), "ISO_8859_1");

		// 设置下载的文件名称
        response.addHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
        // 编码
        response.setCharacterEncoding("UTF-8");
        // 设置二进制传输文件
        response.setHeader("Content-Transfer-Encoding","binary");
        response.setHeader("Pragma", "public");
        response.setHeader("Cache-Control", "public" );
```
## HSSFCellStyle 
用 HSSFWorkbook 代表一个 excal 文件，HSSFSheet 表示文件中的每个 sheet，HSSFRow 代表 sheet 中的每一行，HSSFCell 就表示每一行中的每一格数据了
```java
            // 渲染 excel 文件
            HSSFWorkbook wb = new HSSFWorkbook();
            HSSFSheet sheet = wb.createSheet("酒店信息");
            HSSFRow row = sheet.createRow(0);
            HSSFCell cell = row.createCell(0);
```
HSSFCellStyle 是一个实现了 CellStyle 接口的类，用于工作簿的工作页中每个单元格的高级样式展示

HSSFCellStyle 与 HSSFFont 都是通过 HSSFWorkbook 创造出来的
```java
// 生成一个样式
HSSFCellStyle style = workbook.createCellStyle();
// 设置这些样式
style.setAlignment(HSSFCellStyle.ALIGN_CENTER);//水平居中 
style.setVerticalAlignment(HSSFCellStyle.VERTICAL_CENTER);//垂直居中

 // 背景色
style.setFillForegroundColor(HSSFColor.YELLOW.index);
style.setFillPattern(HSSFCellStyle.SOLID_FOREGROUND); 
style.setFillBackgroundColor(HSSFColor.YELLOW.index); 

// 设置边框
style.setBorderBottom(HSSFCellStyle.BORDER_THIN);
style.setBorderLeft(HSSFCellStyle.BORDER_THIN);
style.setBorderRight(HSSFCellStyle.BORDER_THIN);
style.setBorderTop(HSSFCellStyle.BORDER_THIN);  

// 自动换行  
style.setWrapText(true);  

// 生成一个字体
HSSFFont font = workbook.createFont();
font.setFontHeightInPoints((short) 10);
font.setColor(HSSFColor.RED.index);
font.setBoldweight(HSSFFont.BOLDWEIGHT_BOLD);
font.setFontName("宋体");

// 把字体应用到当前样式
style.setFont(font);

// style 设置好后，为 cell 设置样式
cell.setCellStyle(style);// cell 为已有的单元格
// 为单元格设置数据
cell.setCellValue("hello world");
```

## EasyExcal
直接使用 HSSFCellStyle 未免太麻烦了一些，阿里为我们提供了更加简单的 Excal 操作，官方文档如下：

https://easyexcel.opensource.alibaba.com/docs/current/

EasyExcal 的输出是根据流来的，内容是使用 list 确定的，表格的结构是从 pojo 的注解来确定的。因此我们只需要在 write 方法中对流就行操作就可以了

比如下面这个流，是将文件输出到服务器的磁盘中
```java
FileOutputStream outputStream = new FileOutputStream(new File(excelFilePath));
EasyExcel.write(outputStream, DestinationDimensionStopOrder.class).sheet().doWrite(destinationDimensionStopOrder);
```
下面的 pojo 展示了如何使用 easyExcal 提供的注解
```java
@Getter
@Setter
@EqualsAndHashCode
public class DemoData {
    @ExcelProperty("字符串标题")
    private String string;
    @ExcelProperty("日期标题")
    private Date date;
    @ExcelProperty("数字标题")
    private Double doubleData;
    /**
     * 忽略这个字段
     */
    @ExcelIgnore
    private String ignore;
}
```

以下是一些特殊使用
### 自定义格式转换
有时候我们需要将一些类中自定义的属性放进 excal，这时候我们需要转换器。easyExcal 提供的特殊注解为我们处理了一些常用的类型转换
```java
@Getter
@Setter
@EqualsAndHashCode
public class ConverterData {
    /**
     * 我想所有的 字符串起前面加上"自定义："三个字
     */
    @ExcelProperty(value = "字符串标题", converter = CustomStringStringConverter.class)
    @NotNull(message = "字符串标题不能为空")
    private String string;
    /**
     * 我想写到excel 用年月日的格式
     */
    @DateTimeFormat("yyyy年MM月dd日HH时mm分ss秒")
    @ExcelProperty("日期标题")
    private Date date;
    /**
     * 我想写到excel 用百分比表示
     */
    @NumberFormat("#.##%")
    @ExcelProperty(value = "数字标题")
    private Double doubleData;
}
```

转换器的写法如下：
```java
package com.alibaba.easyexcel.test.demo.write;

import com.alibaba.excel.converters.Converter;
import com.alibaba.excel.enums.CellDataTypeEnum;
import com.alibaba.excel.metadata.GlobalConfiguration;
import com.alibaba.excel.metadata.data.ReadCellData;
import com.alibaba.excel.metadata.data.WriteCellData;
import com.alibaba.excel.metadata.property.ExcelContentProperty;

/**
 * String and string converter
 *
 * @author Jiaju Zhuang
 */
public class CustomStringStringConverter implements Converter<String> {
    @Override
    public Class<?> supportJavaTypeKey() {
        return String.class;
    }

    @Override
    public CellDataTypeEnum supportExcelTypeKey() {
        return CellDataTypeEnum.STRING;
    }

    /**
     * 这里是读的时候会调用
     *
     * @param cellData            NotNull
     * @param contentProperty     Nullable
     * @param globalConfiguration NotNull
     * @return
     */
    @Override
    public String convertToJavaData(ReadCellData<?> cellData, ExcelContentProperty contentProperty,
        GlobalConfiguration globalConfiguration) {
        return cellData.getStringValue();
    }

    /**
     * 这里是写的时候会调用 
     *
     * @param value               NotNull
     * @param contentProperty     Nullable
     * @param globalConfiguration NotNull
     * @return
     */
    @Override
    public WriteCellData<?> convertToExcelData(String value, ExcelContentProperty contentProperty,
        GlobalConfiguration globalConfiguration) {
        return new WriteCellData<>("自定义：" + value);
    }

}
```
supportJavaTypeKey 方法指定该 Converter 转换的目标类型是 String，而 easyexcel 在将 excel 单元格内容转换为 java 中的 string 时调用的就是 convertToJavaData 方法
### 上传
```java
    @RequestMapping("/secondKill/uploadConfig.json")
    @ResponseBody
    public JsonData uploadConfig(@RequestParam(value = "file") MultipartFile file） {
            ReadAndValidatorListener<CrmUserInfoVO> listener = new ReadAndValidatorListener<>();
            EasyExcel.read(file.getInputStream(), CrmUserInfoVO.class, listener)
                    .excelType(ExcelTypeEnum.XLSX)
                    .autoCloseStream(false)
                    .autoTrim(true)
                    .sheet()
                    .doRead();

            if (listener.hasViolation()) {
                return JsonResult.error(listener.getViolationMessageString());
            }
			// 这里 getDataList 拿到 excal 中的数据，推荐做一次 vo 到 po 的转换
            return crmUserInfoService.importAllUser(listener.getDataList(), user.getUserName());
    }
```

监听器可以这么写
```java
    @Override
    public void importEmployeExcel(MultipartFile file) throws Exception {
        EasyExcel.read(file.getInputStream(), Employe.class, new AnalysisEventListener<Employe>() {

            /**
             * 批处理阈值，作用：减轻数据库的压力
             */
            private static final int BATCH_COUNT = 2;

            /**
             * 存储员工对象
             */
            List<Employe> list = new ArrayList<Employe>(BATCH_COUNT);

            //easyExcel每次从Excel中读取一行数据就会调用一次invoke方法
            @Override
            public void invoke(Employe employe, AnalysisContext analysisContext) {
            	// 这里也可以将错误信息提取出来
            	if (Strings.isNotBlank(ExcelCellUtils.validateEntity(employe))) {
            		list.add(employe);
            	}
                
                if (list.size() >= BATCH_COUNT) {
                 	employeDao.addBatch(list);
                    list.clear();
                }
            }

            //easyExcel在将Excel表中数据读取完毕后，最终执行此方法
            @Override
            public void doAfterAllAnalysed(AnalysisContext analysisContext) {
                //最后,如果size<BATCH_COUNT就在这里进行数据的处理
                if (list.size() > 0) {
                    employeDao.addBatch(list);
                }
                // 或者在 invoke 中不使用 BATCH_COUNT 判断，在结尾处一起修改
                // Lists.partition(list, BATCH_COUNT).stream().forEach(employeDao::addBatch);
            }
			
			// 在此匿名内部类的方法里，throw new ExcelAnalysisStopException()就会终止easyExcel的运行。
			
			/**
		     *
		     * @param exception
		     * @param context
		     * @throws Exception
		     */
		    @Override
		    public void onException(Exception exception, AnalysisContext context) {
		        // 此方法能接住，在此匿名内部类的方法里抛出的异常，并进行处理，然后继续invoke方法。
		    }
		
        }).sheet().doRead();//sheet()参数指定，默认读取第一张工作表
    }
```

validateEntity 是校验参数方法，旨在减少重复的校验代码
```java
import javax.validation.ConstraintViolation;
import javax.validation.Validation;
import javax.validation.Validator;
import javax.validation.groups.Default;

    public static <T> String validateEntity(T obj) {
        StringBuilder result = new StringBuilder();
        Set<ConstraintViolation<T>> set = VALIDATOR.validate(obj, Default.class);
        if (set != null && !set.isEmpty()) {
            for (ConstraintViolation<T> cv : set) {
                //拼接错误信息
                result.append(" ").append(cv.getMessage());
            }
        }
        return result.toString();
    }
```
### 下载
```java
        // 查询线索
        List<SalesClue> salesClues = salesClueRouteService.selectByCondition(
                CrmSalesClueFilter.builder().startTime(DateUtil.str2date(date, DateUtil.DATE_FORMAT)).saleNames(usernames).build()
        );

        List<SalesClueDownloadDetail> salesClueDownloadDetail = salesClueService.toDownloadDetail(salesClues);

		// 设置为流
        response.setContentType("application/octet-stream");
        response.setHeader("Content-disposition", "attachment;filename=" + "detail.xlsx");

        try {
            EasyExcel.write(response.getOutputStream(), SalesClueDownloadDetail.class)
                    .sheet().doWrite(salesClueDownloadDetail);
        } catch (IOException e) {
            log.error("downloadDetail出现异常", e);
        }
```
除了提供给前端，根据传入流的不同，可以输出到不同的地方，比如输出到文件中
```java
        FileOutputStream outputStream = new FileOutputStream(new File(excelFilePath));
        EasyExcel.write(outputStream, DestinationDimensionStopOrder.class).sheet().doWrite(destinationDimensionStopOrder);
```
### 依赖
```xml
            <dependency>
                <groupId>org.apache.xmlbeans</groupId>
                <artifactId>xmlbeans</artifactId>
                <version>3.1.0</version>
            </dependency>
            <!-- 4.1.2 -->
            <dependency>
                <groupId>org.apache.poi</groupId>
                <artifactId>poi</artifactId>
                <version>${org.apache.poi.version}</version>
                <scope>compile</scope>
            </dependency>
            <dependency>
                <groupId>org.apache.poi</groupId>
                <artifactId>poi-ooxml</artifactId>
                <version>${org.apache.poi.version}</version>
                <scope>compile</scope>
            </dependency>
            <dependency>
                <groupId>org.apache.poi</groupId>
                <artifactId>poi-ooxml-schemas</artifactId>
                <version>${org.apache.poi.version}</version>
            </dependency>
            <!-- 3.2.1 -->
            <dependency>
                <groupId>com.alibaba</groupId>
                <artifactId>easyexcel</artifactId>
                <version>${com.alibaba.easyexcel.version}</version>
            </dependency>
```

### 注意事项
EasyExcel 有很多坑，他封装了很多东西导致了可扩张性不是很好，下面来列一些项目中常见的事项：

1，在监听器中如果不想继续解析数据了，我们只能抛出异常来结束方法。记得在监听器外围做好拦截，否则这个我们可预知的错误会直接抛给用户
2，在所有的方法中抛出异常的话，都会走到 onException 方法中，比如在 invokeHead（访问首行的方法）、invoke（访问各种数据的方法），因此在这个方法中需要兼容好各种情况
3，**在监听器中无论抛出什么异常，都会被包装成 ExcelAnalysisException 异常**。这个需要额外注意，并且异常的 message 和 code 都会被改写