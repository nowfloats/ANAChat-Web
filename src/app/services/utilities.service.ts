import { Injectable } from '@angular/core';
import * as moment from 'moment';

import { ANATime, ANADate, ANAMeta, SenderType, GeoLoc, MediaType, AddressInput } from '../models/ana-chat.models';
import { GoogleMapsConfig } from '../models/google-maps-config.model';
import { AppSettings, BrandingConfig, AppConfig, ThirdPartyConfig } from '../models/ana-config.models';
@Injectable()
export class UtilitiesService {
	static googleMapsConfigRef: GoogleMapsConfig = { apiKey: '' };
	static settings: AppSettings;
	static simulatorBusinessId = 'ana-studio';
	static simulatorCustomerId = 'ana-simulator';
	constructor() { }

	static uuidv4() {
		return (<any>[1e7] + -1e3 + -4e3 + -8e3 + -1e11).toString().replace(/[018]/g,
			c => (<any>c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> <any>c / 4).toString(16)
		)
	}

	static anaDateDisplay(anaDate: ANADate) {
		return moment({
			year: parseInt(anaDate.year),
			month: parseInt(anaDate.month) - 1,
			day: parseInt(anaDate.mday)
		}).format("MM-DD-YYYY");
	}
	static anaDateToDate(anaDate: ANADate) {
		return new Date(parseInt(anaDate.year), parseInt(anaDate.month) - 1, parseInt(anaDate.mday));
	}
	static anaTimeToDate(anaTime: ANATime) {
		let d = new Date();
		d.setHours(parseInt(anaTime.hour), parseInt(anaTime.minute), parseInt(anaTime.second));
		return d;
	}
	static anaTimeDisplay(anaTime: ANATime) {
		return this.timeDisplay(`${anaTime.hour}:${anaTime.minute}:${anaTime.second}`);
	}

	static timeDisplay(time: any) {
		// Check correct time format and split into components
		time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

		if (time.length > 1) { // If time format correct
			time = time.slice(1);  // Remove full string match value
			time[5] = +time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
			time[0] = +time[0] % 12 || 12; // Adjust hours
		}
		return time.join(''); // return adjusted time or original string
	}

	static getReplyMeta(srcMeta: ANAMeta) {
		let replyMeta: ANAMeta = {
			id: this.uuidv4(),
			recipient: srcMeta.sender,
			responseTo: srcMeta.id,
			sender: srcMeta.recipient,
			senderType: SenderType.USER,
			sessionId: srcMeta.sessionId,
			timestamp: new Date().getTime()
		};
		return replyMeta;
	}

	static googleMapsStaticLink(latLng: GeoLoc) {
		return `https://maps.googleapis.com/maps/api/staticmap?center=${latLng.lat},${latLng.lng}&zoom=13&size=300x150&maptype=roadmap&markers=color:red|label:A|${latLng.lat},${latLng.lng}&key=${UtilitiesService.googleMapsConfigRef.apiKey}`;
	}

	static getAnaMediaTypeFromMIMEType(mimeType: string) {
		let assetType: MediaType;
		if (mimeType.startsWith('image'))
			assetType = MediaType.IMAGE;
		else if (mimeType.startsWith('video'))
			assetType = MediaType.VIDEO;
		else if (mimeType.startsWith('audio'))
			assetType = MediaType.AUDIO;
		else
			assetType = MediaType.FILE;
		return assetType;
	}

	static anaAddressDisplay(anaAddress: AddressInput) {
		return [anaAddress.line1, anaAddress.area, anaAddress.city, anaAddress.state, anaAddress.country, anaAddress.pin].filter(x => x).join(", ");
	}
}

export class Config {
	static emailRegex: RegExp = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
	static phoneRegex: RegExp = /^\+?\d{6,15}$/;
	static numberRegex: RegExp = /^[0-9]*\.?[0-9]+$/;
}
