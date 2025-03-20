// Music Generator Script

// Configuration
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
let API_KEY = 'AIzaSyAoPx85b-nXyjUG7CfBxpKN3IkAZroqgxk'; // To be set by user in localStorage or via a settings modal

// Global variables for audio libraries
let tuna = null;
let wadContext = null;
let wadSynth = null;
let nativeContext = null;

// Initialize additional audio libraries
function initAudioLibraries() {
    // Initialize Tuna
    if (window.Tuna && !tuna) {
        try {
            // Create Tuna with Tone.js context for integration
            tuna = new Tuna(Tone.context);
            console.log("Tuna.js initialized successfully");
        } catch (error) {
            console.error("Failed to initialize Tuna:", error);
        }
    }
    
    // Initialize WAD
    if (window.Wad && !wadContext) {
        try {
            // Create a WAD context aligned with Tone.js if possible
            wadContext = new Wad.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            console.log("WAD.js initialized successfully");
        } catch (error) {
            console.error("Failed to initialize WAD:", error);
        }
    }
    
    // Initialize Web Audio API native context
    if (!nativeContext) {
        try {
            // Can use Tone's context for consistency
            nativeContext = Tone.context;
            console.log("Web Audio API context initialized successfully");
        } catch (error) {
            console.error("Failed to initialize Web Audio API context:", error);
        }
    }
}

// UI Enhancement Functions
function setExamplePrompt(prompt) {
    document.getElementById('musicPrompt').value = prompt;
    // Simple highlight effect
    document.getElementById('musicPrompt').style.borderColor = 'var(--primary-color)';
    setTimeout(() => {
        document.getElementById('musicPrompt').style.borderColor = 'var(--border-color)';
    }, 500);
}

function setDuration(minutes) {
    document.getElementById('duration').value = minutes;
    // Update active state of duration buttons
    document.querySelectorAll('.duration-btn').forEach(btn => {
        if (btn.textContent === `${minutes} min`) {
            btn.style.background = 'var(--primary-color)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--primary-color)';
        } else {
            btn.style.background = 'var(--background-light)';
            btn.style.color = 'var(--text-color)';
            btn.style.borderColor = 'var(--border-color)';
        }
    });
}

function updateCustomDuration(value) {
    // Reset all duration buttons to inactive state
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.style.background = 'var(--background-light)';
        btn.style.color = 'var(--text-color)';
        btn.style.borderColor = 'var(--border-color)';
    });
}

// Add simple hover effects for buttons
document.addEventListener('DOMContentLoaded', function() {
    // Apply minimal hover effects to interactive elements
    document.querySelectorAll('.example-prompt-btn, .duration-btn, .player-btn').forEach(btn => {
        btn.addEventListener('mouseover', () => {
            btn.style.opacity = '0.9';
        });
        btn.addEventListener('mouseout', () => {
            btn.style.opacity = '1';
        });
    });
});

// Global variables for music state
let currentSynth = null;
let currentPattern = null;
let musicPlaying = false;
let currentMusicData = null;
let audioBuffer = null;
let analyser = null;
let visualizationIntervalId = null;
let enhancementEffects = [];

// Check for saved API key
document.addEventListener('DOMContentLoaded', function() {
    // Load API key from localStorage if available
    API_KEY = localStorage.getItem('gemini_api_key') || '';
    
    // If no API key is found, show a modal to enter it
    if (!API_KEY) {
        showApiKeyModal();
    }
    
    // Load generation history from localStorage
    loadGenerationHistory();
    
    // Setup event listeners
    setupEventListeners();
});

// Show API Key Modal
function showApiKeyModal() {
    // Create modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = 'background-color: white; padding: 2rem; border-radius: var(--radius); width: 90%; max-width: 500px; box-shadow: var(--shadow-lg);';
    
    // Modal heading
    const modalHeading = document.createElement('h3');
    modalHeading.textContent = 'Gemini API Key Required';
    modalHeading.style.cssText = 'margin-bottom: 1rem; color: var(--primary-color);';
    
    // Modal description
    const modalDesc = document.createElement('p');
    modalDesc.innerHTML = 'To use the music generator, you need to provide a Gemini API key. You can get a free API key from <a href="https://ai.google.dev/" target="_blank">Google AI Studio</a>.';
    modalDesc.style.cssText = 'margin-bottom: 1.5rem; font-size: 0.9rem; line-height: 1.5;';
    
    // API key input
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'text';
    apiKeyInput.placeholder = 'Enter your Gemini API Key';
    apiKeyInput.style.cssText = 'width: 100%; padding: 0.75rem; margin-bottom: 1rem; border-radius: var(--radius); border: 1px solid var(--border-color);';
    
    // Save button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save API Key';
    saveButton.className = 'signup-btn';
    saveButton.style.cssText = 'width: 100%; padding: 0.75rem;';
    
    // Assemble modal
    modalContent.appendChild(modalHeading);
    modalContent.appendChild(modalDesc);
    modalContent.appendChild(apiKeyInput);
    modalContent.appendChild(saveButton);
    modalOverlay.appendChild(modalContent);
    
    // Add modal to body
    document.body.appendChild(modalOverlay);
    
    // Save button event listener
    saveButton.addEventListener('click', function() {
        const keyValue = apiKeyInput.value.trim();
        if (keyValue) {
            API_KEY = keyValue;
            localStorage.setItem('gemini_api_key', API_KEY);
            document.body.removeChild(modalOverlay);
        } else {
            apiKeyInput.style.borderColor = 'var(--danger-color)';
            setTimeout(() => {
                apiKeyInput.style.borderColor = 'var(--border-color)';
            }, 2000);
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    const musicForm = document.getElementById('musicForm');
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Form submission
    if (musicForm) {
        musicForm.addEventListener('submit', function(e) {
            e.preventDefault();
            generateMusic();
        });
    }
    
    // Play button
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            playGeneratedMusic();
        });
    }
    
    // Stop button
    if (stopBtn) {
        stopBtn.addEventListener('click', function() {
            stopMusic();
        });
    }
    
    // Download button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            downloadMusic();
        });
    }
}

