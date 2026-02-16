import Peer from 'peerjs';

export class P2PStreaming {
  private peer: Peer | null = null;

  async initialize(peerId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        host: 'peerserver.example.com',
        port: 443,
        secure: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        }
      };

      this.peer = peerId
        ? new Peer(peerId, options)
        : new Peer(options);

      this.peer.on('open', (id: string) => {
        resolve(id);
      });

      this.peer.on('error', (err: any) => {
        reject(err);
      });
    });
  }

  getPeer() {
    return this.peer;
  }
}
