import { Injectable } from '@angular/core';
import * as cfm from '../models/ana-chatflow.models';
import * as models from '../models/ana-chat.models';
import * as vm from '../models/ana-chat-vm.models';
import * as jsonpath from 'jsonpath';
import * as _ from 'underscore';

import { Http, Headers, URLSearchParams } from '@angular/http';
import { UtilitiesService } from '../services/utilities.service';
@Injectable()
export class SimulatorService {

	private debug: boolean = false;
	private chatFlow: cfm.ChatNode[] = [];
	private state: SimulatorState;

	constructor(private http: Http, private utils: UtilitiesService) { }

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

	sendMessage(message: models.ANAChatMessage, threadMsgRef?: vm.ChatMessageVM) {
		let msg = message.extract();

		this.logDebug("Sent Simulator Message: ");
		this.logDebug(msg);
		this.processIncomingMessage(message);
		if (threadMsgRef)
			threadMsgRef.status = vm.MessageStatus.ReceivedAtServer;
	}
	handleMessageReceived: (message: models.ANAChatMessage) => any;

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
							if (ip.val == "GET_STARTED") {
								nextNodeId = this.chatFlow[0].Id;
							} else {
								let clickedBtn = this.getNodeButtonById(ip.val);
								if (clickedBtn) {
									nextNodeId = clickedBtn.NextNodeId;
									userData = clickedBtn.VariableValue;
								}
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
		return JSON.parse(this.processVerbs(JSON.stringify(chatNode))) as cfm.ChatNode;
	}
	private processVerbs(txt: string): string {
		return txt.replace(/\[~(.*?)\]/g, (subStr, key) => {
			if (this.state.variables && this.state.variables[key])
				return this.state.variables[key];
			return "";
		});
	}

