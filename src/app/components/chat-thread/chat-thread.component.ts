import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewChildren } from '@angular/core';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import * as StompJS from 'stompjs';
import * as SockJS from 'sockjs-client';

import * as models from '../../models/ana-chat.models';
import * as config from '../../models/ana-config.models';
import * as vm from '../../models/ana-chat-vm.models';
import { StompService, StompConfig, StompConnectionStatus } from '../../services/stomp.service';
import { APIService } from '../../services/api.service';
import { UtilitiesService } from '../../services/utilities.service';
import { ChainDelayService } from '../../services/chain-delay.service';
@Component({
	selector: 'app-chat-thread',
	templateUrl: './chat-thread.component.html',
	styleUrls: ['./chat-thread.component.css']
})
export class ChatThreadComponent implements OnInit, AfterViewInit {

	ngAfterViewInit() {
		if (this.chatThreadView)
			this.chatThread.chatThreadView = this.chatThreadView.nativeElement;
	}

	constructor(
		private stompService: StompService,
		private apiService: APIService,
		private dialog: MdDialog,
		private chainDelayService: ChainDelayService) {

		this.chatThread = new vm.ChatThreadVM();
		this.chatInput = new vm.ChatInputVM(this.dialog, this.chatThread, this.stompService, this.apiService);
	}
	@ViewChild("inputContainer")
	inputContainerRef: ElementRef;

	@ViewChild("chatThreadView")
	chatThreadView: ElementRef;

	@ViewChildren("carouselContainer")
	carouselContainers: ElementRef[];

	chatThread: vm.ChatThreadVM;
	chatInput: vm.ChatInputVM;
	settings: config.AppSettings;
	isMin: boolean = false;

	connectionStatusMessage() {
		if (!this.stompService)
			return '';
		switch (this.stompService.connectionStatus) {
			case StompConnectionStatus.Connected:
				return '- Available';
			case StompConnectionStatus.Connecting:
				return '- Trying to connect...';
			case StompConnectionStatus.Disconnected:
				return '- Not available';
			default:
				return '';
		}
	}
	setMin(min: boolean) {
		this.isMin = min;
	}
	scrollCarousel(carId: string, direction: string) {
		if (this.carouselContainers && this.carouselContainers.length > 0) {
			let carousels = this.carouselContainers.map(x => x.nativeElement as HTMLDivElement).filter(x => x.classList.contains(carId));
			if (carousels) {
				let car = carousels[0];
				if (direction == 'right')
					car.scrollBy({ behavior: 'smooth', left: 245 }); //The 'left' value should be the width + margin of a single carousel item set in the CSS
				else if (direction == 'left')
					car.scrollBy({ behavior: 'smooth', left: -245 });
			}
		}
	}

	canScrollCarousel(carId: string, direction: string) {
		return true;
		//Below implementation is not accurate.

		//if (this.carouselContainers && this.carouselContainers.length > 0) {
		//    let carousels = this.carouselContainers.map(x => x.nativeElement as HTMLDivElement).filter(x => x.classList.contains(carId));
		//    if (carousels) {
		//        let car = carousels[0];
		//        if (direction == 'right')
		//            return car.scrollLeft < car.scrollWidth;
		//        else if (direction == 'left')
		//            return car.scrollLeft > 0;
		//    }
		//}
	}

	isLastInMessageGroup(msg: vm.ChatMessageVM) {
		let msgsOnly = this.chatThread.messages.filter(x => x.getMessageContentType() != models.MessageContentType.Typing);
		var index = msgsOnly.indexOf(msg);
		if (index != -1) {
			if (index >= (msgsOnly.length - 1))
				return true;
			if (msgsOnly[index].direction != msgsOnly[index + 1].direction)
				return true;
		}
		return false;
	}
	isLastMessage(msg: vm.ChatMessageVM) {
		let msgsOnly = this.chatThread.messages.filter(x => x.getMessageContentType() != models.MessageContentType.Typing);
		var index = msgsOnly.indexOf(msg);
		return index == msgsOnly.length - 1;
	}
	handleCarouselClick(chatMessage: vm.ChatMessageVM, carOption: models.CarouselOption) {
		let carMsg = chatMessage.carouselMessageData();
		if (!carMsg.content.input)
			carMsg.content.input = {
				val: ""
			};
		if (carOption.type == models.ButtonType.URL) {
			let v = JSON.parse(carOption.value);
			carMsg.content.input.val = v.value;
			window.open(v.url, '_blank');
		} else
			carMsg.content.input.val = carOption.value;

		let msg = this.chatThread.addTextReply(carOption.title, UtilitiesService.uuidv4());
		this.stompService.sendMessage(new models.ANAChatMessage({
			meta: UtilitiesService.getReplyMeta(chatMessage.meta),
			data: carMsg
		}), msg);

		this.chatInput.resetInputs();
	}

