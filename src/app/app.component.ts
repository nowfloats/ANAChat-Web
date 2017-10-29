import { Component } from '@angular/core';
import { LazyMapsAPILoader, LAZY_MAPS_API_CONFIG, LazyMapsAPILoaderConfigLiteral } from '@agm/core';
import { ActivatedRoute } from '@angular/router';
import { AppConfig, AppSettings, BrandingConfig, ThirdPartyConfig } from './models/ana-config.models';
import { StompConfig, StompService } from './services/stomp.service';
import { APIService } from './services/api.service';
import { UtilitiesService } from './services/utilities.service';
import { MatCSSService } from './services/mat-css.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	constructor(
		private route: ActivatedRoute,
		private apiService: APIService,
		private stomp: StompService,
		private utils: UtilitiesService,
		private matCSS: MatCSSService) {
		this.route.queryParams.subscribe(params => {
			if (params['s']) {
				let settings = JSON.parse(atob(params['s'])) as AppSettings;
				if (settings.stompConfig && settings.stompConfig.debug)
					console.log(settings);
				this.setAppSettings(settings);
			}
		});
	}

	setAppSettings(settings: AppSettings) {
		if (settings.brandingConfig) {
			UtilitiesService.settings = settings;
			this.getCustomStyle(settings.brandingConfig.primaryBackgroundColor, settings.brandingConfig.secondaryBackgroundColor, settings.brandingConfig.primaryForegroundColor, settings.brandingConfig.frameContentWidth);
		}
		if (settings.thirdPartyConfig && UtilitiesService.googleMapsConfigRef)
			UtilitiesService.googleMapsConfigRef.apiKey = settings.thirdPartyConfig.googleMapsKey;
		if (settings.appConfig)
			this.apiService.fileUploadEndpoint = settings.appConfig.fileUploadEndpoint;
		if (settings.stompConfig)
			this.stomp.connect(settings.stompConfig);
	}

	getCustomStyle(accent: string = undefined, secondary: string = undefined, accentFG: string = undefined, contentWidth: string = undefined) {
		const ANA_CUSTOM_STYLE = 'ana-custom-style';
		let customStyle = document.getElementById(ANA_CUSTOM_STYLE) as HTMLStyleElement;
		if (!customStyle) {
			customStyle = document.createElement('style');
			customStyle.id = ANA_CUSTOM_STYLE;
			document.head.appendChild(customStyle);
		}

		let appCSS = `/*Dynamic styles*/
.chat-message-item.incoming {
  border-left-color: ${accent || '#8cc83c'};
}

.incoming > .chat-stub {
  border-top-color: ${accent || '#8cc83c'};
}

.carousel-item-button:first-child,
.chat-input button.btn-icon {
  color: ${accent || '#8cc83c'};
}

.chat-input button.btn-click {
  background-color: ${accent || '#8cc83c'};
  color: ${accentFG || 'white'};
}

.chat-message-item.outgoing {
  border-right-color: ${secondary || 'black'};
}

.outgoing > .chat-stub {
  border-top-color: ${secondary || 'black'};
}

.complex-input-btn-done {
  color: ${accentFG || 'white'} !important;
}

.content {
  width: 100vw;
}

.ana-title {
  background-color: ${accent || '#8cc83c'};
  color: ${accentFG || 'white'};
}

.ana-logo > img {
  background-color: ${accentFG || 'white'};
  border: 2px solid ${accentFG || 'white'};
}

.ana-min .ana-minmax-btn {
  border: 2px solid ${accentFG || 'white'};
}

.ana-minmax-btn {
  background-color: ${accentFG || 'white'};
}

.typing-indicator span{
  background-color: ${accent || '#8cc83c'};
}

`;
		this.matCSS.loadCustomMatTheme(accent, customStyle, appCSS);
	}
}