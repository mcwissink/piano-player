import React from 'react';
import MidiController from './MidiController'
import * as WebMidi from "webmidi";

interface IPianoProps {

}

interface IPianoState {
  device: string;
  devices: string[];
}

export default class Piano extends React.PureComponent<IPianoProps, IPianoState> {
  midi: MidiController;
  constructor(props: IPianoProps) {
    super(props);
    this.midi = new MidiController(this.handleDeviceUpdate);
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
    this.midi.connect(device);
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
