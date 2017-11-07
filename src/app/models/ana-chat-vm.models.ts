import { ElementRef } from '@angular/core';
import { MdDialog } from '@angular/material';

import * as models from './ana-chat.models';
import { UtilitiesService, Config } from '../services/utilities.service';
import { StompService } from '../services/stomp.service';
import { APIService } from '../services/api.service';
import { ComplexInputComponent, ComplexType, ComplexInputParams } from '../components/complex-input/complex-input.component';

export enum Direction {
	Incoming,
	Outgoing
}
export enum MessageStatus {
	None, SentToServer, ReceivedAtServer, SentTimeout
}
export class ChatMessageVM {
	direction: Direction;
	time: Date;
	messageData: models.ANAMessageData;
	meta: models.ANAMeta;
	messageAckId: string;
	status: MessageStatus;

	private timeoutTimer: NodeJS.Timer;
	startTimeoutTimer() {
		this.timeoutTimer = setTimeout(() => {
			if (this.status != MessageStatus.ReceivedAtServer)
				this.status = MessageStatus.SentTimeout;
		}, 2000);
	}

	clearTimeoutTimer() {
		clearTimeout(this.timeoutTimer);
		this.timeoutTimer = undefined;
	}

	executeRetry() {
		if (this.retrySending)
			this.retrySending();
	}

	retrySending: () => void;

	simpleMessageData() {
		return this.messageData as models.SimpleMessageData;
	}
	carouselMessageData() {
		return this.messageData as models.CarouselMessageData;
	}
	getMessageContentType(): models.MessageContentType {
		if (this.messageData.type == models.MessageType.SIMPLE) {
			var simple = this.simpleMessageData();
			if (simple.content.typing)
				return models.MessageContentType.Typing;
			if (simple.content.media)
				return models.MessageContentType.Media;
			else if (simple.content.text)
				return models.MessageContentType.Text;
			else
				return null;
		}
		return null;
	}

	constructor(chatMessage: models.ANAChatMessage, direction: Direction, ackId: string, status?: MessageStatus) {
		this.direction = direction;
		this.time = new Date(chatMessage.meta.timestamp);
		this.meta = chatMessage.meta;
		this.messageData = chatMessage.data;

		this.status = status || MessageStatus.None;
		this.messageAckId = ackId;
	}
}

export class ChatThreadVM {

	constructor() {
		this.messages = [];
	}

	chatThreadView: HTMLDivElement;
	messages: ChatMessageVM[];

	addTextIncoming(text: string, ackId: string) {
		let msg = new ChatMessageVM(new models.ANAChatMessage({
			"meta": {
				"timestamp": new Date().getTime(),
			},
			"data": {
				"type": models.MessageType.SIMPLE,
				"content": {
					"text": text,
				}
			}
		}), Direction.Incoming, ackId);

		this.addMessage(msg);
		return msg;
	}

	addTextReply(text: string, ackId: string) {
		if (!text) return null;
		let msg = new ChatMessageVM(new models.ANAChatMessage({
			"meta": {
				"timestamp": new Date().getTime(),
			},
			"data": {
				"type": models.MessageType.SIMPLE,
				"content": {
					"text": text,
				}
			}
		}), Direction.Outgoing, ackId);

		this.addMessage(msg);
		return msg;
	}
	typingTimerId: NodeJS.Timer;
	setTyping() {
		if (this.typingTimerId)
			clearTimeout(this.typingTimerId);
		this.removeTyping();
		let msg = new ChatMessageVM(new models.ANAChatMessage({
			"meta": {
				"timestamp": new Date().getTime(),
			},
			"data": {
				"type": models.MessageType.SIMPLE,
				"content": {
					"typing": true
				}
			}
		}), Direction.Incoming, '');

		this.addMessage(msg);
	}

	removeTyping() {
		let index = this.messages.findIndex(x => x.getMessageContentType() == models.MessageContentType.Typing);
		if (index != -1) {
			this.messages.splice(index, 1);
			if (this.typingTimerId)
				clearTimeout(this.typingTimerId);
		}
	}

	addMediaReply(media: models.SimpleMedia, text: string = '', ackId: string) {
		let msg = new ChatMessageVM(new models.ANAChatMessage({
			"meta": {
				"timestamp": new Date().getTime(),
			},
			"data": {
				"type": models.MessageType.SIMPLE,
				"content": {
					"text": text,
					"media": media,
				}
			}
		}), Direction.Outgoing, ackId);

		this.addMessage(msg);
		return msg;
	}

