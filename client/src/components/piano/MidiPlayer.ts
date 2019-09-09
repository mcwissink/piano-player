import Soundfont from "soundfont-player"
import * as WebMidi from "webmidi";

export default class MidiPlayer {
  soundfont: Soundfont.Player | null;
  context = AudioContext;
  activeNotes: {[note: number]: Soundfont.Player | undefined};
  constructor() {
    this.soundfont = null;
    this.activeNotes = {};
    this.context = this.context;
    this.loadSoundfont('acoustic_grand_piano');
  }

  async loadSoundfont(instrument: string) {
    try {
      // The typings for Soundfont stink, how to fix
      this.soundfont = await Soundfont.instrument(new AudioContext(), instrument as any);
    } catch (e) {
      console.log('failed');
    }
  }

  noteon(event: WebMidi.InputEventNoteon) {
    if (this.soundfont !== null) {
      const note = this.activeNotes[event.note.number];
      if (note !== undefined) {
        note.stop();
      }
      this.activeNotes[event.note.number] = this.soundfont.play(event.note.number.toString());
    }
  }

  noteoff(event: WebMidi.InputEventNoteoff) {
    if (this.soundfont !== null) {
      const note = this.activeNotes[event.note.number];
      if (note !== undefined) {
        note.stop();
      }
    }
  }
}
