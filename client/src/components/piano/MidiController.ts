import * as WebMidi from 'webmidi';
import MidiPlayer from './MidiPlayer';
import { SafeSocket } from '../../App';
import { Events as E } from '../../../../server/interfaces/IEvents';
import { keyMap } from '../../util';
import instruments from '../../instruments.json';
import MidiWriter from 'midi-writer-js';

export interface IActiveNote extends E.Piano.NoteOn {
  sustain?: true;
}

export type ActiveNotes = {[note: number]: IActiveNote}; 
export type SustainedNotes = {[note: number]: E.Piano.NoteOff};

type DeviceCallback = (devices: string[]) => void;
export default class MidiController {
  static COMPUTER_INPUT = "Default";
  midi: WebMidi.WebMidi;
  track: any;
  previousEventTick: number = 0;
  player: MidiPlayer;
  input: WebMidi.Input | null;
  activeNotes: ActiveNotes;
  sustainedNotes: SustainedNotes;
  noteColor: string;
  sustain: boolean;
  active: boolean = true;
  constructor(public socket: SafeSocket, noteColor: string, instrument: string) {
    this.midi = WebMidi.default;
    this.player = new MidiPlayer();
    this.input = null;
    this.noteColor = noteColor;
    this.sustain = false;
    this.activeNotes = {};
    this.sustainedNotes = {};
    this.socket.on<E.Piano.ControlChange>('controlchange', this.controlchangeEvent);
    this.socket.on('noteon', this.noteonEvent);
    this.socket.on('noteoff', this.noteoffEvent);
  }

  init(deviceCallback: DeviceCallback) {
	  this.midi.enable(err => {
      if (err) {
        console.log("Web Midi API not supported");
        deviceCallback(this.getInputs());
      } else {
        this.midi.addListener("connected", () => deviceCallback(this.getInputs()));
        this.midi.addListener("disconnected", () => deviceCallback(this.getInputs()));
      }
	  });
  }

  getInputs() {
    const inputs = this.midi.inputs.map(input => input.name)
    inputs.push(MidiController.COMPUTER_INPUT)
    return inputs;
  }

  setNoteColor(color: string) {
    this.noteColor = color;
  }

  setActive(active: boolean) {
    this.active = active;
  }

  setInstrument(instrument: string) {
    const instrumentId = instruments.indexOf(instrument);
    if (instrumentId === -1) {
      return;
    }
    const controlchange: E.Piano.ControlChange = {
      id: this.socket.raw.id,
      control: {
        number: 102,
        value: instrumentId,
      }
    };
    this.controlchangeEvent(controlchange);
    this.socket.emit('controlchange', controlchange);
  }

  connect(name: string) {
    this.disconnect();
    if (name === MidiController.COMPUTER_INPUT) {
      window.addEventListener("keypress", this.handleKeyDown);
      window.addEventListener("keyup", this.handleKeyUp);
      return;
    }
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

  handleKeyDown = (e: KeyboardEvent) => {
    // Prevent the piano playing when user is typing
    if (!this.active) { return; }
    const note = keyMap[e.key];
    if (note === undefined || this.activeNotes[note] !== undefined) {
      return;
    }
    const noteon: E.Piano.NoteOn = {
      id: this.socket.raw.id,
      color: this.noteColor,
      note: {
        number: note,
        velocity: 0.85,
        timeStamp: this.midi.time,
      }
    };
    this.noteonEvent(noteon);
    this.socket.emit('noteon', noteon);
  }

  handleKeyUp = (e: KeyboardEvent) => {
    // Prevent the piano playing when user is typing
    if (!this.active) { return; }
    const note = keyMap[e.key];
    if (note === undefined) {
      return;
    }
    const noteoff: E.Piano.NoteOff = {
      id: this.socket.raw.id,
      note: {
        number: note,
        timeStamp: this.midi.time,
      }
    };
    this.noteoffEvent(noteoff);
    this.socket.emit('noteoff', noteoff);
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
    console.log(e);
    const noteon: E.Piano.NoteOn = {
      id: this.socket.raw.id,
      color: this.noteColor,
      note: {
        number: e.note.number,
        velocity: e.velocity,
        timeStamp: e.timestamp,
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
        timeStamp: e.timestamp,
      }
    };
    this.noteoffEvent(noteoff);
    this.socket.emit('noteoff', noteoff);
  }

  controlchangeEvent = (e: E.Piano.ControlChange) => {
    switch (e.control.number) {
      case 64: //Sustain pedal
        if (e.control.value > 0) {
          this.sustain = true;
        } else {
          this.sustain = false;
          Object.values(this.sustainedNotes).forEach(note => this.noteoffEvent(note)); 
        }
        break;
      case 102:
        this.player.loadSoundfont(e.control.value);
        break;
    }
  }

  noteonEvent = (e: E.Piano.NoteOn) => {
    delete this.sustainedNotes[e.note.number];
    this.player.noteon(e);
    this.activeNotes[e.note.number] = e;
    if (this.track) {
      if (!this.previousEventTick) {
        this.previousEventTick = e.note.timeStamp;
      }
      this.track.addEvent(new MidiWriter.NoteOnEvent({
        pitch: e.note.number,
        velocity: e.note.velocity,
        wait: `T${e.note.timeStamp - this.previousEventTick}`,
      }));
      this.previousEventTick = e.note.timeStamp;
    }
  }

  noteoffEvent = (e: E.Piano.NoteOff) => {
    if (this.sustain) {
      this.sustainedNotes[e.note.number] = e;
    } else {
      if (this.track) {
        this.track.addEvent(new MidiWriter.NoteOffEvent({
          pitch: e.note.number,
          duration: `T${e.note.timeStamp - this.previousEventTick}`,
        }));
        this.previousEventTick = e.note.timeStamp;
      }
      this.player.noteoff(e);
      delete this.activeNotes[e.note.number];
    }
  }
  
  disconnect() {
    window.removeEventListener("keypress", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    if (this.input !== null) {
      this.input.removeListener();
    }
  }

  record() {
    if (this.track) {
      const file = new MidiWriter.Writer(this.track);
      console.log(file.dataUri());
      delete this.track;
    } else {
      this.track = new MidiWriter.Track();
      this.previousEventTick = 0;
    }
  }
}	
