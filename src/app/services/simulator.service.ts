import { Injectable } from '@angular/core';
import * as cfm from '../models/ana-chatflow.models';
import * as models from '../models/ana-chat.models';
import * as vm from '../models/ana-chat-vm.models';
import { Http, Headers, URLSearchParams } from '@angular/http';
@Injectable()
export class SimulatorService {

	private debug: boolean = false;
	private chatFlow: cfm.ChatNode[] = [];
	private state: SimulatorState;

	constructor(private http: Http) { }

	init(chatFlow: cfm.ChatNode[], debug?: boolean) {
		this.chatFlow = chatFlow;
		if (debug)
			this.debug = debug;

		if (this.chatFlow && this.chatFlow.length > 0) {
			this.state = {
				currentNode: this.chatFlow[0],
				variables: {}
			};
		}
	}

	sendMessage(message: models.ANAChatMessage, threadMsgRef: vm.ChatMessageVM) {
		let msg = message.extract();

		this.logDebug("Sent Simulator Message: ");
		this.logDebug(msg);
		this.processIncomingMessage(message);

		threadMsgRef.status = vm.MessageStatus.ReceivedAtServer;
	}
	handleMessageReceived: (message: models.ANAChatMessage) => any;


	private processNode(chatNode: cfm.ChatNode, section?: cfm.Section) {

	}

	private processButtons(chatNode: cfm.ChatNode) {

	}

	private processIncomingMessage(chatMsg: models.ANAChatMessage) {
		let message = chatMsg.data;
		if (message.type == models.MessageType.INPUT) {
			let ipMsgContent = message.content as models.InputContent;
			if (ipMsgContent.input && Object.keys(ipMsgContent.input).length > 0) {
				let nextNodeId = "";
				let userData: any = null;
				switch (ipMsgContent.inputType) {
					case models.InputType.LOCATION://Click, Complex
						{
							let locIp = ipMsgContent.input as models.LocationInput;
							userData = locIp.location;
							let clickedBtn = this.getNodeButtonByType(cfm.ButtonType.GetLocation);
							if (clickedBtn)
								nextNodeId = clickedBtn.NextNodeId;
						}
						break;
					case models.InputType.DATE://Click, Complex
						{
							let ip = ipMsgContent.input as models.DateInput;
							userData = ip.date;
							let clickedBtn = this.getNodeButtonByType(cfm.ButtonType.GetDate);
							if (clickedBtn)
								nextNodeId = clickedBtn.NextNodeId;
						}
						break;
					case models.InputType.TIME://Click, Complex
						{
							let ip = ipMsgContent.input as models.TimeInput;
							userData = ip.time;
							let clickedBtn = this.getNodeButtonByType(cfm.ButtonType.GetTime);
							if (clickedBtn)
								nextNodeId = clickedBtn.NextNodeId;
						}
						break;
					case models.InputType.ADDRESS://Click, Complex
						{
							let ip = ipMsgContent.input as models.AddressInputField;
							userData = ip.address;
							let clickedBtn = this.getNodeButtonByType(cfm.ButtonType.GetAddress);
							if (clickedBtn)
								nextNodeId = clickedBtn.NextNodeId;
						}
						break;
					case models.InputType.MEDIA: //Click, Non Complex
						{
							let ip = ipMsgContent.input as models.MediaInput;
							if (ip.media && ip.media.length > 0) {
								userData = ip.media[0];
								let cfmType = cfm.ButtonType.GetFile;
								switch (ip.media[0].type) {
									case models.MediaType.AUDIO:
										cfmType = cfm.ButtonType.GetAudio;
										break;
									case models.MediaType.VIDEO:
										cfmType = cfm.ButtonType.GetVideo;
										break;
									case models.MediaType.IMAGE:
										cfmType = cfm.ButtonType.GetImage;
										break;
									case models.MediaType.FILE:
									default:
										cfmType = cfm.ButtonType.GetFile;
										break;
								}
								let clickedBtn = this.getNodeButtonByType(cfmType);
								if (clickedBtn)
									nextNodeId = clickedBtn.NextNodeId;
							}
						}
						break;
					case models.InputType.OPTIONS: //Click, Non Complex
						{
							let ip = ipMsgContent.input as models.TextInput; //Option also has input.val
							let clickedBtn = this.getNodeButtonById(ip.val);
							if (clickedBtn) {
								nextNodeId = clickedBtn.NextNodeId;
								userData = clickedBtn.VariableValue;
							}
						}
						break;
					case models.InputType.LIST://Click, Complex
						{
							let ipMsg = ipMsgContent as models.ListInputContent; //Option also has input.val
							let ip = ipMsg.input;
							let listSelectedValues = ip.val.split(',');
							let listSelectedItems = ipMsg.values.filter(x => listSelectedValues.indexOf(x.value) != -1);
							userData = listSelectedItems.map(x => x.text);
							let clickedBtn = this.getNodeButtonByType(cfm.ButtonType.GetItemFromSource);
							if (clickedBtn)
								nextNodeId = clickedBtn.NextNodeId;
						}
						break;
					case models.InputType.PHONE:
						{
							let ip = ipMsgContent.input as models.TextInput;
							userData = ip.val;
							let clickedBtn = this.getNodeButtonByType(cfm.ButtonType.GetPhoneNumber);
							if (clickedBtn)
								nextNodeId = clickedBtn.NextNodeId;
						}
						break;
					case models.InputType.EMAIL:
						{
							let ip = ipMsgContent.input as models.TextInput;
							userData = ip.val;
							let clickedBtn = this.getNodeButtonByType(cfm.ButtonType.GetEmail);
							if (clickedBtn)
								nextNodeId = clickedBtn.NextNodeId;
						}
						break;
					case models.InputType.NUMERIC:
						{
							let ip = ipMsgContent.input as models.TextInput;
							userData = ip.val;
							let clickedBtn = this.getNodeButtonByType(cfm.ButtonType.GetNumber);
							if (clickedBtn)
								nextNodeId = clickedBtn.NextNodeId;
						}
						break;
					case models.InputType.TEXT:
						{
							let ip = ipMsgContent.input as models.TextInput;
							userData = ip.val;
							let clickedBtn = this.getNodeButtonByType(cfm.ButtonType.GetText);
							if (clickedBtn)
								nextNodeId = clickedBtn.NextNodeId;
						}
						break;
					default:
						break;
				}

				this.saveVariable(userData);
				this.gotoNextNode(nextNodeId);
			}
		} else if (message.type == models.MessageType.CAROUSEL) {
			let msgContent = message.content as models.CarouselContent;
			if (msgContent.input && Object.keys(msgContent.input).indexOf('val') != -1 && msgContent.input.val) {
				let clickedCarBtn = this.getCarouselButtonById(msgContent.input.val);
				this.saveVariable(clickedCarBtn.VariableValue);
				switch (clickedCarBtn.Type) {
					case cfm.CarouselButtonType.DeepLink:
					case cfm.CarouselButtonType.OpenUrl:
					case cfm.CarouselButtonType.NextNode:
					default:
						this.gotoNextNode(clickedCarBtn.NextNodeId);
						break;
				}
			}
		}
	}