	chatTextInputOnFocus() {
		this.chatThread.scrollLastIntoView();
	}

	textInputFocus() {
		let ele = this.inputContainerRef.nativeElement as HTMLDivElement;
		if (ele) {
			setTimeout(() => {
				let inputEle = ele.querySelector('#chat-text') as HTMLInputElement;
				if (inputEle)
					inputEle.focus();
			}, 100);
		}
	}

	MH = new vm.ModelHelpers();
	ngOnInit() {
		this.settings = UtilitiesService.settings;

		this.stompService.handleMessageReceived = (message) => {
			if (this.settings && this.settings.stompConfig && this.settings.stompConfig.debug) {
				console.log("Socket Message Received: ");
				console.log(message);
			}

			switch (message.data.type) {
				case models.MessageType.INPUT:
					{
						this.chainDelayService.delay((queueLength) => {
							this.chatInput.resetInputs(); //Currently only one input item is supported
							this.chatInput.setInput(new vm.ChatInputItemVM(message));
							this.chatThread.removeTyping();
							this.textInputFocus();
						}, 0);
						break;
					}
				case models.MessageType.SIMPLE:
				case models.MessageType.CAROUSEL:
					{
						this.chatThread.setTyping();
						this.chainDelayService.delay((queueLength) => {
							let msg = new vm.ChatMessageVM(message, vm.Direction.Incoming, "");
							this.chatThread.addMessage(msg);

							if (message.data.type == models.MessageType.CAROUSEL) {
								let carItemsWithOptions = msg.carouselMessageData().content.items.filter(x => x.options && x.options.length > 0).length;
								if (carItemsWithOptions > 0) //Hide the fixed input textbox if carousel has options
									this.chatInput.resetInputs();
							}
							if (queueLength > 0)
								this.chatThread.setTyping();
						}, 2000);
						break;
					}
				default:
					console.log(`Unsupported message type: ${models.MessageType[message.data.type]}`);
			}
		};
		this.stompService.handleConnect = () => {
			if (this.chatThread.messages.length <= 0) {
				let firstMsg = new models.ANAChatMessage({
					"meta": {
						"sender": {
							"id": this.stompService.config.businessId,
							"medium": 3
						},
						"recipient": {
							"id": this.stompService.config.customerId,
							"medium": 3
						},
						"senderType": models.SenderType.USER,
						"timestamp": new Date().getTime(),
					},
					"data": {
						"type": 2,
						"content": {
							"inputType": models.InputType.OPTIONS,
							"mandatory": 1,
							"options": [
								{
									"title": "Get Started",
									"value": "GetStarted"
								}
							],
							"input": {
								"val": ""
							}
						}
					}
				});
				let msg = new vm.ChatMessageVM(firstMsg, vm.Direction.Outgoing, UtilitiesService.uuidv4()); //Pseudo, not actually added to thread. 
				this.stompService.sendMessage(new models.ANAChatMessage({
					meta: UtilitiesService.getReplyMeta(firstMsg.meta),
					data: firstMsg.data
				}), msg);
			}
			else {
				//Retrying all pending messages in the chat thread.
				let pendingMsgs = this.chatThread.messages.filter(x => x.status == vm.MessageStatus.SentTimeout || x.status == vm.MessageStatus.SentToServer && x.retrySending);
				pendingMsgs.forEach(x => x.retrySending());
			}
		};
		this.stompService.handleAck = (messageAckId: string) => {
			let msg = this.chatThread.messages.find(x => x.messageAckId == messageAckId);
			if (msg) {
				msg.status = vm.MessageStatus.ReceivedAtServer;
				msg.clearTimeoutTimer();
			}
		};
	}
}