// Generate Music Function
async function generateMusic() {
    // Check if API key is available
    if (!API_KEY) {
        showApiKeyModal();
        return;
    }
    
    // Get user input
    const prompt = document.getElementById('musicPrompt').value;
    const duration = parseFloat(document.getElementById('duration').value);
    const enhancement = document.getElementById('enhanceMusic').value;
    
    // Validate
    if (!prompt || !duration || duration < 0.5 || duration > 5) {
        alert('Please enter a valid prompt and duration (0.5-5 minutes)');
        return;
    }
    
    // Show loading state
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('musicPlayer').style.display = 'none';
    
    try {
        // Prepare prompt for Gemini API
        const enhancementPrompt = getEnhancementPrompt(enhancement);
        
        const geminiPrompt = `Generate a musical sequence for Tone.js with the following description: "${prompt}". 
        The music should last approximately ${duration} minutes.
        
        ${enhancementPrompt}
        
        Provide the result in JSON format with the following structure:
        {
            "notes": [
                { "note": "C4", "duration": "8n", "time": "0:0:0", "velocity": 0.8 },
                { "note": "E4", "duration": "8n", "time": "0:0:1", "velocity": 0.7 },
                ...more notes
            ],
            "tempo": 120,
            "title": "Generated title based on the prompt",
            "instrument": "preferred instrument type (piano, synth, etc)"
        }
        
        Make sure to include enough notes to match the requested duration. Time should be in Tone.js transport time format (measures:quarters:sixteenths).`;
        
        // Call Gemini API
        const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: geminiPrompt
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract the music data from the response
        let musicData;
        try {
            // Find the JSON block in the response
            const text = data.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                             text.match(/```\n([\s\S]*?)\n```/) || 
                             text.match(/{[\s\S]*?}/);
                
            let jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
            
            // Clean up any markdown or text around the JSON
            if (jsonText.includes('{')) {
                jsonText = jsonText.substring(jsonText.indexOf('{'), jsonText.lastIndexOf('}') + 1);
            }
            
            musicData = JSON.parse(jsonText);
        } catch (error) {
            console.error('Failed to parse music data:', error);
            throw new Error('Could not parse the music data from the API response');
        }
        
        // Save the music data
        currentMusicData = musicData;
        currentMusicData.enhancement = enhancement;
        
        // Save to history
        saveToHistory({
            id: Date.now(),
            prompt: prompt,
            duration: duration,
            enhancement: enhancement,
            title: musicData.title || 'Untitled Music',
            musicData: musicData,
            timestamp: new Date().toISOString()
        });
        
        // Prepare the player
        setupMusicPlayer(musicData);
        
        // Hide loading, show player
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('musicPlayer').style.display = 'block';
        
        // Update the music details
        document.getElementById('musicDetails').textContent = musicData.title || 'Generated Music';
        document.getElementById('totalTime').textContent = formatTime(duration * 60);
        
    } catch (error) {
        console.error('Music generation failed:', error);
        
        // Hide loading state
        document.getElementById('loadingState').style.display = 'none';
        
        // Show error message
        alert(`Failed to generate music: ${error.message}`);
    }
}

// Get enhancement-specific prompt instructions
function getEnhancementPrompt(enhancement) {
    switch(enhancement) {
        case 'reverb':
            return `Include musical dynamics that would benefit from reverb and echo effects. Design the composition with space between notes to allow reverberations to be heard.`;
        case 'harmony':
            return `Create a rich harmonic structure with chord progressions. For each melody note, suggest complementary harmony notes that should be played simultaneously.`;
        case 'structure':
            return `Structure the composition with distinct sections (intro, verse, chorus, bridge, outro, etc.). Make sure there's musical development and repetition of themes.`;
        case 'chorus':
            return `Create a composition that would benefit from chorus and phaser effects. Include sustained notes and smooth transitions between pitches. Consider a dreamy, swirling quality to the melody.`;
        case 'lofi':
            return `Compose a lo-fi style piece with a relaxed tempo (around 70-85 BPM). Include jazz-influenced chord progressions, subtle dissonance, and repetitive melodic patterns. Leave space for beats and atmospheric effects.`;
        case 'synth-pad':
            return `Create a melody that would work well with synthesizer pad backing. Design simple, memorable themes that can be highlighted while pads provide harmonic support. Include chord progression information.`;
        case 'orchestral':
            return `Compose an orchestral-inspired piece with distinct sections for different instrument groups (strings, brass, woodwinds, percussion). Include dynamics (forte, piano) and articulation instructions.`;
        default:
            return '';
    }
}

