import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map'

import { ANATime, ANADate, ANAMeta, SenderType } from '../models/ana-chat.models';
import { StompConfig } from './stomp.service';
import { AppConfig } from '../models/ana-config.models';

@Injectable()
export class APIService {
    public fileUploadEndpoint: string;
    constructor(public http: Http) { }

    uploadFile(file: File) {
        let formData = new FormData();
        formData.append("file", file);
        let headers = new Headers();
        return this.http.post(this.fileUploadEndpoint, formData, { headers }).map(res => res.json() as UploadFileResponse);
    }
}

export interface Link {
    rel: string;
    href: string;
}

export interface UploadFileResponse {
    data: boolean;
    links: Link[];
}
