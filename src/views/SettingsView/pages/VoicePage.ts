import {
  AlignmentFlag,
  Direction,
  Orientation,
  QBoxLayout,
  QLabel,
  QProgressBar,
  QSlider,
} from '@nodegui/nodegui';
import { app, MAX_QSIZE } from '../../..';
import { DComboBox } from '../../../components/DComboBox/DComboBox';
import { DLabel } from '../../../components/DLabel/DLabel';
import { NoiseReductor } from '../../../components/VoicePanel/NoiseReductor';
import { ConfigManager } from '../../../utilities/ConfigManager';
import { Events } from '../../../utilities/Events';
import { __ } from '../../../utilities/StringProvider';
import { RecordStream } from '../../../utilities/voice/RecordStream';
import { voiceProvider as vp } from '../../../utilities/voice/VoiceProviderManager';
import { Divider } from '../Divider';
import { Page } from './Page';

export class VoicePage extends Page {
  title = __('VOICE');

  private header = new QLabel();

  private inDevice = new DComboBox(this);

  private outDevice = new DComboBox(this);

  private inVolume = new QSlider(this);

  private outVolume = new QSlider(this);

  private sensVal = new QSlider(this);

  private sensCheck = new QProgressBar(this);

  private recordTester?: RecordStream;

  private recordTimer: any;

  constructor() {
    super();
    this.initPage();
    this.layout.setSpacing(5);

    app.on(Events.CONFIG_UPDATE, this.loadConfig.bind(this));
  }

  onOpened() {
    this.updateSinks();
    this.loadConfig(app.config);
    this.openRecorder();
  }

  private openRecorder() {
    this.onClosed();
    if (!vp) return;
    this.recordTester = vp.createRecordStream({ device: this.inDevice.currentText() });
    const noiseReductor = new NoiseReductor(
      () => {},
      (loudness) => {
        this.sensCheck.setValue(
          loudness * (app.config.get('voiceSettings').inputVolume ?? 100) * 0.1
        );
      }
    );

    const tester = this.recordTester.stream.pipe(noiseReductor);

    this.recordTimer = setInterval(() => {
      tester.read();
    }, 50);
  }

  onClosed() {
    clearInterval(this.recordTimer);
    this.recordTester?.end();
    this.recordTester = undefined;
  }

  private loadConfig(config: ConfigManager) {
    const v = config.get('voiceSettings');

    this.loadingConfig = true;
    this.inDevice.setCurrentText(v.inputDevice ?? 'default');
    this.outDevice.setCurrentText(v.outputDevice ?? 'default');
    this.inVolume.setValue(v.inputVolume ?? 100);
    this.outVolume.setValue(v.outputVolume ?? 100);
    this.sensVal.setValue((v.inputSensitivity ?? 0) * 10);
    this.loadingConfig = false;
  }

  private loadingConfig = false;

  private saveConfig() {
    if (!app.config.isLoaded || this.loadingConfig) {
      return;
    }

    const settings = app.config.get('voiceSettings');

    settings.inputDevice = this.inDevice.currentText();
    settings.outputDevice = this.outDevice.currentText();
    settings.inputVolume = this.inVolume.value();
    settings.outputVolume = this.outVolume.value();
    settings.inputSensitivity = this.sensVal.value() / 10;

    void app.config.save();
  }

  private updateSinks() {
    const { inDevice, outDevice } = this;

    if (!vp) {
      return;
    }

    this.loadingConfig = true;
    inDevice.clear();
    outDevice.clear();

    inDevice.addItems(vp.getInputDevices());
    outDevice.addItems(vp.getOutputDevices());

    this.loadingConfig = false;
  }

  private initPage() {
    const {
      createSubheader: createHeader,
      saveConfig,
      title,
      header,
      layout,
      inDevice,
      inVolume,
      outDevice,
      outVolume,
      sensVal,
      sensCheck,
    } = this;

    header.setObjectName('Header2');
    header.setText(title);
    layout.addWidget(header);

    if (!vp) {
      const pnsLabel = new DLabel(this);

      pnsLabel.setText(__('PLATFORM_NOT_SUPPORTED'));
      pnsLabel.setAlignment(AlignmentFlag.AlignCenter);
      layout.addWidget(pnsLabel);
      layout.addStretch(1);

      [inDevice, inVolume, outDevice, outVolume, sensVal, sensCheck].forEach((w) => w.hide());

      return;
    }

    const devLayout = new QBoxLayout(Direction.LeftToRight);
    const inLayout = new QBoxLayout(Direction.TopToBottom);
    const outLayout = new QBoxLayout(Direction.TopToBottom);
    const sensLayout = new QBoxLayout(Direction.TopToBottom);

    [devLayout, inLayout, outLayout, sensLayout].forEach((l) => {
      l.setSpacing(12);
      l.setContentsMargins(2, 0, 2, 2);
    });

    inDevice.addEventListener('currentIndexChanged', () => {
      saveConfig.call(this);

      if (this.recordTester?.device !== inDevice.currentText()) {
        this.openRecorder();
      }
    });

    inVolume.setOrientation(Orientation.Horizontal);
    inVolume.addEventListener('valueChanged', saveConfig.bind(this));
    outVolume.setOrientation(Orientation.Horizontal);
    outVolume.addEventListener('valueChanged', saveConfig.bind(this));
    outDevice.addEventListener('currentIndexChanged', saveConfig.bind(this));

    inLayout.addWidget(createHeader('FORM_LABEL_INPUT_DEVICE'));
    inLayout.addWidget(inDevice);
    inLayout.addSpacing(4);
    inLayout.addWidget(createHeader('FORM_LABEL_INPUT_VOLUME'));
    inLayout.addWidget(inVolume);

    outLayout.addWidget(createHeader('FORM_LABEL_OUTPUT_DEVICE'));
    outLayout.addWidget(outDevice);
    outLayout.addSpacing(4);
    outLayout.addWidget(createHeader('FORM_LABEL_OUTPUT_VOLUME'));
    outLayout.addWidget(outVolume);

    devLayout.addLayout(inLayout, 1);
    devLayout.addLayout(outLayout, 1);

    sensVal.setOrientation(Orientation.Horizontal);
    sensVal.setMaximum(160);
    sensVal.setProperty('type', 'sensivity');
    sensVal.addEventListener('valueChanged', saveConfig.bind(this));

    sensCheck.setMaximum(160);
    sensCheck.setTextVisible(false);
    sensCheck.setMaximumSize(MAX_QSIZE, 6);

    sensLayout.addWidget(createHeader('FORM_LABEL_INPUT_SENSITIVTY'));
    sensLayout.addWidget(sensVal);
    sensLayout.addWidget(sensCheck);

    layout.addLayout(devLayout);
    layout.addWidget(new Divider());
    layout.addLayout(sensLayout);

    layout.addStretch(1);
  }
}
