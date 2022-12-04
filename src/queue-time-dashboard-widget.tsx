import * as React from "react";
import { useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IProjectPageService } from "azure-devops-extension-api";
import { Build, BuildDefinition, BuildRestClient } from "azure-devops-extension-api/Build";

import "azure-devops-ui/Core/core.css";
import "azure-devops-ui/Core/override.css";
import './queue-time-dashboard-widget.scss';
import { IConfigurableWidget, WidgetSettings, WidgetStatusType } from "./widget-sdk-stuff";

const MaxItems = 20;
const MinHeight = 8;
const MaxHeight = 72;

interface QueueTimeWidgetSettings {
    definitionId: string;
}

export const QueueTimeDashboardWidget = () => {
    const [runs, setRuns] = useState<Build[]>([]);
    const [definition, setDefinition] = useState<BuildDefinition>();
    const [definitionId, setDefinitionId] = useState(0);

    const loadBuilds = async () => {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) {
            return;
        }

        const buildClient = getClient(BuildRestClient);
        
        if (definitionId > 0) {
            buildClient.getDefinition(project.id, definitionId)
                .then((definition: BuildDefinition) => {
                    setDefinition(definition);
                });


            buildClient.getBuilds(project.id, [definitionId], undefined, undefined, undefined, undefined, undefined, undefined,
                undefined, undefined, undefined, undefined, MaxItems)
                .then((builds: Build[]) => {
                    // make sure there are MaxItem entries to make looping simpler later
                    setRuns(new Array(MaxItems - builds.length).fill(undefined).concat(builds));
                });
        }
    }

    const loadFromSettings = (widgetSettings: WidgetSettings) => {
        console.log("load widgetSettings " + JSON.stringify(widgetSettings));

        const payload = JSON.parse(widgetSettings.customSettings.data) as QueueTimeWidgetSettings;

        setDefinitionId(parseInt(payload.definitionId));

        // TODO: "Unconfigured" is a thing. maybe if payload.definitionId is NaN we can use that
        return WidgetStatusType.Success;
    };

    useEffect(() => {
        SDK.register("queue-time-dashboard-widget", () => {
            return {
                load: loadFromSettings,
                reload: loadFromSettings
            } as IConfigurableWidget;
        });

        SDK.init({
            loaded: true
        });
        
        SDK.ready();
    }, []);

    useEffect(() => {
        loadBuilds();
    }, [definitionId]);

    let longestQueueTime: number = 0;
    runs.forEach((run) => {
        if (!!run) {
            const startTime = run.startTime || new Date();
            const queueTime = startTime.valueOf() - run.queueTime.valueOf();
            if (queueTime > longestQueueTime) {
                longestQueueTime = queueTime;
            }
        }
    });

    if (isNaN(definitionId) || definitionId <= 0) {
        return <div>configure me</div>
    }

    return (
        <div className="queue-time-dashboard-widget">
            <h2 className="visual-title text-ellipsis definition-header">{definition?.name}</h2>
            <div className="bar-chart">
                <ul className="runs-list flex flex-row">
                    {runs.map((run: Build, index: number) => {
                        if (run === undefined) {
                            return <EmptyRunItem />
                        }
                        else {
                            return <RunItem run={run} longestQueueTime={longestQueueTime} />
                        }
                    })}
                </ul>
                <div className="border-element"></div>
            </div>
        </div>
    )
}

interface BarChartItemProps {
    paddingTop: number;
}

const BarChartListItem = (props: React.PropsWithChildren<BarChartItemProps>) => {
    const { children, paddingTop } = props;

    return (
        <li className="bar-chart-list-item padded-item relative">
            <span>
                <div className="bar-chart-item-container" style={{paddingTop: paddingTop + "px"}}>
                    {children}
                </div>
            </span>
        </li>
    )
}

const EmptyRunItem = () => {
    return (
        <BarChartListItem paddingTop={MaxHeight}>
            <div className="bar-chart-item bar-chart-unknown-color" style={{width: "13.1px", height: MinHeight + "px", opacity: "1"}}></div>
        </BarChartListItem>
    )
}

interface RunItemProps {
    run: Build;
    longestQueueTime: number;
}

const RunItem = (props: RunItemProps) => {
    const {run, longestQueueTime} = props;

    const startTime = run.startTime || new Date();
    const queueTime = startTime.valueOf() - run.queueTime.valueOf();
    const height = MinHeight + (MaxHeight * (queueTime / longestQueueTime))
    const paddingTop = (MaxHeight + MinHeight) - height;

    return (
        <BarChartListItem paddingTop={paddingTop}>
            <span className="bar-chart-item bar-chart-success-color" style={{width: "13.1px", height: height + "px", opacity: "1px"}}></span>
        </BarChartListItem>
    )
}

ReactDOM.render(<QueueTimeDashboardWidget />, document.getElementById("root"));