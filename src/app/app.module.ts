import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
	MdDialogModule,
	MdDatepickerModule,
	MdFormFieldModule,
	MdNativeDateModule,
	MdInputModule,
	MdButtonModule,
	MdListModule,
	MdCheckboxModule,
	MdCardModule,
	MdRadioModule,
	MdProgressBarModule
} from '@angular/material';

import { AgmCoreModule, LAZY_MAPS_API_CONFIG } from '@agm/core';

import { AppComponent } from './app.component';
import { ChatThreadComponent } from './components/chat-thread/chat-thread.component';

import { StompService } from './services/stomp.service';
import { APIService } from './services/api.service';
import { UtilitiesService } from './services/utilities.service';
import { SimulatorService } from './services/simulator.service';
import { ComplexInputComponent } from './components/complex-input/complex-input.component';
import { GoogleMapsConfig } from './models/google-maps-config.model';
import { MatCSSService } from './services/mat-css.service';
import { ChainDelayService } from './services/chain-delay.service';
@NgModule({
	declarations: [
		AppComponent,
		ChatThreadComponent,
		ComplexInputComponent
	],
	imports: [
		BrowserModule,
		FormsModule,
		BrowserAnimationsModule,
		MdDialogModule,
		MdDatepickerModule,
		MdFormFieldModule,
		MdNativeDateModule,
		MdInputModule,
		MdButtonModule,
		MdListModule,
		MdCheckboxModule,
		MdCardModule,
		MdRadioModule,
		MdProgressBarModule,
		RouterModule.forRoot([
			{ path: '', component: ChatThreadComponent },
			{ path: '**', redirectTo: '' }
		]),
		HttpModule,
		AgmCoreModule.forRoot()
	],
	providers: [
		StompService,
		UtilitiesService,
		APIService,
		MatCSSService,
		ChainDelayService,
		SimulatorService,
		{ provide: LAZY_MAPS_API_CONFIG, useClass: GoogleMapsConfig }
	],
	bootstrap: [AppComponent],
	entryComponents: [
		ComplexInputComponent
	]
})
export class AppModule { }
