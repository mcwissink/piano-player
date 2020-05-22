import Soundfont from "soundfont-player"
import { Events as E } from '../../../../server/interfaces/IEvents';

export default class MidiPlayer {
  soundfont: Soundfont.Player | null;
  activeNotes: {[note: number]: Soundfont.Player | undefined};
  constructor() {
    this.soundfont = null;
    this.activeNotes = {};
    this.loadSoundfont('acoustic_grand_piano');
  }

  async loadSoundfont(instrument: string) {
    try {
      // The typings for Soundfont stink, how to fix
      this.soundfont = await Soundfont.instrument((new AudioContext()) as any, instrument as any);
    } catch (e) {
      console.log('failed');
    }
  }

  noteon(e: E.Piano.NoteOn) {
    if (this.soundfont !== null) {
      const note = this.activeNotes[e.note.number];
      if (note !== undefined) {
        note.stop();
      }
      this.activeNotes[e.note.number] = this.soundfont.play(e.note.number.toString(), undefined, { gain: e.note.velocity / 127 });
    }
  }

  noteoff(e: E.Piano.NoteOff) {
    if (this.soundfont !== null) {
      const note = this.activeNotes[e.note.number];
      if (note !== undefined) {
        note.stop();
      }
    }
  }
}
