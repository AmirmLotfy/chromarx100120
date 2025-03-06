
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;

  constructor(
    private onStart: () => void,
    private onStop: (audioBlob: Blob) => void,
    private onError: (error: Error) => void
  ) {}

  async startRecording() {
    try {
      if (this.isRecording) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      this.mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        this.onStop(audioBlob);
        this.isRecording = false;
      });

      this.mediaRecorder.start();
      this.isRecording = true;
      this.onStart();
    } catch (error) {
      this.onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  isCurrentlyRecording() {
    return this.isRecording;
  }
}

export const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
