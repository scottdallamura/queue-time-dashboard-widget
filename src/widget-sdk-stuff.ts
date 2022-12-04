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

export interface WidgetSettings {
    name: string;
    customSettings: CustomSettings;
    size: WidgetSize;
    lightboxOptions: LightboxOptions;
}

export class ConfigurationEvent {
    static ConfigurationChange: string = "ms.vss-dashboards-web.configurationChange";
}