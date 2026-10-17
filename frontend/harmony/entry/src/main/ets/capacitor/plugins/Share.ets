import { systemShare } from '@kit.ShareKit';
import { fileUri } from '@kit.CoreFileKit';
import { CapacitorPlugin } from '../CapacitorPlugin';
import { PluginCall } from '../PluginCall';

/**
 * `@capacitor/share` — hand a file (or plain text) to the system share sheet.
 *
 * The JS side calls `Share.share({ title, url })` where `url` is a `file://`
 * URI produced by `Filesystem.getUri` (mobile.js shareExport / shareExportBlob).
 * Android feeds that URI to the system chooser; here the HarmonyOS share
 * panel (`systemShare.ShareController`) plays that role.
 *
 * Semantics follow the Android plugin: resolve with no data once the sheet is
 * shown, reject on failure. `text` without a `url` is shared as plain text.
 */
export class SharePlugin extends CapacitorPlugin {
  getPluginId(): string {
    return 'Share';
  }

  getMethods(): string[] {
    return ['share'];
  }

  share(call: PluginCall): void {
    const title: string = call.getString('title', '');
    const text: string = call.getString('text', '');
    const url: string = call.getString('url', '');

    if (url.length === 0 && text.length === 0) {
      call.reject('Nothing to share: provide text or url', 'INVALID_PARAM');
      return;
    }

    try {
      let record: systemShare.SharedRecord;
      if (url.length > 0) {
        // A `file://` URI from Filesystem.getUri: share the file itself.
        // A file:// prefix is stripped because getUriFromPath wants a path.
        const path: string = url.startsWith('file://') ? url.substring('file://'.length) : url;
        const uri: string = fileUri.getUriFromPath(path);
        record = {
          utd: this.utdFor(path),
          uri: uri,
          title: title,
        };
      } else {
        record = {
          utd: 'general.plain-text',
          content: text,
          title: title,
        };
      }
      const data: systemShare.SharedData = new systemShare.SharedData(record);
      const controller: systemShare.ShareController = new systemShare.ShareController(data);
      const options: systemShare.ShareControllerOptions = {
        selectionMode: systemShare.SelectionMode.SINGLE,
        previewMode: systemShare.SharePreviewMode.DEFAULT,
      };
      controller.show(this.context, options)
        .then(() => {
          call.resolve();
        })
        .catch((e: Object) => {
          call.reject(`share failed: ${String(e)}`);
        });
    } catch (e) {
      call.reject(`share failed: ${String(e)}`);
    }
  }

  /**
   * UTD id for the file being shared. openGym exports are JSON backups
   * (plain text), zipped media backups, or shared print HTML — map the common
   * extensions and fall back to the generic data type.
   */
  private utdFor(path: string): string {
    const lower: string = path.toLowerCase();
    if (lower.endsWith('.json')) {
      return 'general.json';
    }
    if (lower.endsWith('.txt') || lower.endsWith('.html') || lower.endsWith('.htm')) {
      return 'general.plain-text';
    }
    if (lower.endsWith('.zip')) {
      return 'general.archive';
    }
    if (lower.endsWith('.pdf')) {
      return 'general.pdf';
    }
    return 'general.data';
  }
}