// Setup the music player
function setupMusicPlayer(musicData) {
    // Initialize Tone.js
    if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
    }
    
    // Set the tempo
    Tone.Transport.bpm.value = musicData.tempo || 120;
    
    // Create visualization
    setupVisualization();
    
    // Reset the current time display
    document.getElementById('currentTime').textContent = '0:00';
    
    // Update play button
    const playBtn = document.getElementById('playBtn');
    playBtn.innerHTML = '<i class="material-icons">play_arrow</i>';
}

// Play the generated music
function playGeneratedMusic() {
    if (!currentMusicData) return;
    
    if (musicPlaying) {
        // If already playing, pause
        Tone.Transport.pause();
        document.getElementById('playBtn').innerHTML = '<i class="material-icons">play_arrow</i>';
        musicPlaying = false;
        
        // Clear visualization interval
        if (visualizationIntervalId) {
            clearInterval(visualizationIntervalId);
            visualizationIntervalId = null;
        }
    } else {
        // First initialize audio libraries if needed
        initAudioLibraries();
        
        // Start playing
        // Initialize audio context if needed
        if (Tone.context.state !== 'running') {
            Tone.start();
        }
        
        // Reset transport
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        
        // Clear any existing parts
        if (currentPattern) {
            currentPattern.dispose();
        }
        
        // Dispose any existing synth
        if (currentSynth) {
            currentSynth.dispose();
        }
        
        // Clear enhancement effects
        cleanupEffects();
        
        // Create a new synth based on the instrument type
        let instrument = currentMusicData.instrument || 'piano';
        createInstrument(instrument);
        
        // Apply enhancement effects based on selection
        applyEnhancementEffects(currentMusicData.enhancement);
        
        // Create a new pattern
        currentPattern = new Tone.Part((time, note) => {
            currentSynth.triggerAttackRelease(
                note.note,
                note.duration,
                time,
                note.velocity || 0.7
            );
        }, currentMusicData.notes).start(0);
        
        // Set up visualization
        setupVisualization();
        
        // Update time display during playback
        visualizationIntervalId = setInterval(() => {
            const currentSeconds = Tone.Transport.seconds;
            document.getElementById('currentTime').textContent = formatTime(currentSeconds);
            
            // Update visualization
            updateVisualization();
            
            // Check if playback has completed
            const duration = parseFloat(document.getElementById('duration').value) * 60;
            if (currentSeconds >= duration) {
                stopMusic();
            }
        }, 100);
        
        // Start the transport
        Tone.Transport.start();
        
        document.getElementById('playBtn').innerHTML = '<i class="material-icons">pause</i>';
        musicPlaying = true;
    }
}

// Create the appropriate instrument
function createInstrument(instrumentType) {
    if (instrumentType.includes('piano')) {
        currentSynth = new Tone.Sampler({
            urls: {
                A1: "A1.mp3", C2: "C2.mp3", D2: "D2.mp3", E2: "E2.mp3", G2: "G2.mp3",
                A2: "A2.mp3", C3: "C3.mp3", D3: "D3.mp3", E3: "E3.mp3", G3: "G3.mp3",
                A3: "A3.mp3", C4: "C4.mp3", D4: "D4.mp3", E4: "E4.mp3", G4: "G4.mp3",
                A4: "A4.mp3", C5: "C5.mp3", D5: "D5.mp3", E5: "E5.mp3", G5: "G5.mp3",
                A5: "A5.mp3", C6: "C6.mp3", D6: "D6.mp3", E6: "E6.mp3"
            },
            baseUrl: "https://tonejs.github.io/audio/salamander/",
            release: 1
        }).toDestination();
    } else if (instrumentType.includes('guitar')) {
        currentSynth = new Tone.PluckSynth().toDestination();
    } else if (instrumentType.includes('synth') || instrumentType.includes('electronic')) {
        currentSynth = new Tone.PolySynth(Tone.AMSynth).toDestination();
    } else if (instrumentType.includes('string') || instrumentType.includes('orchestral')) {
        // A more sustained sound for strings
        currentSynth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 3,
            modulationIndex: 10,
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.1,
                decay: 0.2,
                sustain: 0.8,
                release: 1.5
            },
            modulation: {
                type: "square"
            },
            modulationEnvelope: {
                attack: 0.5,
                decay: 0,
                sustain: 1,
                release: 0.5
            }
        }).toDestination();
    } else {
        // Default synth
        currentSynth = new Tone.PolySynth(Tone.Synth).toDestination();
    }
}

