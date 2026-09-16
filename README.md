# 极简记账 (Minimalist Ledger)

<p align="center">
  <img src="src/assets/icon.png" width="96" height="96" alt="极简记账 Logo" onerror="this.style.display='none'"/>
</p>

<p align="center">
  <strong>一款专注纯粹记账本质的免费开源 Android 记账应用</strong><br>
  <span>0 广告 · 0 推广 · 0 云端追踪 · 100% 本地隐私安全 · 自由导出</span>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"/>
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20Web-green.svg" alt="Platform"/>
  <img src="https://img.shields.io/badge/React-18.3-61dafb.svg" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178c6.svg" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Capacitor-8.5-119eff.svg" alt="Capacitor"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg" alt="TailwindCSS"/>
</p>

---

## 📖 项目愿景

市面上的记账软件日益臃肿——开屏广告、金融借贷推销、社区理财杂乱无章，甚至将**全量数据导出、预算管理、多维统计**等本应最基础的记账功能划入高价 VIP 付费墙。

**极简记账 (Minimalist Ledger)** 诞生于对记账本质的回归：
- **回归记账本质**：打开即记、记完即走、随心查对。
- **数据完全自主**：所有流水 100% 留存在手机本地，永久免费支持 Excel/CSV/JSON 导出与无损备份还原。
- **开源共建共享**：代码完全透明开源，绝不索取任何多余敏感权限。

---

## ✨ 核心特性

### 1. ⚡ 秒开极速记账 & 财务计算器键盘
- **拟真财务键盘**：内置数字计算器，支持 `+`、`-`、`=` 连续加减运算，无缝核对复杂账单。
- **「再记一笔」连击模式**：保存后保留当前分类、账户与日期，免去重复点选，连续录入丝滑顺手。
- **震动触觉反馈**：拟真敲击手感，带来行云流水的记账体验。
- **选填备注与快捷标签**：支持单笔交易附带备注及常用快捷标签。

### 2. 📂 二级分类自由拓展
- **一级分类下细分子项**：例如在「餐饮美食」下一键点选「早餐」、「午餐」、「晚餐」、「外卖」或「咖啡」。
- **长按即刻管理**：在分类九宫格中长按任意分类，即可唤出二级分类管理抽屉，自由添加或删减二级选项。
- **智能防误触**：内置触控滑动位移识别算法，上下滑屏浏览分类时绝不误触发管理弹窗。

### 3. 💳 灵活账户资产联动
- **多账户支持**：支持微信支付、支付宝、银行卡、现金、信用卡等多种账户类型。
- **非强制选择**：无需每笔强制选账户；若上次选过，下次自动延续所选账户。
- **直达管理中心**：记账界面提供直达账户管理入口，支持账户新增、删除与余额统计。

### 4. 🔄 钱迹（Qianji）账单格式无缝导入
- **格式深度兼容**：原生支持导入从「钱迹」App 导出的标准 JSON 备份账本。
- **智能分类校准**：自动识别并映射钱迹中的各类支出/收入分类及对应子项目。
- **预算系统联动**：导入历史月度账单后，系统自动同步纳入当月预算消费小项统计。

### 5. 🧩 原生桌面小部件 (Android App Widgets)
- **1×4 通栏小部件**：桌面一览当月总支出、月度预算消耗进度条、近 7 日消费趋势柱状图，右侧配备一键记账入口。
- **2×2 便捷看板**：直观呈现今日支出、当月累计及预算剩余额度，点击直达记账界面。
- **桌面快捷直达**：点击小部件上的记账按钮，毫秒级直通快捷记账面板。

### 6. 🛡️ 本地自动快照防丢引擎 (Auto-Snapshot)
- **自动镜像备份**：每次记账时全自动向隔离的安全存储写入带时间戳的双重镜像快照。
- **防意外清除机制**：在发生系统清理或意外重置时提供兜底机制。
- **一键无损找回**：设置页面提供「本地自动快照防丢恢复」卡片，清晰展示快照笔数与时间，随时一键还原。

### 7. 📊 多维深度统计图表
- **柱状趋势图**：支持当月每日/当周每日自由切换，支持支出趋势/收入趋势自由组合（2×2 组合共4种视图）。
- **SVG 环形消费占比图**：智能解决 100% 满额单分类几何渲染问题，精确展示各分类支出占比。
- **排行榜与历史月份翻页**：轻松对照历史月份收支结余与各分类消费排行。

