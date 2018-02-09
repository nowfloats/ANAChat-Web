import { Injectable } from '@angular/core';

import { ANATime, ANADate, ANAMeta, SenderType, GeoLoc, MediaType, AddressInput } from '../models/ana-chat.models';
import { GoogleMapsConfig } from '../models/google-maps-config.model';
import { AppSettings, BrandingConfig, AppConfig, ThirdPartyConfig } from '../models/ana-config.models';
@Injectable()
export class UtilitiesService {
	static googleMapsConfigRef: GoogleMapsConfig = { apiKey: '' };
	static settings: AppSettings;

	constructor() { }

	static uuidv4() {
		return (<any>[1e7] + -1e3 + -4e3 + -8e3 + -1e11).toString().replace(/[018]/g,
			c => (<any>c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> <any>c / 4).toString(16)
		)
	}

	static anaDateDisplay(anaDate: ANADate) {
		return `${parseInt(anaDate.mday)}-${parseInt(anaDate.month)}-${parseInt(anaDate.year)}`;
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
		let hr = parseInt(anaTime.hour);
		let min = parseInt(anaTime.minute);

		var hours: any = hr > 12 ? hr - 12 : hr;
		var am_pm = hr >= 12 ? "PM" : "AM";
		hours = hours < 10 ? "0" + hours : hours;
		var minutes = min < 10 ? "0" + min : min;

		return hours + ":" + minutes + " " + am_pm;
	}

	static getReplyMeta(srcMeta: ANAMeta, copyId?: boolean) {
		let replyMeta: ANAMeta = {
			id: copyId ? srcMeta.id : this.uuidv4(),
			recipient: srcMeta.sender,
			responseTo: srcMeta.id,
			sender: srcMeta.recipient,
			senderType: SenderType.USER,
			sessionId: srcMeta.sessionId,
			flowId: srcMeta.flowId,
			previousFlowId: srcMeta.previousFlowId,
			currentFlowId: srcMeta.currentFlowId,
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

	static pad(number: number, width: number, z = '0') {
		let n = number + '';
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	}
}

export class Config {
	static emailRegex: RegExp = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
	static phoneRegex: RegExp = /^\+?\d{6,15}$/;
	static numberRegex: RegExp = /^[0-9]*\.?[0-9]+$/;

	static consecutiveErrorsThreshold = 5;
	static consecutiveErrorsMessageText = "Uh oh, seems like you've lost your internet connection";
	static consecutiveErrorsMessageAckId = "CONSECUTIVE_ERRORS_MESSAGE";

	static simulatorBusinessId = 'ana-studio';
	static simulatorCustomerId = 'ana-simulator';
}