// Clean up any existing effects
function cleanupEffects() {
    enhancementEffects.forEach(effect => {
        if (effect) {
            if (typeof effect.dispose === 'function') {
                effect.dispose();
            } else if (typeof effect === 'object' && effect.disconnect) {
                effect.disconnect();
            }
        }
    });
    
    // Clean up WAD synth if it exists
    if (wadSynth) {
        wadSynth.stop();
        wadSynth = null;
    }
    
    enhancementEffects = [];
}

// Apply audio enhancement effects based on the selection
function applyEnhancementEffects(enhancement) {
    switch(enhancement) {
        case 'reverb':
            const reverb = new Tone.Reverb({
                decay: 5,
                wet: 0.5
            }).toDestination();
            
            const delay = new Tone.FeedbackDelay({
                delayTime: "8n", 
                feedback: 0.3,
                wet: 0.3
            }).toDestination();
            
            currentSynth.connect(reverb);
            currentSynth.connect(delay);
            
            enhancementEffects.push(reverb, delay);
            break;
            
        case 'harmony':
            // We'll let the Gemini API generate the harmony notes directly
            // Just add some chorus for richness
            const chorus = new Tone.Chorus({
                frequency: 1.5,
                delayTime: 3.5,
                depth: 0.7,
                wet: 0.5
            }).toDestination();
            
            currentSynth.connect(chorus);
            enhancementEffects.push(chorus);
            break;
            
        case 'structure':
            // This is mostly handled by the AI prompt
            // Add subtle effects that enhance clarity of structured music
            const eq = new Tone.EQ3({
                low: 0,
                mid: 2,
                high: 1,
            }).toDestination();
            
            const compressor = new Tone.Compressor({
                threshold: -20,
                ratio: 4,
                attack: 0.005,
                release: 0.1
            }).toDestination();
            
            currentSynth.connect(eq);
            currentSynth.connect(compressor);
            enhancementEffects.push(eq, compressor);
            break;
            
        case 'chorus':
            // Use Tuna.js for chorus and phaser effects
            if (tuna) {
                const tunaChorus = new tuna.Chorus({
                    rate: 1.5,
                    feedback: 0.4,
                    delay: 0.0045,
                    bypass: 0,
                    depth: 0.7
                });
                
                const tunaPhaser = new tuna.Phaser({
                    rate: 0.8,
                    depth: 0.5,
                    feedback: 0.4,
                    stereoPhase: 30,
                    baseModulationFrequency: 700,
                    bypass: 0
                });
                
                // Connect Tone.js synth to Tuna effects
                const tunaInput = Tone.context.createGain();
                currentSynth.connect(tunaInput);
                
                // Chain the effects
                tunaInput.connect(tunaChorus);
                tunaChorus.connect(tunaPhaser);
                tunaPhaser.connect(Tone.context.destination);
                
                // Store for cleanup
                enhancementEffects.push({
                    dispose: () => {
                        tunaInput.disconnect();
                        tunaChorus.bypass = 1;
                        tunaPhaser.bypass = 1;
                    }
                });
            } else {
                // Fallback to Tone.js effects
                const fallbackChorus = new Tone.Chorus({
                    frequency: 1.5,
                    delayTime: 3.5,
                    depth: 0.8,
                    wet: 0.6
                }).toDestination();
                
                currentSynth.connect(fallbackChorus);
                enhancementEffects.push(fallbackChorus);
            }
            break;
            
        case 'lofi':
            // Use Tuna.js for lo-fi effects
            if (tuna) {
                // Create a bitcrusher for that lo-fi sound
                const tunaBitcrusher = new tuna.Bitcrusher({
                    bits: 8,
                    normfreq: 0.1,
                    bufferSize: 4096,
                    bypass: 0
                });
                
                // Add a filter to simulate vintage equipment
                const tunaFilter = new tuna.Filter({
                    frequency: 3000,
                    Q: 1,
                    gain: 0,
                    filterType: "lowpass",
                    bypass: 0
                });
                
                // Add some slight saturation/distortion
                const tunaOverdrive = new tuna.Overdrive({
                    outputGain: 0.5,
                    drive: 0.25,
                    curveAmount: 0.5,
                    algorithmIndex: 0,
                    bypass: 0
                });
                
                // Connect Tone.js synth to Tuna effects
                const tunaInput = Tone.context.createGain();
                tunaInput.gain.value = 0.8; // Reduce volume slightly
                currentSynth.connect(tunaInput);
                
                // Chain the effects
                tunaInput.connect(tunaFilter);
                tunaFilter.connect(tunaBitcrusher);
                tunaBitcrusher.connect(tunaOverdrive);
                tunaOverdrive.connect(Tone.context.destination);
                
                // Store for cleanup
                enhancementEffects.push({
                    dispose: () => {
                        tunaInput.disconnect();
                        tunaFilter.bypass = 1;
                        tunaBitcrusher.bypass = 1;
                        tunaOverdrive.bypass = 1;
                    }
                });
            } else {
                // Fallback to Tone.js effects
                const bitCrusher = new Tone.BitCrusher(4).toDestination();
                const filter = new Tone.Filter({
                    frequency: 2500,
                    type: "lowpass",
                    rolloff: -24
                }).toDestination();
                
                currentSynth.connect(filter);
                filter.connect(bitCrusher);
                enhancementEffects.push(bitCrusher, filter);
            }
            break;
            
        case 'synth-pad':
            // Use WAD.js for synth pad backing
            if (window.Wad) {
                try {
                    // Create a pad synth with WAD
                    wadSynth = new Wad({
                        source: 'sine',
                        env: {
                            attack: 0.7,
                            decay: 0.3,
                            sustain: 0.7,
                            hold: 3,
                            release: 1.5
                        },
                        filter: {
                            type: 'lowpass',
                            frequency: 700,
                            q: 3,
                            env: {
                                attack: 0.5,
                                frequency: 1500
                            }
                        },
                        vibrato: {
                            attack: 1,
                            speed: 5,
                            magnitude: 5
                        }
                    });
                    
                    // Extract chord progression from notes
                    const chords = extractChords(currentMusicData.notes);
                    
                    // Play pad chords along with the melody
                    chords.forEach(chord => {
                        Tone.Transport.schedule(time => {
                            playWadChord(chord.notes, chord.duration);
                        }, chord.time);
                    });
                    
                    // Add normal Tone.js reverb to main synth
                    const padReverb = new Tone.Reverb({
                        decay: 5,
                        wet: 0.4
                    }).toDestination();
                    
                    currentSynth.connect(padReverb);
                    enhancementEffects.push(padReverb);
                    
                    // Store WAD synth for cleanup
                    enhancementEffects.push({
                        dispose: () => {
                            if (wadSynth) {
                                wadSynth.stop();
                            }
                        }
                    });
                } catch (error) {
                    console.error("WAD synth pad error:", error);
                    // Fallback to Tone.js pad effect
                    createTonePad();
                }
            } else {
                // Fallback to Tone.js pad effect
                createTonePad();
            }
            break;
            
        case 'orchestral':
            // Use Web Audio API with multiple layers
            try {
                // Add a string section using Tone.js built-in effects
                const strings = new Tone.PolySynth(Tone.FMSynth, {
                    harmonicity: 3,
                    modulationIndex: 5,
                    oscillator: { type: "sine" },
                    envelope: {
                        attack: 0.3,
                        decay: 0.4,
                        sustain: 0.7,
                        release: 1.2
                    },
                    modulation: { type: "triangle" },
                    modulationEnvelope: {
                        attack: 0.5,
                        decay: 0.1,
                        sustain: 0.2,
                        release: 0.5
                    }
                }).toDestination();
                
                // Add brass section using native Web Audio API
                const brassOsc = Tone.context.createOscillator();
                const brassGain = Tone.context.createGain();
                const brassFilter = Tone.context.createBiquadFilter();
                
                brassOsc.type = 'sawtooth';
                brassFilter.type = 'lowpass';
                brassFilter.frequency.value = 1200;
                brassFilter.Q.value = 8;
                
                brassOsc.connect(brassFilter);
                brassFilter.connect(brassGain);
                brassGain.connect(Tone.context.destination);
                
                brassGain.gain.value = 0; // Start silent
                brassOsc.start();
                
                // Create a pattern for orchestral backing
                const orchestralPart = new Tone.Part((time, note) => {
                    // For important notes in the melody, add orchestral backing
                    if (note.velocity > 0.6) {
                        // Play string chord
                        const chord = createTriad(note.note);
                        strings.triggerAttackRelease(chord, note.duration, time, note.velocity * 0.6);
                        
                        // Trigger brass for emphasis on strong beats
                        const noteFreq = Tone.Frequency(note.note).toFrequency();
                        brassOsc.frequency.setValueAtTime(noteFreq, time);
                        brassGain.gain.setValueAtTime(0, time);
                        brassGain.gain.linearRampToValueAtTime(0.2, time + 0.05);
                        brassGain.gain.exponentialRampToValueAtTime(0.01, time + Tone.Time(note.duration).toSeconds());
                    }
                }, currentMusicData.notes).start(0);
                
                // Add reverb for the orchestral sound
                const orchestralReverb = new Tone.Reverb({
                    decay: 3,
                    wet: 0.35
                }).toDestination();
                
                strings.connect(orchestralReverb);
                
                // Connect main synth with slightly reduced volume
                const mainGain = Tone.context.createGain();
                mainGain.gain.value = 0.7;
                currentSynth.connect(mainGain);
                mainGain.connect(Tone.context.destination);
                
                // Store for cleanup
                enhancementEffects.push(strings, orchestralReverb, orchestralPart, {
                    dispose: () => {
                        brassOsc.stop();
                        brassGain.disconnect();
                        brassFilter.disconnect();
                        mainGain.disconnect();
                    }
                });
            } catch (error) {
                console.error("Orchestral effect error:", error);
                // Fallback to simple reverb
                const fallbackReverb = new Tone.Reverb(3).toDestination();
                currentSynth.connect(fallbackReverb);
                enhancementEffects.push(fallbackReverb);
            }
            break;
            
        default:
            // Basic enhancement with a little reverb
            const basicReverb = new Tone.Reverb({
                decay: 2,
                wet: 0.2
            }).toDestination();
            
            currentSynth.connect(basicReverb);
            enhancementEffects.push(basicReverb);
    }
}

