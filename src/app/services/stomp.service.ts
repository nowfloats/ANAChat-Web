import { Injectable } from '@angular/core';

import * as SockJS from 'sockjs-client';
import * as StompJS from 'stompjs';

import { ChatMessageVM, MessageStatus } from '../models/ana-chat-vm.models';
import { ANAChatMessage } from '../models/ana-chat.models';
import { UtilitiesService } from '../services/utilities.service';
import { SimulatorService } from '../services/simulator.service';

@Injectable()
export class StompService {
	public config: StompConfig;
	private client: StompJS.Client;
	private sockInstance: any;
	private timer: NodeJS.Timer;
	private stompHeaders: any = {};

	connectionStatus: StompConnectionStatus;

	constructor(private sim: SimulatorService) { }

	public connect(config?: StompConfig) {
		this.clearTimer();

		this.configure(config);

		if (!this.client)
			throw Error('Client not configured!');

		this.debug('Connecting...');
		this.connectionStatus = StompConnectionStatus.Connecting;
		let headers: any = { user_id: this.config.customerId };
		this.client.connect(headers, this.onConnect, this.onError);
	}
	private clearTimer() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}
	private disconnect() {
		this.clearTimer();
		if (this.client && this.client.connected) {
			this.client.disconnect(() => this.debug("WebSocket Disconnected"));
		}
	}

	private debug = (...args: any[]) => {
		if (console && console.log && console.log.apply && this.config && this.config.debug)
			console.log.apply(console, args);
	}

	configure(config?: StompConfig) {
		if (config === null && this.config === null)
			throw Error('No configuration provided!');

		if (config != null)
			this.config = config;

		this.sockInstance = new SockJS(this.config.endpoint);
		this.client = StompJS.over(this.sockInstance);
		this.connectionStatus = StompConnectionStatus.Disconnected;
		this.client.debug = (this.config.debug || this.config.debug == null ? this.debug : null);
	}
	//Should be an arrow function to follow class context
	private onConnect = (frame: StompJS.Frame) => {
		this.clearTimer();

		if (this.connectionStatus == StompConnectionStatus.Connected)
			return;

		try {
			this.subscribe();
			this.connectionStatus = StompConnectionStatus.Connected;

			if (this.handleConnect)
				this.handleConnect();
		} catch (e) {
			this.debug(e);
			this.connectionStatus = StompConnectionStatus.Disconnected;
		}
	}

	private subscribe = () => {
		this.stompHeaders['user_id'] = this.config.customerId;
		let custId = this.stompHeaders['user_id'];

		this.stompHeaders['id'] = UtilitiesService.uuidv4();
		this.client.subscribe('/topic/presence', (message) => {
			this.client.send("/app/presence", this.stompHeaders, JSON.stringify({ user_id: custId }));
		}, this.stompHeaders);

		//Header: Id should be different for different subscription
		this.stompHeaders['id'] = UtilitiesService.uuidv4();
		this.client.subscribe('/topic/chat/customer/' + custId + "/business/" + this.config.businessId, (message) => {
			this.onMessage(JSON.parse(message.body));
		}, this.stompHeaders);

		this.stompHeaders['id'] = UtilitiesService.uuidv4();
		this.client.subscribe('/queue/events/user/' + custId, (message) => {
			this.onAck(message.headers['tid']);
		}, this.stompHeaders);
	}

	private onError = (error: string | StompJS.Message) => {
		this.connectionStatus = StompConnectionStatus.Disconnected;

		if (typeof error === 'object')
			error = error.body;

		if (this.config && this.config.debug)
			this.debug('Socket Error: ' + JSON.stringify(error));

		this.debug(`Error: ${error}`);
		if (error.indexOf('Lost connection') !== -1)
			this.delayReconnect(5000);
	}

	private delayReconnect(t: number) {
		this.debug(`Reconnecting in ${t / 1000} second(s)...`);
		this.timer = setTimeout(() => {
			this.connect();
		}, t);
	}

	private onAck = (msgAckId: string) => {
		this.debug("Ack Msg Id: " + msgAckId);
		if (this.handleAck)
			this.handleAck(msgAckId);
	};

	private msgsIds: string[] = [];
	private onMessage = (messageBody: any) => {
		if (this.handleMessageReceived) {
			let anaMsg = new ANAChatMessage(messageBody);
			if (this.msgsIds.indexOf(anaMsg.meta.id) == -1) { //handle message only if it is not already handled
				this.msgsIds.push(anaMsg.meta.id);
				this.handleMessageReceived(anaMsg);
			}
		}
	}

	sendMessage(message: ANAChatMessage, threadMsgRef: ChatMessageVM) {
		if (UtilitiesService.simulatorModeSettings) { //Simulator mode
			this.sim.sendMessage(message, threadMsgRef);
		} else {
			let _sendMessage = () => {
				let msg = message.extract();

				this.debug("Sent Socket Message: ");
				this.debug(msg);

				let headers = this.stompHeaders;
				headers['tid'] = threadMsgRef.messageAckId;
				this.client.send(`/app/message`, headers, JSON.stringify(msg));
				threadMsgRef.status = MessageStatus.SentToServer;
				threadMsgRef.startTimeoutTimer();
			};
			threadMsgRef.retrySending = _sendMessage; //Saving the context to be used for retrying in case of failure
			_sendMessage();
		}
		
	}

	handleConnect: () => void;
	handleMessageReceived: (message: ANAChatMessage) => any;
	handleAck: (messageAckId: string) => any;
}

export interface StompConfig {
	endpoint: string;
	customerId: string;
	businessId: string;
	debug: boolean;
}

export enum StompConnectionStatus {
	None,
	Connected,
	Disconnected,
	Connecting
}
