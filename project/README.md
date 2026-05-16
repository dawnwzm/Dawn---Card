# Dawn AIGC Explorer Log — Design System

> 一个以 **终端 / 操作系统 / 探索日志** 为视觉母题的个人简历网站设计系统。
> 黑底、等宽字体、磷光绿、宇航员飘动、像素小猫、3D 粒子建筑、鼠标聚焦交互。

---

## 0. Context（你是谁）

这是 **Dawn** 的个人 AIGC 简历站。整个网站像一个正在运行的终端 / IDE — 进入站点后，光标在打字介绍自己；用户向下滚动，像在 `cat` 出每段经历；数字以日志滚动方式刷新；背景里宇航员缓慢飘动，偶尔有像素风的小猫穿过屏幕。

**核心交互**：不依赖文本输入。完全用 **鼠标 hover** 驱动 — 当鼠标悬停在某条经历（如 "360 集团"）上时：
- 该条目放大、聚焦、清晰
- 其它条目缩小、字号变小、模糊（`blur(2-4px) + opacity 0.35`）
- 背景层出现该公司的 **3D 粒子建筑**（360 集团楼、达摩院楼…）
- 右侧浮出 **对话框样式** 的工作详情面板（类似 IDE 的 hover-tooltip）

**Sources（材料来源）**：
- `uploads/360建筑.png` — 360 集团总部建筑插画（深绿玻璃幕墙、纤瘦塔楼、薄荷绿幕墙灯）— 已搬到 `assets/building-360.png`
- `uploads/打招呼.png` — 挥手的宇航员（白色航天服、黑色头盔）— 已搬到 `assets/astronaut-wave.png`
- `uploads/原本_副本.pages` — **未在文件系统中找到**。`.pages` 是 Apple 的私有格式，建议导出为 PDF 或粘贴文本后再上传。当前简历文字使用占位条目（含已知关键词：阿里达摩院、360 集团）。

---

## 1. Index（这个文件夹里有什么）

```
.
├─ README.md                ← 你正在读
├─ SKILL.md                 ← Agent Skill 入口
├─ colors_and_type.css      ← 颜色 / 字体 / spacing / shadow tokens
├─ assets/                  ← 视觉素材
│   ├─ building-360.png
│   ├─ astronaut-wave.png
│   └─ pixel-cats/          ← 像素小猫（生成的 sprite，CSS 阴影绘制）
├─ fonts/                   ← 字体说明（Google Fonts CDN，见下方 Caveat）
├─ preview/                 ← Design-System Tab 上展示的卡片
│   ├─ palette-phosphor.html
│   ├─ palette-void.html
│   ├─ palette-semantic.html
│   ├─ type-mono.html
│   ├─ type-pixel.html
│   ├─ type-scale.html
│   ├─ spacing.html
│   ├─ radius-shadow.html
│   ├─ component-buttons.html
│   ├─ component-statusline.html
│   ├─ component-logblock.html
│   ├─ component-tooltip.html
│   ├─ brand-astronaut.html
│   ├─ brand-building.html
│   └─ brand-pixelcat.html
└─ ui_kits/
    └─ resume-site/         ← 简历站本体（首屏预览）
        ├─ index.html
        ├─ Terminal.jsx
        ├─ ExperienceList.jsx
        ├─ ExperienceCard.jsx
        ├─ Astronaut.jsx
        ├─ PixelCat.jsx
        └─ ParticleBuilding.jsx
```

---

## 2. CONTENT FUNDAMENTALS（文案怎么写）

### Tone（语气）
- **第三人称叙述自己 / 第一人称低频** — 像 changelog 里写的 commit message，干、准、动词起头。
- **Engineer log 风**：观察、记录、不夸张、不卖弄。"shipped"、"led"、"探索"、"完成"。
- **中英混排** — 项目名、技术词保留英文（DAMO、AIGC、Diffusion、Agent…），叙述用中文。
- **不用感叹号**。最多一个问号留给 CTA。
- **不用 emoji** — 我们有像素小猫和 ASCII（`▶ ◆ ◇ › $ ~ → ↳ ✓`）来代替。
- 偶尔出现 ASCII 注释行 `# this is what I shipped` — 加在区段标题前作为低声注脚。

### Casing
- **全小写** 用于：命令、标签、tag、文件名（`cat ~/experience/360.log`）
- **Title Case** 仅用于：公司名、项目专有名称
- **ALL CAPS + 字间距** 用于：section marker（`[ EXPERIENCE ]` `[ WORKS ]`）

### 我 vs 你
- 写简历主体：第一人称 "我" 但极度克制 — 多数情况下省略主语，让动词先到（"主导了…"、"参与了…"）。
- 对访客说话：**你** — 出现在引导文案里（"hover to inspect"、"按 ↓ 滚动加载下一段"）。

### 示例（OK 的句子）

> ```
> $ whoami
> dawn — aigc explorer, ex-damo, ex-360
> $ cat ~/now.log
> [2026-05-14 09:21] training small diffusion models, drawing pixel cats
> ```

