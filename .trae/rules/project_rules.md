# TMS 前端项目开发规范

## 项目概述

- **项目名称**: TMS (Team Management System)
- **技术栈**: Aurelia 框架 + jQuery + Semantic UI
- **项目类型**: 团队协作系统（聊天、博文知识库、国际化翻译）

## 代码规范

### 文件结构

```
src/
├── resources/
│   ├── elements/     # 自定义组件
│   ├── attributes/   # 自定义属性
│   └── value-converters/  # 值转换器
├── blog/             # 博文相关
├── chat/             # 聊天相关
└── common/           # 公共模块
```

### 命名规范

- **组件文件**: 使用 `em-` 前缀，如 `em-blog-content.js`
- **样式文件**: 使用 `.less` 格式，与组件同名
- **模板文件**: 使用 `.html` 格式，与组件同名
- **HTML模板引入**: 在HTML模板中使用 `.css` 扩展名引入样式文件，即使实际文件是 `.less` 格式（如：`<require from="./em-example.css"></require>`）
- **类名**: 大驼峰命名，如 `BlogContent`

### 组件开发规范

#### Aurelia 组件结构

```javascript
// em-example.js
import { inject, bindable } from 'aurelia-framework';

@inject(Element, Service)
export class EmExample {
    @bindable data;

    constructor(element, service) {
        this.element = element;
        this.service = service;
    }

    attached() {
        // 组件挂载时初始化
    }

    detached() {
        // 组件卸载时清理
    }
}
```

#### 样式规范 (LESS)

```less
// em-example.less
.em-example {
    // 组件样式
    .header {
        padding: 16px;
    }
}
```

### HTML 编辑器规范

项目包含多个独立的 HTML 编辑器页面：

- `excalidraw.html` - 手绘白板编辑器
- `sheet.html` - 电子表格编辑器（Luckysheet）
- `mind.html` - 思维导图编辑器
- `excel.html` - Excel 编辑器

#### HTML 编辑器开发规范

1. **样式统一**: 参考已有编辑器的样式规范
2. **响应式设计**: 支持移动端适配
3. **消息通信**: 使用 `postMessage` 与父窗口通信
4. **快捷键**: 统一使用 ESC 等快捷键处理

### 编辑器通信协议

```javascript
// 向父窗口发送消息
window.parent.postMessage({
    action: 'created|updated|isUpdated',
    source: 'blog|comment',
    data: {}
}, window.location.origin);

// 接收父窗口消息
window.addEventListener('message', (evt) => {
    if (evt.origin !== window.location.origin) return;
    // 处理消息
});
```

## 常用命令

```bash
# 开发模式启动
au run --watch

# 构建生产环境
au pkg --env prod

```

## 依赖管理

- **jQuery**: 使用全局 `$`
- **Lodash**: 使用全局 `_`
- **Toastr**: 消息提示，配置为底部居中
- **Semantic UI**: UI 组件库

## 注意事项

1. **不要**在代码中添加调试注释或 console.log（除非明确要求）
2. **遵循**现有代码风格和命名约定
3. **确保**移动端兼容性
4. **使用**现有的工具函数和组件
5. **保持**向后兼容性

## 编辑器特定规范

### Luckysheet (sheet.html)

- 使用 `luckysheet.create()` 初始化
- 通过 `luckysheet.getAllSheets()` 获取数据
- 监听键盘事件需使用捕获阶段

### Excalidraw (excalidraw.html)

- 使用 React 组件方式引入
- 通过 `window.excalidrawAPI` 访问 API

### Draw.io (em-blog-write-draw)

- 使用 iframe 嵌入
- 通过 `postMessage` 进行通信
- 配置只读模式时需发送 `configure` 消息

## 提交规范

- **不要**主动提交代码（除非用户明确要求）
- 完成修改后等待用户确认
- 提供清晰的修改说明

---

*此文档由 Trae AI 助手维护，根据项目实际情况持续更新*
