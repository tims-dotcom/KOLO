export interface RecordedVoiceResult {
  wavBlob: Blob;
  duration: number;
  waveform: number[];
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  // Downsample to 24000 Hz if sampleRate is higher (e.g. 48000 Hz) to keep files compact & crisp
  const targetRate = sampleRate > 24000 ? 24000 : sampleRate;
  const ratio = sampleRate / targetRate;
  const outLength = Math.floor(samples.length / ratio);
  const buffer = new ArrayBuffer(44 + outLength * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + outLength * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format = 1
  view.setUint16(22, 1, true); // Mono = 1 channel
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, outLength * 2, true);

  let offset = 44;
  for (let i = 0; i < outLength; i++) {
    const srcIdx = Math.min(samples.length - 1, Math.floor(i * ratio));
    const s = Math.max(-1, Math.min(1, samples[srcIdx]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export class LiveVoiceRecorder {
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private totalSamples = 0;
  private startTime = 0;
  private rafId: number | null = null;
  private peakHistory: number[] = [];

  async start(
    onVisualizerUpdate: (bars: number[], volume: number, elapsedSec: number) => void
  ): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Мікрофон недоступний. На телефоні відкривайте через HTTPS-посилання.'
      );
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioCtx();
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 128;
    this.analyserNode.smoothingTimeConstant = 0.65;

    this.processorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);
    this.chunks = [];
    this.totalSamples = 0;
    this.peakHistory = [];
    this.startTime = Date.now();

    this.processorNode.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      this.chunks.push(copy);
      this.totalSamples += copy.length;
    };

    // Connect graph (processor connected to a zero-gain node so it doesn't echo through speakers)
    const zeroGain = this.audioCtx.createGain();
    zeroGain.gain.value = 0;

    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(this.processorNode);
    this.processorNode.connect(zeroGain);
    zeroGain.connect(this.audioCtx.destination);

    const freqData = new Uint8Array(this.analyserNode.frequencyBinCount);
    const timeData = new Uint8Array(this.analyserNode.fftSize);
    const numBars = 28;

    const tick = () => {
      if (!this.analyserNode) return;
      this.analyserNode.getByteFrequencyData(freqData);
      this.analyserNode.getByteTimeDomainData(timeData);

      // Compute RMS volume from time domain (0..1)
      let sumSquares = 0;
      for (let i = 0; i < timeData.length; i++) {
        const normalized = (timeData[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / timeData.length);
      const volume = Math.min(1, rms * 3.8);
      this.peakHistory.push(Math.max(0.08, volume));

      // Build 28 frequency-reactive bars
      const bars: number[] = [];
      const usableBins = Math.min(freqData.length, 36);
      for (let b = 0; b < numBars; b++) {
        const binIndex = Math.floor((b / numBars) * usableBins);
        const rawFreq = freqData[binIndex] / 255;
        // Combine frequency energy + overall voice RMS so bars stay flat in silence and jump on speech
        const level = Math.min(1, Math.max(0.08, rawFreq * 0.75 + volume * 0.65));
        bars.push(level);
      }

      const elapsedSec = (Date.now() - this.startTime) / 1000;
      onVisualizerUpdate(bars, volume, elapsedSec);

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stop(): RecordedVoiceResult {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    const sampleRate = this.audioCtx?.sampleRate || 44100;
    const duration = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

    // Merge recorded PCM chunks
    const merged = new Float32Array(this.totalSamples);
    let offset = 0;
    for (const chunk of this.chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Normalize audio slightly if microphone was very quiet
    let maxPeak = 0;
    for (let i = 0; i < merged.length; i++) {
      const abs = Math.abs(merged[i]);
      if (abs > maxPeak) maxPeak = abs;
    }
    if (maxPeak > 0.01 && maxPeak < 0.5) {
      const gain = Math.min(4.0, 0.75 / maxPeak);
      for (let i = 0; i < merged.length; i++) {
        merged[i] = Math.max(-1, Math.min(1, merged[i] * gain));
      }
    }

    const wavBlob = encodeWAV(merged, sampleRate);

    // Downsample peakHistory into 28 bars for the message bubble waveform
    const targetBars = 28;
    const waveform: number[] = [];
    if (this.peakHistory.length > 0) {
      for (let i = 0; i < targetBars; i++) {
        const startIdx = Math.floor((i / targetBars) * this.peakHistory.length);
        const endIdx = Math.max(
          startIdx + 1,
          Math.floor(((i + 1) / targetBars) * this.peakHistory.length)
        );
        let max = 0.12;
        for (let j = startIdx; j < endIdx && j < this.peakHistory.length; j++) {
          if (this.peakHistory[j] > max) max = this.peakHistory[j];
        }
        waveform.push(Math.min(1, Math.max(0.14, Number(max.toFixed(2)))));
      }
    } else {
      for (let i = 0; i < targetBars; i++) waveform.push(0.2);
    }

    this.cleanup();

    return {
      wavBlob,
      duration,
      waveform,
    };
  }

  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.cleanup();
  }

  private cleanup(): void {
    try {
      this.processorNode?.disconnect();
      this.analyserNode?.disconnect();
      this.sourceNode?.disconnect();
    } catch {
      // ignore
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
    this.audioCtx = null;
    this.chunks = [];
  }
}