	addMessage(chatMsgVM: ChatMessageVM) {
		this.removeTyping();
		this.messages.push(chatMsgVM);
		//Sorting the messages based on timestamp. Currently disabled.
		//this.messages.sort((x, y) => x.meta.timestamp - y.meta.timestamp);
		this.scrollLastIntoView();
	}

	scrollLastIntoView(t: number = 100) {
		if (this.chatThreadView)
			setTimeout(() => this.chatThreadView.children.item(this.chatThreadView.children.length - 1).scrollIntoView({ behavior: 'smooth' }), t);
	}
}

export class ChatInputItemVM {
	content: models.InputContent;
	data: models.ANAMessageData;
	meta: models.ANAMeta;
	disabled: boolean;
	textInputContent() {
		return this.content as models.TextInputContent;
	}

	constructor(message: models.ANAChatMessage) {
		this.data = message.data;
		this.content = message.inputData().content;
		this.content.input = {};
		this.meta = message.meta;
		this.disabled = false;
	}
}
export class ChatInputVM {
	constructor(
		public dialog: MdDialog,
		public chatThread: ChatThreadVM,
		public stompService: StompService,
		public apiService: APIService) { }

	setInput(chatInputItemVM: ChatInputItemVM) {
		if (this.textInput)
			this.textInput.disabled = true;

		if (this.inputCategory(chatInputItemVM) == models.InputCategory.Text) {
			let a = (chatInputItemVM.content as models.TextInputContent);
			if (a.textInputAttr && a.textInputAttr.defaultText)
				a.input.val = a.textInputAttr.defaultText;

			this.textInput = chatInputItemVM;
		} else if (this.inputCategory(chatInputItemVM) == models.InputCategory.Click) {
			this.clickInput = chatInputItemVM;
			if (chatInputItemVM.content.mandatory == models.Bool.FALSE) {
				this.textInput = this.textInputForNonMandatoryCase(chatInputItemVM.meta);
			} else
				this.textInput = undefined;
		}

		this.chatThread.scrollLastIntoView(300);
	}

	textInputForNonMandatoryCase(srcMeta: models.ANAMeta) {
		let anaMeta: models.ANAMeta = {
			id: "",
			sender: {
				id: this.stompService.config.businessId,
				medium: 3,
			},
			recipient: {
				id: this.stompService.config.customerId,
				medium: 3
			},
			responseTo: srcMeta ? srcMeta.id : '',
			senderType: models.SenderType.USER,
			sessionId: srcMeta ? srcMeta.sessionId : '',
			timestamp: srcMeta ? srcMeta.timestamp : new Date().getTime()
		};
		let input = new ChatInputItemVM(new models.ANAChatMessage({
			meta: anaMeta,
			data: {
				type: models.MessageType.INPUT,
				content: {
					inputType: 0,
					mandatory: 1,
					textInputAttr: {
						multiLine: 1,
						minLength: 0,
						maxLength: 400,
						defaultText: "",
						placeHolder: "Type a message..."
					},
					input: {
						val: "",
					}
				}
			}
		}));
		return input;
	}

	textInput: ChatInputItemVM = undefined;
	clickInput: ChatInputItemVM = undefined;

	inputCategory(inputVM: ChatInputItemVM): models.InputCategory {
		switch (inputVM.content.inputType) {
			case models.InputType.TEXT:
			case models.InputType.EMAIL:
			case models.InputType.NUMERIC:
			case models.InputType.PHONE:
				return models.InputCategory.Text;
			default:
				return models.InputCategory.Click;
		}
	}

