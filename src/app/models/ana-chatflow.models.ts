//Enum Start
export enum SectionType {
	Image = 'Image',
	Text = 'Text',
	Graph = 'Graph',
	Gif = 'Gif',
	Audio = 'Audio',
	Video = 'Video',
	Link = 'Link',
	EmbeddedHtml = 'EmbeddedHtml',
	Carousel = 'Carousel',
	PrintOTP = 'PrintOTP'
}

export enum CarouselButtonType {
	NextNode = 'NextNode',
	DeepLink = 'DeepLink',
	OpenUrl = 'OpenUrl'
}

export enum NodeType {
	ApiCall = 'ApiCall',
	Combination = 'Combination',
	Card = 'Card',
	Condition = 'Condition'
}

export enum APIMethod {
	GET = 'GET',
	POST = 'POST',
	PATCH = 'PATCH',
	PUT = 'PUT',
	DELETE = 'DELETE',
	HEAD = 'HEAD',
	OPTIONS = 'OPTIONS',
	CONNECT = 'CONNECT',
}

export enum CardPlacement {
	Incoming = 'Incoming',
	Outgoing = 'Outgoing',
	Center = 'Center'
}
//Enums End

// Sections - Start
export interface TitleCaptionEntity {
	Title: string;
	Caption: string;
}

export interface BaseIdEntity {
	_id: string;
}

export interface BaseEntity extends BaseIdEntity { }

export interface Section extends BaseEntity {
	SectionType: SectionType;
	DelayInMs?: number;
	Hidden?: boolean;

	ContentId?: string;
	ContentEmotion?: string;
}

export interface RepeatableBaseEntity extends BaseEntity {
	DoesRepeat: boolean;
	RepeatOn: string;
	RepeatAs: string;
	StartPosition: string;
	MaxRepeats: number;
}

export interface TextSection extends Section {
	Text: string;
}

export interface TitleCaptionSection extends Section, TitleCaptionEntity { }

export interface TitleCaptionUrlSection extends TitleCaptionSection {
	Url: string;
}

export interface ImageSection extends TitleCaptionUrlSection { }

export interface VideoSection extends TitleCaptionUrlSection { }

export interface AudioSection extends TitleCaptionUrlSection { }

export interface EmbeddedHtmlSection extends TitleCaptionUrlSection { }

export interface CarouselButton extends RepeatableBaseEntity {
	Url: string;
	Type: CarouselButtonType;
	VariableValue: string;
	NextNodeId: string;
	Text: string;

	ContentId: string;
	ContentEmotion: string;
}

export interface CarouselItem extends RepeatableBaseEntity, TitleCaptionEntity {
	ImageUrl: string;
	Buttons: CarouselButton[];

	ContentId?: string;
	ContentEmotion?: string;
}

export interface CarouselSection extends TitleCaptionSection {
	Items: CarouselItem[];
}
// Sections - End
export enum ConditionOperator {
	EqualTo = 'EqualTo',
	NotEqualTo = 'NotEqualTo',
	GreaterThan = 'GreaterThan',
	LessThan = 'LessThan',
	GreaterThanOrEqualTo = 'GreaterThanOrEqualTo',
	LessThanOrEqualTo = 'LessThanOrEqualTo',
	Mod = 'Mod',
	In = 'In',
	NotIn = 'NotIn',
	StartsWith = 'StartsWith',
	EndsWith = 'EndsWith',
	Contains = 'Contains',
	Between = 'Between'
}

export enum ButtonType {
	OpenUrl = 'OpenUrl',
	GetText = 'GetText',
	GetNumber = 'GetNumber',
	GetAddress = 'GetAddress',
	GetEmail = 'GetEmail',
	GetPhoneNumber = 'GetPhoneNumber',
	GetItemFromSource = 'GetItemFromSource',
	GetImage = 'GetImage',
	GetAudio = 'GetAudio',
	GetVideo = 'GetVideo',
	NextNode = 'NextNode',
	DeepLink = 'DeepLink',
	GetAgent = 'GetAgent',
	GetFile = 'GetFile',
	ShowConfirmation = 'ShowConfirmation',
	FetchChatFlow = 'FetchChatFlow',
	/// Format: yyyy-MM-dd
	GetDate = 'GetDate',
	/// Format: HH:mm:ss
	GetTime = 'GetTime',
	/// Format: yyyy-MM-ddTHH:mm:ss
	GetDateTime = 'GetDateTime',
	/// Format: [Latitude],[Longitude]
	GetLocation = 'GetLocation'
}

export interface Button extends BaseIdEntity {
	ButtonName?: string;
	ButtonText: string;
	Emotion?: number;
	ButtonType: ButtonType;
	DeepLinkUrl?: string;
	Url?: string;
	BounceTimeout?: number;
	NextNodeId?: string;
	DefaultButton?: boolean;
	Hidden?: boolean;
	VariableValue?: string;
	PrefixText?: string;
	PostfixText?: string;
	PlaceholderText?: string;
	ConditionMatchKey?: string;
	ConditionOperator?: ConditionOperator;
	ConditionMatchValue?: string;
	PostToChat?: boolean;
	DoesRepeat?: boolean;
	RepeatOn?: string;
	RepeatAs?: string;
	StartPosition?: number;
	MaxRepeats?: number;
	AdvancedOptions?: boolean;
	MinLength?: number;
	MaxLength?: number;
	DefaultText?: string;
	IsMultiLine?: boolean;

	ContentId?: string;
	ContentEmotion?: string;
}

export interface ChatNode {
	Name: string;
	Id: string;
	Emotion?: string;
	TimeoutInMs: number;
	NodeType: NodeType;
	Sections: Section[];
	Buttons: Button[];
	VariableName?: string;
	ApiMethod?: APIMethod;
	ApiUrl?: string;
	//ApiResponseDataRoot?: string;
	NextNodeId?: string;
	RequiredVariables?: string[];
	GroupName?: string;
	CardHeader?: string;
	CardFooter?: string;
	Placement?: CardPlacement;
	IsStartNode?: boolean;

	RequestBody?: string;
	Headers?: string;
}