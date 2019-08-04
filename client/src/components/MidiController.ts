import * as WebMidi from "webmidi";
import io from 'socket.io-client';
import MidiPlayer from "./MidiPlayer";


interface ServerNoteon {
  id: string;
  event: WebMidi.InputEventNoteon;
}

interface ServerNoteoff {
  id: string;
  event: WebMidi.InputEventNoteoff;
}


type DeviceCallback = (devices: WebMidi.Input[]) => void;
export default class MidiController {
  midi: WebMidi.WebMidi;
  player: MidiPlayer;
  input: WebMidi.Input | null;
  socket: SocketIOClient.Socket;
  constructor(deviceCallback: DeviceCallback) {
    this.midi = WebMidi.default;
    this.player = new MidiPlayer();
    this.input = null;
    

    this.socket = io.connect(window.location.href.replace(/^http/, "ws"));
    this.socket.on('connect_error', () => console.log("error"));
    this.socket.on('connect', () => console.log("connected"));
    this.socket.emit('join', { room: 'default' });
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
    this.player.noteon(event);
    this.socket.emit('noteon', {
      id: this.socket.id,
      event,
    });
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

	
