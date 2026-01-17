---
title: ffmpeg 的安装以及实现音频切分功能
date: 2024-09-17
sidebar: true
categories:
  - 计算机基础
tags:
  - ffmpeg
---
背景是需要在 java 项目中实现一个音频切分的功能，比如用户上传了一个100分钟的视频，我们需要将该音频的前10分钟和最后10分钟切出来，需要切的音频格式包含 mp4、mp3、wav 等常见的压缩文件格式

经过调研发现 ffmpeg 比较适合处理这个，在 java 中有提供对应的封装库 javacv、ffmpeg-platform，当然 java 中也提供了其他的组件去切音频，但是他们的泛用性不如 ffmpeg

本文将从 ffmpeg 的安装介绍起，包含 linux、mac、docker 下的各种安装方式，和该工具在命令行模式、java 代码中的使用，以及该工具对应的封装库 javacv 的使用方式
## 关于 ffmpeg 的安装
### mac 下安装 ffmpeg
在 mac 下安装 ffmpeg，推荐使用 brew 命令。Brew 全称叫 Homebrew，是 Mac 系统上的软件包管理工具。这里的软件并不是指从 AppStore 或从网上下载的 dmg 文件，而是开发所需要用的一些工具软件，如 gawk 等。 只需要一个命令， 安装和卸载它们非常方便

Homebrew 最初是为 macOS 设计的，但后来也被移植到了 Linux 上，使得在类 Unix 的操作系统上也能使用 Homebrew 来管理软件包。虽然 Homebrew 在 macOS 上非常流行，因为它能很好地与 macOS 的系统结构集成，但 Homebrew 在 Linux 上同样有用，尤其是在那些没有强大的包管理系统的发行版上，或者当用户想要在标准包之外安装额外的软件时

