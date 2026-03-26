# 快速启动指南 🚀

## 5 分钟快速上手

### 步骤 1: 安装依赖

```bash
cd d:\project\read-demo
npm install
```

### 步骤 2: 编译代码

```bash
npm run compile
```

### 步骤 3: 调试运行

1. 在 VSCode 中打开项目文件夹
2. 按 `F5` 键启动调试
3. 在新的 VSCode 窗口中，按 `Ctrl+Shift+T` 激活插件
4. 选择 `example.txt` 文件进行测试

### 步骤 4: 使用功能

#### 基本操作
- **显示/隐藏**: `Ctrl+Shift+T`
- **上一行**: `Ctrl+Shift+Left` 或点击状态栏左侧按钮
- **下一行**: `Ctrl+Shift+Right` 或点击状态栏右侧按钮
- **选择文件**: 点击状态栏文本区域

## 项目结构概览

```
read-demo/
├── src/                          # 源代码
│   ├── extension.ts             # 入口文件
│   ├── txtFileReader.ts         # 文件读取器
│   └── statusBarManager.ts      # 状态栏管理
├── out/                          # 编译输出（自动生成）
├── .vscode/                      # VSCode 配置
├── package.json                  # 项目配置
├── tsconfig.json                 # TypeScript 配置
├── README.md                     # 使用说明
├── DEVELOPMENT_GUIDE.md          # 开发指南
├── PUBLISH_GUIDE.md              # 发布指南
└── TEST_CASES.md                 # 测试用例
```

## 核心功能速览

### ✅ 已实现功能

1. **状态栏显示**
   - 单行文本展示
   - 图标美化
   - 长度截断

2. **导航控制**
   - 左右切换按钮
   - 快捷键支持
   - 循环浏览

3. **文件管理**
   - TXT 文件读取
   - 自动监听变化
   - 配置持久化

4. **用户友好**
   - 错误提示
   - 进度反馈
   - 工具提示

## 常用命令

```bash
# 开发模式（监听并自动编译）
npm run watch

# 编译代码
npm run compile

# 代码检查
npm run lint

# 打包扩展
vsce package

# 发布扩展
vsce publish
```

## 快捷键参考

| 功能 | Windows/Linux | macOS |
|------|--------------|-------|
| 切换显示 | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| 上一行 | `Ctrl+Shift+←` | `Cmd+Shift+←` |
| 下一行 | `Ctrl+Shift+→` | `Cmd+Shift+→` |

## 示例文件

项目包含一个 `example.txt` 文件用于测试：

```
这是第一行内容
这是第二行内容
...
这是第十行内容
```

## 下一步

### 想要了解更多？

- 📖 [完整使用说明](./README.md)
- 💻 [开发指南](./DEVELOPMENT_GUIDE.md)
- 📦 [发布指南](./PUBLISH_GUIDE.md)
- 🧪 [测试用例](./TEST_CASES.md)

### 自定义开发

参考 [`DEVELOPMENT_GUIDE.md`](./DEVELOPMENT_GUIDE.md) 了解：
- 如何添加新功能
- 代码架构说明
- 最佳实践建议

### 准备发布

参考 [`PUBLISH_GUIDE.md`](./PUBLISH_GUIDE.md) 了解：
- 发布到 VSCode 市场
- 版本管理
- 市场推广

## 故障排除

### 问题：编译失败

**解决**:
```bash
# 清理后重新编译
rm -rf out/ node_modules/
npm install
npm run compile
```

### 问题：调试时插件未激活

**解决**:
- 确认 `package.json` 中的 `activationEvents` 配置
- 手动触发快捷键 `Ctrl+Shift+T`
- 查看调试控制台的日志输出

### 问题：状态栏不显示

**解决**:
- 右键点击状态栏，确保相关项已勾选
- 确认已成功选择 TXT 文件
- 查看是否有错误提示

### 问题：快捷键无效

**解决**:
- 按 `Ctrl+K Ctrl+S` 打开快捷键设置
- 搜索 `txtReader` 查看快捷键绑定
- 检查是否有冲突

## 开发环境要求

- ✅ Node.js >= 16.x
- ✅ VSCode >= 1.74.0
- ✅ TypeScript >= 5.0.0

## 获取帮助

1. 查看 [README.md](./README.md) 了解详细功能
2. 查看 [TEST_CASES.md](./TEST_CASES.md) 了解测试清单
3. 查看 [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) 了解技术细节
4. 通过 GitHub Issues 提交问题

## 快速测试清单

- [ ] 依赖安装成功
- [ ] 代码编译无错误
- [ ] F5 能启动调试
- [ ] 按 `Ctrl+Shift+T` 能激活插件
- [ ] 能选择 example.txt 文件
- [ ] 状态栏显示第一行内容
- [ ] 左右按钮能切换行
- [ ] 快捷键正常工作

全部打勾即可开始正式开发！✅

---

**祝你开发愉快！** 🎉

如有任何问题，请参考详细文档或提交 Issue。
