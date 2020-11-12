import {
  AlignmentFlag, Direction, Orientation, QBoxLayout, QLabel, QProgressBar, QSlider,
} from '@nodegui/nodegui';
import { ChildProcessWithoutNullStreams, execSync } from 'child_process';
import { __ } from 'i18n';
import { basename } from 'path';
import { app, MAX_QSIZE } from '../../..';
import { DComboBox } from '../../../components/DComboBox/DComboBox';
import { DLabel } from '../../../components/DLabel/DLabel';
import { NoiseReductor } from '../../../components/VoicePanel/NoiseReductor';
import { createLogger } from '../../../utilities/Console';
import { Events } from '../../../utilities/Events';
import { IConfig } from '../../../utilities/IConfig';
import { createRecordStream } from '../../../utilities/VoiceStreams';
import { Divider } from '../Divider';
import { Page } from './Page';

const { error } = createLogger(basename(__filename, '.ts'));

export class VoicePage extends Page {
  title = __('VOICE');

  private header = new QLabel();

  private inDevice = new DComboBox(this);

  private outDevice = new DComboBox(this);

  private inVolume = new QSlider(this);

  private outVolume = new QSlider(this);

  private sensVal = new QSlider(this);

  private sensCheck = new QProgressBar(this);

  private recordTester?: ChildProcessWithoutNullStreams;

  private recordTimer: any;

  constructor() {
    super();
    this.initPage();
    this.layout.setSpacing(5);

    app.on(Events.CONFIG_UPDATE, this.loadConfig.bind(this));
  }

  private createHeader(id: string) {
    const label = new QLabel(this);
    label.setObjectName('Header3');
    label.setText(__(id));
    return label;
  }

  onOpened() {
    this.updateSinks();
    this.loadConfig(app.config);
    this.openRecorder();
  }

  private openRecorder() {
    this.onClosed();
    this.recordTester = createRecordStream({ device: this.inDevice.currentText() });
    const noiseReductor = new NoiseReductor(() => {}, (loudness) => {
      this.sensCheck.setValue(loudness * (app.config.voiceSettings.inputVolume ?? 100) * 0.1);
    });
    const tester = this.recordTester.stdout.pipe(noiseReductor);
    this.recordTimer = setInterval(() => {
      tester.read();
    }, 50);
  }

  onClosed() {
    clearInterval(this.recordTimer);
    this.recordTester?.kill();
    this.recordTester = undefined;
  }

  private loadConfig({ voiceSettings: v }: IConfig) {
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
    if (!app.configManager.isLoaded || this.loadingConfig) return;
    const settings = { ...app.config.voiceSettings };
    settings.inputDevice = this.inDevice.currentText();
    settings.outputDevice = this.outDevice.currentText();
    settings.inputVolume = this.inVolume.value();
    settings.outputVolume = this.outVolume.value();
    settings.inputSensitivity = this.sensVal.value() / 10;
    app.config.voiceSettings = settings;
    void app.configManager.save();
  }

  private updateSinks() {
    const {
      inDevice, outDevice,
    } = this;
    if (process.platform !== 'linux') return;
    this.loadingConfig = true;
    inDevice.clear();
    outDevice.clear();

    try {
      const sourcesOut = execSync('pactl list sources short').toString();
      const sources = sourcesOut.split('\n').map((value) => value.split('\t')[1]).filter((value) => value);
      inDevice.addItems(sources);

      const sinksOut = execSync('pactl list sinks short').toString();
      const sinks = sinksOut.split('\n').map((value) => value.split('\t')[1]).filter((value) => value);
      outDevice.addItems(sinks);
    } catch (e) {
      error('Could not update PulseAudio sinks.', e);
    }
    this.loadingConfig = false;
  }

  private initPage() {
    const {
      createHeader, updateSinks, saveConfig,
      title, header, layout, inDevice, inVolume, outDevice, outVolume, sensVal, sensCheck,
    } = this;
    header.setObjectName('Header2');
    header.setText(title);
    layout.addWidget(header);

    if (process.platform !== 'linux') {
      const pnsLabel = new DLabel(this);
      pnsLabel.setText(__('PLATFORM_NOT_SUPPORTED'));
      pnsLabel.setAlignment(AlignmentFlag.AlignCenter);
      layout.addWidget(pnsLabel);
      layout.addStretch(1);
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
      this.openRecorder();
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
    updateSinks.call(this);
  }
}