	private processNode(chatNode: cfm.ChatNode, section?: cfm.Section) {

		chatNode = this.processVerbsForChatNode(chatNode);
		this.state.currentNode = chatNode;
		this.state.currentSection = section || _.first(chatNode.Sections);
		//if (this.state.currentSection) {
		//	let currentSectionIndex = this.state.currentNode.Sections.indexOf(this.state.currentSection);
		//	if (this.state.currentNode.Sections.length > currentSectionIndex + 1)
		//		this.state.currentSection = this.state.currentNode.Sections;

		//} else
		//	this.state.currentSection = ((chatNode.Sections && chatNode.Sections.length > 0) ? chatNode.Sections[0] : null);

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
						this.saveVariable(res.text());
						this.processConditionNode(chatNode);
					}, err => {
						console.log(err);
						this.gotoNextNode(nextNodeId); //Fallback node
					});
				}
				break;
			case cfm.NodeType.Card:
				break;
			case cfm.NodeType.Condition:
				this.processConditionNode(chatNode);
				break;

			case cfm.NodeType.Combination:
			default:
				{
					if (chatNode.Sections && chatNode.Sections.length > 0) {
						let msg = this.convertSection(this.state.currentSection);
						this.prepareReplyAndSend(msg);

						let sectionIndex = chatNode.Sections.indexOf(this.state.currentSection);
						let remainingSections = chatNode.Sections.length - (sectionIndex + 1);
						if (remainingSections > 0) {
							this.processNode(chatNode, chatNode.Sections[sectionIndex + 1]);
							return;
						}
					}

					if (this.state.currentNode && this.state.currentNode.Buttons && this.state.currentNode.Buttons.length > 0) {
						let inputMsgToSend = this.convertButtons(this.state.currentNode);
						this.prepareReplyAndSend(inputMsgToSend);
					}
				}
				break;
		}
	}

	private prepareReplyAndSend(data: models.ANAMessageData) {
		if (this.handleMessageReceived) {
			let meta: models.ANAMeta = {
				id: UtilitiesService.uuidv4(),
				recipient: {
					id: 'ana-studio',
					medium: 100
				},
				sender: {
					id: 'ana-simulator',
					medium: 100
				},
				senderType: models.SenderType.ANA,
				sessionId: '1234',
				timestamp: new Date().getTime(),
				responseTo: ''
			};
			this.handleMessageReceived(new models.ANAChatMessage({
				meta: meta,
				data: data
			}));
		}
	}

	private convertSection(section: cfm.Section): models.ANAMessageData {
		let anaMessageContent: models.SimpleContent = {
			text: ''
		};
		let anaMessageData: models.ANAMessageData = {
			content: anaMessageContent,
			type: models.MessageType.SIMPLE
		};
		switch (section.SectionType) {
			case cfm.SectionType.Image:
				anaMessageContent.media = {
					type: models.MediaType.IMAGE,
					url: (section as cfm.ImageSection).Url,
				}
				anaMessageContent.text = (section as cfm.ImageSection).Title;
				break;
			case cfm.SectionType.Text:
			default:
				anaMessageContent.text = (section as cfm.ImageSection).Title;
				break;
			case cfm.SectionType.Gif:
				anaMessageContent.media = {
					type: models.MediaType.IMAGE,
					url: (section as cfm.ImageSection).Url,
				}
				anaMessageContent.text = (section as cfm.ImageSection).Title;
				break;
			case cfm.SectionType.Audio:
				anaMessageContent.media = {
					type: models.MediaType.AUDIO,
					url: (section as cfm.ImageSection).Url,
				}
				anaMessageContent.text = (section as cfm.ImageSection).Title;
				break;
			case cfm.SectionType.Video:
				anaMessageContent.media = {
					type: models.MediaType.VIDEO,
					url: (section as cfm.ImageSection).Url,
				}
				anaMessageContent.text = (section as cfm.ImageSection).Title;
				break;
			case cfm.SectionType.Carousel:
				{
					let carContent: models.CarouselContent = {
						items: _.map((section as cfm.CarouselSection).Items, x => {
							return {
								title: x.Title,
								desc: x.Caption,
								media: {
									type: models.MediaType.IMAGE,
									url: x.ImageUrl
								},
								options: _.map(x.Buttons, y => {
									return {
										title: y.Text,
										value: y._id,
										type: this.convertCarouselButtonType(y.Type)
									};
								}),
								url: ''
							};
						}),
						mandatory: 1
					};
					anaMessageData = {
						type: models.MessageType.CAROUSEL,
						content: carContent
					};
				}
				break;
		}
		return anaMessageData;
	}

	private convertButtons(chatNode: cfm.ChatNode): models.ANAMessageData {

		let clickInputs = _.filter(chatNode.Buttons, x => _.contains([
			cfm.ButtonType.DeepLink,
			cfm.ButtonType.OpenUrl,
			cfm.ButtonType.GetDate,
			cfm.ButtonType.GetText,
			cfm.ButtonType.GetVideo,
			cfm.ButtonType.GetAddress,
			cfm.ButtonType.GetAgent,
			cfm.ButtonType.GetAudio,
			cfm.ButtonType.GetDateTime,
			cfm.ButtonType.GetItemFromSource,
			cfm.ButtonType.GetFile,
			cfm.ButtonType.GetLocation,
			cfm.ButtonType.FetchChatFlow,
			cfm.ButtonType.ShowConfirmation,
			cfm.ButtonType.NextNode,
		], x.ButtonType));

		let textInputs = _.filter(chatNode.Buttons, x => _.contains([
			cfm.ButtonType.GetText,
			cfm.ButtonType.GetEmail,
			cfm.ButtonType.GetPhoneNumber,
			cfm.ButtonType.GetNumber,
		], x.ButtonType));

		let mandatory = 1;
		if (textInputs && textInputs.length > 0 && clickInputs && clickInputs.length > 0) {
			mandatory = 0;
		}

		if (clickInputs && clickInputs.length > 0) {
			if (_.filter(clickInputs, x => _.contains([cfm.ButtonType.NextNode, cfm.ButtonType.OpenUrl], x.ButtonType)).length > 0) { //If next node/open url button is present, only options can be sent
				//Build options input and send
				let optionsInput: models.OptionsInputContent = {
					inputType: models.InputType.OPTIONS,
					mandatory: mandatory,
					options: _.map(clickInputs, y => {
						return {
							title: y.ButtonName || y.ButtonText,
							value: y._id,
							type: this.convertButtonType(y.ButtonType)
						}
					})
				};
				return {
					content: optionsInput,
					type: models.MessageType.INPUT
				};
			}
		}

		if (textInputs && textInputs.length > 0) {
			let textInput = textInputs[0];
			let inputMsg: models.TextInputContent = {
				inputType: this.convertButtonTypeToInputType(textInput.ButtonType),
				mandatory: mandatory,
				textInputAttr: {
					defaultText: textInput.DefaultText,
					maxLength: textInput.MaxLength,
					minLength: textInput.MinLength,
					multiLine: textInput.IsMultiLine ? 1 : 0,
					placeHolder: textInput.PlaceholderText
				}
			}
			return {
				content: inputMsg,
				type: models.MessageType.INPUT
			};
		}
	}

	private convertButtonTypeToInputType(srcType: cfm.ButtonType): models.InputType {
		switch (srcType) {
			default:
			case cfm.ButtonType.GetText:
				return models.InputType.TEXT;
			case cfm.ButtonType.GetEmail:
				return models.InputType.EMAIL;
			case cfm.ButtonType.GetNumber:
				return models.InputType.NUMERIC;
			case cfm.ButtonType.GetPhoneNumber:
				return models.InputType.PHONE;
		}
	}

	private convertCarouselButtonType(srcType: cfm.CarouselButtonType): models.ButtonType {
		switch (srcType) {
			case cfm.CarouselButtonType.DeepLink:
			case cfm.CarouselButtonType.OpenUrl:
				return models.ButtonType.URL;
			case cfm.CarouselButtonType.NextNode:
			default:
				return models.ButtonType.ACTION;
		}
	}

	private convertButtonType(srcType: cfm.ButtonType): models.ButtonType {
		switch (srcType) {
			case cfm.ButtonType.DeepLink:
			case cfm.ButtonType.OpenUrl:
				return models.ButtonType.URL;
			case cfm.ButtonType.NextNode:
			default:
				return models.ButtonType.ACTION;
		}
	}

	private processConditionNode(chatNode: cfm.ChatNode) {
		try {
			if (chatNode.Buttons) {
				for (var btnIdx = 0; btnIdx < chatNode.Buttons.length; btnIdx++) {
					let btn = chatNode.Buttons[btnIdx];
					let firstPart = btn.ConditionMatchKey.split('.')[0];
					let remainingParts = btn.ConditionMatchKey.split('.').splice(0, 1).join('.');
					let jResp = JSON.parse(this.state.variables[firstPart]);

					if (this.match(jsonpath.query(jResp, remainingParts) as any, btn.ConditionOperator, btn.ConditionMatchValue)) {
						this.saveVariable(btn.VariableValue);
						this.gotoNextNode(btn.NextNodeId);
						break;
					}
				}
			}
		} catch (e) {
			if (chatNode.Buttons) {
				for (var btnIdx = 0; btnIdx < chatNode.Buttons.length; btnIdx++) {
					let btn = chatNode.Buttons[btnIdx];
					let leftOperand = this.state.variables[btn.ConditionMatchKey];
					if (this.match(leftOperand, btn.ConditionOperator, btn.ConditionMatchValue)) {
						this.saveVariable(btn.VariableValue);
						this.gotoNextNode(btn.NextNodeId);
						break;
					}
				}
			}
		}
	}

	private match(left: any, op: cfm.ConditionOperator, right: any) {
		try {
			switch (op) {
				case cfm.ConditionOperator.Between:
					{
						let r1 = right.split(',')[0];
						let r2 = right.split(',')[1];

						return (r1 < left && left < r2);
					}
				case cfm.ConditionOperator.NotEqualTo:
					return left != right;
				case cfm.ConditionOperator.GreaterThan:
					return left > right;
				case cfm.ConditionOperator.LessThan:
					return left < right;
				case cfm.ConditionOperator.GreaterThanOrEqualTo:
					return left >= right;
				case cfm.ConditionOperator.LessThanOrEqualTo:
					return left <= right;
				case cfm.ConditionOperator.In:
					return right.split(',').indexOf(left) != -1;
				case cfm.ConditionOperator.NotIn:
					return right.split(',').indexOf(left) == -1;
				case cfm.ConditionOperator.StartsWith:
					return left.startsWith(right);
				case cfm.ConditionOperator.EndsWith:
					return left.endsWith(right);
				case cfm.ConditionOperator.Contains:
					return left.indexOf(right) != -1;
				case cfm.ConditionOperator.EqualTo:
				default:
					return left == right;
			}
		} catch (e) {
			console.log('Invalid operation or operands');
		}
	}
}

export interface SimulatorState {
	currentNode?: cfm.ChatNode;
	currentSection?: cfm.Section;
	variables?: {
		[key: string]: string
	}
}