> ```
> [ EXPERIENCE / 360 集团 / 2023.06 — 2024.12 ]
> ▶ 主导 AIGC 探索小组，从 0 到 1 搭建内部 prompt 平台
> ▶ 完成 18 次 diffusion 模型微调实验，3 个落地业务线
> ▶ 影响日活用户 ~120k
> ```

### 反例（不要这样）
- ❌ "🚀 Excited to share..."（emoji + 兴奋语气）
- ❌ "我超棒的项目！！！"（感叹号 / 自夸）
- ❌ 长段落散文化抒情 — 全部拆成 log line

---

## 3. VISUAL FOUNDATIONS（视觉怎么长）

### 3.1 Colors
**单一色相策略** — 整个站点只有一种色相（≈ 158° 薄荷/磷光绿），通过 **不同透明度** 拉开层级。这是 brief 明确要求："同色系但是不同的透明度"。

- **背景**：`--void-1 (#05080a)` 近黑，比纯黑暖一点，能托起磷光绿
- **前景文字**：5 级 alpha 阶梯 `fg-1 → fg-5`（96% / 72% / 48% / 28% / 14%）
- **磷光主色** `--phosphor (#5eead4)` — 只用于：光标 / 激活态 / 命令提示符 / 高亮经历
- **mint-50 → mint-900** 给数据可视化和粒子色阶
- **唯一例外**：像素小猫用 `--accent-cat (#f9a8d4)` 一点点粉色，3D 建筑蓝图线用 `--accent-blueprint (#67e8f9)` 一点点冰蓝。点缀，不到 2% 面积。

### 3.2 Type
- **JetBrains Mono** — 全局正文 / 标题 / UI（等宽，ligature 关闭，重量 300–700）
- **VT323** — 像素小猫旁边的弹幕标语（pixel 风）
- **Space Grotesk** — 仅在极少数 "走出终端" 的瞬间（如 404、彩蛋页）使用
- 字号尺度紧凑且均匀：11 / 13 / 14 / 16 / 20 / 28 / 40 / 64 — 等宽字体不能像 sans-serif 那样拉太大，>40px 容易显得过于"装饰"，只在 Hero 用一次

### 3.3 Backgrounds
- **底层**：`--void-1`，CRT 扫描线（`--scanline`，alpha 0.025，3px 间距，极淡）
- **网格层**（仅在 Hero 与 Section 间隔使用）：`--grid-bg`，40px × 40px，alpha 0.04
- **宇航员**：`position: fixed`，opacity 0.4–0.6，缓慢飘动（30s 一圈 Lissajous 轨迹），blend-mode `screen` 让他在深底上发亮但不喧宾
- **3D 粒子建筑**：hover 触发，从屏幕背景中央"打字"出建筑轮廓 — 用 ~2000 个 mint 色阶粒子构成蓝图线
- 不用渐变。**不用任何 purple-pink-blue 的 AI gradient**。

### 3.4 Animation
- **Easing**：默认 `cubic-bezier(0.2, 0.7, 0.2, 1)`（quick out, slow settle —"keyboard feel"）
- **打字机**：每字符 30–60ms（含轻微抖动 ±10ms 让它不死板）
- **数字滚动**：300ms ease-out，从 0 → 目标值，rolling 数字（每位独立翻动）
- **Hover focus**：被聚焦项 `scale(1.05) brightness(1.1)`，其它项 `scale(0.96) blur(3px) opacity(0.35)`，250ms
- **粒子建筑入场**：粒子从随机位置飞到目标位置，stagger 1.5ms 每粒，总时长 1200ms
- **闪烁光标**：`steps(2)` 1s，硬边切换不要 fade
- **不用 bounce / spring**。终端没有弹性。

### 3.5 Hover / Press
- **Hover**：text-shadow 加上 `--glow-text`，颜色从 `--fg-2` → `--phosphor`；下划线从虚线 → 实线
- **Press / Active**：颜色 → `--mint-200`，没有缩放（终端按键不会动），加 inner shadow 1px
- **Focus**：1px 实线 `--phosphor` 外框 + `--glow-sm`，no rounded
- Hover 是 **唯一** 触发详情面板的方式（brief 要求）

### 3.6 Borders & Corners
- **Radius**：0 是默认。所有面板、按钮、卡片都是直角 — 终端美学。例外：
  - 对话框气泡 `--radius-3 (8px)` — 像 iMessage 但极简
  - 状态点 `--radius-pill` — 仅 6×6 的小圆点
- **Borders**：`rgba(phosphor, 0.10 / 0.20 / 0.55)` 三阶（faint / line / active）
- **Dashed border** 用于 "loading" / "placeholder" 区域

### 3.7 Shadows
- 没有传统 drop-shadow（黑底上看不见）。所有"阴影"是 **glow** — 磷光外发光
- `--glow-sm`：常规激活 / 光标
- `--glow-md`：hover 聚焦项
- `--glow-lg`：粒子建筑核心
- 文字用 `--glow-text` 加在 `--phosphor` 色的关键字上

### 3.8 Imagery vibe
- 仅有两张主图：宇航员（白）、360 楼（深绿玻璃）— 都做 **multiply / screen blend** 融入深底
- 不用真实照片。任何插画要么是 3D 渲染感（参考素材），要么是像素艺术（≤16×16）
- 不加 grain / noise overlay（CRT 扫描线已经够了，再加噪点会脏）

