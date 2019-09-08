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
    Soundfont.instrument(new AudioContext(), 'acoustic_grand_piano').then((player: Soundfont.Player) => {
      this.soundfont = player;
    });
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