	handleClick(inputVM: ChatInputItemVM) {
		if (!this.isInputValid(inputVM)) {
			let errorMsg = this.inputErrorMsg(inputVM);
			let lastMsg = this.chatThread.messages[this.chatThread.messages.length - 1];
			if (lastMsg.direction == Direction.Incoming && lastMsg.messageAckId == "ERROR_MSG" && lastMsg.simpleMessageData().content.text == errorMsg)
				return; //Skip if already error message is added with the same msg text.

			//alert(this.inputErrorMsg(inputVM));
			switch (inputVM.content.inputType) {
				case models.InputType.TEXT:
				case models.InputType.EMAIL:
				case models.InputType.PHONE:
				case models.InputType.NUMERIC:
					{
						let modifieldInputContent = inputVM.content as models.TextInputContent;
						this.chatThread.addTextReply(modifieldInputContent.input.val, "");
						break;
					}
			}
			this.chatThread.addTextIncoming(errorMsg, "ERROR_MSG");
			return;
		}
		this.resetInputs();
		let ackId = UtilitiesService.uuidv4();
		switch (inputVM.content.inputType) {
			case models.InputType.TEXT:
			case models.InputType.EMAIL:
			case models.InputType.PHONE:
			case models.InputType.NUMERIC:
				{
					let modifieldInputContent = inputVM.content as models.TextInputContent;
					let msg = this.chatThread.addTextReply(modifieldInputContent.input.val, ackId);
					this.stompService.sendMessage(new models.ANAChatMessage({
						meta: UtilitiesService.getReplyMeta(inputVM.meta),
						data: { type: inputVM.data.type, content: modifieldInputContent }
					}), msg);
					break;
				}
			case models.InputType.ADDRESS:
				{
					let modifieldInputContent = inputVM.content as models.AddressInputContent;

					let dialogRef = this.dialog.open(ComplexInputComponent, {
						width: 'auto',
						data: {
							Type: ComplexType.Address
						}
					});
					dialogRef.afterClosed().subscribe(result => {
						if (result != true) return;
						let userAddressInput = dialogRef.componentInstance.givenAddress;
						let msg = this.chatThread.addTextReply(`${[userAddressInput.line1, userAddressInput.area, userAddressInput.city, userAddressInput.state, userAddressInput.country, userAddressInput.pin].filter(x => x).join(", ")}`, ackId);
						modifieldInputContent.input = userAddressInput;
						this.stompService.sendMessage(new models.ANAChatMessage({
							meta: UtilitiesService.getReplyMeta(inputVM.meta),
							data: { type: inputVM.data.type, content: modifieldInputContent }
						}), msg);
					});
					break;
				}
			case models.InputType.LOCATION:
				{
					let locInputData = inputVM.content as models.LocationInputContent;

					let geoLoc: models.GeoLoc = locInputData.defaultLocation;
					if (!geoLoc) {
						if (navigator.geolocation) {
							navigator.geolocation.getCurrentPosition((pos) => {
								let loc: models.GeoLoc = {
									lat: pos.coords.latitude,
									lng: pos.coords.longitude
								}
								this.showLocationPickerDialog(locInputData, inputVM.meta, inputVM.data.type, ackId, loc);
							}, err => {
								this.showLocationPickerDialog(locInputData, inputVM.meta, inputVM.data.type, ackId);
							});
						}
					} else
						this.showLocationPickerDialog(locInputData, inputVM.meta, inputVM.data.type, ackId, geoLoc);
					break;
				}
			case models.InputType.MEDIA:
				{
					let mediaInputContent = inputVM.content as models.MediaInputContent;
					let input = document.createElement('input');
					input.type = 'file';
					if (mediaInputContent.mediaType != models.MediaType.FILE)
						input.accept = `${models.MediaType[mediaInputContent.mediaType]}/*`;
					input.multiple = false;
					input.onchange = () => {
						if (input.files) {
							let f = input.files[0];
							this.apiService.uploadFile(f).subscribe(resp => {
								if (resp.links) {
									let assetUrl = resp.links[0].href;
									let assetType: models.MediaType;
									if (f.type.startsWith('image')) {
										assetType = models.MediaType.IMAGE;
									} else if (f.type.startsWith('video')) {
										assetType = models.MediaType.VIDEO;
									} else if (f.type.startsWith('audio')) {
										assetType = models.MediaType.AUDIO;
									} else {
										assetType = models.MediaType.FILE;
									}
									let media: models.SimpleMedia = {
										previewUrl: assetUrl,
										type: assetType,
										url: assetUrl
									};
									let msg = this.chatThread.addMediaReply(media, '', ackId);
									mediaInputContent.input.media = [media];
									this.stompService.sendMessage(new models.ANAChatMessage({
										meta: UtilitiesService.getReplyMeta(inputVM.meta),
										data: { type: inputVM.data.type, content: mediaInputContent }
									}), msg);
								}
								else
									alert("Error occurred while sending the file!");
							}, err => {
								alert("Unable to send file!");
							});
						}
					}
					input.click();
					break;
				}
			case models.InputType.LIST:
				{
					let listInputContent = inputVM.content as models.ListInputContent;
					let dialogRef = this.dialog.open(ComplexInputComponent, {
						width: 'auto',
						data: {
							Type: ComplexType.List,
							ListValues: listInputContent.values,
							ListMultiple: listInputContent.multiple
						}
					});
					dialogRef.afterClosed().subscribe(result => {
						if (result != true) return;
						let selectedListItems = dialogRef.componentInstance.choosenListValues();
						let msg = this.chatThread.addTextReply(selectedListItems.map(x => x.text).join(', '), ackId);
						listInputContent.input.val = selectedListItems.map(x => x.value).join(',');
						this.stompService.sendMessage(new models.ANAChatMessage({
							meta: UtilitiesService.getReplyMeta(inputVM.meta),
							data: { type: inputVM.data.type, content: listInputContent }
						}), msg);
					});
					break;
				}
			case models.InputType.TIME:
				{
					let timeContent = inputVM.content as models.TimeInputContent;

					let dialogRef = this.dialog.open(ComplexInputComponent, {
						width: 'auto',
						data: {
							Type: ComplexType.Time
						}
					});
					dialogRef.afterClosed().subscribe(result => {
						if (result != true) return;

						let userInputTime = dialogRef.componentInstance.getChoosenANATime();
						let displayTime = UtilitiesService.anaTimeDisplay(userInputTime);
						let msg = this.chatThread.addTextReply(displayTime, ackId);
						timeContent.input.time = userInputTime;
						this.stompService.sendMessage(new models.ANAChatMessage({
							meta: UtilitiesService.getReplyMeta(inputVM.meta),
							data: { type: inputVM.data.type, content: timeContent }
						}), msg);
					});
					break;
				}
			case models.InputType.DATE:
				{
					let dateContent = inputVM.content as models.DateInputContent;

					let dialogRef = this.dialog.open(ComplexInputComponent, {
						width: 'auto',
						data: {
							Type: ComplexType.Date
						}
					});
					dialogRef.afterClosed().subscribe(result => {
						if (result != true) return;
						let userInputDate = dialogRef.componentInstance.getChoosenANADate();
						let displayDate = UtilitiesService.anaDateDisplay(userInputDate);
						let msg = this.chatThread.addTextReply(displayDate, ackId);
						dateContent.input.date = userInputDate;
						this.stompService.sendMessage(new models.ANAChatMessage({
							meta: UtilitiesService.getReplyMeta(inputVM.meta),
							data: { type: inputVM.data.type, content: dateContent }
						}), msg);
					});
					break;
				}
			case models.InputType.OPTIONS:
				{
					let optionInputContent = inputVM.content as models.OptionsInputContent;
					let msg = this.chatThread.addTextReply(optionInputContent.input.title, ackId);
					this.stompService.sendMessage(new models.ANAChatMessage({
						meta: UtilitiesService.getReplyMeta(inputVM.meta),
						data: { type: inputVM.data.type, content: optionInputContent }
					}), msg);
					break;
				}
			default:
				console.log(`Unsupported button type: ${inputVM.content.inputType}`);
				break;
		}
	}