安装 brew 方式：[MAC 安装 Homebrew](https://www.cnblogs.com/Nestar/p/18074872)

安装完毕后输入：
```bash
brew install ffmpeg
```
### docker 和 linux 下安装 ffmpeg
下面说的都是 docker 安装镜像的操作，在 linux 下安装只需要去掉 RUN 即可

对于 Debian 或 Ubuntu 镜像

```Dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

Alpine Linux 镜像使用 apk 包管理器，安装 FFmpeg 的方式略有不同

```Dockerfile
RUN apk add --no-cache ffmpeg
```

如果你使用的是基于 CentOS 的镜像，可以使用以下命令安装 FFmpeg：

```Dockerfile
RUN yum install -y epel-release && yum install -y ffmpeg
```

后续就是通用的构建镜像并且使用的流程
```bash
docker build -t docker-with-ffmpeg .
docker run -it --rm docker-with-ffmpeg bash
```
## 关于 ffmpeg 使用
### 在命令行使用
在终端中输入以下命令检查 ffmpeg 是否已经安装

```bash
ffmpeg -version
ffmpeg
```
操作 ffmpeg 切分视频
```
ffmpeg -i tempAudio.wav -ss 00:00:00 -t 00:00:10 -c copy splitAudio.wav
```
解释命令参数：

-i tempAudio.wav：指定输入文件为tempAudio.wav。-i参数后面跟的是要处理的输入文件
-ss 00:00:00：设置截取的起始时间。这里的时间是00:00:00，即从音频的开始位置开始截取。-ss参数允许你指定截取片段的起始时间点
-t 00:00:10：设置截取的持续时间。这里的00:00:10意味着截取时长为10秒的音频片段
-c copy：指定编码方式为复制模式。这意味着 FFmpeg 不会重新编码音频数据，而是直接从源文件复制音频流到目标文件
splitAudio.wav：这是输出文件的名称。经过截取后的音频片段将被保存到这个文件中

获取音频文件的时长：
```bash
ffprobe -i "path/to/audio_file.mp3" -show_entries format=duration -v quiet -of csv="p=0"
```
解释命令参数：

-i: 指定输入的音频文件路径
-show_entries format=duration: 显示格式中的“duration”条目，即音频文件的持续时间
-v quiet: 设置日志级别为 quiet，只显示错误信息
-of csv="p=0": 设置输出格式为 CSV 格式，其中 p=0 表示不使用管道分隔符，只输出数字

### 在 java 代码中使用
我们可以通过 ProcessBuilder 来调用 ffmpeg 功能。这种方式需要保证我们的机器里已经安装了 ffmpeg，并且 ffmpeg 已经配置到了环境变量里

ProcessBuilder 是 Java 中的一个类，位于 java.lang 包下，用于创建和启动新的系统进程。它是 Java 平台标准库的一部分，提供了高级别的抽象来控制和启动外部进程，允许你在 Java 应用程序中执行操作系统命令或运行其他可执行程序

```java
    private void splitAudio(File file) {
        try {
            String[] command = {
                    "ffmpeg",
                    "-i", file.getName(),
                    "-ss", "00:00:00",
                    "-t", "00:00:10",
                    "-c", "copy",
                    "splitAudio.wav"
            };

            ProcessBuilder pb = new ProcessBuilder(command);
            // 设置执行命令的目录
            pb.directory(file.getParentFile());
            pb.redirectErrorStream(true);
            Process process = pb.start();
            // 确保进程结束
            process.waitFor();
        } catch (Exception e) {
            LOGGER.error("splitAudio error e = ", e);
        }
    }
```

## 关于 javacv、ffmpeg-platform 的使用
javacv 是一个封装了多个计算机视觉和多媒体处理库（包括 OpenCV、FFmpeg 等）的 Java 绑定库，它允许开发者在 Java 中方便地使用这些底层库的功能。导入了 javacv 后，在 java 中使用 ffmpeg 的功能，就不用安装 ffmpeg 了，因为该库已经自带了二进制的 ffmpeg

maven 导入方式
```xml
        <dependency>
            <groupId>org.bytedeco</groupId>
            <artifactId>javacv</artifactId>
            <version>1.5.6</version>
        </dependency>
        <dependency>
            <groupId>org.bytedeco</groupId>
            <artifactId>ffmpeg-platform</artifactId>
            <version>4.4-1.5.6</version>
        </dependency>
        <dependency>
            <groupId>org.bytedeco</groupId>
            <artifactId>javacpp</artifactId>
            <version>1.5.3</version>
        </dependency>

```

我们主要会使用该库中的 FFmpegFrameGrabber 类，FFmpegFrameGrabber 类提供了从各种来源（如视频文件、摄像头、网络流等）捕获音频和视频帧的能力。它利用 FFmpeg 库的强大功能来处理媒体数据，从而使得在 Java 中进行媒体文件的读取、处理和分析变得相对简单

这里额外提一个坑点，**由于使用 ffmpeg 必须要使用 cpp，如果使用 javacpp 这个包，并且 javacpp 如果只放在子包中，在使用的时候会找不到**。会出现 java.lang.ClassNotFoundException: org.bytedeco.javacpp.presets.javacpp 问题

这个问题可能的原因是 javacpp 并非传统的 jar 包，它导入的其实是二进制的 cpp 文件，导致依赖传递失效

下面给一个使用 javacv 将音频文件切分的例子：
```java
    public static void audioClip() throws Exception {
        FFmpegFrameGrabber grabber = new FFmpegFrameGrabber("/Users/yfx/Documents/getFile.wav");
        grabber.start();

        FFmpegFrameRecorder recorder = new FFmpegFrameRecorder("/Users/yfx/Documents/getFileOut.wav", grabber.getAudioChannels());
        recorder.setAudioCodec(grabber.getAudioCodec());
        recorder.setAudioBitrate(grabber.getAudioBitrate());
        recorder.setSampleRate(grabber.getSampleRate());
        recorder.start();

        double endTime = 10;

        Frame frame;
        while ((frame = grabber.grabFrame()) != null) {
            if (frame.samples == null) {
                break;
            }

            double timestamp = grabber.getTimestamp() / 1000000.0;
            if (timestamp >= 0 && timestamp <= endTime) {
                recorder.record(frame);
            }
        }

        grabber.stop();
        recorder.stop();
    }
```
这里额外提一点就是，用户上传的文件我们一般是通过 MultipartFile 接受的，而 FFmpegFrameGrabber 可以操作的只是 File 类，因此我们需要先将 MultipartFile 转化成 File 才可以使用 FFmpegFrameGrabber，代码如下：

```java
    public static FFmpegFrameGrabber convertMultipartFileToFFmpegFrameGrabber(MultipartFile file) throws IOException {
        // 创建一个临时文件来存储上传的文件内容
        File tempFile = File.createTempFile("temp_video", ".mp4");
        tempFile.deleteOnExit(); // 确保应用程序退出时删除临时文件

        // 将 MultipartFile 写入到临时文件中
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(file.getBytes());
        }

        // 使用 FFmpegFrameGrabber 打开临时文件
        FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(tempFile.getAbsolutePath());
        grabber.start();

        return grabber;
    }
}
```
