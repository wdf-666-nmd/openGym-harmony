import { systemShare } from '@kit.ShareKit';
import { fileUri } from '@kit.CoreFileKit';
import fs from '@ohos.file.fs';
import { CapacitorPlugin } from '../CapacitorPlugin';
import { PluginCall } from '../PluginCall';

/**
 * `Print` (openGym's own plugin, registered natively on Android/iOS) —
 * `printHtml({ html, name })` hands a self-contained HTML document to the OS
 * print flow. On Android this is PrintManager with an offscreen WebView; on
 * iOS UIPrintInteractionController.
 *
 * HarmonyOS has no public system-print API for third-party apps. The system
 * share sheet, however, ships print/save-as-file abilities
 * (`ShareAbilityType.PRINT`, `SAVE_AS_FILE`), so this implementation writes
 * the document to the cache directory and opens the share sheet on it — the
 * person picks "save as file", "print", or any share target. The JS contract
 * is unchanged (resolve on hand-off), and callers gate on MOBILE exactly as
 * before.
 */
export class PrintPlugin extends CapacitorPlugin {
  getPluginId(): string {
    return 'Print';
  }

  getMethods(): string[] {
    return ['printHtml'];
  }

  printHtml(call: PluginCall): void {
    const html: string = call.getString('html');
    const name: string = call.getString('name', 'openGym');
    if (html.length === 0) {
      call.reject('html is required', 'INVALID_PARAM');
      return;
    }
    try {
      const fileName: string = name.endsWith('.html') ? name : `${name}.html`;
      const safeName: string = fileName.replace(/[\\/:*?"<>|]/g, '_');
      const path: string = `${this.context.cacheDir}/${safeName}`;
      const file: fs.File = fs.openSync(path, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC);
      fs.writeSync(file.fd, html);
      fs.closeSync(file);
      const uri: string = fileUri.getUriFromPath(path);
      const record: systemShare.SharedRecord = {
        utd: 'general.html',
        uri: uri,
        title: name,
      };
      const data: systemShare.SharedData = new systemShare.SharedData(record);
      const controller: systemShare.ShareController = new systemShare.ShareController(data);
      const options: systemShare.ShareControllerOptions = {
        selectionMode: systemShare.SelectionMode.SINGLE,
        previewMode: systemShare.SharePreviewMode.DETAIL,
      };
      controller.show(this.context, options)
        .then(() => {
          call.resolve();
        })
        .catch((e: Object) => {
          call.reject(`print (via share sheet) failed: ${String(e)}`);
        });
    } catch (e) {
      call.reject(`print failed: ${String(e)}`);
    }
  }
}
