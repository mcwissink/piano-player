// Drop in note_modules/midi-writer-js/index.d.ts
// Until I figure out better build system
declare var MidiWriter: any;
declare module 'midi-writer-js' {
	export = MidiWriter;
}
