// Array to keep track of currently held MIDI note numbers
const heldNotes = [];

// Reference to the DOM element where detected chord names will be displayed
const chordDisplay = document.getElementById("chord");

/**
 * Convert a MIDI note number to a full note name with octave.
 * For example, 60 -> "C4"
 *
 * @param {number} midi - MIDI note number (0–127)
 * @returns {string} Note name with octave
 */
const midiToNote = (midi) => {
  const notes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const note = notes[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
};

/**
 * Convert a MIDI note number to a pitch class (note name only, no octave).
 * For example, 60 -> "C"
 *
 * @param {number} midi - MIDI note number
 * @returns {string} Pitch class (e.g. "D#", "A")
 */
const midiToPitchClass = (midi) => midiToNote(midi).replace(/[0-9]/g, "");

/**
 * Analyze currently held notes and display the most likely chord.
 * Uses Tonal.js chord detection on pitch classes derived from held MIDI notes.
 */
const updateChord = () => {
  const noteNames = heldNotes.map(midiToPitchClass);
  const chords = Tonal.Chord.detect(noteNames);
  chordDisplay.textContent = chords[0] || noteNames.join(" ");
};

/**
 * Handle incoming MIDI messages and update the held notes array.
 * Note On (0x90) and Note Off (0x80) messages are processed to track active notes.
 *
 * @param {MIDIMessageEvent} event - The incoming MIDI message event
 */
const onMIDIMessage = (event) => {
  const [status, note, velocity] = event.data;
  const command = status & 0xf0;

  switch (command) {
    case 0x80: // Note Off
      heldNotes.splice(heldNotes.indexOf(note), 1);
      break;
    case 0x90: // Note On
      if (velocity > 0) {
        // Add note to held notes if it's not already there
        if (!heldNotes.includes(note)) {
          heldNotes.push(note);
        }
      } else {
        // Velocity 0 is treated as Note Off
        heldNotes.splice(heldNotes.indexOf(note), 1);
      }
      break;
  }

  updateChord();
};

/**
 * Request access to the Web MIDI API and set up event listeners for MIDI input.
 * Displays an error message if access is denied.
 */
const startMIDI = async () => {
  try {
    const access = await navigator.requestMIDIAccess();
    for (let input of access.inputs.values()) {
      input.onmidimessage = onMIDIMessage;
    }
    chordDisplay.textContent = "Play a chord!";
  } catch (e) {
    chordDisplay.textContent = "MIDI access denied.";
    console.error(e);
  }
};

// Start listening for MIDI input when the page loads
startMIDI();
