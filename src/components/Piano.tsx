import React from "react";
import MidiController from "./MidiController"
import MidiPlayer from "./MidiPlayer"
import * as WebMidi from "webmidi";

interface IPianoProps {

}

interface IPianoState {
  device: string;
  devices: string[];
}

export default class Piano extends React.PureComponent<IPianoProps, IPianoState> {
  midi: MidiController;
  player: MidiPlayer;
  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D | null
  frameId: number;
  constructor(props: IPianoProps) {
    super(props);
    this.midi = new MidiController(this.handleDeviceUpdate);
    this.player = new MidiPlayer();
    this.frameId = -1;
    this.state = {
      device: "",
      devices: [],
    };
  }

  setup = (canvas: HTMLCanvasElement | null) => {
    if (canvas === null) {
      return;
    }
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.update();
  }

  update = () => {
    this.frameId = window.requestAnimationFrame(this.update);
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.frameId);
  }

  handleDeviceUpdate = (devices: WebMidi.Input[]) => {
    this.setState({ devices: devices.map(device => device.name) });
  }

  handleDeviceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const device = e.target.value;
    this.midi.connect(device, this.player);
    this.setState({ device });
  }

  render() {
    const {
      device,
      devices,
    } = this.state;
    return (
      <div>
        <canvas ref={this.setup} />
        <select value={device} onChange={this.handleDeviceSelect}>
          <option value=""></option>
          {devices.map(device => <option key={device} value={device}>{device}</option>)}
        </select>
      </div>
    )
  }
}
