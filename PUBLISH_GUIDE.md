# VSCode 插件发布指南

## 发布前准备

### 1. 完善项目信息

#### package.json 必填字段
```json
{
  "name": "txt-status-bar-reader",
  "displayName": "TXT Status Bar Reader",
  "description": "在 VSCode 状态栏中显示 TXT 文件内容，支持逐行切换和快捷键控制",
  "version": "1.0.0",
  "publisher": "your-publisher-name",  // 需要替换为你的发布者名称
  "engines": {
    "vscode": "^1.74.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/txt-status-bar-reader.git"
  },
  "homepage": "https://github.com/yourusername/txt-status-bar-reader#readme",
  "bugs": {
    "url": "https://github.com/yourusername/txt-status-bar-reader/issues"
  },
  "license": "MIT",
  "icon": "images/icon.png",  // 可选：添加图标
  "galleryBanner": {         // 可选：市场页面横幅
    "color": "#C80000",
    "theme": "dark"
  }
}
```

### 2. 创建发布者账户

1. 访问 [Visual Studio Marketplace](https://marketplace.visualstudio.com/vscode)
2. 使用 Microsoft 账户登录
3. 创建发布者（Publisher）
   - 发布者 ID 将作为插件 ID 的前缀
   - 例如：`your-publisher-name.txt-status-bar-reader`

### 3. 获取 Personal Access Token

1. 访问 [Azure DevOps](https://dev.azure.com/)
2. 点击右上角用户头像 → Personal access tokens
3. 创建新的 token
   - 名称：vsce-publish
   - Organization: All accessible organizations
   - Expiration: 自定义（建议 1-2 年）
   - Scopes: Custom defined → Marketplace (Manage)
4. 复制生成的 token（只显示一次）

### 4. 安装 vsce 工具

```bash
npm install -g @vscode/vsce
```

注意：旧的 `vsce` 已迁移到 `@vscode/vsce`

## 本地测试

### 1. 打包测试

```bash
# 编译代码
npm run compile

# 打包成 .vsix 文件
vsce package

# 检查生成的文件
ls *.vsix
```

### 2. 本地安装测试

```bash
# 从 .vsix 安装
code --install-extension txt-status-bar-reader-1.0.0.vsix

# 或者在 VSCode 中
# 1. 按 Ctrl+Shift+X 打开扩展面板
# 2. 点击 ... 菜单
# 3. 选择 "从 VSIX 安装..."
# 4. 选择 .vsix 文件
```

### 3. 验证清单

- [ ] 插件能正常激活
- [ ] 所有功能正常工作
- [ ] 快捷键正确绑定
- [ ] 状态栏显示正常
- [ ] 错误提示清晰友好
- [ ] README 显示正确
- [ ] 无控制台错误

## 发布流程

### 方式一：命令行发布（推荐）

```bash
# 1. 登录（输入之前创建的 PAT）
vsce login your-publisher-name

# 2. 发布
vsce publish

# 或者使用 token 直接发布（不推荐，会暴露在历史记录中）
vsce publish -p YOUR_PERSONAL_ACCESS_TOKEN
```

### 方式二：CI/CD 自动发布

#### GitHub Actions 示例

创建 `.github/workflows/publish.yml`:

```yaml
name: Publish Extension

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Compile
        run: npm run compile
      
      - name: Publish to VSCE
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
        run: npx @vscode/vsce publish
      
      - name: Publish to Open VSX
        env:
          OVSX_PAT: ${{ secrets.OVSX_PAT }}
        run: npx ovsx publish
```

### 方式三：手动上传

1. 打包：`vsce package`
2. 访问 [Marketplace 管理页面](https://marketplace.visualstudio.com/manage)
3. 选择你的发布者
4. 点击 "New Extension"
5. 上传 .vsix 文件
6. 填写详细信息
7. 提交审核

## 版本更新

### 语义化版本规范

```
主版本号。次版本号。修订号
Major.Minor.Patch

例如：
1.0.0  - 初始版本
1.0.1  - Bug 修复
1.1.0  - 新功能
2.0.0  - 破坏性更新
```

### 更新步骤

1. 更新 `package.json` 中的 version
2. 更新 `CHANGELOG.md`
3. 提交 git commit
4. 打标签：`git tag v1.0.1`
5. 推送：`git push origin v1.0.1`
6. 发布：`vsce publish`

### CHANGELOG 模板

```markdown
# Change Log

## [1.0.1] - 2024-01-15

### Fixed
- 修复文件监听器内存泄漏问题
- 修复长文本截断异常

### Added
- 添加文件路径配置持久化
- 增加进度提示功能

### Changed
- 优化状态栏显示效果
- 改进错误提示信息

### Removed
- 移除废弃的 API 调用
```

## 多平台发布

### 构建所有平台包

```bash
vsce package --target linux-x64
vsce package --target alpine-x64
vsce package --target darwin-x64
vsce package --target darwin-arm64
vsce package --target win32-x64
vsce package --target win32-arm64
vsce package --target web
```

### Web 版本支持

如果需要支持 Web 版 VSCode，需要：

1. 在 `package.json` 中添加：
```json
"browser": "./dist/web/extension.js",
"activationEvents": [
  "onStartupFinished"
],
```

2. 使用 webpack 打包 web 版本
3. 避免使用 Node.js 原生模块

## 市场推广

### 1. 完善市场页面

- **图标**: 128x128 PNG
- **横幅**: 设计吸引人的 banner
- **截图**: 展示主要功能
- **详细描述**: 突出特色功能

### 2. 关键词优化

在 `package.json` 中：
```json
"keywords": [
  "txt",
  "reader",
  "statusbar",
  "text-file",
  "file-viewer"
]
```

### 3. 分类选择

```json
"categories": [
  "Other",
  "Visualization",
  "Education"
]
```

### 4. 推广渠道

- GitHub README
- 技术博客文章
- 社交媒体分享
- 开发者社区（Reddit, Hacker News 等）

## 维护与更新

### 用户反馈处理

1. **Issue 跟踪**
   - 及时回复用户问题
   - 标记 bug 和功能请求
   - 定期清理过期 issue

2. **版本更新频率**
   - 小问题积累：每 2-4 周
   - 重要功能：随时发布
   - 紧急修复：立即发布

3. **兼容性维护**
   - 关注 VSCode 版本更新
   - 测试新版本兼容性
   - 及时弃用旧 API

### 数据分析

访问 [Marketplace 管理页面](https://marketplace.visualstudio.com/manage) 查看：
- 下载量统计
- 活跃用户数
- 平均评分
- 用户反馈

## 常见问题

### Q1: 发布失败 "The publisher already exists"
**解决**: 使用已有的发布者名称，或创建新的发布者账户

### Q2: 错误 "You must accept the License Terms"
**解决**: 在 package.json 中明确指定 license 字段

### Q3: 图标不显示
**解决**: 
- 确保图片路径正确
- 图片尺寸至少 128x128
- 格式为 PNG 或 SVG

### Q4: 审核被拒绝
**常见原因**:
- 描述不清晰
- 功能与描述不符
- 包含恶意代码
- 侵犯版权

**解决**: 根据反馈修改后重新提交

### Q5: 如何撤回已发布的版本
**解决**: 
- 无法删除，只能下架
- 在市场页面标记为 "Unlisted"
- 发布新版本覆盖

## 最佳实践

### 发布清单

- [ ] 代码通过所有测试
- [ ] README 完整准确
- [ ] CHANGELOG 已更新
- [ ] 版本号已提升
- [ ] 本地打包测试通过
- [ ] 所有功能验证正常
- [ ] 无敏感信息泄露
- [ ] LICENSE 文件存在
- [ ] 图标资源完整
- [ ] 仓库链接正确

### 安全检查

1. **代码审查**
   - 无硬编码密钥
   - 无敏感数据传输
   - 权限最小化原则

2. **依赖检查**
   ```bash
   npm audit
   npm outdated
   ```

3. **隐私合规**
   - 不收集用户数据（除非必要并声明）
   - 遵守 GDPR 等法规
   - 清晰的隐私政策

### 性能优化

1. **减小包体积**
   - 使用 .vscodeignore
   - 压缩图片资源
   - Tree-shaking 无用代码

2. **加快启动速度**
   - 延迟加载非必需功能
   - 避免同步阻塞操作
   - 合理使用 activationEvents

## 替代发布平台

### 1. Open VSX Registry

```bash
# 安装 ovsx
npm install -g ovsx

# 获取 token: https://open-vsx.org/user-settings/tokens

# 发布
ovsx publish

# 或使用 CI/CD
npx ovsx publish -p YOUR_TOKEN
```

### 2. GitHub Releases

```bash
# 在 GitHub 创建 Release
# 上传 .vsix 文件作为附件
# 用户可手动下载安装
```

### 3. 私有市场

企业内部可搭建私有 VSCode 扩展市场

## 总结

发布 VSCode 插件的完整流程：

1. ✅ 完善项目和文档
2. ✅ 创建发布者账户
3. ✅ 获取访问令牌
4. ✅ 本地打包测试
5. ✅ 命令行发布
6. ✅ 验证市场页面
7. ✅ 收集用户反馈
8. ✅ 持续维护更新

祝发布顺利！🎉