	handleKeyPress(inputVM: ChatInputItemVM, event: KeyboardEvent) {
		if (event.keyCode == 13) //Enter key
			if (this.inputCategory(inputVM) == models.InputCategory.Text) {
				if (inputVM.textInputContent().input.val)
					this.handleClick(inputVM);
			} else
				this.handleClick(inputVM);
	}
	handleBtnOptionClick(inputVM: ChatInputItemVM, optionVal: string) {
		if (inputVM.content.inputType == models.InputType.OPTIONS) {
			let x = inputVM.content as models.OptionsInputContent;
			let option = x.options.find(y => y.value == optionVal);
			if (!option) {
				alert('Invalid option!');
				return;
			}

			if (option.type == models.ButtonType.URL) {
				let v = JSON.parse(option.value);
				x.input.val = v.value;
				window.open(v.url, '_blank');
			} else
				x.input.val = option.value;

			x.input.title = option.title;
		}
		this.handleClick(inputVM);
	}
	htmlInputType(inputVM: ChatInputItemVM): string {
		switch (inputVM.content.inputType) {
			case models.InputType.TEXT:
			case models.InputType.PHONE:
				return 'text';
			case models.InputType.EMAIL:
				return 'email';
			case models.InputType.NUMERIC:
				return 'number';
			default:
				return 'text';
		}
	}
	isInputValid(inputVM: ChatInputItemVM) {
		switch (inputVM.content.inputType) {
			case models.InputType.TEXT:
				{
					let x = inputVM.content as models.TextInputContent;
					if (!x.input.val)
						return false;
					if (x.textInputAttr) {
						if (x.textInputAttr.minLength > 0 && x.input.val.length < x.textInputAttr.minLength)
							return false;
						if (x.textInputAttr.maxLength > 0 && x.input.val.length > x.textInputAttr.maxLength)
							return false;
					}
					return true;
				}
			case models.InputType.EMAIL:
				{
					let x = inputVM.content as models.TextInputContent;
					return x.input.val && x.input.val.match(Config.emailRegex);
				}
			case models.InputType.PHONE:
				{
					let x = inputVM.content as models.TextInputContent;
					return x.input.val && x.input.val.match(Config.phoneRegex);
				}
			case models.InputType.NUMERIC:
				{
					let x = inputVM.content as models.TextInputContent;
					return x.input.val && x.input.val.match(Config.numberRegex);
				}
			case models.InputType.ADDRESS:
			case models.InputType.LOCATION:
			case models.InputType.MEDIA:
			case models.InputType.LIST:
				{
					//These are validated in the complex input dialog itself.
					return true;
				}
			case models.InputType.TIME:
				{
					let x = inputVM.content as models.TimeInputContent;
					return x.input.time;
				}
			case models.InputType.DATE:
				{
					let x = inputVM.content as models.DateInputContent;
					return x.input.date;
				}
			case models.InputType.OPTIONS:
				{
					let x = inputVM.content as models.OptionsInputContent;
					return x.input.val;
				}
			default:
				console.log(`Unsupported button type: ${inputVM.content.inputType}`);
				break;
		}
	}
	inputErrorMsg(inputVM: ChatInputItemVM) {
		switch (inputVM.content.inputType) {
			case models.InputType.EMAIL:
				return 'Please give a valid email address';
			case models.InputType.NUMERIC:
				return 'Please give a valid number';
			case models.InputType.PHONE:
				return 'Please give a valid phone number';
			case models.InputType.TEXT:
				{
					let c = inputVM.textInputContent();
					if (!c.input.val)
						return "The value cannot be empty";
					if (c.input.val && c.input.val.length < c.textInputAttr.minLength)
						return `Minimum ${c.textInputAttr.minLength} characters required.`;
					else if (c.input.val && c.input.val.length > c.textInputAttr.maxLength)
						return `Maximum ${c.textInputAttr.maxLength} characters allowed.`;
				}
			default:
				return 'The value cannot be empty!';
		}
	}
	resetInputs() {
		this.textInput = undefined;
		this.clickInput = undefined;
	}

