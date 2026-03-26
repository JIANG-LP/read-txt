# VSCode 插件开发指南

## 项目概述

本项目是一个功能完整的 VSCode 插件，实现在状态栏中显示 TXT 文件内容，并支持逐行切换。

## 技术栈

- **TypeScript**: 主要开发语言
- **VSCode Extension API**: 插件开发框架
- **Node.js fs 模块**: 文件系统操作

## 核心架构

### 1. 文件结构

```
read-demo/
├── src/                        # 源代码目录
│   ├── extension.ts           # 插件入口文件
│   ├── txtFileReader.ts       # TXT 文件读取器
│   └── statusBarManager.ts    # 状态栏管理器
├── out/                        # 编译输出目录
├── .vscode/                    # VSCode 配置
│   ├── launch.json            # 调试配置
│   ├── tasks.json             # 任务配置
│   └── settings.json          # 工作区设置
├── package.json               # 插件配置文件
├── tsconfig.json              # TypeScript 配置
├── .vscodeignore              # 打包忽略配置
├── README.md                  # 使用说明
├── CHANGELOG.md               # 变更日志
└── example.txt                # 示例文件
```

### 2. 核心类说明

#### TxtFileReader (txtFileReader.ts)
负责文件读取和管理的核心类

**主要方法：**
- `loadFile(filePath)`: 加载 TXT 文件
- `getCurrentLine()`: 获取当前行内容
- `getPreviousLine()`: 获取上一行
- `getNextLine()`: 获取下一行
- `dispose()`: 清理资源

**特性：**
- 文件变化监听
- 自动刷新支持
- 循环浏览（首尾相连）
- 空行过滤

#### StatusBarManager (statusBarManager.ts)
负责状态栏 UI 管理和用户交互

**主要方法：**
- `loadFile(filePath)`: 加载文件并更新显示
- `show()`: 显示状态栏
- `hide()`: 隐藏状态栏
- `previousLine()`: 切换到上一行
- `nextLine()`: 切换到下一行
- `dispose()`: 清理资源

**UI 组成：**
- 左侧按钮：上一行
- 中间文本：当前内容显示
- 右侧按钮：下一行

#### extension.ts
插件入口，负责初始化和命令注册

**主要功能：**
- 初始化 StatusBarManager
- 注册所有命令
- 处理快捷键绑定
- 恢复上次配置的文件

## 功能实现详解

### 1. 状态栏显示组件

```typescript
// 创建状态栏项
this.statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
);

// 设置文本和图标
this.statusBarItem.text = `$(file-text) ${displayText}`;

// 设置工具提示
this.statusBarItem.tooltip = '详细信息...';

// 设置点击命令
this.statusBarItem.command = 'txtReader.selectFile';
```

**关键点：**
- 使用 `StatusBarAlignment.Left` 左对齐
- 优先级数字越大越靠左
- 使用 `$(icon-name)` 显示图标
- 文本过长时自动截断

### 2. 左右切换按钮

```typescript
// 上一行按钮
this.previousButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    101  // 更高的优先级，显示在更左边
);
this.previousButton.text = '$(chevron-left) 上一行';
this.previousButton.command = 'txtReader.previousLine';

// 下一行按钮
this.nextButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    101
);
this.nextButton.text = '下一行 $(chevron-right)';
this.nextButton.command = 'txtReader.nextLine';
```

### 3. 文件读取和解析

```typescript
private readFile(): void {
    const content = fs.readFileSync(this.filePath, 'utf-8');
    // 按行分割，过滤空行
    this.lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    this.currentIndex = 0;
}
```

**处理逻辑：**
- 使用 `fs.readFileSync` 同步读取
- 正则表达式 `/\r?\n/` 兼容不同换行符
- 过滤掉纯空白的行
- 自动定位到第一行

### 4. 快捷键绑定

在 `package.json` 中配置：

```json
"keybindings": [
  {
    "command": "txtReader.toggleStatus",
    "key": "ctrl+shift+t",
    "mac": "cmd+shift+t",
    "when": "editorTextFocus"
  }
]
```

**条件说明：**
- `when`: 定义快捷键生效的条件
- `editorTextFocus`: 编辑器有焦点时

### 5. 文件监听

```typescript
setupFileWatcher(): void {
    const uri = vscode.Uri.file(this.filePath);
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(uri, '*')
    );
    
    // 监听变化
    this.fileWatcher.onDidChange(() => {
        this.readFile();
    });
    
    // 监听删除
    this.fileWatcher.onDidDelete(() => {
        vscode.window.showWarningMessage('文件已被删除');
        this.dispose();
    });
}
```

