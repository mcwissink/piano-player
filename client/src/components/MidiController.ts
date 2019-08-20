import * as WebMidi from "webmidi";
import MidiPlayer from "./MidiPlayer";

export interface INoteonEvent {
  id: string;
  color: string;
  event: WebMidi.InputEventNoteon;
}

export interface INoteoffEvent {
  id: string;
  event: WebMidi.InputEventNoteoff;
}

export type ActiveNotes = {[note: number]: INoteonEvent[]}; 

type DeviceCallback = (devices: WebMidi.Input[]) => void;
export default class MidiController {
  midi: WebMidi.WebMidi;
  player: MidiPlayer;
  input: WebMidi.Input | null;
  socket: SocketIOClient.Socket;
  activeNotes: ActiveNotes;
  userColor: string;
  constructor(socket: SocketIOClient.Socket, userColor: string, deviceCallback: DeviceCallback) {
    this.midi = WebMidi.default;
    this.player = new MidiPlayer();
    this.input = null;
    this.socket = socket;
    this.userColor = userColor;
    this.activeNotes = [];
    for (let i = 0; i < 127; i++) {
      this.activeNotes[i] = [];
    }

    this.socket.on('noteon', this.noteonEvent);
    this.socket.on('noteoff', this.noteoffEvent);
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

  setUserColor(color: string) {
    this.userColor = color;
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
      color: this.userColor,
      event,
    };
    this.player.noteon(event);
    this.activeNotes[event.note.number].push(serverNoteon);
    this.socket.emit('noteon', serverNoteon);
  }

  noteoff = (event: WebMidi.InputEventNoteoff) => {
    const serverNoteoff = {
      id: this.socket.id,
      event,
    }
    this.player.noteoff(event);
    this.activeNotes[event.note.number].pop();
    this.socket.emit('noteoff', serverNoteoff);
  }

  noteonEvent = (data: INoteonEvent) => {
    if (data.id !== this.socket.id) {
      this.player.noteon(data.event);
      this.activeNotes[data.event.note.number].push(data);
    }
  }

  noteoffEvent = (data: INoteoffEvent) => {
    if (data.id !== this.socket.id) {
      this.player.noteoff(data.event);
      this.activeNotes[data.event.note.number].pop();
    }
  }
  
  remove() {
    if (this.input !== null) {
      this.input.removeListener();
    }
  }
}	
