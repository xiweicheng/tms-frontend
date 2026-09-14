# TMS 前端工程

> TMS（Team Management System）是一套免费开源的团队协作 Web 系统，覆盖**团队沟通（聊天）**与**博文知识库**两大场景，采用响应式界面设计并适配移动端。

基于 Aurelia 框架 + jQuery + Semantic UI 构建，使用 aurelia-cli 脚手架管理开发与生产构建流程。

- 前端工程（Gitee）：<https://gitee.com/xiweicheng/tms-frontend>
- 前端工程（GitHub）：<https://github.com/xiweicheng/tms-frontend>
- 后端工程：<https://github.com/xiweicheng/tms>
- 框架官网：<http://aurelia.io>
- CLI 文档：<http://aurelia.io/hub.html#/doc/article/aurelia/framework/latest/the-aurelia-cli/1>

## 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [核心模块](#核心模块)
- [HTML 编辑器](#html-编辑器)
- [资源系统](#资源系统)
- [通信与事件总线](#通信与事件总线)
- [构建与部署](#构建与部署)
- [开发规范](#开发规范)
- [常用命令](#常用命令)
- [许可证](#许可证)

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 核心框架 | Aurelia 1.x（aurelia-bootstrapper / aurelia-framework） |
| 构建工具 | aurelia-cli + Gulp 4 + Babel（ES2015 + stage-1 + 装饰器） |
| UI 库 | tms-semantic-ui（Semantic UI 衍生）、semantic-ui-calendar、Modaal、Fancybox |
| DOM 工具 | jQuery 1.x、Lodash 4.x |
| 样式 | LESS（HTML 模板中通过 `.css` 扩展名引用） |
| Markdown | SimpleMDE（fork 版本）、marked、highlight.js |
| 实时通信 | SockJS + STOMP over WebSocket |
| 轮询 | 自研 common-poll（自适应间隔轮询） |
| 表格 | Luckysheet、xlsx |
| 思维导图 | mind-elixir-core |
| 白板 | Excalidraw、Draw.io |
| 日历 | FullCalendar 3.x + moment |
| 其他 | Dropzone（上传）、clipboard / clipboard-js、timeago.js、push.js、nprogress、js-base64、ua-device、color-hash |

## 项目结构

```
tms-frontend/
├── index.html              # 应用入口（Aurelia bootstrapper）
├── blog.html               # 独立博文编辑器入口（Froala）
├── sheet.html              # 独立电子表格编辑器（Luckysheet，活跃使用）
├── mind.html               # 独立思维导图编辑器（mind-elixir-core）
├── excalidraw.html         # 独立白板编辑器（Excalidraw）
├── excel.html              # 已废弃的轻量 Excel 编辑器（x-spreadsheet，仅保留渲染历史文档）
├── deps.js                 # 第三方依赖映射（requirejs config）
├── package.json            # 依赖与脚本
├── pnpm-lock.yaml          # 依赖锁定
├── aurelia_project/        # aurelia-cli 配置（构建管线）
├── cdn/                    # 本地 CDN 资源（font-awesome、mermaid、sortable 等）
├── scripts/                # 构建产物（vendor-bundle 等，已在 .gitignore）
└── src/
    ├── main.js             # Aurelia 入口（standardConfiguration + resources feature）
    ├── app.js / app.html   # 根组件（路由配置、表格导出、文件预览等全局行为）
    ├── environment.js      # 环境开关（debug / testing）
    ├── variables.less      # 全局 LESS 变量
    ├── common.less         # 公共样式
    ├── override.less       # 三方库样式覆盖
    ├── common/             # 公共模块（工具、常量、轮询、上下文、事件总线等）
    ├── chat/               # 聊天模块（路由页面 + 服务）
    ├── blog/               # 博文模块（路由页面）
    ├── user/               # 用户模块（登录、注册、密码重置）
    └── resources/
        ├── index.js        # 全局资源注册（elements / attributes / value-converters）
        ├── elements/       # 自定义组件（em-* 前缀）
        ├── attributes/     # 自定义属性（attr-*）
        ├── value-converters/
        └── binding-behaviors/
```

## 快速开始

前置条件：Node.js 环境 + 全局安装 aurelia-cli。

```bash
# 1. 全局安装 aurelia-cli
npm install aurelia-cli -g

# 2. 安装工程依赖
npm install        # 或 pnpm install

# 3. 开发模式（默认带 --watch）
au run --watch

# 4. 生产构建
au run build --env prod
```

开发服务默认监听 `http://localhost:9000`，需要配合后端 TMS 工程的 API（默认代理到 `/admin/*`、`/ws`）。

## 核心模块

### 1. 应用入口与路由

[src/main.js](src/main.js) 完成 Aurelia 启动：加载 `standardConfiguration` + `init` + `resources` 两个 feature，并根据 `environment.debug` 决定是否开启开发日志。

[src/app.js](src/app.js) 是根组件，在 `configureRouter` 中定义全部路由：

| 路由 | 模块 | 说明 |
| --- | --- | --- |
| `pwd-reset` | user/user-pwd-reset | 密码重置 |
| `register` | user/user-register | 用户注册 |
| `login` | user/user-login | 登录 |
| `chat/:username` | chat/chat | 私聊 / 频道聊天 |
| `blog`、`blog/:id` | blog/blog | 博文知识库 |
| `''`（默认） | — | 重定向到 `chat/{lastChatTo 或 @admin}` |

`App.attached()` 还承担三类全局行为：
- **Markdown 表格导出**：鼠标 hover `.markdown-body table` 时注入下载按钮，使用 `XLSX.utils.table_to_sheet` 导出 xlsx；
- **Markdown 任务项勾选**：监听 `li.task-item input:checkbox`，通过事件总线 `EVENT_MARKDOWN_TASK_ITEM_STATUS_TOGGLE` 通知对应组件回写状态；
- **文件在线预览**：对 `admin/file/download/` 链接注入「在线预览」按钮，调用 `window.tmsSysConfig.fileViewUrl`（kkfileview）并支持 Base64 编码 URL。

### 2. 聊天模块（chat）

| 文件 | 职责 |
| --- | --- |
| [src/chat/chat.js](src/chat/chat.js) | 路由页面组件：初始化 SockJS + STOMP、注册事件订阅、管理用户/频道列表、分页加载消息 |
| [src/chat/chat-service.js](src/chat/chat-service.js) | 单例 Service：封装 `loginUser` / `sysConf` / `listUsers` / `listChannels` / `listMyTags` 等后端接口，支持缓存 |
| [src/chat/chat.html](src/chat/chat.html) | 三栏布局：左 `em-chat-sidebar-left`、中消息列表 + `em-chat-input`、右 `em-chat-sidebar-right` |

聊天模块通过 WebSocket 订阅以下频道：
- `/channel/update`：频道消息更新
- `/user/channel/at`：@ 提及
- 频道在线状态、日程更新、博文更新、博文评论、博文锁定等

并使用 [common-poll](src/common/common-poll.js) 作为兜底轮询：最小间隔 6s、最大 5min，连续 10 次无新数据则递增间隔，一旦有新数据恢复到 6s。

### 3. 博文模块（blog）

[src/blog/blog.js](src/blog/blog.js) 负责博文知识库的容器布局与事件编排，订阅 `EVENT_BLOG_VIEW_CHANGED`、`EVENT_BLOG_RIGHT_SIDEBAR_TOGGLE`、`EVENT_BLOG_TOGGLE_SIDEBAR(_PC)`、`EVENT_BLOG_IS_UPDATED_ACK` 等事件，配合右侧 `em-blog-right-sidebar`、左侧 `em-blog-left-sidebar`、内容区 `em-blog-content` 三块组件。

博文支持多种编辑器（见 [HTML 编辑器](#html-编辑器)），并在关闭前通过 `EVENT_BLOG_IS_UPDATED` / `EVENT_BLOG_IS_UPDATED_ACK` 二次确认未保存内容。

### 4. 用户模块（user）

- [src/user/user-login.html](src/user/user-login.html) / `.js`：登录
- [src/user/user-register.html](src/user/user-register.html) / `.js`：注册
- [src/user/user-pwd-reset.html](src/user/user-pwd-reset.html) / `.js`：密码重置

### 5. 公共模块（common）

| 文件 | 职责 |
| --- | --- |
| [common-constant.js](src/common/common-constant.js) | 全局常量 `window.nsCons`：所有事件名（`EVENT_*`）、动作类型（`ACTION_TYPE_*`）、localStorage key、侧边栏宽度等 |
| [common-ctx.js](src/common/common-ctx.js) | 全局上下文 `window.nsCtx`：登录用户、用户列表、频道列表、当前 chatTo/blogId 等 |
| [common-utils.js](src/common/common-utils.js) | URL 解析（基于 wurl）、跳转登录、参数增删、终端判断等 |
| [common-poll.js](src/common/common-poll.js) | 自适应轮询（含暂停 / 恢复 / 重置 / 停止） |
| [common-poll2.js](src/common/common-poll2.js) | 轮询的另一种实现 |
| [common-toastr.js](src/common/common-toastr.js) | toastr 默认配置（底部居中） |
| [common-tips.js](src/common/common-tips.js) | Markdown 快捷输入提示（`/h1` `/code` `/list` 等） |
| [common-emoji.js](src/common/common-emoji.js) | Emoji 数据集 |
| [common-diff.js](src/common/common-diff.js) | 文本 diff（jsdiff） |
| [common-paste.js](src/common/common-paste.js) | 粘贴处理（paste.js） |
| [common-search.js](src/common/common-search.js) | 搜索相关 |
| [common-scrollbar.js](src/common/common-scrollbar.js) | 自定义滚动条 |
| [common-tags.js](src/common/common-tags.js) | 标签管理 |
| [common-plugin.js](src/common/common-plugin.js) | 插件初始化 |
| [common-imgs-loaded.js](src/common/common-imgs-loaded.js) | 图片加载完成检测 |

## HTML 编辑器

项目内置 5 个独立的 HTML 编辑器页面，通过 iframe 嵌入到博文/聊天中，使用 `postMessage` 与父窗口通信。

| 文件 | 底层库 | 用途 |
| --- | --- | --- |
| [blog.html](blog.html) | Froala | 富文本博文编辑 |
| [sheet.html](sheet.html) | Luckysheet | 电子表格（活跃使用） |
| [mind.html](mind.html) | mind-elixir-core | 思维导图 |
| [excalidraw.html](excalidraw.html) | Excalidraw（React） | 手绘白板 |
| — | Draw.io（iframe 嵌入，见 `em-blog-write-draw` / `em-blog-draw`） | 流程图 |

> 已废弃：[excel.html](excel.html)（基于 x-spreadsheet）不再支持新建，仅保留 `em-blog-excel` / `em-blog-write-excel` 组件用于渲染历史 Excel 文档。新建电子表格请使用 `sheet.html`。

### 编辑器通信协议

```js
// 子窗口 → 父窗口
window.parent.postMessage({
    action: 'created' | 'updated' | 'isUpdated',
    source: 'blog' | 'comment',
    data: {}
}, window.location.origin);

// 父窗口 → 子窗口
window.addEventListener('message', (evt) => {
    if (evt.origin !== window.location.origin) return;
    // 处理消息
});
```

每个编辑器都支持：
- **只读模式**：通过 URL 参数或 postMessage `configure` 消息切换，隐藏顶部工具栏与帮助按钮；
- **快捷键**：ESC 关闭、键盘翻页等；
- **响应式**：移动端适配，`viewport` 锁定缩放；
- **主题色**：统一的 topbar 样式（白底 + 阴影 + 圆角输入框）。

### 对应的 Aurelia 组件

- `em-blog-write` / `em-blog-write-html` / `em-blog-write-sheet` / `em-blog-write-mind` / `em-blog-write-excalidraw` / `em-blog-write-draw`：编辑态容器（`em-blog-write-excel` 已废弃，仅渲染历史文档）
- `em-blog-content` / `em-blog-sheet` / `em-blog-mind` / `em-blog-excalidraw` / `em-blog-draw`：只读态容器（`em-blog-excel` 已废弃，仅渲染历史文档）

## 资源系统

[src/resources/index.js](src/resources/index.js) 通过 `aurelia.globalResources([...])` 集中注册全部全局资源。

### 自定义元素（em-*）

按功能分组（共 70+ 个）：

- **聊天**：`em-chat-top-menu`、`em-chat-sidebar-left`、`em-chat-sidebar-right`、`em-chat-content-item`、`em-chat-content-item-footbar`、`em-chat-input`、`em-chat-msg`、`em-chat-msg-popup`、`em-chat-member-popup`、`em-chat-attach`、`em-chat-share`、`em-chat-topic`、`em-chat-topic-input`、`em-chat-settings`、`em-chat-todo`、`em-chat-gantt` / `em-chat-gantt-edit`、`em-chat-schedule` / `em-chat-schedule-edit` / `em-chat-schedule-remind`、`em-chat-channel-create` / `em-chat-channel-edit` / `em-chat-channel-join` / `em-chat-channel-members-mgr` / `em-chat-channel-members-show` / `em-chat-channel-link-mgr`、`em-chat-system-link-mgr`
- **博文**：`em-blog-top-menu`、`em-blog-left-sidebar`、`em-blog-right-sidebar`、`em-blog-content`、`em-blog-write*`（7 个编辑器）、`em-blog-sheet` / `em-blog-excel` / `em-blog-mind` / `em-blog-excalidraw` / `em-blog-draw`、`em-blog-comment` / `em-blog-comment-footer` / `em-blog-comment-popup` / `em-blog-comment-share`、`em-blog-save`、`em-blog-share`、`em-blog-history` / `em-blog-history-view` / `em-blog-history-diff`、`em-blog-space-create` / `em-blog-space-edit` / `em-blog-space-update` / `em-blog-space-auth` / `em-blog-space-dir-create` / `em-blog-space-dir-edit` / `em-blog-space-channel-edit`、`em-blog-tpl-edit` / `em-blog-tpl-select`
- **频道任务（看板）**：`em-channel-task`、`em-channel-task-create`、`em-channel-task-item-header` / `em-channel-task-item-footer`、`em-channel-tasks-modal`、`em-channel-chat-task-talk-modal`
- **通用**：`em-modal`、`em-confirm-modal`、`em-hotkeys-modal`、`em-dropdown` / `em-dropdown-links`、`em-checkbox`、`em-user-avatar`、`em-user-edit` / `em-user-create`、`em-audio-alert`

### 自定义属性（attr-*）

封装 jQuery + Semantic UI 行为：`attr-dropzone`（拖拽上传）、`attr-pastable`（粘贴）、`attr-textcomplete`（@ 补全）、`attr-scrollbar`、`attr-modaal`、`attr-fancybox`、`attr-dimmer`、`attr-c2c`、`attr-autosize`、`attr-tablesort`、`attr-task`、`attr-attr`、`attr-ui-dropdown(-action|-hover|-hover-action)`、`attr-ui-tab`、`attr-ui-popup`、`attr-ui-pp`、`attr-ui-checkbox`。

### 值转换器与绑定行为

- [vc-common](src/resources/value-converters/vc-common.js)：通用值转换
- [bb-key](src/resources/binding-behaviors/bb-key.js)：按键绑定行为

## 通信与事件总线

项目使用 Aurelia 的 `EventAggregator`（全局变量 `ea`）作为事件总线，所有事件名集中在 [common-constant.js](src/common/common-constant.js) 的 `window.nsCons`，主要分组：

- **应用**：`EVENT_APP_ROUTER_NAVIGATE`
- **聊天**：`EVENT_CHAT_*`（消息发送、侧边栏切换、频道创建/删除/加入/离开、消息插入、消息搜索、@、回复滚动等）
- **WebSocket**：`EVENT_WS_*`（频道更新、@、在线、日程、博文、评论、锁定）
- **博文**：`EVENT_BLOG_*`（切换、变更、创建/更新/删除、侧边栏、视图变更、收藏、保存、历史、评论、未保存确认）
- **频道任务**：`EVENT_CHANNEL_TASK_*`、`EVENT_CLOSE_CHANNEL_TASKS_MODAL`
- **UI**：`EVENT_SHOW_HOTKEYS_MODAL`、`EVENT_TOASTR_CLOSE`、`EVENT_AUDIO_ALERT`、`EVENT_MODAAL_*`、`EVENT_MARKDOWN_TASK_ITEM_STATUS_TOGGLE`、`EVENT_MD_EDITOR_TBAR_VISIBLE_CHANGE`

全局上下文 `window.nsCtx` 承载跨组件共享状态：`loginUser`、`isSuper`、`isAdmin`、`users`、`channels`、`memberAll`、`chatTo`、`chatId`、`blogId`、`isModaalOpening`、`isRightSidebarShow`。

## 构建与部署

### 构建命令

```bash
# 开发模式（带 watch + browser-sync）
au run --watch

# 生产构建
au run build --env prod
# 等价于项目脚本
au pkg --env prod
```

构建产物位于工程根目录（`scripts/` 下的 vendor-bundle、app-bundle 等，已在 `.gitignore` 中忽略）。

### 部署到后端

生产构建后，将整个工程目录内容（排除 `node_modules`）复制到后端 TMS 工程（<https://github.com/xiweicheng/tms>）的：

```
tms/src/main/resources/static/page
```

### 构建脚本

项目附带若干 shell 脚本用于版本号管理：

- [build-no.sh](build-no.sh)
- [commit-build-no.sh](commit-build-no.sh)
- [deploy2local-build-no.sh](deploy2local-build-no.sh)

## 开发规范

完整规范见 [.trae/rules/project_rules.md](.trae/rules/project_rules.md)，要点：

### 命名

- 组件文件：`em-*` 前缀，如 `em-blog-content.js`
- 样式：`.less` 与组件同名
- 模板：`.html` 与组件同名
- 类名：大驼峰，如 `BlogContent`
- HTML 模板中通过 `.css` 扩展名引入 `.less` 文件：`<require from="./em-example.css"></require>`

### 组件结构

```javascript
import { inject, bindable, containerless } from 'aurelia-framework';

@containerless
export class EmExample {
    @bindable data;

    constructor() { }

    attached() { /* 组件挂载时初始化 */ }

    detached() { /* 组件卸载时清理：解绑事件、销毁实例 */ }

    unbind() { /* 释放事件订阅 */ }
}
```

### 注意事项

1. 不要在代码中添加调试注释或 `console.log`（除非明确要求）
2. 遵循现有代码风格与命名约定
3. 确保移动端兼容性
4. 使用现有的工具函数和组件
5. 保持向后兼容性
6. 不主动提交代码（除非用户明确要求）

## 常用命令

```bash
# 代码生成
au generate element            # 生成自定义元素
au generate attribute          # 生成自定义属性
au generate value-converter    # 生成值转换器
au generate binding-behavior   # 生成绑定行为
au generate task               # 生成构建任务
au generate generator          # 生成生成器

# 开发
au run --watch

# 生产构建
au run build --env prod
```

## 第三方依赖

完整依赖见 [package.json](package.json)。关键插件文档：

- jQuery scrollTo：<https://github.com/flesler/jquery.scrollTo>
- marked：<https://github.com/chjj/marked>
- highlight.js：<https://www.npmjs.com/package/highlight.js>
- clipboard.js：<https://github.com/zenorocha/clipboard.js>
- Dropzone：<https://www.npmjs.com/package/dropzone>
- paste.js：<https://github.com/layerssss/paste.js>
- timeago.js：<https://github.com/hustcc/timeago.js>
- autosize：<http://www.jacklmoore.com/autosize/>
- jquery.hotkeys：<https://github.com/jeresig/jquery.hotkeys>
- jquery-textcomplete：<https://github.com/yuku-t/jquery-textcomplete>
- SimpleMDE：<https://github.com/NextStepWebs/simplemde-markdown-editor/>
- jquery.scrollbar：<https://github.com/gromo/jquery.scrollbar>
- color-hash：<https://github.com/zenozeng/color-hash>
- push.js：<https://github.com/Nickersoft/push.js>
- tinyColorPicker：<https://github.com/PitPik/tinyColorPicker>
- Fancybox 3：<http://fancyapps.com/fancybox/3/>
- Froala：<https://github.com/froala/wysiwyg-editor>
- jsdiff：<https://github.com/kpdecker/jsdiff>
- Luckysheet：<https://github.com/dream-num/Luckysheet>
- mind-elixir-core：<https://github.com/ssshooter/mind-elixir-core>
- SortableJS：<http://www.sortablejs.com/index.html>

参考产品：[石墨文档](https://shimo.im/welcome)、[语雀](https://www.yuque.com/dashboard)。

## 许可证

MIT License，详见 [LICENSE](LICENSE)。

---

*本文档由 Trae AI 助手基于源码分析生成。*
