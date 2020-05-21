import React from "react";
import MidiController from "./piano/MidiController"
import PianoGraphics from './piano/Graphics';
import * as WebMidi from "webmidi";
import { IAppContext, withContext } from '../App';
import instruments from '../instruments.json';

interface IPianoProps {

}

interface IPianoState {
  instrument: string;
  device: string;
  devices: string[];
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

  resizeCanvas = () => {
    // Make it visually fill the positioned parent
    if (this.canvas !== undefined) {
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
      if (this.graphics !== undefined) {
        this.graphics.resize();
      }
    }
  }

  render() {
    const {
      device,
      devices,
      instrument,
    } = this.state;
    const {
      room,
    } = this.props;
    return (
      <>
        <canvas onFocus={() => console.log('focus')} onBlur={() => console.log('blur')} style={{ display: 'block', height: '100%' }} ref={this.setup} />
        <hr/>
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
      </>
    )
  }
}

export default withContext(Piano);
