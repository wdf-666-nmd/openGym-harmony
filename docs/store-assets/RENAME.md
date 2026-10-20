# 改名重提审操作单（openGym → 开练日记）

> 2026-10-21。背景：v2 提审被驳回，**共三项问题**（用户提供的驳回报告截图逐字核实）：
> 1. 【9.5 名称】应用与 "openGym" 应用名称相同，未提供授权或商标权属证明。特别提醒：修改应用名称时，请务必同步更新应用介绍、应用内容及应用安装包的名称配置
> 2. 【1.11 分类】请提交至【运动健康】分类并设置【运动】为主标签（此前分类填错）
> 3. 【1.20 图标】AGC 提交的图标与应用安装后终端显示的图标不一致（包内 startIcon.png 是适配器模板的「21」像素字图标，AGC 提交的是哑铃图标——两图完全不同）
>
> 整改方案：市场名与桌面名统一改为「开练日记」——不含 openGym 字样（连部分相似都会被驳回，参考「指尖」案例）、避开「训练日志」类泛用词（TOP3 广义归纳类驳回）、双字组合独特性高；openGym = 开放健身房，「开练」是含义承接。
> 桌面名与市场名同步改的理由：驳回报告特别提醒明说"务必同步更新…应用安装包的名称配置"，名称一致性是审核明确要求，不是可选项。

## 已完成的源码改动（两仓库同步落盘）

| 文件 | 改动 |
|---|---|
| `frontend/harmony/AppScope/resources/base/element/string.json` | `app_name` → 开练日记 |
| `frontend/harmony/entry/src/main/resources/base/element/string.json` | `EntryAbility_label` + `app_name` → 开练日记 |
| `frontend/harmony/AppScope/app.json5` | versionCode 1000000→1000001，versionName 1.0.0→1.0.1 |
| `frontend/harmony/entry/src/main/resources/base/media/startIcon.png` | 「21」模板图标 → 哑铃图标（= AGC 提交的 app-icon-1024.png，字节级一致） |
| `frontend/harmony/AppScope/resources/base/media/startIcon.png` | 新增（此前 $media:startIcon 引用无实际文件） |
| `resign-app.sh` | 输出改为 opengym-release-v3.app |

UI 界面文案零改动（`frontend/src` 中 `(?i)gym` 零命中，品牌名不出现在界面里），截图无需重截。

## 第一步：重出 v3 包（构建仓库内执行）

```bash
cd E:/Tianshu/opengym-harmony/frontend/harmony
# DevEco 的 hvigorw.bat 在 Git Bash 下是坏的，必须用 node 直跑 hvigorw.js（见 docs/harmony.md）
"C:/Program Files/Huawei/DevEco Studio/tools/node/node.exe" \
  "C:/Program Files/Huawei/DevEco Studio/tools/hvigor/bin/hvigorw.js" \
  assembleApp --no-daemon
# 产出 frontend/harmony/build/outputs/default/harmony-default-unsigned.app

# 发布签名（resign-app.sh 已改为输出 v3）
cd E:/Tianshu/opengym-harmony
bash resign-app.sh "C:/Users/21972/Desktop/opengym_releaseRelease.p7b"
# 产出 frontend/harmony/build/outputs/default/opengym-release-v3.app
```

注意：AGC 版本管理里 versionCode 必须递增，v3 包 1000001 已满足。

## 第二步：AGC 修改应用信息（网页动态页，需人工操作）

1. AGC → 我的应用 → opengym → 应用信息：**应用名称**改为「开练日记」
   - 若 AGC 提示名称被占用（重名校验即时生效），备选名依次试：开练手账 / 开铁日记 / 练出日记
2. **应用分类与标签（1.11 整改）**：分类改为「运动健康」，主标签设为「运动」；如 AGC 要求健康类目资质，表单内在线签署《健康类目承诺函》即可
3. **应用介绍**：粘贴 SUBMISSION.md 更新后的「应用描述（完整版）」（开头已改为「开练日记是一款开源的健身训练追踪应用（基于 AGPL-3.0 开源项目 openGym 的鸿蒙适配版）」）
4. **应用图标**：AGC 侧不动（哑铃图标继续用）；包内已同步替换为同一图标（1.20 整改），提交的图标与安装后显示将完全一致
5. **一句话简介**、关键词、截图：不变（简介本就不含应用名）
6. 备注栏注明：「本次版本为名称合规整改：应用更名为开练日记，功能与上一版本一致」

## 第三步：重提审

1. 版本管理与提审 → 新建版本上传 v3 包（`E:\Tianshu\opengym-harmony\frontend\harmony\build\outputs\default\opengym-release-v3.app`）
2. 版本说明用 SUBMISSION.md「版本说明（1.0.1）」
3. 其余表单项沿用 SUBMISSION.md（权限说明、敏感个人信息声明、测试账号等均已就绪）
4. 若再次驳回：按报告逐条修；名称类若仍卡，走 AGC「在线人工客服」提工单（1-2 工作日回复）

## 第四步（过审后）

AGC 应用发布 → 拿市场链接/二维码 → 手机市场安装 → 关闭开发者模式（原始诉求闭环）。

## 风险与备选

- 名称占用预查：web 搜索 AppGallery 无「开练日记」同名应用（低相关检索，最终以 AGC 表单重名校验为准——它保存时会即时提示）
- 若「开练日记」在 AGC 重名校验中被拒，备选名：开练手账 / 开铁日记 / 练出日记（均为独特组合词，规避 TOP3 泛用词驳回）
- 路线 B（联系上游 DuarteSantos8 索取名称授权）保留为后备：AGPL 不含商标授权，周期不可控，仅在路 A 反复失败时启用
- v2 包与已提交的 versionId 不作废：AGC 支持驳回后重新编辑提审，v3 是新版本提交
