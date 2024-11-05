class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.bufferSize = 4096;
      this.buffer = new Float32Array(this.bufferSize);
      this.bufferIndex = 0;
    }
  
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      if (!input || !input[0]) return true;
  
      const inputChannel = input[0];
  
      // Fill buffer
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex++;
  
        // When buffer is full, send it to the main thread
        if (this.bufferIndex >= this.bufferSize) {
          const int16Data = this.convertFloat32ToInt16(this.buffer);
          this.port.postMessage({ audioData: int16Data });
          this.bufferIndex = 0;
        }
      }
  
      return true;
    }
  
    convertFloat32ToInt16(buffer) {
      const l = buffer.length;
      const buf = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        buf[i] = Math.min(1, buffer[i]) * 0x7FFF;
      }
      return buf;
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor);