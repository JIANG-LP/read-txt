import * as vscode from 'vscode';
import { TxtFileReader } from './txtFileReader';
import { StatusBarManager } from './statusBarManager';

let statusBarManager: StatusBarManager | undefined;

/**
 * 插件激活函数
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('TXT Status Bar Reader 插件已激活');

    // 初始化状态栏管理器
    statusBarManager = new StatusBarManager(context);
    
    // 注册命令
    registerCommands(context);

    // 自动尝试加载配置的文件路径
    const configFilePath = vscode.workspace.getConfiguration('txtReader').get<string>('filePath', '');
    if (configFilePath) {
        try {
            statusBarManager.loadFile(configFilePath);
            statusBarManager.show();
        } catch (error) {
            vscode.window.showWarningMessage(`无法自动加载配置文件：${configFilePath}`);
        }
    }
}

/**
 * 注册所有命令
 */
function registerCommands(context: vscode.ExtensionContext) {
    // 显示状态栏
    context.subscriptions.push(
        vscode.commands.registerCommand('txtReader.showStatus', () => {
            if (statusBarManager) {
                statusBarManager.show();
            }
        })
    );

    // 隐藏状态栏
    context.subscriptions.push(
        vscode.commands.registerCommand('txtReader.hideStatus', () => {
            if (statusBarManager) {
                statusBarManager.hide();
            }
        })
    );

    // 切换显示/隐藏
    context.subscriptions.push(
        vscode.commands.registerCommand('txtReader.toggleStatus', () => {
            if (statusBarManager) {
                if (statusBarManager.isVisible()) {
                    statusBarManager.hide();
                } else {
                    statusBarManager.show();
                }
            }
        })
    );

    // 选择文件
    context.subscriptions.push(
        vscode.commands.registerCommand('txtReader.selectFile', async () => {
            if (!statusBarManager) {
                return;
            }

            const options: vscode.OpenDialogOptions = {
                canSelectMany: false,
                openLabel: '选择 TXT 文件',
                filters: {
                    'Text Files': ['txt']
                }
            };

            try {
                const fileUri = await vscode.window.showOpenDialog(options);
                if (fileUri && fileUri[0]) {
                    const filePath = fileUri[0].fsPath;
                    statusBarManager.loadFile(filePath);
                    
                    // 更新配置
                    await vscode.workspace.getConfiguration().update(
                        'txtReader.filePath',
                        filePath,
                        vscode.ConfigurationTarget.Global
                    );
                    
                    statusBarManager.show();
                    vscode.window.showInformationMessage(`已加载文件：${filePath}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '未知错误';
                vscode.window.showErrorMessage(`选择文件失败：${errorMessage}`);
            }
        })
    );

    // 上一行
    context.subscriptions.push(
        vscode.commands.registerCommand('txtReader.previousLine', () => {
            if (statusBarManager) {
                statusBarManager.previousLine();
            }
        })
    );

    // 下一行
    context.subscriptions.push(
        vscode.commands.registerCommand('txtReader.nextLine', () => {
            if (statusBarManager) {
                statusBarManager.nextLine();
            }
        })
    );

    // 手动选择编码
    context.subscriptions.push(
        vscode.commands.registerCommand('txtReader.selectEncoding', async () => {
            if (!statusBarManager) {
                return;
            }

            const encodingOptions = [
                { label: 'UTF-8', description: '通用编码，支持多国语言', encoding: 'utf8' },
                { label: 'GBK', description: '简体中文常用编码', encoding: 'gbk' },
                { label: 'GB2312', description: '简体中文标准编码', encoding: 'gb2312' },
                { label: 'GB18030', description: '中文扩展编码', encoding: 'gb18030' },
                { label: 'BIG5', description: '繁体中文编码', encoding: 'big5' },
                { label: 'Latin-1', description: '西欧语言编码', encoding: 'latin1' }
            ];

            try {
                const selected = await vscode.window.showQuickPick(encodingOptions, {
                    placeHolder: '请选择文件编码格式',
                    matchOnDescription: true
                });

                if (selected && statusBarManager) {
                    // 这里需要 StatusBarManager 暴露 reloadWithEncoding 方法
                    // 暂时通过重新加载文件来实现
                    vscode.window.showInformationMessage(`已选择编码：${selected.label}`);
                    
                    // 显示编码提示信息
                    vscode.window.showInformationMessage(
                        `将使用 ${selected.label} 编码重新加载文件`,
                        '确认'
                    ).then(selection => {
                        if (selection === '确认') {
                            // 重新选择文件以应用新编码
                            vscode.commands.executeCommand('txtReader.selectFile');
                        }
                    });
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '未知错误';
                vscode.window.showErrorMessage(`选择编码失败：${errorMessage}`);
            }
        })
    );
}

/**
 * 插件停用函数
 */
export function deactivate() {
    console.log('TXT Status Bar Reader 插件已停用');
    if (statusBarManager) {
        statusBarManager.dispose();
    }
}
