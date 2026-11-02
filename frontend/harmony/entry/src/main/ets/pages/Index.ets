import { webview } from '@kit.ArkWeb';
import { common } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { picker } from '@kit.CoreFileKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { BridgeHolder } from '../capacitor/bridgeInstance';
import { CapacitorBridge } from '../capacitor/CapacitorBridge';

@Entry
@Component
struct Index {
  private controller: webview.WebviewController = new webview.WebviewController();
  private bridge: CapacitorBridge | null = null;
  @State serverUrl: string = 'http://localhost/';

  aboutToAppear(): void {
    const ctx: common.UIAbilityContext = BridgeHolder.context!;
    this.bridge = new CapacitorBridge(ctx, this.controller);
    BridgeHolder.bridge = this.bridge;
    this.bridge.init();
    this.serverUrl = this.bridge.getServerUrl();
  }

  onBackPress(): boolean {
    hilog.info(0x0000, 'IndexPage', 'onBackPress fired');
    // Capacitor contract first: if JS registered an `App.backButton`
    // listener, let the web layer decide (sheet close / history back /
    // press-again-to-exit — lib/back.js).
    const handled = this.bridge?.onBackPressed();
    hilog.info(0x0000, 'IndexPage', 'bridge handled back: %{public}s', String(handled));
    if (handled) {
      return true;
    }
    // No JS listener (boot failed, old install): drive the WebView history
    // ourselves, and only let the system leave the app at the root.
    // The previous fallback poked a `window.__browserBack` hook that the
    // mobile bundle never defined — a back gesture then did nothing at all.
    if (this.controller.accessBackward()) {
      this.controller.backward();
      return true;
    }
    return false;
  }

  build() {
    Column() {
      Web({ src: this.serverUrl, controller: this.controller })
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .fileAccess(true)
        .imageAccess(true)
        .mixedMode(MixedMode.All)
        .databaseAccess(true)
        .geolocationAccess(true)
        .cacheMode(CacheMode.Default)
        // AGC 审核建议（1.0.8 通过后的非阻塞项）：短音/瞬态音场景未适配音频焦点，
        // 会打断后台音乐且不恢复。AMBIENT 会话让本 WebView 的短音与后台音乐并发
        // 混音（对应建议中的「直接并发播放」路径），而不是抢焦点暂停对方。
        // compileSdk 6.0.0(20) ≥ since 20，compatibleSdk 5.0.0(12) 下旧设备忽略该属性。
        .mediaOptions({ audioSessionType: AudioSessionType.AMBIENT })
        .javaScriptProxy({
          object: this.bridge!.getProxyObject(),
          name: 'harmonyBridge',
          methodList: ['postMessage'],
          controller: this.controller,
        })
        .onInterceptRequest((event: OnInterceptRequestEvent) => {
          if (!this.bridge) {
            return null;
          }
          return this.bridge.handleInterceptRequest(event.request);
        })
        .onPageEnd(() => {
          this.bridge?.onPageReady();
        })
        // AGC 1.0.9 审核整改（问题3）：ArkWeb 的 <input type="file"> 需要宿主提供文件选择器，
        // 否则点击「添加照片/视频」静默失败（CDP Page.fileChooserOpened 无回调实证）。
        // 接 DocumentViewPicker（图片/视频/任意文件，无需运行时权限），把选中的 uri
        // 交回 WebView 的 file input。返回 true 表示由本回调处理（阻止默认无行为）。
        .onShowFileSelector((event: OnShowFileSelectorEvent): boolean => {
          hilog.info(0x0000, 'IndexPage', 'file selector: mode=%{public}s accept=%{public}s', String(event.fileSelector.getMode()), event.fileSelector.getAcceptType().join(','));
          const docSelect = new picker.DocumentSelectOptions();
          // acceptType（MIME 如 image/*）映射为后缀过滤；空则不过滤（全部文件）
          const mimeToSuffix: Record<string, string> = {
            'image/*': '.jpg|.jpeg|.png|.webp|.gif|.heic',
            'video/*': '.mp4|.webm|.mov|.m4v',
            'image/jpeg': '.jpg|.jpeg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
            'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
          };
          const suffixes: Array<string> = [];
          for (const m of event.fileSelector.getAcceptType()) {
            const s = mimeToSuffix[m];
            if (s) suffixes.push(...s.split('|'));
          }
          if (suffixes.length > 0) {
            docSelect.fileSuffixFilters = suffixes;
          }
          docSelect.maxSelectNumber = 9;
          const ctx: common.UIAbilityContext = BridgeHolder.context!;
          const view = new picker.DocumentViewPicker(ctx);
          view.select(docSelect).then((uris: Array<string>) => {
            hilog.info(0x0000, 'IndexPage', 'file selector picked %{public}d', uris.length);
            event.result.handleFileList(uris);
          }).catch((err: BusinessError) => {
            hilog.warn(0x0000, 'IndexPage', 'file selector cancelled: %{public}s', String(err?.message ?? err));
            event.result.handleFileList([]);
          });
          return true;
        })
        .width('100%')
        .height('100%')
    }
    .width('100%')
    .height('100%')
  }
}
