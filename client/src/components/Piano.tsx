import React from "react";
import MidiController from "./piano/MidiController"
import PianoGraphics from './piano/Graphics';
import { IAppContext, withContext } from '../App';
import instruments from '../instruments.json';

interface IPianoProps {

}

interface IPianoState {
  instrument: string;
  device: string;
  devices: string[];
  recording: boolean;
  midiFile: string;
  midiFileDump: string;
}

type IProps = IPianoProps & IAppContext
class Piano extends React.PureComponent<IProps, IPianoState> {
  canvas?: HTMLCanvasElement;
  midi: MidiController;
  frameId: number;
  graphics?: PianoGraphics;
  constructor(props: IProps) {
    super(props);
    this.frameId = -1;
    this.state = {
      instrument:'acoustic_grand_piano',
      device: '',
      devices: [],
      recording: false,
      midiFile: '',
      midiFileDump: '',
    };
    this.midi = new MidiController(this.props.socket, this.props.color, this.state.instrument);
  }

  componentDidMount() {
    this.midi.init(this.handleDeviceUpdate);
  }

  componentDidUpdate() {
    this.midi.setNoteColor(this.props.color);
    this.midi.setActive(this.props.room.activePiano);
    if (this.graphics !== undefined) {
      this.graphics.setTheme(this.props.theme);
    }
  }

  setup = (canvas: HTMLCanvasElement | null) => {
    if (canvas === null) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      return;
    }
    this.canvas = canvas;
    window.addEventListener('resize', this.resizeCanvas, false);
    this.resizeCanvas();
    this.graphics = new PianoGraphics(canvas, ctx, this.props.theme);
    this.update();
  }

  update = () => {
    if (this.graphics === undefined) {
      return;
    }
    this.graphics.draw(this.midi.activeNotes);
    this.frameId = window.requestAnimationFrame(this.update);
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.frameId);
    this.midi.disconnect();
  }

  handleDeviceUpdate = (devices: string[]) => {
    if (!this.props.room.permissions.play) {
      return;
    }
    const device = (() => {
      if (devices.length > 0) {
        const deviceName = devices[0];
        this.midi.connect(deviceName);
        return deviceName;
      } else {
        return '';
      }
    })();
    this.setState({ devices: devices, device });
  }

  handleDeviceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const device = e.target.value; 
    this.midi.connect(device);
    this.setState({ device });
  }

  handleInstrumentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const instrument = e.target.value;
    this.midi.setInstrument(instrument);
    this.setState({ instrument });
  }

  handleRecord = () => {
    this.midi.record();
    if (this.state.recording) {
      this.setState({ midiFile: this.midi.midiFile });
    }
    this.setState({ recording: !this.state.recording });
  }

  handleRecordDump = () => {
    this.downloadURI(this.midi.recordDump());
  }

  downloadURI = (uri: string) => {
    const link = document.createElement('a');
    link.setAttributeNode(document.createAttribute('download'));
    /* link.download = name; */
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  resizeCanvas = () => {
    // Make it visually fill the positioned parent
    if (this.canvas !== undefined) {
      const container = document.getElementById('canvas-container');
      if (container !== null) {
        /* this.canvas.width = this.canvas.offsetWidth;
         * this.canvas.height = this.canvas.offsetHeight; */
        const { width, height } = container.getBoundingClientRect();
        this.canvas.width = width;
        this.canvas.height = height;
        if (this.graphics !== undefined) {
          this.graphics.resize();
        }
      }
    }
  }

  render() {
    const {
      device,
      devices,
      instrument,
      recording,
      midiFile,
    } = this.state;
    const {
      room,
    } = this.props;
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <div id='canvas-container' style={{ width: '100%', height: '80%' }}>
          <canvas ref={this.setup} />
        </div>
        <div>
          <button onClick={this.handleRecord}>{recording ? 'done' : 'record'}</button>
          {midiFile ? (
            <button>
              <a href={midiFile} download>download</a>
            </button>
          ) : null}
        </div>
        <button onClick={this.handleRecordDump}>download last 10 min.</button>
        {room.permissions.admin ? (
          <div>
            <select value={device} onChange={this.handleDeviceSelect}>
              <option value=""></option>
              {devices.map((device, i) => <option key={i} value={device}>{device}</option>)}
            </select>
            <select value={instrument} onChange={this.handleInstrumentSelect}>
              {instruments.map(instrument => <option key={instrument} value={instrument}>{instrument}</option>)}
            </select>
          </div>
        ) : null}
      </div>
    )
  }
}

export default withContext(Piano);