### 3.9 Layout
- **三层堆叠**：
  - z=0：宇航员 + 扫描线 + 网格背景
  - z=10：3D 粒子建筑（hover 时浮现）
  - z=20：内容（命令行 + 经历列表）
  - z=30：右侧 hover 对话框
  - z=100：顶部 statusline（永远固定）+ 底部命令栏
- **栅格**：8px 基础，正文使用 `ch` 单位定宽（80ch 是经典终端宽度）
- **顶部固定 statusline**（h=28px）：`▮ dawn@aigc-explorer ▮ session: 1d 03:42 ▮ fps: 60 ▮ cats: 3`
- **底部命令栏**（h=32px）：`[hover] inspect  [scroll] load next  [esc] back to /`

### 3.10 Transparency & Blur
- Blur 仅用于 **背景失焦** —`backdrop-filter: blur(8px)` 在对话框背后
- 也用于 **非焦点项**（hover 聚焦时其它项 `filter: blur(3px)`）
- 透明度做层级，不做装饰 — 不要做"玻璃拟态"卡片

### 3.11 Card 长什么样
- 默认：直角，`--border-line`，`--void-2` 背景，没有 shadow
- Hover：边框 → `--border-active`，加 `--glow-md`，左侧出现 4px 实线 `--phosphor` 标尺
- 不要 colored-left-border-only 的卡片（已被 brief 排除为 AI-slop）

---

## 4. ICONOGRAPHY

### 总策略
**网站尽量不用图标** — 终端美学下，ASCII / Unicode 字符就是图标。

### 使用顺序
1. **ASCII 字符**（首选）— `$ › ▶ ▮ ◆ ◇ ✓ ✗ → ↳ ~ — ::`
2. **像素小猫** — 我们自绘的 8×8 / 16×16 sprite，用 CSS box-shadow 拼像素（见 `assets/pixel-cats/`）
3. **Lucide Icons (CDN)** — 仅在 UI Kit 中的对话框、关闭按钮等位置使用。从 `https://unpkg.com/lucide@latest` 加载。1.5px stroke，line-style，颜色 `currentColor`，尺寸 12 / 14 / 16
4. **不用 Font Awesome / Heroicons** — 风格太"web 通用"，破坏终端感
5. **不用 emoji** — Brief 明确

### 像素小猫
- 4 只 sprite：`pixel-cat-walk`、`pixel-cat-sit`、`pixel-cat-stretch`、`pixel-cat-sleep`
- 16×16 grid，每 cell 8px CSS box-shadow 拼出（无需图片）
- 颜色：磷光绿主体 + 一抹粉 `--accent-cat`
- 行为：随机时间从屏幕底部走过 / 蹲在命令行末尾 blink / 偶尔停下来打个哈欠

### Logo
- 文字标 only：`dawn // aigc explorer` 全等宽，`//` 用 `--phosphor` 上色
- 没有图形标。需要的时候用 ASCII 框 `╔════╗ ║ DAWN ║ ╚════╝`

---

## 5. Caveats（已知缺口 — 需要你补）

> 这部分会在交付时也贴到 chat 里。

1. **简历内容缺失**：`uploads/原本_副本.pages` 在文件系统中不存在（可能是 `.pages` 格式上传时被压缩剥离）。当前所有简历条目都是占位 — 已知关键词只有 "阿里达摩院" 与 "360 集团"。请把简历正文以 **Markdown / 纯文本 / PDF** 形式重新粘贴给我。
2. **字体**：未提供字体文件。已用 Google Fonts 替代：
   - JetBrains Mono（等宽，主字体）
   - VT323（像素字）
   - Space Grotesk（备用 sans）
   如果你心里有目标字体（例如 Berkeley Mono、Commit Mono、Fira Code、IBM Plex Mono），告诉我替换。
3. **3D 粒子建筑** 当前用 Canvas 2D 粒子从素材图像点阵采样实现，**没有用 three.js 的真正 3D 旋转**。如果你想要可旋转的 3D 体积，需要我引入 three.js 并补建模时间。
4. **未确认 hover 目标列表**：除了 360 集团、阿里达摩院之外的经历条目都是占位。
5. **像素小猫**：当前是 CSS box-shadow 拼的 sprite，4 个姿势。如果你想要更多帧、更复杂动画，需要确认是否做 GIF / WebP。

---

## 6. Bold Ask（请你做）

**请把简历正文（中文 / 双语都行）以纯文本或 Markdown 的形式贴在下一条消息里**，包括：
- 个人简介 1–2 行（hero 打字机用）
- 教育经历（学校、专业、年份）
- 工作经历（公司、职位、起止时间、3–6 条 bullet）
- 项目（名字、一句话简介、链接）
- 技能栈 / 联系方式

把它给我之后，我会把所有占位条目换成真实内容，并按 hover 列表把每家公司各绘制一个 3D 粒子建筑（你目前给了 360 集团，达摩院的建筑图也欢迎一起给）。
