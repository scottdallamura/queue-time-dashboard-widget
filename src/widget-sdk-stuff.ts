// this should be imported from the widget SDK, but it's not available in the new version :(
export interface EventArgs<T> {
    data: T;
}

export interface NotifyResult {
    getResponse(): Promise<string>;
}

export interface IWidgetConfigurationContext {
    notify: <T>(event: string, eventArgs: EventArgs<T>) => Promise<NotifyResult>;
}

export interface WidgetSize {
    columnSpan: number;
    rowSpan: number;
}

export interface LightboxOptions {
    height: number;
    width: number;
    resizable: boolean;
}

export interface SemanticVersion {
    major: number;
    minor: number;
    patch: number;
}

export interface CustomSettings {
    data: string;
    version?: SemanticVersion;
}

export enum WidgetStatusType {
    Success = 0,
    Failure = 1,
    Unconfigured = 2
}

export interface WidgetStatus {
    state?: string;
    statusType: WidgetStatusType;
}

export interface WidgetSettings {
    name: string;
    customSettings: CustomSettings;
    size: WidgetSize;
    lightboxOptions: LightboxOptions;
}

export class ConfigurationEvent {
    static ConfigurationChange: string = "ms.vss-dashboards-web.configurationChange";
}

export interface SaveStatus {
    customSettings: CustomSettings;
    isValid: boolean;
}

export interface IWidgetConfiguration {
    load: (widgetSettings: WidgetSettings, widgetConfigurationContext: IWidgetConfigurationContext) => Promise<WidgetStatus>;
    onSave: () => Promise<SaveStatus>;
    onSaveComplete?: () => void;
    listen?: <T>(event: string, eventArgs: EventArgs<T>) => void;
}

export interface Size {
    width: number;
    height: number;
}

export interface IWidget {
    preload?: (widgetSettings: WidgetSettings) => Promise<WidgetStatus>;
    load: (widgetSettings: WidgetSettings) => Promise<WidgetStatus> | WidgetStatusType;
    onDashboardLoaded?: () => void;
    disableWidgetForStakeholders?: (widgetSettings: WidgetSettings) => Promise<boolean>;
    lightbox?: (widgetSettings: WidgetSettings, lightboxSize: Size) => Promise<WidgetStatus>;
    listen?: <T>(event: string, eventArgs: EventArgs<T>) => void;
}

export interface IConfigurableWidget extends IWidget {
    reload: (newWidgetSettings: WidgetSettings) => Promise<WidgetStatus> | WidgetStatusType;
}