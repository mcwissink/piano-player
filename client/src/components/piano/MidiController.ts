import * as WebMidi from "webmidi";
import MidiPlayer from "./MidiPlayer";

export interface IMidiEvent<T> {
  id: string;
  event: T
}

export interface INoteonEvent {
  id: string;
  event: WebMidi.InputEventNoteon;
}

export interface IControlchangeEvent {
  id: string;
  event: WebMidi.InputEventControlchange;
}

export interface INoteoffEvent {
  id: string;
  event: WebMidi.InputEventNoteoff;
}

export interface IActiveNote extends INoteonEvent {
  sustain?: true;
}

export type ActiveNotes = {[note: number]: IActiveNote}; 
export type SustainedNotes = {[note: number]: IMidiEvent<WebMidi.InputEventNoteoff>};

type DeviceCallback = (devices: WebMidi.Input[]) => void;
export default class MidiController {
  midi: WebMidi.WebMidi;
  player: MidiPlayer;
  input: WebMidi.Input | null;
  socket: SocketIOClient.Socket;
  activeNotes: ActiveNotes;
  sustainedNotes: SustainedNotes;
  userColor: string;
  sustain: boolean;
  constructor(socket: SocketIOClient.Socket, userColor: string, instrument: string, deviceCallback: DeviceCallback) {
    this.midi = WebMidi.default;
    this.player = new MidiPlayer();
    this.input = null;
    this.socket = socket;
    this.userColor = userColor;
    this.sustain = false;
    this.activeNotes = {};
    this.sustainedNotes = {}; 

    this.socket.on('controlchange', this.controlchangeEvent);
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

  wrapEvent<T>(event: T): IMidiEvent<T> {
    return {
      id: this.socket.id,
      event,
    }
  }

  setInstrument(instrument: string) {
    this.player.loadSoundfont(instrument);
  }

  connect(name: string) {
    this.remove();
    const device = name === "" ? false : this.midi.getInputByName(name);
    if (device) {
      this.input = device;
      this.input.addListener("controlchange", "all", this.controlchange);
      this.input.addListener("noteon", "all", this.noteon);
      this.input.addListener("noteoff", "all", this.noteoff);
    } else {
      this.input = null;
    }
  }

  controlchange = (event: WebMidi.InputEventControlchange) => {
    const controlchange  = this.wrapEvent(event);
    this.controlchangeEvent(controlchange);
    this.socket.emit('controlchange', controlchange);
  }

  noteon = (event: WebMidi.InputEventNoteon) => {
    const noteon = this.wrapEvent(event);
    this.noteonEvent(noteon);
    this.socket.emit('noteon', noteon);
  }

  noteoff = (event: WebMidi.InputEventNoteoff) => {
    const noteoff = this.wrapEvent(event);
    this.noteoffEvent(noteoff);
    this.socket.emit('noteoff', noteoff);
  }

  controlchangeEvent = (data: IMidiEvent<WebMidi.InputEventControlchange>) => {
    switch (data.event.controller.number) {
      case 64: { //Sustain pedal
        if (data.event.value > 0) {
          this.sustain = true;
        } else {
          this.sustain = false;
          Object.values(this.sustainedNotes).forEach(event => this.noteoffEvent(event)); 
        }
      }
    }
  }

  noteonEvent = (data: IMidiEvent<WebMidi.InputEventNoteon>) => {
    delete this.sustainedNotes[data.event.note.number];
    this.player.noteon(data.event);
    this.activeNotes[data.event.note.number] = data;
  }

  noteoffEvent = (data: IMidiEvent<WebMidi.InputEventNoteoff>) => {
    if (this.sustain) {
      this.sustainedNotes[data.event.note.number] = data;
    } else {
      this.player.noteoff(data.event);
      delete this.activeNotes[data.event.note.number];
    }
  }
  
  remove() {
    if (this.input !== null) {
      this.input.removeListener();
    }
  }
}	