	private gotoNextNode(nextNodeId: string) {
		let nextNode = this.getNodeById(nextNodeId);
		this.processNode(nextNode);
	}

	private getNodeById(Id: string) {
		if (Id) {
			let foundNodes = this.chatFlow.filter(n => n.Id == Id);
			if (foundNodes && foundNodes.length > 0)
				return foundNodes[0];
		}
		return null;
	}

	private getNodeButtonById(buttonId: string) {
		let btn = this.state.currentNode.Buttons.filter(x => x._id == buttonId);
		return (btn && btn.length > 0) ? btn[0] : null;
	}

	private getNodeButtonByType(type: cfm.ButtonType) {
		let btn = this.state.currentNode.Buttons.filter(x => x.ButtonType == type);
		return (btn && btn.length > 0) ? btn[0] : null;
	}

	private getCarouselButtonById(carItemBtnId: string) {
		let carSection = this.state.currentSection as cfm.CarouselSection;
		if (carSection && carSection.SectionType == cfm.SectionType.Carousel) {
			let carBtn = carSection.Items.map(x => x.Buttons).reduce((a, b) => (a && a.length > 0 && b && b.length > 0) ? a.concat(b) : []).filter(x => x._id == carItemBtnId);
			return (carBtn && carBtn.length > 0) ? carBtn[0] : null;
		}
		return null;
	}

	private saveVariable(value: string) {
		if (value && this.state.currentNode && this.state.currentNode.VariableName)
			this.state.variables[this.state.currentNode.VariableName] = value;
	}

	private logDebug = (msg: any) => {
		if (this.debug)
			console.log(msg);
	}
	private processVerbsForChatNode(chatNode: cfm.ChatNode): cfm.ChatNode {
		//let matches = json.match(/\[~(.*?)\]/g);
		//for (var i = 0; i < matches.length; i++) {
		//	let match = matches[i];
		//}
		return JSON.parse(this.processVerbs(JSON.stringify(chatNode))) as cfm.ChatNode;
	}
	private processVerbs(txt: string): string {
		return txt.replace(/\[~(.*?)\]/g, (subStr, key) => {
			if (this.state.variables && this.state.variables[key])
				return this.state.variables[key];
			return "";
		});
	}
	private convert(chatNode: cfm.ChatNode, section?: cfm.Section): models.ANAMessageData {
		chatNode = this.processVerbsForChatNode(chatNode);
		switch (chatNode.NodeType) {
			case cfm.NodeType.ApiCall:
				{
					let apiHeaders = new Headers();

					if (chatNode.Headers) {
						let splits = chatNode.Headers.split(/\n|,/);
						for (var si = 0; si < splits.length; si++) {
							try {
								let split = splits[si];
								if (split.indexOf(':') != -1) {
									let key = split.split(':')[0];
									let value = split.split(':')[1];
									apiHeaders.set(key, value);
								}
							} catch (e) {
								console.log('Invalid format provided in headers');
								console.log(e);
							}
						}
					}

					let reqBody: string = null;
					if (chatNode.RequestBody)
						reqBody = this.processVerbs(chatNode.RequestBody);

					let reqParams = new URLSearchParams();
					if (chatNode.RequiredVariables) {
						for (var i = 0; i < chatNode.RequiredVariables.length; i++) {
							if (chatNode.RequiredVariables[i] && Object.keys(this.state.variables).indexOf(chatNode.RequiredVariables[i]) != -1)
								reqParams.append(chatNode.RequiredVariables[i], this.state.variables[chatNode.RequiredVariables[i]]);
						}
					}

					let nextNodeId = chatNode.NextNodeId;
					this.http.request(chatNode.ApiUrl, {
						headers: apiHeaders,
						body: reqBody,
						method: cfm.APIMethod[chatNode.ApiMethod],
						params: reqParams,
					}).subscribe(res => {



					}, err => {
						console.log(err);
						this.gotoNextNode(nextNodeId); //Fall back node
					});
				}
				break;
			case cfm.NodeType.Card:
				break;
			case cfm.NodeType.Condition:
				break;

			case cfm.NodeType.Combination:
			default:
				{

				}
				break;
		}
		return null;
	}
}

export interface SimulatorState {
	currentNode?: cfm.ChatNode;
	currentSection?: cfm.Section;
	variables?: {
		[key: string]: string
	}
}
