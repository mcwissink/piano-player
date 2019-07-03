import * as WebMidi from "webmidi";

type DeviceCallback = (devices: WebMidi.Input[]) => void;
export default class MidiController {
  midi: WebMidi.WebMidi;
  input: WebMidi.Input | null;
  constructor(deviceCallback: DeviceCallback) {
    this.midi = WebMidi.default;
    this.input = null;
    this.init(deviceCallback)
  }

  init(deviceCallback: DeviceCallback) {
	  this.midi.enable((err: any) => {
      if (err) {
        console.log("Web Midi API not supported");
      } else {
        this.midi.addListener("connected", () => deviceCallback(this.midi.inputs));
        this.midi.addListener("disconnected", () => deviceCallback(this.midi.inputs));
      }
	  });
  }

  connect(name: string) {
    this.remove();
    const device = name === "" ? false : this.midi.getInputByName(name);
    if (device) {
      this.input = device;
      this.input.addListener("programchange", "all", e => {
        console.log(e);
      });
      this.input.addListener("noteon", "all", e => {
        console.log(e);
      });
      this.input.addListener("noteoff", "all", e => {
        console.log(e);
      })
    } else {
      this.input = null;
    }
  }
  
  remove() {
    if (this.input !== null) {
      this.input.removeListener();
    }
  }
}	

	
