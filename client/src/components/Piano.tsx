import React from "react";
import MidiController, {ActiveNotes} from "./MidiController"
import * as WebMidi from "webmidi";
import { IAppContext, withContext } from '../App';

const KEY_WIDTH = 10;
const KEY_HEIGHT = 150;
const BLACK_KEYS = [0, 2, 5, 7, 10];

class DrawNote {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }
  draw() {
    this.y--;
    this.ctx.fillStyle = this.color;
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

class DrawPiano {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  activeDrawNotes: {[note: number]: DrawNote};
  pastDrawNotes: DrawNote[];
  topOfPiano: number;
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;

    // activeDrawNotes remembers which notes to actively update when a key is pressed
    this.activeDrawNotes = {};
    // pastDrawNotes updates the notes that have been released. Scrolling them into the distance
    this.pastDrawNotes = [];
    // Set top of keyboard with some padding
    this.topOfPiano = canvas.height - KEY_HEIGHT - 1;
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
    for (let i = 1; i <= 88; i++) {
      const note = activeNotes[i + 20];
      const x = whiteNotePosition * KEY_WIDTH;
      this.drawWhiteKey(x, this.topOfPiano, note);
      whiteNotePosition++;
      // Handle drawing the notes
      if (note !== undefined) {
        if (this.activeDrawNotes[i] === undefined) {
          this.activeDrawNotes[i] = new DrawNote(this.canvas, this.ctx, x, this.topOfPiano, KEY_WIDTH, 1, "red");
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
    // Draw the black keys next
    let blackNotePosition = 0;
    for (let i = 1; i <= 88; i++) {
      const note = activeNotes[i + 20];
      const keyInOctave = i % 12;
      if (BLACK_KEYS.indexOf(keyInOctave) !== -1) {
        const x = (blackNotePosition * KEY_WIDTH) + (KEY_WIDTH/2)
        this.drawBlackKey(x, this.topOfPiano, note);
        blackNotePosition += (keyInOctave === 2 || keyInOctave === 7) ? 2 : 1;
        // Handle drawing the notes
        if (note !== undefined) {
          if (this.activeDrawNotes[i] === undefined) {
            // No active note so create one
            this.activeDrawNotes[i] = new DrawNote(this.canvas, this.ctx,  x, this.topOfPiano, KEY_WIDTH * 0.8, 1, "red");
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

  drawBlackKey(x: number, y: number, note: any) {
    //const fillColor = note !== undefined ? note.color : "#000000";
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(x, y, KEY_WIDTH * 0.8, KEY_HEIGHT * 0.65);
  }

  drawWhiteKey(x: number, y: number, note: any) {
    //const fillColor = note !== undefined ? note.color : "#ffffff";
    this.ctx.fillStyle = "#ffffff";
    this.ctx.strokeStyle = "#000000";
    this.ctx.fillRect(x, y, KEY_WIDTH, KEY_HEIGHT);
    this.ctx.strokeRect(x, y, KEY_WIDTH, KEY_HEIGHT);
  }
}

interface IPianoProps {

}

interface IPianoState {
  device: string;
  devices: string[];
}

type IProps = IPianoProps & IAppContext
class Piano extends React.PureComponent<IProps, IPianoState> {
  midi: MidiController;
  frameId: number;
  graphics?: DrawPiano;
  constructor(props: IProps) {
    super(props);
    this.midi = new MidiController(this.props.socket, this.handleDeviceUpdate);
    this.frameId = -1;
    this.state = {
      device: "",
      devices: [],
    };
  }

  setup = (canvas: HTMLCanvasElement | null) => {
    if (canvas === null) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      return;
    }
    this.graphics = new DrawPiano(canvas, ctx);
    this.update();
  }

  update = () => {
    if (this.graphics === undefined) {
      return;
    }
    this.graphics.draw(this.midi.activeNotes);
    this.frameId = window.requestAnimationFrame(this.update);
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.frameId);
  }

  handleDeviceUpdate = (devices: WebMidi.Input[]) => {
    this.setState({ devices: devices.map(device => device.name) });
  }

  handleDeviceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const device = e.target.value; 
    this.midi.connect(device);
    this.setState({ device });
  }

  render() {
    const {
      device,
      devices,
    } = this.state;
    return (
      <div>
        <canvas ref={this.setup} />
        <select value={device} onChange={this.handleDeviceSelect}>
          <option value=""></option>
          {devices.map(device => <option key={device} value={device}>{device}</option>)}
        </select>
      </div>
    )
  }
}

export default withContext(Piano);
