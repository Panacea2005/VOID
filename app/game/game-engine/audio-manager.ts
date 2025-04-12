import { AudioEventType } from '../types/game-types';

// Audio Manager class for handling all game audio
export class AudioManager {
  private sounds: Map<AudioEventType, HTMLAudioElement> = new Map();
  private musicElement: HTMLAudioElement | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private volume: number = 0.7;
  private currentMusic: string = '';

  constructor() {
    this.initializeSounds();
  }

  // Initialize all sound effects
  private initializeSounds(): void {
    // Define sound effects paths
    const soundPaths: Record<AudioEventType, string> = {
      [AudioEventType.PLAYER_MOVE]: '/sounds/player_move.mp3',
      [AudioEventType.PLAYER_COLLECT]: '/sounds/player_collect.mp3',
      [AudioEventType.PLAYER_TELEPORT]: '/sounds/player_teleport.mp3',
      [AudioEventType.PLAYER_DAMAGE]: '/sounds/player_damage.mp3',
      [AudioEventType.PLAYER_POWERUP]: '/sounds/player_powerup.mp3',
      [AudioEventType.ENEMY_ALERT]: '/sounds/enemy_alert.mp3',
      [AudioEventType.ENEMY_ATTACK]: '/sounds/enemy_attack.mp3',
      [AudioEventType.ENEMY_STUN]: '/sounds/enemy_stun.mp3',
      [AudioEventType.LEVEL_COMPLETE]: '/sounds/level_complete.mp3',
      [AudioEventType.GAME_OVER]: '/sounds/game_over.mp3',
      [AudioEventType.SWITCH_ACTIVATE]: '/sounds/switch_activate.mp3',
      [AudioEventType.TELEPORT_USE]: '/sounds/teleport_use.mp3',
      [AudioEventType.BARRIER_TOGGLE]: '/sounds/barrier_toggle.mp3',
      [AudioEventType.AMBIENT]: '/sounds/ambient_music.mp3',
      [AudioEventType.UI_SELECT]: '/sounds/ui_select.mp3',
      [AudioEventType.UI_CONFIRM]: '/sounds/ui_confirm.mp3',
      [AudioEventType.UI_CANCEL]: '/sounds/ui_cancel.mp3',
    };

    // Create fallback audio elements for development
    // In a production environment, you'd want to use actual sound files
    for (const type in AudioEventType) {
      if (isNaN(Number(type))) {
        const eventType = AudioEventType[type as keyof typeof AudioEventType];
        this.createSoundElement(eventType, soundPaths[eventType]);
      }
    }
  }

  // Create a sound element
  private createSoundElement(type: AudioEventType, path: string): void {
    try {
      const audio = new Audio();
      
      // For development without actual sound files, we'll create silent audio
      // You should replace this with actual sound file paths in a real game
      audio.src = path;
      
      // Set common audio properties
      audio.volume = this.volume;
      audio.preload = 'auto';
      
      // For background music, loop it
      if (type === AudioEventType.AMBIENT) {
        audio.loop = true;
      } else {
        audio.loop = false;
      }
      
      // Store the audio element
      this.sounds.set(type, audio);
      
      // Add error handling
      audio.onerror = (e) => {
        console.warn(`Failed to load sound: ${path}`, e);
        
        // Create a silent audio element as fallback
        const silentAudio = new Audio();
        silentAudio.volume = 0;
        this.sounds.set(type, silentAudio);
      };
    } catch (error) {
      console.error('Error creating audio element:', error);
    }
  }

