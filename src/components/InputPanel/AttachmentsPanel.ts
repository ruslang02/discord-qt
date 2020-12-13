import {
  AlignmentFlag,
  Direction,
  MouseButton,
  QBoxLayout,
  QLabel,
  QMouseEvent,
  QPixmap,
  QWidget,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { basename, extname, join } from 'path';
import { pathToFileURL } from 'url';
import { PIXMAP_EXTS } from '../..';
import { createLogger } from '../../utilities/Console';
import { pictureWorker } from '../../utilities/PictureWorker';
import { __ } from '../../utilities/StringProvider';

const { error } = createLogger('AttachmentsPanel');

export class AttachmentsPanel extends QWidget {
  private static fileIcon = new QPixmap(join(__dirname, './assets/icons/file.png'));

  private files = new Set<string>();

  layout = new QBoxLayout(Direction.LeftToRight);

  constructor(parent?: any) {
    super(parent);
    this.setObjectName('AttachmentPanel');
    this.setLayout(this.layout);
    this.layout.setContentsMargins(0, 5, 0, 5);
    this.layout.addStretch(1);
    this.hide();
  }

  /**
   * Adds attachments to the message.
   * @param files Files to add.
   */
  addFiles(files: string[]) {
    for (const file of files) {
      this.files.add(file);
    }

    this.updateComponent();
  }

  clear() {
    this.files.clear();
    this.updateComponent();
  }

  getFiles() {
    return [...this.files.values()].map((attachment) => ({
      attachment,
      name: basename(attachment),
    }));
  }

  private updateComponent() {
    const { layout } = this;

    (layout.nodeChildren as Set<QWidget>).forEach((w) => {
      w.hide();
      layout.removeWidget(w);
    });

    for (const file of this.files) {
      const attach = new QLabel(this);

      attach.setFixedSize(120, 60);
      attach.setAlignment(AlignmentFlag.AlignCenter);
      attach.setProperty('toolTip', __('RIGHT_CLICK_REMOVE'));
      attach.addEventListener(WidgetEventTypes.MouseButtonPress, (e) => {
        const event = new QMouseEvent(e as any);

        if ((event.button() & MouseButton.RightButton) === MouseButton.RightButton) {
          this.files.delete(file);
          this.updateComponent();
        }
      });

      const url = pathToFileURL(file);
      const ext = extname(file).replace(/\./g, '').toUpperCase();

      if (!PIXMAP_EXTS.includes(ext)) {
        attach.setPixmap(AttachmentsPanel.fileIcon);
      } else {
        pictureWorker
          .loadImage(url.href, { roundify: false })
          .then((path) => {
            if (this.native.destroyed) {
              return;
            }

            const pix = new QPixmap(path);

            if (pix.width() < 1) {
              attach.setPixmap(AttachmentsPanel.fileIcon);
            } else {
              attach.setPixmap(pix.scaled(120, 60, 1, 1));
            }
          })
          .catch(() => {
            error(`Couldn't access file ${file}.`);
            attach.setPixmap(AttachmentsPanel.fileIcon);
          });
      }

      this.layout.insertWidget(this.layout.nodeChildren.size, attach);
    }

    if (this.files.size) {
      this.show();
    } else {
      this.hide();
    }
  }
}
