# 开练日记（原 openGym）华为应用市场提审材料

> 以下内容按 AGC 提交表单的字段组织，直接复制粘贴即可。
> 提交路径：AGC → 我的应用 → opengym → 版本管理与提审
> 2026-10-21 更新：应用名称由 openGym 改为「开练日记」（9.5 条名称驳回整改），版本升至 1.0.1，详见 RENAME.md。

## 应用名称

开练日记

## 一句话简介（应用描述开头）

开源健身追踪：计划训练、记录动作、看见进步，数据只属于你。

## 应用描述（完整版）

开练日记是一款开源的健身训练追踪应用（基于 AGPL-3.0 开源项目 openGym 的鸿蒙适配版）。

核心功能：
· 训练计划：按周编排训练日，内置推/拉/腿、上/下肢、全身、5×5 等经典入门计划，也可完全自定义
· 训练记录：组数、次数、重量一一记录，支持超组、热身组、有氧训练
· 动作库：数百个动作，附演示动画与目标肌群图
· 数据洞察：肌肉疲劳度、训练量趋势、连续训练周数，看见每一分进步
· 体重与目标：记录体重曲线，设定目标体重
· 训练提醒：按日历排程本地提醒，不漏训练日
· 数据自主：所有数据保存在本机，支持导出备份；也可连接自部署的 openGym 服务器同步

开源与致谢：本应用是开源项目 openGym（github.com/DuarteSantos8/openGym）的社区适配版本，遵循 AGPL-3.0 许可证，源码公开。

## 版本说明（1.0.1）

品牌整改版本：应用更名为「开练日记」以符合应用市场名称规范；功能与 1.0.0 完全一致。基于 openGym v1.4.1 移植：完整训练计划与记录功能、动作库、统计图表、本地提醒、备份导出。

## 关键词

健身,训练,撸铁,健身房,力量训练,训练计划, Workout, Gym

## 隐私权限说明（表单"权限用途"逐条填写）

本应用申请的权限与用途：
· 通知权限：展示训练日提醒（用户主动开启后才使用）
· 网络权限：仅在用户主动选择"连接自部署服务器"同步时访问用户自己指定的服务器；默认本地模式不联网
· 不收集、不上传任何用户数据；无第三方 SDK、无广告、无统计追踪

## 敏个人信息声明

健康数据（训练记录、体重）仅存储于设备本地，不上传任何服务器（除非用户自行配置同步到本人服务器）。

## 截图（docs/store-assets/ 下，共 5 张，齐备）

- s1-home.jpeg：首页（新手引导态，日历+训练卡片+体重模块）
- user-shot-4.jpg：计划页（每周安排 · 固定周/轮换模式）
- user-shot-1.jpg：训练进行中（Push Day · 杠铃卧推 · 组数/重量编辑）★ 主力功能图
- user-shot-3.jpg：动作库（5632 个动作 · 肌肉/类型/器械筛选）
- user-shot-2.jpg：统计页（训练量/热力图/身体围度曲线）

建议上传顺序：训练进行中 → 动作库 → 首页 → 统计 → 计划页（核心功能优先）

## 包文件

提交用 HAP：`E:\Tianshu\opengym-harmony\frontend\harmony\entry\build\default\outputs\default\entry-release-signed.hap`
（发布证书 opengym_release 签名，versionCode 1000001 / versionName 1.0.1，发布 Profile 已关联）

## 注意事项

1. 开放式测试目前主要面向已上架或过审应用的新版本——**首次提审的应用一般需要先走正式上架流程**（含软著）。如果 AGC 的开放式测试入口对首版不可用，fallback 是正式提审（材料相同，多一项软著）。提交前在 AGC 界面确认入口可用性。
2. 健身类目在华为审核中归类"运动健康"，可能要求补充《健康类目承诺函》（AGC 表单内在线签署即可）。
3. AGPL 开源：在"应用描述"已注明源码地址，满足合规要求；如审核要求补充开源证明，提供 GitHub 仓库链接截图即可。

## 最终提交包（2026-10-17 更新）

AGC 上架要求 .app 格式（非 .hap）。构建链：hvigor assembleApp 出未签名包 → hap-sign-tool 发布证书签名。

**提交文件**：`E:\Tianshu\opengym-harmony\frontend\harmony\build\outputs\default\opengym-release-v3.app`
（发布证书 opengym_release 签名，189MB，versionName 1.0.1 / versionCode 1000001）

复现命令：
```
cd frontend/harmony
hvigorw assembleApp --no-daemon
java -jar <SDK>/toolchains/lib/hap-sign-tool.jar sign-app -mode localSign \
  -keyAlias opengymrelease -keyPwd <密码> \
  -appCertFile <发布.cer> -profileFile <发布Profile.p7b> -profileSigned 1 \
  -inFile build/outputs/default/harmony-default-unsigned.app \
  -keystoreFile <发布.p12> -keystorePwd <密码> \
  -signAlg SHA256withECDSA -outFile build/outputs/default/opengym-release-v3.app
```
