import * as React from "react";
import { useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IProjectPageService } from "azure-devops-extension-api";
import { Build, BuildRestClient } from "azure-devops-extension-api/Build";

import "azure-devops-ui/Core/core.css";
import "azure-devops-ui/Core/override.css";
import './queue-time-dashboard-widget.scss';

const MaxItems = 20;
const MinHeight = 8;
const MaxHeight = 72;

export const QueueTimeDashboardWidget = () => {
    const [runs, setRuns] = useState<Build[]>([]);

    const loadBuilds = async () => {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) {
            return;
        }

        const buildClient = getClient(BuildRestClient);
        const builds = await buildClient.getBuilds(project.id, [139], undefined, undefined, undefined, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined, MaxItems);

        // make sure there are MaxItem entries to make looping simpler later
        setRuns(new Array(MaxItems - builds.length).fill(undefined).concat(builds));
    }

    useEffect(() => {
        SDK.register("queue-time-dashboard-widget", () => {
            return {
                load: function (widgetSettings: any) {
                    console.log("load widgetSettings " + JSON.stringify(widgetSettings));

                    return 0; // success
                }
            }
        });

        SDK.init({
            loaded: true
        });
        
        SDK.ready();

        loadBuilds();
    }, []);

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

    return (
        <div className="queue-time-dashboard-widget">
            <h2 className="visual-title text-ellipsis definition-header">definition name here</h2>
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