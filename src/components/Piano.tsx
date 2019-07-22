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
  constructor(props: IPianoProps) {
    super(props);
    this.midi = new MidiController(this.handleDeviceUpdate);
    this.player = new MidiPlayer();
    this.state = {
      device: "",
      devices: [],
    };
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
        <select value={device} onChange={this.handleDeviceSelect}>
          <option value=""></option>
          {devices.map(device => <option key={device} value={device}>{device}</option>)}
        </select>
      </div>
    )
  }
}