### 6. 错误处理

```typescript
try {
    this.txtReader.loadFile(filePath);
} catch (error) {
    const errorMessage = error instanceof Error 
        ? error.message 
        : '未知错误';
    vscode.window.showErrorMessage(`加载文件失败：${errorMessage}`);
}
```

**错误类型：**
- 文件不存在
- 文件格式错误
- 文件内容为空
- 权限问题

### 7. 配置持久化

```typescript
// 读取配置
const filePath = vscode.workspace.getConfiguration('txtReader')
    .get<string>('filePath', '');

// 保存配置
await vscode.workspace.getConfiguration().update(
    'txtReader.filePath',
    filePath,
    vscode.ConfigurationTarget.Global
);
```

## 开发流程

### 1. 环境搭建

```bash
# 安装 Node.js (v16+)
# 安装 VSCode

# 克隆项目
git clone <repository>

# 进入项目目录
cd read-demo

# 安装依赖
npm install

# 编译
npm run compile

# 监听模式（开发时）
npm run watch
```

### 2. 调试运行

1. 在 VSCode 中打开项目
2. 按 `F5` 启动调试
3. 在新窗口中测试插件
4. 查看调试控制台的日志

### 3. 打包发布

```bash
# 安装 vsce 工具
npm install -g vsce

# 登录（需要 Microsoft 账号）
vsce login <publisher-name>

# 打包
vsce package

# 发布
vsce publish
```

## 最佳实践

### 1. 代码组织
- 单一职责：每个类只负责一个功能
- 清晰的接口：公共方法明确输入输出
- 资源管理：及时清理订阅和监听器

### 2. 用户体验
- 即时反馈：操作后立即显示状态
- 友好提示：错误信息清晰明确
- 快捷操作：提供多种交互方式

### 3. 性能优化
- 避免频繁 IO：文件变化时再读取
- 限制显示长度：防止状态栏溢出
- 异步操作：耗时操作使用异步

### 4. 错误处理
- 防御性编程：检查参数有效性
- 完整捕获：捕获所有可能的异常
- 优雅降级：出错时保持基本功能

## 扩展功能建议

### 可以继续添加的功能：

1. **多文件支持**
   - 文件列表管理
   - 快速切换文件

2. **显示模式**
   - 顺序/随机播放
   - 自定义刷新频率

3. **标记功能**
   - 书签标记重要行
   - 快速跳转到书签

4. **搜索功能**
   - 关键字搜索
   - 高亮匹配行

5. **导出功能**
   - 导出当前行为其他格式
   - 批量导出

6. **主题定制**
   - 自定义状态栏样式
   - 颜色主题支持

## 常见问题解决

### Q1: 状态栏不显示？
**解决：**
- 检查是否已选择文件
- 查看状态栏是否被隐藏（右键状态栏检查）
- 确认插件已激活

### Q2: 快捷键无效？
**解决：**
- 检查快捷键冲突（`Ctrl+K Ctrl+S`）
- 确认在编辑器聚焦状态下
- 重新加载窗口

### Q3: 文件更新不同步？
**解决：**
- 检查文件监听器是否正常
- 手动重新选择文件
- 查看控制台错误日志

### Q4: 编译错误？
**解决：**
```bash
# 清理后重新编译
rm -rf out/
npm run compile

# 检查 TypeScript 版本
tsc --version

# 更新依赖
npm update
```

## 测试清单

- ✅ 首次启动能正常选择文件
- ✅ 状态栏正确显示文件内容
- ✅ 左右按钮能切换行
- ✅ 快捷键正常工作
- ✅ 文件变化自动更新
- ✅ 错误提示友好清晰
- ✅ 循环浏览功能正常
- ✅ 配置保存和恢复
- ✅ 资源正确释放
- ✅ 跨平台兼容性

## 参考资料

- [VSCode Extension API 文档](https://code.visualstudio.com/api)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [VSCode 图标参考](https://codicons.github.io/)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)

## 总结

本插件是一个完整的 VSCode 扩展示例，涵盖了：
- 状态栏 UI 开发
- 文件系统操作
- 快捷键绑定
- 命令注册
- 配置管理
- 资源生命周期管理

通过这个项目，你可以学习到 VSCode 插件开发的完整流程和最佳实践。
