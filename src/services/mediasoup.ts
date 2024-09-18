import * as mediasoup from 'mediasoup';
import os from 'os';

class MediasoupService {
  // Correct type and initialization of workers array
  private workers: mediasoup.types.Worker[] = [];

  // Function to create a MediaSoup worker
  private async initWorkers(){
    const cpuCores = os.cpus();
    const numberOfCores = cpuCores.length;

    // Create workers based on the number of CPU cores
    for (let index = 0; index < numberOfCores; index++) {
      const worker = await this.createWorker();
      this.workers.push(worker)
    }
  }

  private async createWorker(): Promise<mediasoup.types.Worker> {
    const worker = await mediasoup.createWorker({
      logLevel: 'warn',
      logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
      rtcMinPort: 2000,
      rtcMaxPort: 2020,
    });

    console.log('Worker created, PID:', worker.pid);

    // Handle worker errors
    worker.on('died', () => {
      console.error('MediaSoup worker died, exiting in 2 seconds...');
      setTimeout(() => process.exit(1), 2000);
    });

    return worker;
  }

  // Method to get a random worker
  private get worker() {
    const index = Math.floor(Math.random() * this.workers.length);
    return this.workers[index];
  }

  // Method to get a router for a given worker
  async getRouter() {
    if(this.workers.length == 0){
        await this.initWorkers();
    }

    const worker = this.worker;
    const mediaCodecs = [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
    ];
    

    const router = await worker.createRouter({ mediaCodecs });
    console.log('Router created with ID:', router.id);
    return router;
  }
}

// Proper instantiation of the MediasoupService class
const mediasoupService = new MediasoupService();
export default mediasoupService;
