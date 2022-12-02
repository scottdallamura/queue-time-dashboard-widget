import * as React from "react";
import { useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IProjectPageService } from "azure-devops-extension-api";
import { Build, BuildRestClient } from "azure-devops-extension-api/Build";
import {QueryHierarchyItem, WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking"; // antonioru

import "azure-devops-ui/Core/core.css";
import "azure-devops-ui/Core/override.css";
import './queue-time-dashboard-widget.scss';

const MaxItems = 20;
const MinHeight = 8;
const MaxHeight = 72;

export const QueueTimeDashboardWidget = () => {
    // const [runs, setRuns] = useState<Build[]>([]);
    const [queryHierarchyItems, setQueries] = useState<QueryHierarchyItem[]>([]); // antonioru

    const loadBuilds = async () => {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();

        console.log("start");

        if (!project) {
            return;
        }

        console.log(project.id);

        // const buildClient = getClient(BuildRestClient);
        // const builds = await buildClient.getBuilds(project.id, [139], undefined, undefined, undefined, undefined, undefined, undefined,
        //     undefined, undefined, undefined, undefined, MaxItems);

        //////////////////////////////
        //  Unhandled exception in fetch for https://dev.azure.com/antonioru/a7e331d5-b3e7-4c61-ba0b-9303bd7ed8e1/_apis/wit/queries: TypeError: Failed to fetch
        ///////////////////////////////        
        const workItemTrackingClient  = getClient(WorkItemTrackingRestClient); // antonioru
        const queries = await workItemTrackingClient.getQueries(project.id); // antonioru ** LINE WITH ERROR    

        console.log("Queries");

        // make sure there are MaxItem entries to make looping simpler later
        // setRuns(new Array(MaxItems - builds.length).fill(undefined).concat(builds));
        setQueries(new Array(MaxItems - queries.length).fill(undefined).concat(queries)); // antonioru
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
    // runs.forEach((run) => {
    //     if (!!run) {
    //         const startTime = run.startTime || new Date();
    //         const queueTime = startTime.valueOf() - run.queueTime.valueOf();
    //         if (queueTime > longestQueueTime) {
    //             longestQueueTime = queueTime;
    //         }
    //     }
    // });

    return (
        <div className="queue-time-dashboard-widget">
            <h2 className="visual-title text-ellipsis definition-header">definition name here</h2>
            <div className="bar-chart">
                <ul className="runs-list flex flex-row">
                    {queryHierarchyItems.map((query: QueryHierarchyItem, index: number) => {
                        <li>{query.id}</li>    
                    })}
                </ul>
                <div className="border-element"></div>
                {/* <ul>
                {runs.map((run: Build, index: number) => {
                        if (run === undefined) {
                            return <EmptyRunItem />
                        }
                        else {
                            return <RunItem run={run} longestQueueTime={longestQueueTime} />
                        }
                    })}
                </ul> */}
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