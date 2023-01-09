import * as React from "react";
import { useEffect, useRef, useState } from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { CommonServiceIds, getClient, IProjectPageService } from "azure-devops-extension-api";
import { BuildRestClient } from "azure-devops-extension-api/Build";
import { QueueTimeWidgetSettings } from "./queue-time-dashboard-widget-settings";
import { IWidgetConfigurationContext, ConfigurationEvent, WidgetSettings, IWidgetConfiguration, WidgetStatusType } from "./widget-sdk-stuff";

import "azure-devops-ui/Core/core.css";
import "azure-devops-ui/Core/override.css";
import './queue-time-dashboard-widget.scss';

export const QueueTimeDashboardWidgetConfiguration = () => {
    // "Selection should be specified on mount and not updated to a new object during the Listbox's lifecycle."
    const selection = new DropdownSelection();

    const [configurationContext, setConfigurationContext] = useState<IWidgetConfigurationContext>();
    const [definitions, setDefinitions] = useState<IListBoxItem[]>([]);

    // to avoid a stale closure in the functions passed to SDK.register, we need a ref
    const latestDefinitionId = useRef("");
    
    const loadDefinitions = async () => {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) {
            return;
        }

        const buildClient = getClient(BuildRestClient);
        
        const definitions = await buildClient.getDefinitions(project.id);

        const listItems: IListBoxItem[] = [];
        definitions.forEach((definition, index) => {
            const item = {
                id: definition.id.toString(),
                text: definition.name
            };

            if (item.id === latestDefinitionId.current) {
                selection.select(index);
            }
            
            listItems.push(item);
        });

        setDefinitions(listItems);
    }

    const onHostLoad = (widgetSettings: WidgetSettings, widgetConfigurationContext: IWidgetConfigurationContext) => {
        console.log("config widgetSettings " + JSON.stringify(widgetSettings));

        const payload = JSON.parse(widgetSettings.customSettings.data) as QueueTimeWidgetSettings;
        if (!!payload) {
            latestDefinitionId.current = payload.definitionId;
        }
        
        setConfigurationContext(widgetConfigurationContext);

        loadDefinitions();

        return Promise.resolve({
            statusType: WidgetStatusType.Success
        });
    };

    const onHostSave = () => {
        // WidgetConfigurationSave.Valid (or .Invalid)
        return Promise.resolve({
            customSettings: {
                data: JSON.stringify({
                    // we use the latestDefinitionId ref here instead of state
                    // the state variable is captured when this function is created and ends up being stale
                    definitionId: latestDefinitionId.current
                })
            },
            isValid: true 
        });
    };

    useEffect(() => {
        SDK.register("queue-time-dashboard-widget.configuration", () => {
            return {
                load: onHostLoad,
                onSave: onHostSave
            } as IWidgetConfiguration;
        });

        SDK.init({
            loaded: true
        });
        
        SDK.ready();
    }, []);

    const onSelectPipeline = (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) => {
        latestDefinitionId.current = item.id;

        if (!!configurationContext) {
            const customSettings = {
                data: JSON.stringify({
                    definitionId: item.id
                })
            };

            configurationContext.notify(
                ConfigurationEvent.ConfigurationChange,
                { data: customSettings } // ConfigurationEvent.Args(customSettings)
            );
        }
    };

    return (
        <div>
            <h3>Select a pipeline</h3>
            <Dropdown placeholder="Select a pipeline"
                items={definitions}
                onSelect={onSelectPipeline}
                selection={selection} />
        </div>
    )
}

ReactDOM.render(<QueueTimeDashboardWidgetConfiguration />, document.getElementById("root"));
