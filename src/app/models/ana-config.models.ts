import { StompConfig } from '../services/stomp.service';

export interface ThirdPartyConfig {
    googleMapsKey: string;
}

export interface AppConfig {
    fileUploadEndpoint: string;
}

export interface BrandingConfig {
    primaryBackgroundColor: string;
    primaryForegroundColor: string;
    secondaryBackgroundColor: string;
    logoUrl: string;
    agentName: string;
    agentDesc: string;
    frameHeight: string;
    frameWidth: string;
    frameContentWidth: string;
}

export interface AppSettings {
    stompConfig?: StompConfig;
    thirdPartyConfig?: ThirdPartyConfig;
    brandingConfig?: BrandingConfig;
    appConfig?: AppConfig;
}