// Helper: Create a Tone.js based pad effect
function createTonePad() {
    // Create a pad synth with Tone.js
    const padSynth = new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 2.5,
        oscillator: {
            type: "sine"
        },
        envelope: {
            attack: 0.5,
            decay: 0.3,
            sustain: 0.7,
            release: 1.5
        },
        modulation: {
            type: "square"
        },
        modulationEnvelope: {
            attack: 0.5,
            decay: 0,
            sustain: 0.5,
            release: 0.5
        }
    }).toDestination();
    
    // Extract chord progression
    const chords = extractChords(currentMusicData.notes);
    
    // Create a new part for the pad
    const padPart = new Tone.Part((time, chord) => {
        padSynth.triggerAttackRelease(
            chord.notes,
            chord.duration,
            time,
            0.4 // Lower velocity for pads
        );
    }, chords).start(0);
    
    // Add reverb
    const padReverb = new Tone.Reverb(4).toDestination();
    padSynth.connect(padReverb);
    
    // Store for cleanup
    enhancementEffects.push(padSynth, padPart, padReverb);
}

// Helper: Extract chord progression from notes
function extractChords(notes) {
    const chords = [];
    const measureMap = {};
    
    // Group notes by measure
    notes.forEach(note => {
        const timeComponents = note.time.split(':');
        const measure = parseInt(timeComponents[0]);
        
        if (!measureMap[measure]) {
            measureMap[measure] = [];
        }
        
        measureMap[measure].push(note);
    });
    
    // Create a chord for each measure
    Object.keys(measureMap).forEach(measure => {
        const measureNotes = measureMap[measure];
        
        // Find the root notes (typically longer or at the beginning of measure)
        measureNotes.sort((a, b) => {
            const aComponents = a.time.split(':').map(Number);
            const bComponents = b.time.split(':').map(Number);
            
            // Sort by position in measure
            if (aComponents[1] !== bComponents[1]) {
                return aComponents[1] - bComponents[1];
            }
            
            return aComponents[2] - bComponents[2];
        });
        
        // Get chord root from first note in measure
        const rootNote = measureNotes[0].note;
        
        // Create a triad based on the root note
        const chordNotes = createTriad(rootNote);
        
        chords.push({
            time: `${measure}:0:0`,
            notes: chordNotes,
            duration: "1m"
        });
    });
    
    return chords;
}

