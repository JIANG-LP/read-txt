import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as iconv from 'iconv-lite';

/**
 * 支持的编码列表
 */
const SUPPORTED_ENCODINGS = [
    'utf8',
    'gbk',
    'gb2312',
    'gb18030',
    'big5',
    'ascii',
    'latin1'
];

/**
 * TXT 文件读取器类
 * 负责读取和解析 TXT 文件内容，支持多种编码格式
 */
export class TxtFileReader {
    private filePath: string = '';
    private lines: string[] = [];
    private currentIndex: number = -1;
    private fileWatcher?: vscode.FileSystemWatcher;
    private refreshTimer?: NodeJS.Timeout;
    private currentEncoding: string = 'utf8';

    /**
     * 加载文件
     * @param filePath 文件路径
     */
    public loadFile(filePath: string): void {
        // 清理之前的资源
        this.dispose();

        if (!filePath) {
            throw new Error('文件路径不能为空');
        }

        // 验证文件是否存在
        if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在：${filePath}`);
        }

        // 验证是否为 txt 文件
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.txt') {
            throw new Error('请选择 TXT 格式的文件');
        }

        this.filePath = filePath;
        this.readFileWithEncodingDetection();
        this.setupFileWatcher();
        this.setupAutoRefresh();
        this.setupConfigListener(); // 监听配置变化
    }

    /**
     * 监听配置变化（charsPerLine）
     */
    private setupConfigListener(): void {
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('txtReader.charsPerLine')) {
                console.log('检测到 charsPerLine 配置变化，重新加载文件');
                // 配置变化时重新加载文件以应用新的分行设置
                if (this.filePath && fs.existsSync(this.filePath)) {
                    this.readFileWithEncodingDetection();
                }
            }
        });
    }

    /**
     * 检测文件编码并读取
     */
    private readFileWithEncodingDetection(): void {
        try {
            // 首先尝试 UTF-8
            const contentUtf8 = fs.readFileSync(this.filePath);
            
            // 检查是否有 BOM 头
            if (contentUtf8.length >= 3 && 
                contentUtf8[0] === 0xEF && 
                contentUtf8[1] === 0xBB && 
                contentUtf8[2] === 0xBF) {
                // UTF-8 with BOM
                this.currentEncoding = 'utf8';
                this.parseContent(contentUtf8.toString('utf8'));
                console.log(`检测到 UTF-8 with BOM 编码`);
                return;
            }

            // 尝试用不同编码解码并检测乱码
            for (const encoding of SUPPORTED_ENCODINGS) {
                try {
                    const content = iconv.decode(contentUtf8, encoding);
                    
                    // 检测是否包含有效中文字符且无乱码
                    if (this.isValidChineseText(content)) {
                        this.currentEncoding = encoding;
                        this.parseContent(content);
                        console.log(`自动检测到编码：${encoding}`);
                        return;
                    }
                } catch (e) {
                    // 跳过无法解码的编码
                    continue;
                }
            }

            // 如果都没有检测到，默认使用 UTF-8
            this.currentEncoding = 'utf8';
            this.parseContent(contentUtf8.toString('utf8'));
            console.log('使用默认 UTF-8 编码');
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            throw new Error(`读取文件失败：${errorMessage}`);
        }
    }

    /**
     * 检测文本是否为有效的中文文本
     * @param text 待检测的文本
     */
    private isValidChineseText(text: string): boolean {
        // 移除空白字符
        const trimmed = text.trim();
        if (!trimmed) {
            return false;
        }

        // 检测是否包含中文字符
        const hasChinese = /[\u4e00-\u9fa5]/.test(trimmed);
        
        // 检测是否包含明显的乱码特征
        // 连续的替换字符 () 或其他异常字符
        const hasGarbled = /[]{3,}/.test(trimmed) || 
                          /[]{2,}/.test(trimmed);

        // 如果是中文文本且没有明显乱码，则认为是有效的
        return hasChinese && !hasGarbled;
    }

    /**
     * 解析文件内容
     * @param content 文件内容
     */
    private parseContent(content: string): void {
        // 按行分割，过滤掉空行
        const rawLines = content.split(/\r?\n/).filter(line => line.trim() !== '');
        
        // 获取配置的每行字符数
        const charsPerLine = vscode.workspace.getConfiguration('txtReader').get<number>('charsPerLine', 30);
        
        // 将长行按字符数分割成多行
        this.lines = this.splitLongLines(rawLines, charsPerLine);
        
        if (this.lines.length === 0) {
            this.currentIndex = -1;
            throw new Error('文件内容为空');
        }

        // 重置索引到第一行
        this.currentIndex = 0;
        
        console.log(`成功读取文件，共 ${this.lines.length} 行（按每行${charsPerLine}字分割），编码：${this.currentEncoding}`);
    }

    /**
     * 将超长行按字符数分割
     * @param lines 原始行数组
     * @param charsPerLine 每行字符数
     * @returns 分割后的行数组
     */
    private splitLongLines(lines: string[], charsPerLine: number): string[] {
        const result: string[] = [];
        
        for (const line of lines) {
            if (line.length <= charsPerLine) {
                // 不超过限制，直接添加
                result.push(line);
            } else {
                // 超过限制，按字符数分割
                for (let i = 0; i < line.length; i += charsPerLine) {
                    result.push(line.slice(i, i + charsPerLine));
                }
            }
        }
        
        return result;
    }

    /**
     * 设置文件监听器
     */
    private setupFileWatcher(): void {
        const uri = vscode.Uri.file(this.filePath);
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(uri, '*'));

        // 监听文件变化
        this.fileWatcher.onDidChange(() => {
            console.log('文件发生变化，重新读取');
            const currentLine = this.getCurrentLine();
            this.readFileWithEncodingDetection();
            
            // 尝试保持当前行
            if (currentLine && this.lines.length > 0) {
                const newIndex = this.lines.findIndex(line => line === currentLine);
                this.currentIndex = newIndex >= 0 ? newIndex : 0;
            }
        });

        // 监听文件删除
        this.fileWatcher.onDidDelete(() => {
            vscode.window.showWarningMessage(`文件已被删除：${this.filePath}`);
            this.dispose();
        });
    }

    /**
     * 设置自动刷新
     */
    private setupAutoRefresh(): void {
        const config = vscode.workspace.getConfiguration('txtReader');
        const interval = config.get<number>('refreshInterval', 0);

        if (interval > 0) {
            this.refreshTimer = setInterval(() => {
                try {
                    this.readFileWithEncodingDetection();
                } catch (error) {
                    console.error('自动刷新失败:', error);
                }
            }, interval);
        }
    }

    /**
     * 获取当前行内容
     */
    public getCurrentLine(): string | undefined {
        if (this.currentIndex < 0 || this.currentIndex >= this.lines.length) {
            return undefined;
        }
        return this.lines[this.currentIndex];
    }

    /**
     * 获取上一行
     */
    public getPreviousLine(): string | undefined {
        if (this.lines.length === 0) {
            return undefined;
        }

        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            // 循环到最后一行
            this.currentIndex = this.lines.length - 1;
        }

        return this.getCurrentLine();
    }

    /**
     * 获取下一行
     */
    public getNextLine(): string | undefined {
        if (this.lines.length === 0) {
            return undefined;
        }

        if (this.currentIndex < this.lines.length - 1) {
            this.currentIndex++;
        } else {
            // 循环到第一行
            this.currentIndex = 0;
        }

        return this.getCurrentLine();
    }

    /**
     * 获取当前行索引（从 1 开始）
     */
    public getCurrentIndex(): number {
        return this.currentIndex + 1;
    }

    /**
     * 获取总行数
     */
    public getTotalLines(): number {
        return this.lines.length;
    }

    /**
     * 获取文件路径
     */
    public getFilePath(): string {
        return this.filePath;
    }

    /**
     * 获取当前使用的编码
     */
    public getEncoding(): string {
        return this.currentEncoding;
    }

    /**
     * 手动指定编码重新加载
     * @param encoding 编码格式
     */
    public reloadWithEncoding(encoding: string): void {
        if (!SUPPORTED_ENCODINGS.includes(encoding)) {
            throw new Error(`不支持的编码格式：${encoding}`);
        }

        try {
            const buffer = fs.readFileSync(this.filePath);
            const content = iconv.decode(buffer, encoding);
            this.currentEncoding = encoding;
            this.parseContent(content);
            console.log(`使用指定编码重新加载：${encoding}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            throw new Error(`使用编码 ${encoding} 读取失败：${errorMessage}`);
        }
    }

    /**
     * 检查是否有加载文件
     */
    public hasFile(): boolean {
        return this.lines.length > 0;
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = undefined;
        }

        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = undefined;
        }

        this.filePath = '';
        this.lines = [];
        this.currentIndex = -1;
        this.currentEncoding = 'utf8';
    }
}