	showLocationPickerDialog(locInputContent: models.LocationInputContent, inputMeta: models.ANAMeta, inputMessageType: models.MessageType, ackId: string, defaultLoc?: models.GeoLoc) {
		let dialogRef = this.dialog.open(ComplexInputComponent, {
			width: 'auto',
			data: {
				Type: ComplexType.Location,
				DefaultGeoLoc: defaultLoc
			}
		});
		dialogRef.afterClosed().subscribe(result => {
			if (result != true) return;

			let userInputLoc = dialogRef.componentInstance.geoLoc;
			let gMapUrl = UtilitiesService.googleMapsStaticLink(userInputLoc);
			let msg = this.chatThread.addMediaReply({
				previewUrl: gMapUrl,
				type: models.MediaType.IMAGE,
				url: gMapUrl
			}, "Location", ackId);
			locInputContent.input.location = userInputLoc;
			this.stompService.sendMessage(new models.ANAChatMessage({
				meta: UtilitiesService.getReplyMeta(inputMeta),
				data: { type: inputMessageType, content: locInputContent }
			}), msg);
		});
	}
}

export class ModelHelpers {
	constructor() { }

	Direction = Direction;
	MessageStatus = MessageStatus;
	MessageType = models.MessageType;
	MessageContentType = models.MessageContentType;
	MediaType = models.MediaType;
	InputType = models.InputType;
}