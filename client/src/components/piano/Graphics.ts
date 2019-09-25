import { ITheme } from '../../App';
import { ActiveNotes, INoteonEvent } from "./MidiController"

function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

class NoteGraphics {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  color: {
    r: number,
    g: number,
    b: number,
    a: number,
  }
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = Object.assign({ a: 255 }, hexToRgb(color));
  }
  draw() {
    this.color.a -= 0.01;
    this.y--;
    this.ctx.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${this.color.a})`;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
/*
const gradientWidth = canvas.width;
    const gradientHeight = canvas.height / 2;

    const gradientCanvas = document.createElement('canvas');
    gradientCanvas.width = gradientWidth;
    gradientCanvas.height = gradientHeight;
    const gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight);
    gradient.addColorStop(0.1, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gradientWidth, gradientHeight);*/

export default class PianoGrahpics {
  BLACK_KEYS = [1, 4, 6, 9, 11];
  WHITE_KEYS = [0, 2, 3, 5, 7, 8, 10];
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  activeDrawNotes: {[note: number]: NoteGraphics};
  pastDrawNotes: NoteGraphics[];
  topOfPiano: number;
  keyWidth: number;
  keyHeight: number;
  theme: ITheme;
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, theme: ITheme) {
    this.canvas = canvas;
    this.ctx = ctx;

    // activeDrawNotes remembers which notes to actively update when a key is pressed
    this.activeDrawNotes = {};
    // pastDrawNotes updates the notes that have been released. Scrolling them into the distance
    this.pastDrawNotes = [];
    this.keyWidth = this.canvas.width / 52;
    this.keyHeight = this.keyWidth * 10; 
    // Set top of keyboard with some padding
    this.topOfPiano = this.canvas.height - this.keyHeight;
    this.theme = theme;
  }

  setTheme(theme: ITheme) {
    this.theme = theme;
  }

  draw(activeNotes: ActiveNotes) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawPiano(activeNotes); 
    this.drawNotes(activeNotes);
  }

  drawNotes(activeNotes: ActiveNotes) {
    for (const activeDrawNote of Object.values(this.activeDrawNotes)) {
      activeDrawNote.draw();
    }
    for (let i = 0; i < this.pastDrawNotes.length; i++) {
      const pastDrawNote = this.pastDrawNotes[i];
      pastDrawNote.draw();
      // Remove the note once it is out of sight
      if (pastDrawNote.y + pastDrawNote.height < -10) {
        this.pastDrawNotes.splice(i, 1);
      }
    }
  }

  drawPiano(activeNotes: ActiveNotes) {
    // Draw the white keys first
    let whiteNotePosition = 0;
    for (let i = 0; i < 88; i++) {
      const note = activeNotes[i + 21];
      const keyInOctave = i % 12;
      if (this.WHITE_KEYS.indexOf(keyInOctave) !== -1) {
        const x = whiteNotePosition * this.keyWidth;
        this.drawWhiteKey(x, this.topOfPiano, note);
        whiteNotePosition++;
        // Handle drawing the notes
        if (note !== undefined) {
          if (this.activeDrawNotes[i] === undefined) {
            this.activeDrawNotes[i] = new NoteGraphics(this.canvas, this.ctx, x, this.topOfPiano, this.keyWidth, 1, '#ff0000');
          } else {
            this.activeDrawNotes[i].height++;
          }
        } else {
          if (this.activeDrawNotes[i] !== undefined) {
            this.pastDrawNotes.push(this.activeDrawNotes[i]);
            delete this.activeDrawNotes[i];
          }
        }
      }
    }
    // Draw the black keys next
    let blackNotePosition = 0;
    for (let i = 0; i < 88; i++) {
      const note = activeNotes[i + 21];
      const keyInOctave = i % 12;
      if (this.BLACK_KEYS.indexOf(keyInOctave) !== -1) {
        const x = (blackNotePosition * this.keyWidth) + (this.keyWidth/2)
        this.drawBlackKey(x, this.topOfPiano, note);
        blackNotePosition += (keyInOctave === this.BLACK_KEYS[0] || keyInOctave === this.BLACK_KEYS[2]) ? 2 : 1;
        // Handle drawing the notes
        if (note !== undefined) {
          if (this.activeDrawNotes[i] === undefined) {
            // No active note so create one
            this.activeDrawNotes[i] = new NoteGraphics(this.canvas, this.ctx, x, this.topOfPiano, this.keyWidth * 0.8, 1, '#ff0000');
          } else {
            // update the active note
            this.activeDrawNotes[i].height++;
          }
        } else {
          if (this.activeDrawNotes[i] !== undefined) {
            // The note is no longer active so add it to pastDrawNotes and remove it from activeDrawNotes
            this.pastDrawNotes.push(this.activeDrawNotes[i]);
            delete this.activeDrawNotes[i];
          }
        }
      }
    }
  }

  drawBlackKey(x: number, y: number, note: INoteonEvent) {
    const fillColor = note !== undefined ? '#ff0000' : this.theme.secondary;
    this.ctx.fillStyle = fillColor; 
    this.ctx.strokeStyle = this.theme.primary;
    this.ctx.fillRect(x, y, this.keyWidth * 0.8, this.keyHeight * 0.65);
    this.ctx.strokeRect(x, y, this.keyWidth * 0.8, this.keyHeight * 0.65);
  }

  drawWhiteKey(x: number, y: number, note: INoteonEvent) {
    const fillColor = note !== undefined ? '#ff0000' : this.theme.primary;
    this.ctx.fillStyle = fillColor;
    this.ctx.strokeStyle = this.theme.secondary;
    this.ctx.fillRect(x, y, this.keyWidth, this.keyHeight);
    this.ctx.strokeRect(x, y, this.keyWidth, this.keyHeight);
  }
}
