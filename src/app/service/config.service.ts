import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AppConfig {
  baseUrl: string;
 costingUrl: string;
  backupUrl: string;
  uploadsUrl: string;
  liveTimeOut: number;
  urls: { name: string; url: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
private config!: AppConfig; 

  constructor(private http: HttpClient) {}

  load(): Promise<void> {

    // The live server sends this file without Cache-Control, so a browser
    // is free to keep an old copy for hours. A stale copy silently drops
    // newly added API routes (getUrl returns '' and the request hits the
    // API root), so the request is made unique to force a fresh read.
    const cacheBuster = Date.now().toString();

    return this.http.get<AppConfig>('assets/config/development.json', {
        params: { v: cacheBuster }
      })
      .toPromise()
      .then((data) => {
        this.config = data!;
      });
  }

  getUrl(name: string): string {
    const found = this.config.urls.find((u) => u.name === name);
    return found ? found.url : '';
  }

getWebsiteUrl(name: string): string {
  return this.config.costingUrl + this.getUrl(name); 
}

getUploadsUrl(): string {
  return this.config.uploadsUrl;
}

getUploadUrl(filename: string): string {
  return this.config.uploadsUrl + filename;
}

}
