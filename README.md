# gistolocal

> 从 GitHub Gist 下载文件到指定文件夹

## 安装 

```
npm i -g gistolocal
```

## 使用
> **filename** 指的都是存在gist上的文件名，不是本地文件名
### 同步单个文件到本地

```bash
gistolocal -g <gistId> -f <fileName> -o <outputDir>
```

### 使用配置文件批量同步文件到本地

```json
// filename is gist.config.json
{
    "items": [
        {
            "gistId": "xxx",// gist id
            "fileName": "x.js", // filename
            "outputDir": "./output1" //
        },
        {
            "gistId": "xxx",
            "fileName": "x.md",
            "outputDir": "./output2"
        },
        {
            "gistId": "xxx",
            "fileName": "x.md",
            "outputDir": "./output3"
        }
    ]
}
```

### 命令

```bash
gistolocal -c gist.config.json

// or
 
gistolocal --config gist.config.json
```