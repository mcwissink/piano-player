import React from "react";
import MidiController, { MidiNoteType } from "./piano/MidiController"
/* import RoomSettings from '../components/RoomSettings'; */
import { IAppContext, withContext } from '../App';
import instruments from '../instruments.json';
import { BrowserView } from 'react-device-detect';

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
  midi: MidiController;
  frameId: number;
  whiteKeyMapping = [0, 2, 3, 5, 7, 8, 10];
  blackKeyMapping = [1, -1, 4, 6, -1, 9, 11];
  blackKeyMappingNoPadding = [1, 4, 6, 9, 11];
  keyboard: JSX.Element[] = [];
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
    this.drawPiano();
    this.midi = new MidiController(
      this.props.socket,
      this.props.user.color,
      (event, index) => {
        this.updatePiano(event, index);
        this.forceUpdate();
      }
    );
  }

  componentDidMount() {
    this.midi.init(this.handleDeviceUpdate);
  }

  componentDidUpdate() {
    this.midi.setNoteColor(this.props.user.color);
    this.midi.setActive(this.props.room.activePiano);
  }

  componentWillUnmount() {
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

  updatePiano = (event: MidiNoteType, note: number) => {
    const relativeNote = note - 21;
    const key = this.midi.activeNotes[note];
    const whiteIndex = this.whiteKeyMapping.indexOf(relativeNote % 12);
    if (whiteIndex !== -1) {
      const whiteKeyIndex = (Math.floor(relativeNote / 12) * 7) + whiteIndex;
      this.keyboard[whiteKeyIndex] = (
          <rect
            {...this.keyboard[whiteKeyIndex].props}
            key={relativeNote}
            fill={event === MidiNoteType.noteon ? key.color : 'white'} />
      );
    } else {
      const blackIndex = this.blackKeyMappingNoPadding.indexOf(relativeNote % 12);
      const blackKeyIndex = ((Math.floor(relativeNote / 12) * 5) + blackIndex);
      this.keyboard[52 + blackKeyIndex] = (
          <rect
            {...this.keyboard[52 + blackKeyIndex].props}
            key={relativeNote}
            fill={event === MidiNoteType.noteon ? key.color : 'black'} />
      );
    }
  }

  drawPiano = () => {
    const whiteKeys = [];
    const blackKeys = [];
    for (let i = 0; i < 88; i++) {
      const whiteIndex = this.whiteKeyMapping.indexOf(i % 12);
      if (whiteIndex !== -1) {
        whiteKeys.push(
          <rect
            key={i}
            x={((Math.floor(i / 12) * 7) + whiteIndex)}
            y={0}
            width={1}
            height={10}
            style={{
              strokeWidth: 0.1,
              stroke: 'black'
            }}
            fill='white' />
        );
      } else {
        const blackIndex = this.blackKeyMapping.indexOf(i % 12);
        blackKeys.push(
          <rect
            key={i}
            x={((Math.floor(i / 12) * 7) + blackIndex) + 0.6}
            y={0}
            width={0.8}
            height={6}
            style={{
              strokeWidth: 0.05,
              stroke: 'black'
            }}
            fill='black' />
        );
      }
    }
    this.keyboard = whiteKeys.concat(blackKeys);
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <svg viewBox="0 -42 52 52">
          {this.keyboard}
        </svg>
        <BrowserView>
          <button onClick={this.handleRecord}>{recording ? 'done' : 'record'}</button>
          {midiFile ? (
            <button>
              <a href={midiFile} download>download</a>
            </button>
          ) : null}
          <div>
            <button onClick={this.handleRecordDump}>download last 10 min.</button>
          </div>
        </BrowserView>
        {room.permissions.admin ? (
          <>
          <div>
            <select value={device} onChange={this.handleDeviceSelect}>
              <option value=""></option>
              {devices.map((device, i) => <option key={i} value={device}>{device}</option>)}
            </select>
            <select value={instrument} onChange={this.handleInstrumentSelect}>
              {instruments.map(instrument => <option key={instrument} value={instrument}>{instrument}</option>)}
            </select>
          </div>
          {/* <RoomSettings roomName={room.id} /> */}
          </>
        ) : null}
      </div>
    )
  }
}

export default withContext(Piano);
