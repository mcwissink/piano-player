import * as WebMidi from "webmidi";
import MidiPlayer from "./MidiPlayer";
import { SafeSocket } from '../../App';
import { Events as E } from '../../../../server/interfaces/IEvents';


export interface IActiveNote extends E.Piano.NoteOn {
  sustain?: true;
}

export type ActiveNotes = {[note: number]: IActiveNote}; 
export type SustainedNotes = {[note: number]: E.Piano.NoteOff};

type DeviceCallback = (devices: WebMidi.Input[]) => void;
export default class MidiController {
  midi: WebMidi.WebMidi;
  player: MidiPlayer;
  input: WebMidi.Input | null;
  activeNotes: ActiveNotes;
  sustainedNotes: SustainedNotes;
  userColor: string;
  sustain: boolean;
  constructor(public socket: SafeSocket, userColor: string, instrument: string, deviceCallback: DeviceCallback) {
    this.midi = WebMidi.default;
    this.player = new MidiPlayer();
    this.input = null;
    this.userColor = userColor;
    this.sustain = false;
    this.activeNotes = {};
    this.sustainedNotes = {};
    this.socket.on<E.Piano.ControlChange>('controlchange', this.controlchangeEvent);
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

  controlchange = (e: WebMidi.InputEventControlchange) => {
    const controlchange: E.Piano.ControlChange = {
      id: this.socket.raw.id,
      control: {
        number: e.controller.number,
        value: e.value,
      }
    };
    this.controlchangeEvent(controlchange);
    this.socket.emit('controlchange', controlchange);
  }

  noteon = (e: WebMidi.InputEventNoteon) => {
    const noteon: E.Piano.NoteOn = {
      id: this.socket.raw.id,
      color: this.userColor,
      note: {
        number: e.note.number,
        velocity: e.velocity,
      }
    };
    this.noteonEvent(noteon);
    this.socket.emit('noteon', noteon);
  }

  noteoff = (e: WebMidi.InputEventNoteoff) => {
    const noteoff: E.Piano.NoteOff = {
      id: this.socket.raw.id,
      note: {
        number: e.note.number,
      }
    };
    this.noteoffEvent(noteoff);
    this.socket.emit('noteoff', noteoff);
  }

  controlchangeEvent = (e: E.Piano.ControlChange) => {
    switch (e.control.number) {
      case 64: { //Sustain pedal
        if (e.control.value > 0) {
          this.sustain = true;
        } else {
          this.sustain = false;
          Object.values(this.sustainedNotes).forEach(note => this.noteoffEvent(note)); 
        }
      }
    }
  }

  noteonEvent = (e: E.Piano.NoteOn) => {
    delete this.sustainedNotes[e.note.number];
    this.player.noteon(e);
    this.activeNotes[e.note.number] = e;
  }

  noteoffEvent = (e: E.Piano.NoteOff) => {
    if (this.sustain) {
      this.sustainedNotes[e.note.number] = e;
    } else {
      this.player.noteoff(e);
      delete this.activeNotes[e.note.number];
    }
  }
  
  remove() {
    if (this.input !== null) {
      this.input.removeListener();
    }
  }
}	
