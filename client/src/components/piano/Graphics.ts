import { IApp as A } from '../../interfaces/IApp';
import { IActiveNote, ActiveNotes } from "./MidiController"

function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

class NoteGraphics {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  gradient: CanvasGradient;
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, gradient: CanvasGradient) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.gradient = gradient;
  }
  draw() {
    this.y--;
    this.ctx.fillStyle = this.gradient;
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
ctx.fillRect(0, 0, gradientWidth, gradientHeight);
*/

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
  offsetX: number;
  offsetY: number;
  theme: A.Theme;
  gradients: {[id: string]: CanvasGradient} = {};
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, theme: A.Theme) {
    this.canvas = canvas;
    this.ctx = ctx;

    // activeDrawNotes remembers which notes to actively update when a key is pressed
    this.activeDrawNotes = {};
    // pastDrawNotes updates the notes that have been released. Scrolling them into the distance
    this.pastDrawNotes = [];
    // Set top of keyboard with some padding
    this.theme = theme;
    this.topOfPiano = 0;
    this.keyWidth = 0;
    this.keyHeight = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.resize();
  }

  setTheme(theme: A.Theme) {
    this.theme = theme;
  }

  resize() {
    this.keyWidth = this.canvas.width / 54;
    this.keyHeight = this.keyWidth * 10; 
    this.topOfPiano = this.canvas.height - this.keyHeight - this.offsetY - 10;
    this.offsetX = this.keyWidth;
    this.offsetY = this.keyWidth;
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
    // Draw the background
    this.drawBackground();
    // Draw the white keys first
    let whiteNotePosition = 0;
    for (let i = 0; i < 88; i++) {
      const note = activeNotes[i + 21];
      const keyInOctave = i % 12;
      if (this.WHITE_KEYS.indexOf(keyInOctave) !== -1) {
        const x = (whiteNotePosition * this.keyWidth) + this.offsetX;
        this.drawWhiteKey(x, this.topOfPiano, note);
        whiteNotePosition++;
        // Handle drawing the notes
        if (note !== undefined) {
          if (this.activeDrawNotes[i] === undefined) {

            this.activeDrawNotes[i] = new NoteGraphics(this.canvas, this.ctx, x, this.topOfPiano, this.keyWidth, 1, this.getGradient(note));
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
        const x = (blackNotePosition * this.keyWidth) + (this.keyWidth/2) + this.offsetX;
        this.drawBlackKey(x, this.topOfPiano, note);
        blackNotePosition += (keyInOctave === this.BLACK_KEYS[0] || keyInOctave === this.BLACK_KEYS[2]) ? 2 : 1;
        // Handle drawing the notes
        if (note !== undefined) {
          if (this.activeDrawNotes[i] === undefined) {
            // No active note so create one

            this.activeDrawNotes[i] = new NoteGraphics(this.canvas, this.ctx, x, this.topOfPiano, this.keyWidth * 0.8, 1, this.getGradient(note));
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

  drawBackground() {
    this.ctx.fillStyle = this.theme.secondary; 
    this.ctx.strokeStyle = this.theme.secondary;
    this.roundRect(0, this.topOfPiano - this.offsetY/1.5, this.canvas.width, this.keyHeight + this.offsetY * 2, 10);
    // this.ctx.fillRect(0, this.topOfPiano - this.offsetY/2, this.canvas.width, this.keyHeight + this.offsetY * 2);
  }

  drawBlackKey(x: number, y: number, note: IActiveNote) {
    const fillColor = note !== undefined ? note.color : this.theme.secondary;
    this.ctx.fillStyle = fillColor; 
    this.ctx.strokeStyle = this.theme.primary;
    this.ctx.fillRect(x, y, this.keyWidth * 0.8, this.keyHeight * 0.65);
    this.ctx.strokeRect(x, y, this.keyWidth * 0.8, this.keyHeight * 0.65);
  }

  drawWhiteKey(x: number, y: number, note: IActiveNote) {
    const fillColor = note !== undefined ? note.color : this.theme.primary;
    this.ctx.fillStyle = fillColor;
    this.ctx.strokeStyle = this.theme.secondary;
    this.ctx.fillRect(x, y, this.keyWidth, this.keyHeight);
    this.ctx.strokeRect(x, y, this.keyWidth, this.keyHeight);
  }

  getGradient(note: IActiveNote) {
    const {
      id,
      color,
    } = note;
    const { r, g, b }= hexToRgb(color);
    if (this.gradients[id] === undefined) {
      this.gradients[id] = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      this.gradients[id].addColorStop(0, `rgba(${r},${g},${b}, 0)`)
      this.gradients[id].addColorStop(1, `rgb(${r},${g},${b})`)
    }
    return this.gradients[id];
  }

  roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x+r, y);
    this.ctx.arcTo(x+w, y,   x+w, y+h, r);
    this.ctx.arcTo(x+w, y+h, x,   y+h, r);
    this.ctx.arcTo(x,   y+h, x,   y,   r);
    this.ctx.arcTo(x,   y,   x+w, y,   r);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }
}
