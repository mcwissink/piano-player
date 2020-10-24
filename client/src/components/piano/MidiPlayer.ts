import Soundfont from 'soundfont-player'
import { IEvents as E } from '../../../../server/interfaces/IEvents';
import instruments from '../../instruments.json'

export default class MidiPlayer {
  soundfont: Soundfont.Player | null;
  activeNotes: {[note: number]: Soundfont.Player | undefined};
  ctx: AudioContext|undefined;
  constructor() {
    const AC = (window as any).AudioContext
      || (window as any).webkitAudioContext
      || false;
    if (AC) {
      this.ctx = new AC();
    }
    this.soundfont = null;
    this.activeNotes = {};
    this.loadSoundfont('acoustic_grand_piano');
  }

  async loadSoundfont(identifier: string | number) {
    try {
      // The typings for Soundfont stink, how to fix
      const instrument = typeof identifier === 'string' ? identifier : instruments[identifier];
      this.soundfont = await Soundfont.instrument((this.ctx) as any, instrument as any);
    } catch (e) {
      console.log(`Failed to load instrument: ${instruments}`);
    }
  }

  noteon(e: E.Piano.NoteOn) {
    if (this.soundfont !== null) {
      const note = this.activeNotes[e.note.number];
      if (note !== undefined) {
        note.stop();
      }
      this.activeNotes[e.note.number] = this.soundfont.play(e.note.number.toString(), undefined, { gain: e.note.velocity });
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
