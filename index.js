#!/usr/bin/env node

const { program } = require('commander');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk'); // 引入 chalk

// 定义命令行工具的选项和用法
program
    .version('1.0.0')
    .description('从 GitHub Gist 下载文件到指定文件夹')
    .option('-c, --config <configPath>', '指定 gist.config.json 配置文件路径')
    .action(async (options) => {
        let configPath;
        if (options.config) {
            configPath = options.config;
        } else {
            const defaultPath = path.join(process.cwd(), 'gist.config.json');
            if (await fs.pathExists(defaultPath)) {
                configPath = defaultPath;
            } else {
                console.error(
                    chalk.red(
                        "错误：没有找到 'gist.config.json' 配置文件，请将文件放在当前目录下或使用 '-c' 参数指定配置文件路径。"
                    )
                );
                process.exit(1);
            }
        }

        try {
            const config = await readConfig(configPath);

            for (const item of config.items) {
                await processGistItem(item);
            }

            console.log(chalk.green('所有文件下载完成！')); // 使用 chalk 美化输出
        } catch (error) {
            console.error(chalk.red('发生错误：'), error.message); // 使用 chalk 美化输出
        }
    });
program
    .command('sync <gistId>') // 定义一个 add 子命令
    .description('同步一个gist文件到本地')
    .option('-f, --filename <filename>', '文件名')
    .option('-o, --output <output>', '输出路径')
    .action(async (gistId, options) => {
        const { filename, output } = options;

        if (!filename) {
            console.error(chalk.red('文件名不能为空！')); // 使用 chalk 美化输出
            return;
        }

        if (!output) {
            console.error(chalk.red('输出路径不能为空！')); // 使用 chalk 美化输出
            return;
        }

        try {
            await processGistItem({ gistId, fileName: filename, outputDir: output });
        } catch (error) {
            console.error(chalk.red('发生错误：'), error.message); // 使用 chalk 美化输出
        }
    });
program.parse(process.argv);

// 读取配置文件
async function readConfig(configPath) {
    try {
        const rawConfig = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(rawConfig);
        if (!config.items || !Array.isArray(config.items)) {
            throw new Error("配置文件格式不正确，必须包含一个名为 'items' 的数组。");
        }
        return config;
    } catch (error) {
        throw new Error(`读取配置文件失败: ${error.message}`);
    }
}

// 处理每个配置项
async function processGistItem(item) {
    const { gistId, fileName, outputDir } = item;
    if (!gistId || !fileName || !outputDir) {
        console.warn(
            chalk.yellow(`配置项缺少 gistId, fileName 或 outputDir，已跳过：${JSON.stringify(item)}`) // 使用 chalk 美化输出
        );
        return;
    }

    try {
        const gistUrl = `https://api.github.com/gists/${gistId}`;
        const response = await axios.get(gistUrl);
        if (response.status !== 200) {
            throw new Error(`获取 Gist 数据失败，状态码: ${response.status}`);
        }
        const gistData = response.data;

        const file = gistData.files[fileName];
        if (!file || !file.raw_url) {
            throw new Error(`Gist ${gistId} 中找不到文件 ${fileName}`);
        }
        const rawUrl = file.raw_url;

        const fileResponse = await axios.get(rawUrl);
        if (fileResponse.status !== 200) {
            throw new Error(`下载文件 ${fileName} 内容失败，状态码: ${fileResponse.status}`);
        }
        const fileContent = fileResponse.data;

        const resolvedOutputDir = path.resolve(outputDir);
        await fs.ensureDir(resolvedOutputDir);
        const outputPath = path.join(resolvedOutputDir, fileName);

        await fs.writeFile(outputPath, fileContent);

        console.log(chalk.cyan(`文件 ${fileName} 已成功保存到: ${outputPath}`)); // 使用 chalk 美化输出
    } catch (error) {
        console.error(
            chalk.red(`处理 Gist ${gistId} 文件 ${fileName} 时发生错误：`), // 使用 chalk 美化输出
            error.message
        );
    }
}