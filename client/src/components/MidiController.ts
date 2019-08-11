import * as WebMidi from "webmidi";
import MidiPlayer from "./MidiPlayer";
import io from 'socket.io-client';

export interface ServerNoteon {
  id: string;
  event: WebMidi.InputEventNoteon;
}

export interface ServerNoteoff {
  id: string;
  event: WebMidi.InputEventNoteoff;
}

export type ActiveNotes = {[note: number]: ServerNoteon[]};

type DeviceCallback = (devices: WebMidi.Input[]) => void;
export default class MidiController {
  midi: WebMidi.WebMidi;
  player: MidiPlayer;
  input: WebMidi.Input | null;
  socket: SocketIOClient.Socket
  activeNotes: ActiveNotes;
  constructor(socket: SocketIOClient.Socket, deviceCallback: DeviceCallback) {
    this.midi = WebMidi.default;
    this.player = new MidiPlayer();
    this.input = null;
    this.socket = socket;
    this.activeNotes = {};

    this.socket.on('noteon', this.serverNoteon);
    this.socket.on('noteoff', this.serverNoteoff);
    this.init(deviceCallback);
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
      this.input.addListener("noteon", "all", this.noteon);
      this.input.addListener("noteoff", "all", this.noteoff)
    } else {
      this.input = null;
    }
  }

  noteon = (event: WebMidi.InputEventNoteon) => {
    const serverNoteon = {
      id: this.socket.id,
      event,
    };
    this.player.noteon(event);
    this.activeNotes[event.note.number].push(serverNoteon);
    this.socket.emit('noteon', serverNoteon);
  }

  noteoff = (event: WebMidi.InputEventNoteoff) => {
    this.player.noteoff(event);
    this.socket.emit('noteoff', {
      id: this.socket.id,
      event,
    });
  }

  serverNoteon = (data: ServerNoteon) => {
    if (data.id !== this.socket.id) {
      this.player.noteon(data.event);
    }
  }

  serverNoteoff = (data: ServerNoteoff) => {
    if (data.id !== this.socket.id) {
      this.player.noteoff(data.event);
    }
  }
  
  remove() {
    if (this.input !== null) {
      this.input.removeListener();
    }
  }
}	
