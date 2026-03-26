import * as vscode from 'vscode';
import { TxtFileReader } from './txtFileReader';

/**
 * 状态栏管理器类
 * 负责管理 VSCode 状态栏的显示和交互
 */
export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private txtReader: TxtFileReader;
    private previousButton: vscode.StatusBarItem | undefined;
    private nextButton: vscode.StatusBarItem | undefined;
    private visible: boolean = false;
    private autoPageTimer: NodeJS.Timeout | undefined;
    private autoPageEnabled: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        // 创建主文本显示项
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'txtReader.selectFile';
        this.statusBarItem.tooltip = '点击选择 TXT 文件，当前未加载文件';
        
        // 创建上一行按钮
        this.previousButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            101
        );
        this.previousButton.text = '$(chevron-left) 上一行';
        this.previousButton.tooltip = '显示上一行内容';
        this.previousButton.command = 'txtReader.previousLine';
        
        // 创建下一行按钮
        this.nextButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            101
        );
        this.nextButton.text = '下一行 $(chevron-right)';
        this.nextButton.tooltip = '显示下一行内容';
        this.nextButton.command = 'txtReader.nextLine';

        // 初始化读取器
        this.txtReader = new TxtFileReader();

        // 添加到订阅列表，确保插件停用时清理资源
        context.subscriptions.push(
            this.statusBarItem,
            this.previousButton,
            this.nextButton
        );
        
        // 监听配置变化
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('txtReader.autoPageInterval')) {
                    this.updateAutoPageSetting();
                }
            })
        );
        
        // 初始化自动翻页设置
        this.updateAutoPageSetting();
    }

    /**
     * 加载文件
     * @param filePath 文件路径
     */
    public loadFile(filePath: string): void {
        try {
            this.txtReader.loadFile(filePath);
            this.updateDisplay();
            this.updateTooltip();
            
            this.statusBarItem.tooltip = `点击切换文件 | 当前：${this.txtReader.getFilePath()}`;
            vscode.window.showInformationMessage(
                `已加载文件，共 ${this.txtReader.getTotalLines()} 行`
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            vscode.window.showErrorMessage(`加载文件失败：${errorMessage}`);
            throw error;
        }
    }

    /**
     * 显示状态栏
     */
    public show(): void {
        if (!this.txtReader.hasFile()) {
            vscode.window.showWarningMessage('请先选择一个 TXT 文件');
            vscode.commands.executeCommand('txtReader.selectFile');
            return;
        }

        this.statusBarItem.show();
        this.previousButton?.show();
        this.nextButton?.show();
        this.visible = true;
        this.updateDisplay();
        
        // 如果启用了自动翻页，启动定时器
        if (this.autoPageEnabled) {
            this.startAutoPage();
        }
    }

    /**
     * 隐藏状态栏
     */
    public hide(): void {
        this.statusBarItem.hide();
        this.previousButton?.hide();
        this.nextButton?.hide();
        this.visible = false;
        
        // 隐藏时停止自动翻页
        this.stopAutoPage();
    }

    /**
     * 检查是否可见
     */
    public isVisible(): boolean {
        return this.visible;
    }

    /**
     * 显示上一行
     */
    public previousLine(): void {
        if (!this.txtReader.hasFile()) {
            vscode.window.showWarningMessage('请先选择一个 TXT 文件');
            return;
        }

        const line = this.txtReader.getPreviousLine();
        if (line !== undefined) {
            this.updateDisplay();
            this.showStatusMessage(`第 ${this.txtReader.getCurrentIndex()} / ${this.txtReader.getTotalLines()} 行`);
        }
    }

    /**
     * 显示下一行
     */
    public nextLine(): void {
        if (!this.txtReader.hasFile()) {
            vscode.window.showWarningMessage('请先选择一个 TXT 文件');
            return;
        }

        const line = this.txtReader.getNextLine();
        if (line !== undefined) {
            this.updateDisplay();
            this.showStatusMessage(`第 ${this.txtReader.getCurrentIndex()} / ${this.txtReader.getTotalLines()} 行`);
            
            // 如果启用了自动翻页，重置定时器（避免在手动切换时立即触发自动翻页）
            if (this.autoPageEnabled) {
                this.resetAutoPageTimer();
            }
        }
    }

    /**
     * 更新显示内容
     */
    private updateDisplay(): void {
        const currentLine = this.txtReader.getCurrentLine();
        if (currentLine !== undefined) {
            // 限制显示长度，避免状态栏过长
            const maxLength = 50;
            let displayText = currentLine;
            
            if (displayText.length > maxLength) {
                displayText = displayText.substring(0, maxLength - 3) + '...';
            }

            // 使用文档图标前缀
            this.statusBarItem.text = `$(file-text) ${displayText}`;
        } else {
            this.statusBarItem.text = '$(file-text) 无内容';
        }
    }

    /**
     * 更新工具提示
     */
    private updateTooltip(): void {
        if (this.txtReader.hasFile()) {
            const total = this.txtReader.getTotalLines();
            const current = this.txtReader.getCurrentIndex();
            const filePath = this.txtReader.getFilePath();
            const encoding = this.txtReader.getEncoding();
            
            // 编码格式中文映射
            const encodingMap: Record<string, string> = {
                'utf8': 'UTF-8',
                'gbk': 'GBK (简体中文)',
                'gb2312': 'GB2312 (简体中文)',
                'gb18030': 'GB18030 (中文扩展)',
                'big5': 'BIG5 (繁体中文)',
                'ascii': 'ASCII',
                'latin1': 'Latin-1'
            };
            
            const encodingName = encodingMap[encoding] || encoding;
            
            this.statusBarItem.tooltip = 
                `📄 文件：${path.basename(filePath)}\n` +
                `📊 进度：第 ${current} / ${total} 行\n` +
                `🔤 编码：${encodingName}\n` +
                `📍 路径：${filePath}\n\n` +
                `点击切换文件 | ← 上一行 | → 下一行`;
        }
    }

    /**
     * 显示状态消息
     * @param message 消息内容
     */
    private showStatusMessage(message: string): void {
        vscode.window.setStatusBarMessage(`TXT Reader: ${message}`, 2000);
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        this.stopAutoPage(); // 停止自动翻页
        this.txtReader.dispose();
        this.hide();
    }

    /**
     * 更新自动翻页设置
     */
    private updateAutoPageSetting(): void {
        const config = vscode.workspace.getConfiguration('txtReader');
        const interval = config.get<number>('autoPageInterval', 0);
        
        this.autoPageEnabled = interval > 0;
        
        if (this.autoPageEnabled && this.visible) {
            this.startAutoPage(interval);
        } else {
            this.stopAutoPage();
        }
    }

    /**
     * 启动自动翻页
     * @param interval 翻页间隔（毫秒）
     */
    private startAutoPage(interval?: number): void {
        this.stopAutoPage(); // 先停止现有的定时器
        
        if (!interval) {
            const config = vscode.workspace.getConfiguration('txtReader');
            interval = config.get<number>('autoPageInterval', 0);
        }
        
        if (interval && interval > 0 && this.visible) {
            this.autoPageTimer = setInterval(() => {
                this.nextLine();
            }, interval);
            
            console.log(`自动翻页已启动，间隔：${interval}ms`);
        }
    }

    /**
     * 重置自动翻页定时器
     */
    private resetAutoPageTimer(): void {
        if (this.autoPageEnabled) {
            this.startAutoPage();
        }
    }

    /**
     * 停止自动翻页
     */
    private stopAutoPage(): void {
        if (this.autoPageTimer) {
            clearInterval(this.autoPageTimer);
            this.autoPageTimer = undefined;
            console.log('自动翻页已停止');
        }
    }
}

// 需要引入 path 模块用于获取文件名
import * as path from 'path';