// Helper: Create a triad chord from root note
function createTriad(rootNote) {
    // Extract the note and octave
    const notePattern = /([A-G][#b]?)(\d+)/;
    const match = rootNote.match(notePattern);
    
    if (!match) return [rootNote];
    
    const note = match[1];
    const octave = parseInt(match[2]);
    
    // Major triad notes (root, major third, perfect fifth)
    const noteTable = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteTable.indexOf(note);
    
    if (rootIndex === -1) return [rootNote];
    
    // Get major third and perfect fifth
    const thirdIndex = (rootIndex + 4) % 12;
    const fifthIndex = (rootIndex + 7) % 12;
    
    // Handle octave changes
    const thirdOctave = octave + (rootIndex + 4 >= 12 ? 1 : 0);
    const fifthOctave = octave + (rootIndex + 7 >= 12 ? 1 : 0);
    
    return [
        rootNote,
        `${noteTable[thirdIndex]}${thirdOctave}`,
        `${noteTable[fifthIndex]}${fifthOctave}`
    ];
}

// Helper: Play a chord with WAD.js
function playWadChord(notes, duration) {
    if (!wadSynth) return;
    
    // Convert Tone.js duration to seconds
    const durationSeconds = Tone.Time(duration).toSeconds();
    
    // Play each note with slight variations for a more natural sound
    notes.forEach((note, index) => {
        setTimeout(() => {
            wadSynth.play({
                pitch: note,
                env: {
                    hold: durationSeconds * 0.75
                }
            });
        }, index * 30); // Slight delay between notes
    });
}

// Download the generated music
async function downloadMusic() {
    if (!currentMusicData) return;
    
    // Show a temporary message
    const downloadBtn = document.getElementById('downloadBtn');
    const originalHTML = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="material-icons">hourglass_empty</i>';
    downloadBtn.disabled = true;
    
    try {
        // Stop any playing music first
        if (musicPlaying) {
            stopMusic();
        }
        
        // Initialize the recorder
        const offlineContext = new Tone.OfflineContext(2, 
            parseFloat(document.getElementById('duration').value) * 60, 
            44100
        );
        
        // Create appropriate synth in the offline context
        let instrument = currentMusicData.instrument || 'piano';
        let offlineSynth;
        
        if (instrument.includes('piano')) {
            offlineSynth = new Tone.Sampler({
                urls: {
                    A1: "A1.mp3", C2: "C2.mp3", D2: "D2.mp3", E2: "E2.mp3", G2: "G2.mp3",
                    A2: "A2.mp3", C3: "C3.mp3", D3: "D3.mp3", E3: "E3.mp3", G3: "G3.mp3",
                    A3: "A3.mp3", C4: "C4.mp3", D4: "D4.mp3", E4: "E4.mp3", G4: "G4.mp3",
                    A4: "A4.mp3", C5: "C5.mp3", D5: "D5.mp3", E5: "E5.mp3", G5: "G5.mp3",
                    A5: "A5.mp3", C6: "C6.mp3", D6: "D6.mp3", E6: "E6.mp3"
                },
                baseUrl: "https://tonejs.github.io/audio/salamander/",
                context: offlineContext,
                release: 1
            }).toDestination();
        } else if (instrument.includes('guitar')) {
            offlineSynth = new Tone.PluckSynth({
                context: offlineContext
            }).toDestination();
        } else {
            // Default synth
            offlineSynth = new Tone.PolySynth(Tone.Synth, {
                context: offlineContext
            }).toDestination();
        }
        
        // Create a reverb effect in the offline context
        const reverb = new Tone.Reverb(1.5, {
            context: offlineContext
        }).toDestination();
        offlineSynth.connect(reverb);
        
        // Set up notes in the offline context
        const offlineTransport = offlineContext.transport;
        offlineTransport.bpm.value = currentMusicData.tempo || 120;
        
        // Add each note to the sequence
        currentMusicData.notes.forEach(note => {
            offlineTransport.schedule(time => {
                offlineSynth.triggerAttackRelease(
                    note.note, 
                    note.duration, 
                    time, 
                    note.velocity || 0.7
                );
            }, Tone.Time(note.time));
        });
        
        // Generate the audio
        offlineTransport.start();
        const renderedBuffer = await offlineContext.render();
        
        // Create a WAV download
        const wavBlob = audioBufferToWav(renderedBuffer);
        const url = URL.createObjectURL(wavBlob);
        
        // Create a download link
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${currentMusicData.title || 'generated_music'}.wav`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Restore button
        downloadBtn.innerHTML = originalHTML;
        downloadBtn.disabled = false;
        
    } catch (error) {
        console.error('Error downloading music:', error);
        alert('Failed to download music. Please try again.');
        
        // Restore button
        downloadBtn.innerHTML = originalHTML;
        downloadBtn.disabled = false;
    }
}

// Helper function to convert an Audio Buffer to a WAV Blob
// Based on https://github.com/Tonejs/Tone.js/blob/dev/examples/js/waveSurfer.js
function audioBufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const bufferLength = buffer.length;
    const totalByteSize = bufferLength * blockAlign + 44; // 44 bytes for the header
    
    const arrayBuffer = new ArrayBuffer(totalByteSize);
    const dataView = new DataView(arrayBuffer);
    
    // RIFF identifier 'RIFF'
    dataView.setUint8(0, 'R'.charCodeAt(0));
    dataView.setUint8(1, 'I'.charCodeAt(0));
    dataView.setUint8(2, 'F'.charCodeAt(0));
    dataView.setUint8(3, 'F'.charCodeAt(0));
    
    // file length minus RIFF identifier length and file description length
    dataView.setUint32(4, 36 + bufferLength * blockAlign, true);
    
    // RIFF type 'WAVE'
    dataView.setUint8(8, 'W'.charCodeAt(0));
    dataView.setUint8(9, 'A'.charCodeAt(0));
    dataView.setUint8(10, 'V'.charCodeAt(0));
    dataView.setUint8(11, 'E'.charCodeAt(0));
    
    // format chunk identifier 'fmt '
    dataView.setUint8(12, 'f'.charCodeAt(0));
    dataView.setUint8(13, 'm'.charCodeAt(0));
    dataView.setUint8(14, 't'.charCodeAt(0));
    dataView.setUint8(15, ' '.charCodeAt(0));
    
    // format chunk length
    dataView.setUint32(16, 16, true);
    
    // sample format (raw)
    dataView.setUint16(20, format, true);
    
    // channel count
    dataView.setUint16(22, numberOfChannels, true);
    
    // sample rate
    dataView.setUint32(24, sampleRate, true);
    
    // byte rate (sample rate * block align)
    dataView.setUint32(28, sampleRate * blockAlign, true);
    
    // block align (channel count * bytes per sample)
    dataView.setUint16(32, blockAlign, true);
    
    // bits per sample
    dataView.setUint16(34, bitDepth, true);
    
    // data chunk identifier 'data'
    dataView.setUint8(36, 'd'.charCodeAt(0));
    dataView.setUint8(37, 'a'.charCodeAt(0));
    dataView.setUint8(38, 't'.charCodeAt(0));
    dataView.setUint8(39, 'a'.charCodeAt(0));
    
    // data chunk length
    dataView.setUint32(40, bufferLength * blockAlign, true);
    
    // write the PCM samples
    const channelData = [];
    let offset = 44;
    
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channelData.push(buffer.getChannelData(i));
    }
    
    for (let i = 0; i < bufferLength; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            // convert floating point value to integer
            let sample = Math.max(-1, Math.min(1, channelData[channel][i]));
            sample = sample < 0 ? sample * 32768 : sample * 32767;
            
            dataView.setInt16(offset, sample, true);
            offset += bytesPerSample;
        }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Setup audio visualization
function setupVisualization() {
    // Get the visualization element
    const visualizer = document.getElementById('waveformVisualizer');
    
    // Clear previous content
    visualizer.innerHTML = '';
    
    // Create bars for visualization
    const numBars = 40;
    for (let i = 0; i < numBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        bar.style.cssText = `
            width: ${100 / numBars - 1}%;
            background-color: var(--primary-color);
            margin: 0 1px;
            height: 5px;
            transition: height 0.05s ease;
        `;
        visualizer.appendChild(bar);
    }
    
    // Setup the analyser if not already
    if (!analyser) {
        analyser = new Tone.Analyser('fft', 64);
        Tone.Destination.connect(analyser);
    }
    
    // Style the visualizer container
    visualizer.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
}

// Update visualization during playback
function updateVisualization() {
    if (!analyser || !musicPlaying) return;
    
    const spectrum = analyser.getValue();
    const bars = document.querySelectorAll('.visualizer-bar');
    
    if (bars.length > 0) {
        const barCount = bars.length;
        for (let i = 0; i < barCount; i++) {
            // Get spectrum value for this bar (reuse values if we have more bars than spectrum values)
            const index = Math.floor(i / barCount * spectrum.length);
            const value = spectrum[index];
            
            // Normalize to 0-100 for height
            // FFT values are in dB, typically -100 to 0
            const height = Math.max(5, ((value + 100) / 100) * 80);
            
            bars[i].style.height = `${height}px`;
            
            // Color gradient from blue to light blue based on height
            const hue = 195 + (height / 80) * 20; // 195-215 for blue range
            bars[i].style.backgroundColor = `hsl(${hue}, 100%, 35%)`;
        }
    }
}

// Format seconds to MM:SS
function formatTime(seconds) {
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Save a generation to history
function saveToHistory(historyItem) {
    // Get existing history from localStorage
    let history = JSON.parse(localStorage.getItem('music_generation_history') || '[]');
    
    // Add new item to the beginning
    history.unshift(historyItem);
    
    // Limit history to 10 items
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    
    // Save back to localStorage
    localStorage.setItem('music_generation_history', JSON.stringify(history));
    
    // Update the UI
    loadGenerationHistory();
}

// Load generation history from localStorage
function loadGenerationHistory() {
    const historyContainer = document.getElementById('generationHistory');
    if (!historyContainer) return;
    
    // Get history from localStorage
    const history = JSON.parse(localStorage.getItem('music_generation_history') || '[]');
    
    // Clear container
    historyContainer.innerHTML = '';
    
    if (history.length === 0) {
        historyContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1rem 0;">Your generation history will appear here</p>';
        return;
    }
    
    // Create list
    const historyList = document.createElement('ul');
    historyList.style.cssText = 'list-style-type: none; padding: 0;';
    
    // Add each history item
    history.forEach(item => {
        const historyItem = document.createElement('li');
        historyItem.style.cssText = 'margin-bottom: 0.75rem; padding: 0.75rem; background-color: var(--background-light); border-radius: var(--radius); cursor: pointer;';
        
        // Format timestamp
        const date = new Date(item.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        historyItem.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 0.25rem;">${item.title}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${formattedDate}</div>
            <div style="font-size: 0.8rem; margin-top: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                "${item.prompt.length > 40 ? item.prompt.substring(0, 40) + '...' : item.prompt}"
            </div>
        `;
        
        // Add click event to load this music
        historyItem.addEventListener('click', () => {
            // Load the music data
            currentMusicData = item.musicData;
            
            // Update the form values
            document.getElementById('musicPrompt').value = item.prompt;
            document.getElementById('duration').value = item.duration;
            
            // Setup the player
            setupMusicPlayer(item.musicData);
            
            // Show the player
            document.getElementById('musicPlayer').style.display = 'block';
            
            // Update the music details
            document.getElementById('musicDetails').textContent = item.title;
            document.getElementById('totalTime').textContent = formatTime(item.duration * 60);
            
            // Scroll to the player
            document.getElementById('musicPlayer').scrollIntoView({ behavior: 'smooth' });
        });
        
        historyList.appendChild(historyItem);
    });
    
    historyContainer.appendChild(historyList);
}

// Stop music playback
function stopMusic() {
    if (Tone.Transport.state === 'started' || Tone.Transport.state === 'paused') {
        Tone.Transport.stop();
    }
    
    document.getElementById('playBtn').innerHTML = '<i class="material-icons">play_arrow</i>';
    document.getElementById('currentTime').textContent = '0:00';
    musicPlaying = false;
    
    // Clean up WAD synth if it exists
    if (wadSynth) {
        wadSynth.stop();
    }
    
    // Clear visualization interval
    if (visualizationIntervalId) {
        clearInterval(visualizationIntervalId);
        visualizationIntervalId = null;
    }
} 