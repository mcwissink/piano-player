import Soundfont from "soundfont-player"
import * as WebMidi from "webmidi";

export default class MidiPlayer {
  soundfont: Soundfont.Player | null;
  context: AudioContext;
  activeNotes: {[note: string]: Soundfont.Player | undefined};
  constructor() {
    this.soundfont = null;
    this.context = new AudioContext();
    this.activeNotes = {};
    Soundfont.instrument(this.context, 'acoustic_grand_piano').then(player => {
      this.soundfont = player;
    });
  }

  noteon(event: WebMidi.InputEventNoteon) {
    if (this.soundfont !== null) {
      const note = this.activeNotes[event.note.name];
      if (note !== undefined) {
        note.stop();
      }
      this.activeNotes[event.note.name] = this.soundfont.play(event.note.number);
    }
  }

  noteoff(event: WebMidi.InputEventNoteoff) {
    if (this.soundfont !== null) {
      const note = this.activeNotes[event.note.name];
      if (note !== undefined) {
        note.stop();
      }
    }
  }
}
