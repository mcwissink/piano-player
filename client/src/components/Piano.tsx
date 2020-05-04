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
    this.midi = new MidiController(this.props.socket, this.props.color, this.state.instrument, this.handleDeviceUpdate);
  }

  componentDidUpdate() {
    this.midi.setUserColor(this.props.color);
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
    const resizeCanvas = this.resizeCanvas(canvas);
    window.addEventListener('resize', resizeCanvas, false);
    resizeCanvas();
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

  handleDeviceUpdate = (devices: WebMidi.Input[]) => {
    const device = (() => {
      if (devices.length > 0) {
        const deviceName = devices[0].name;
        this.midi.connect(deviceName);
        return deviceName;
      } else {
        return '';
      }
    })();
    this.setState({ devices: devices.map(d => d.name), device });
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

  resizeCanvas = (canvas: HTMLCanvasElement) => () => {
    // Make it visually fill the positioned parent
    canvas.style.width ='100%';
    canvas.style.height ='100%';
    // ...then set the internal size to match
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
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
        <canvas style={{ flexGrow: 1 }} ref={this.setup} />
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