  // Play a sound
  public playSound(type: AudioEventType): void {
    if (!this.soundEnabled && type !== AudioEventType.AMBIENT) {
      return;
    }
    
    if (!this.musicEnabled && type === AudioEventType.AMBIENT) {
      return;
    }
    
    try {
      const sound = this.sounds.get(type);
      
      if (sound) {
        // For background music, handle it differently
        if (type === AudioEventType.AMBIENT) {
          // Stop previous music if playing
          if (this.musicElement && !this.musicElement.paused) {
            this.musicElement.pause();
            this.musicElement.currentTime = 0;
          }
          
          // Set current music
          this.musicElement = sound;
          this.currentMusic = sound.src;
          
          // Play music
          sound.volume = this.volume;
          sound.play().catch(e => {
            console.warn('Failed to play audio:', e);
          });
        } else {
          // For sound effects, clone the node to allow overlapping sounds
          const soundClone = sound.cloneNode() as HTMLAudioElement;
          soundClone.volume = this.volume;
          
          soundClone.play().catch(e => {
            console.warn('Failed to play audio:', e);
          });
          
          // Clean up the cloned node after it finishes playing
          soundClone.onended = () => {
            soundClone.remove();
          };
        }
      } else {
        console.warn(`Sound not found for type: ${type}`);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  // Stop a specific sound
  public stopSound(type: AudioEventType): void {
    const sound = this.sounds.get(type);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  // Stop all sounds
  public stopAllSounds(): void {
    for (const sound of this.sounds.values()) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  // Toggle sound effects
  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  // Toggle music
  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    
    if (this.musicEnabled) {
      // Resume music
      if (this.musicElement) {
        this.musicElement.play().catch(e => {
          console.warn('Failed to resume music:', e);
        });
      }
    } else {
      // Pause music
      if (this.musicElement) {
        this.musicElement.pause();
      }
    }
    
    return this.musicEnabled;
  }

  // Set volume (0.0 to 1.0)
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all sounds
    for (const sound of this.sounds.values()) {
      sound.volume = this.volume;
    }
  }

  // Get current volume
  public getVolume(): number {
    return this.volume;
  }

  // Check if sound is enabled
  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // Check if music is enabled
  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  // Preload all sounds
  public preloadSounds(): void {
    for (const sound of this.sounds.values()) {
      sound.load();
    }
  }

  // Create synthetic sound for development (when actual sound files are not available)
  public createSyntheticSound(type: AudioEventType): void {
    // This function uses Web Audio API to create synthetic sounds
    // Useful for development when real sound files are not yet available
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create an empty 1-second buffer
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(2, sampleRate, sampleRate);
      
      // Different sounds for different events
      switch (type) {
        case AudioEventType.PLAYER_MOVE:
          this.fillBufferWithTone(buffer, 220, 0.05, 0.1);
          break;
        case AudioEventType.PLAYER_COLLECT:
          this.fillBufferWithTone(buffer, 440, 0.1, 0.3, true);
          break;
        case AudioEventType.PLAYER_TELEPORT:
          this.fillBufferWithSweep(buffer, 100, 800, 0.3);
          break;
        case AudioEventType.PLAYER_DAMAGE:
          this.fillBufferWithNoise(buffer, 0.2, 0.3);
          break;
        case AudioEventType.PLAYER_POWERUP:
          this.fillBufferWithArpeggio(buffer, [300, 400, 500], 0.3);
          break;
        case AudioEventType.ENEMY_ALERT:
          this.fillBufferWithTone(buffer, 330, 0.2, 0.5, false, 'sawtooth');
          break;
        case AudioEventType.LEVEL_COMPLETE:
          this.fillBufferWithArpeggio(buffer, [523.25, 659.25, 783.99, 1046.50], 0.5);
          break;
        case AudioEventType.GAME_OVER:
          this.fillBufferWithSweep(buffer, 400, 100, 0.5, 'sawtooth');
          break;
        default:
          // Default short beep
          this.fillBufferWithTone(buffer, 440, 0.1, 0.3);
      }
      
      // Create an audio element from the buffer
      const audioElement = new Audio();
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(audioContext.destination);
      
      // Convert buffer to wav format
      const wavData = this.bufferToWave(buffer, 0, buffer.length);
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      audioElement.src = url;
      audioElement.volume = this.volume;
      
      // Store the audio element
      this.sounds.set(type, audioElement);
    } catch (error) {
      console.error('Error creating synthetic sound:', error);
    }
  }

  // Helper: Fill buffer with a tone
  private fillBufferWithTone(
    buffer: AudioBuffer,
    frequency: number,
    duration: number,
    amplitude: number,
    ascending: boolean = false,
    waveType: string = 'sine'
  ): void {
    const channelData = [buffer.getChannelData(0), buffer.getChannelData(1)];
    const sampleRate = buffer.sampleRate;
    const samples = Math.min(sampleRate * duration, buffer.length);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let freq = frequency;
      
      // For ascending tones
      if (ascending) {
        freq += (t / duration) * frequency;
      }
      
      // Generate waveform
      let value = 0;
      const phase = 2 * Math.PI * freq * t;
      
      switch (waveType) {
        case 'sine':
          value = Math.sin(phase);
          break;
        case 'square':
          value = Math.sin(phase) >= 0 ? 1 : -1;
          break;
        case 'sawtooth':
          value = (phase % (2 * Math.PI)) / (2 * Math.PI) * 2 - 1;
          break;
        case 'triangle':
          value = Math.abs((phase % (2 * Math.PI)) / (2 * Math.PI) * 4 - 2) - 1;
          break;
      }
      
      // Apply amplitude and envelope
      const envelope = Math.sin((i / samples) * Math.PI);
      value *= amplitude * envelope;
      
      // Set value to both channels
      channelData[0][i] = value;
      channelData[1][i] = value;
    }
  }

  // Helper: Fill buffer with a frequency sweep
  private fillBufferWithSweep(
    buffer: AudioBuffer,
    startFreq: number,
    endFreq: number,
    duration: number,
    waveType: string = 'sine'
  ): void {
    const channelData = [buffer.getChannelData(0), buffer.getChannelData(1)];
    const sampleRate = buffer.sampleRate;
    const samples = Math.min(sampleRate * duration, buffer.length);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const progress = i / samples;
      const frequency = startFreq + (endFreq - startFreq) * progress;
      
      // Generate waveform
      let value = 0;
      const phase = 2 * Math.PI * frequency * t;
      
      switch (waveType) {
        case 'sine':
          value = Math.sin(phase);
          break;
        case 'square':
          value = Math.sin(phase) >= 0 ? 1 : -1;
          break;
        case 'sawtooth':
          value = (phase % (2 * Math.PI)) / (2 * Math.PI) * 2 - 1;
          break;
        case 'triangle':
          value = Math.abs((phase % (2 * Math.PI)) / (2 * Math.PI) * 4 - 2) - 1;
          break;
      }
      
      // Apply amplitude and envelope
      const envelope = Math.sin((i / samples) * Math.PI);
      value *= 0.3 * envelope;
      
      // Set value to both channels
      channelData[0][i] = value;
      channelData[1][i] = value;
    }
  }