### 8. 🎯 预算中心与超支预警
- **双层预算设定**：支持月度总预算和各类别分类专属预算。
- **动态建议消费额**：根据当月剩余天数动态测算每日建议可用金额。
- **预警指示**：消耗达 80% 触发预警黄色指示，超支达 100% 触发醒目红色警报。

### 9. ⏰ 定时记账提醒
- **闹钟式灵活设定**：支持自定义每日提醒时间（如 21:30），周一至周日独立勾选，支持工作日/周末/每天一键切换。
- **系统通知与应用内横幅**：支持系统标准推送，并提供应用内快速记账横幅直达。

### 10. 🔒 100% 离线安全 & 自由导出
- **完全离线**：不设服务器，不联网收集数据，数据仅保存在手机本机。
- **全量 JSON 备份**：支持自由导出与导入完整账本。
- **Excel / CSV 格式报表**：自带 UTF-8 BOM 编码，在 Microsoft Excel、WPS Office 打开绝无中文乱码。

---

## 🛠️ 技术栈

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **核心框架** | React 18 + TypeScript | 组件化设计与类型安全保证 |
| **构建工具** | Vite 8 + Rolldown | 极速热更新与模块打包 |
| **样式体系** | Tailwind CSS 3.4 | 现代响应式 Utility-First 设计与深色模式适配 |
| **图标库** | Lucide React | 丰富一致的矢量线性图标体系 |
| **原生混合** | Capacitor 8.5 | 桥接 Android 原生层与 Web 前端 |
| **原生部件** | Android AppWidgetProvider | Java 实现的原生桌面小部件与数据持久化通信 |

---

## 🚀 快速上手与本地运行

### 前置准备
- [Node.js](https://nodejs.org/) (建议 LTS 18 或 20+)
- [Git](https://git-scm.com/)
- (可选，仅编译原生 APK 时需要) [Android Studio](https://developer.android.com/studio) 及 Android SDK、JDK 17/21

### 1. 克隆代码并安装依赖
```bash
git clone https://github.com/your-username/Minimalist-Ledger.git
cd Minimalist-Ledger
npm install
```

### 2. 启动 Web 本地开发服务
```bash
npm run dev
```
打开浏览器访问 [http://localhost:5173](http://localhost:5173) 即可进入极简记账应用。

### 3. 同步前端构建至 Android 原生项目
```bash
npm run build:android
```

### 4. 编译 Android APK

**方式一：使用 Android Studio**
1. 运行命令打开原生工程：
   ```bash
   npx cap open android
   ```
2. 在 Android Studio 中直接点击 **Run** 或在菜单栏选择 **Build > Build Bundle(s) / APK(s) > Build APK(s)**。

**方式二：使用 Gradle 命令行**
```bash
cd android
./gradlew assembleDebug
```
编译生成的 APK 文件位于：`android/app/build/outputs/apk/debug/app-debug.apk`。

---

## 📂 项目结构

```text
Minimalist-Ledger/
├── src/
│   ├── components/       # 业务组件 (记账弹窗、键盘、统计、预算、小部件中心等)
│   ├── services/         # 数据持久化、通知提醒、默认数据、备份导入等服务
│   ├── types/            # TypeScript 类型定义
│   ├── App.tsx           # 核心容器应用
│   ├── main.tsx          # 前端入口
│   └── index.css         # 全局样式与 Tailwind 指令
├── android/              # Android 原生项目 (Capacitor 容器、AppWidget 桌面小部件)
│   ├── app/
│   │   ├── src/main/java/com/qianji/freeledger/  # Java 原生代码及 Widget 提供者
│   │   ├── src/main/res/                        # Android 布局、小部件 XML 与资源
│   │   └── build.gradle                         # 模块构建配置
│   └── build.gradle                             # 工程根级 Gradle 配置
├── capacitor.config.ts   # Capacitor 跨端配置文件
├── package.json          # 依赖管理与 Scripts
├── tailwind.config.js    # Tailwind 样式配置
└── vite.config.ts        # Vite 构建工具配置
```

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！
1. Fork 本仓库
2. 创建您的分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 协议开源。
