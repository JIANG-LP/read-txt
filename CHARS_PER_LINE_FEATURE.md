# 长文本分行功能说明

## 📋 问题描述

之前的版本中，如果 TXT 文件中某一行文本过长（超过 150 字符），状态栏会显示不完整，并且与下一行内容衔接不上，导致中间内容缺失。

**原因分析**：
- 原始实现只是按文件的换行符 (`\n`) 分割文本
- 对于没有换行的超长段落，会被当作一行处理
- 状态栏为了美观限制了最大显示长度（150 字符），超出部分被截断显示 `...`
- 这导致中间内容永久丢失，无法通过切换行查看

---

## ✅ 解决方案

### 1. 数据层物理分行

在 [`TxtFileReader.parseContent()`](file://d:\project\read-txt\src\txtFileReader.ts#L139-L172) 方法中添加了智能分行逻辑：

```typescript
// 获取配置的每行字符数
const charsPerLine = vscode.workspace.getConfiguration('txtReader').get<number>('charsPerLine', 30);

// 将超长行按字符数分割成多行
this.lines = this.splitLongLines(rawLines, charsPerLine);
```

**新增方法**：[`splitLongLines()`](file://d:\project\read-txt\src\txtFileReader.ts#L164-L179)
- 遍历每一行文本
- 如果超过配置的字符数，自动切割成多行
- 保证内容完整性，不丢失任何字符

---

### 2. 可配置的字符数

在 [`package.json`](file://d:\project\read-txt\package.json) 中添加了新配置项：

```json
"txtReader.charsPerLine": {
  "type": "number",
  "default": 30,
  "minimum": 10,
  "maximum": 200,
  "description": "每行显示的字符数（超过此长度会自动分行）"
}
```

**配置说明**：
- **默认值**：30 个字符
- **可配置范围**：10 - 200 字符
- **动态生效**：修改配置后自动重新加载文件，无需手动操作

---

### 3. 配置监听与自动刷新

添加了 [`setupConfigListener()`](file://d:\project\read-txt\src\txtFileReader.ts#L187-L198) 方法：
- 监听 `txtReader.charsPerLine` 配置变化
- 配置修改后自动重新读取文件并应用新的分行规则
- 实时反馈，提升用户体验

---

### 4. 简化显示逻辑

移除了 [`StatusBarManager.updateDisplay()`](file://d:\project\read-txt\src\statusBarManager.ts#L169-L180) 中的强制截断逻辑：

**之前**：
```typescript
const maxLength = 150;
if (displayText.length > maxLength) {
    displayText = displayText.substring(0, maxLength - 3) + '...';
}
```

**现在**：
```typescript
// 直接使用完整行内容（因为数据层已经分好行了）
this.statusBarItem.text = `$(file-text) ${currentLine}`;
```

---

## 🎯 使用示例

### 场景 1：阅读长篇小说

小说文件通常一段就是几千字没有换行：

**原始文件**：
```
这是一个很长的段落，一共有 1000 个字....................（无换行）
```

**启用功能后（charsPerLine = 30）**：
```
第 1 行：这是一个很长的段落，一共有 1
第 2 行：00 个字....................
第 3 行：..........................
...（依此类推）
```

✅ **效果**：内容完整显示，不会丢失任何字符

---

### 场景 2：调整每行字符数

#### 方法一：通过 VSCode 设置界面

1. 打开 VSCode 设置 (`Ctrl + ,`)
2. 搜索 `txtReader.charsPerLine`
3. 修改为你想要的值（如 50）
4. 保存后自动生效

#### 方法二：直接修改 settings.json

```json
{
  "txtReader.charsPerLine": 50
}
```

#### 效果对比

| 配置值 | 适用场景 | 优点 |
|--------|----------|------|
| 20-30 | 小屏幕、快速浏览 | 单行信息量少，切换频率高 |
| 40-60 | 标准阅读 | 平衡信息量与舒适度 ⭐ |
| 80-100 | 大段文字阅读 | 减少切换次数，提升连贯性 |
| 150+ | 接近原文显示 | 保留原始段落结构 |

---

## 🔧 技术细节

### 分行算法

```typescript
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
```

**特点**：
- ✅ 简单高效，时间复杂度 O(n)
- ✅ 保持原文顺序，不改变内容
- ✅ 支持中文、英文、数字混合

---

### 性能优化

1. **仅在加载时分割一次**：避免重复计算
2. **配置变化时才重新加载**：不会频繁 IO 操作
3. **内存占用可控**：分割后的数组占用与原文件相当

---

## 📊 修改文件清单

| 文件 | 修改内容 | 行数变化 |
|------|----------|----------|
| [`package.json`](file://d:\project\read-txt\package.json) | 添加 `charsPerLine` 配置项 | +7 行 |
| [`txtFileReader.ts`](file://d:\project\read-txt\src\txtFileReader.ts) | 添加分行逻辑、配置监听 | +40 行 |
| [`statusBarManager.ts`](file://d:\project\read-txt\src\statusBarManager.ts) | 移除显示限制 | -5 行 |

---

## ⚠️ 注意事项

1. **空行处理**：纯空白的行会被过滤掉，不计入总行数
2. **换行符兼容**：同时支持 Windows (`\r\n`) 和 Unix (`\n`) 换行符
3. **性能考虑**：超大文件（>10MB）建议设置较大的 `charsPerLine` 值以减少总行数
4. **编码支持**：分行逻辑在所有支持的编码格式下都能正常工作

---

## 🚀 未来优化方向

- [ ] 支持智能断词（在标点符号处断开，避免切断词语）
- [ ] 支持正则表达式分行（按特定模式分割）
- [ ] 支持保留原始换行结构（记录哪些是原始换行，哪些是分割产生）
- [ ] 添加"回到段首"功能（快速跳转到原始段落的起始位置）

---

## 📝 更新日志

**v1.1.0** (当前版本)
- ✅ 新增 `charsPerLine` 配置项
- ✅ 实现长行自动分割功能
- ✅ 支持配置动态刷新
- ✅ 移除状态栏强制截断限制

**v1.0.0** (初始版本)
- 基础 TXT 文件读取功能
- 状态栏显示
- 快捷键控制