  // Helper: Fill buffer with noise
  private fillBufferWithNoise(
    buffer: AudioBuffer,
    duration: number,
    amplitude: number
  ): void {
    const channelData = [buffer.getChannelData(0), buffer.getChannelData(1)];
    const sampleRate = buffer.sampleRate;
    const samples = Math.min(sampleRate * duration, buffer.length);
    
    for (let i = 0; i < samples; i++) {
      const progress = i / samples;
      const value = (Math.random() * 2 - 1) * amplitude;
      
      // Apply envelope
      const envelope = Math.sin((i / samples) * Math.PI);
      
      // Set value to both channels
      channelData[0][i] = value * envelope;
      channelData[1][i] = value * envelope;
    }
  }

  // Helper: Fill buffer with an arpeggio
  private fillBufferWithArpeggio(
    buffer: AudioBuffer,
    frequencies: number[],
    duration: number
  ): void {
    const channelData = [buffer.getChannelData(0), buffer.getChannelData(1)];
    const sampleRate = buffer.sampleRate;
    const totalSamples = Math.min(sampleRate * duration, buffer.length);
    
    const noteDuration = duration / frequencies.length;
    const noteSamples = Math.floor(totalSamples / frequencies.length);
    
    for (let n = 0; n < frequencies.length; n++) {
      const freq = frequencies[n];
      const startSample = n * noteSamples;
      const endSample = Math.min(startSample + noteSamples, totalSamples);
      
      for (let i = startSample; i < endSample; i++) {
        const t = (i - startSample) / sampleRate;
        const progress = (i - startSample) / noteSamples;
        
        // Generate sine wave
        const value = Math.sin(2 * Math.PI * freq * t) * 0.3;
        
        // Apply envelope
        const envelope = Math.sin(progress * Math.PI);
        
        // Set value to both channels
        channelData[0][i] = value * envelope;
        channelData[1][i] = value * envelope;
      }
    }
  }

  // Helper: Convert AudioBuffer to WAV format
  private bufferToWave(buffer: AudioBuffer, offset: number, length: number): Uint8Array {
    const numChannels = buffer.numberOfChannels;
    const samples = buffer.getChannelData(0).subarray(offset, offset + length);
    const sampleRate = buffer.sampleRate;
    
    const dataLength = samples.length * numChannels * 2;
    const waveBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(waveBuffer);
    
    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + dataLength, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // Format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // Format chunk length
    view.setUint32(16, 16, true);
    // Sample format (raw)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, numChannels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numChannels * 2, true);
    // Block align (channel count * bytes per sample)
    view.setUint16(32, numChannels * 2, true);
    // Bits per sample
    view.setUint16(34, 16, true);
    // Data chunk identifier
    this.writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, dataLength, true);
    
    const mult = 32767;
    let currentOffset = 44;
    
    for (let i = 0; i < samples.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i + offset]));
        view.setInt16(currentOffset, sample < 0 ? sample * mult : sample * mult, true);
        currentOffset += 2;
      }
    }
    
    const float32Array = buffer.getChannelData(0); // Extract data from the first channel
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      int16Array[i] = Math.max(-1, Math.min(1, float32Array[i])) * 32767; // Convert to 16-bit PCM
    }
    return new Uint8Array(int16Array.buffer);
  }

  // Helper: Write string to DataView
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // Dispose all resources
  public dispose(): void {
    // Stop all sounds
    this.stopAllSounds();
    
    // Clear the sounds map
    this.sounds.clear();
    
    // Clear music reference
    this.musicElement = null;
  }
}