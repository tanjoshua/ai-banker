"use client"

import { parameterSchema } from "@/app/(main)/api/analyst/gen-params/route";
import { Company, CompanySelection } from "./company-selection"
import { experimental_useObject } from "@ai-sdk/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/resizable";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Fragment, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { DCF } from "../spreadsheet/dcf";

export function Analyst() {
    const [selectedCompany, setSelectedCompany] = useState<Company>()
    const { object, submit, isLoading } = experimental_useObject(
        {
            api: 'api/analyst/gen-params',
            schema: parameterSchema,
        }
    );


    if (selectedCompany) {
        return <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30}>
                <ScrollArea className="h-dvh">
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="font-bold text-xl ">
                                {selectedCompany.name}
                            </div>
                            <Button variant="outline" size="icon" onClick={() => setSelectedCompany(undefined)}>
                                <RefreshCw />
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {isLoading && !object &&
                                <Fragment>
                                    <Skeleton className="rounded-xl h-32" />
                                    <Skeleton className="rounded-xl h-32" />
                                    <Skeleton className="rounded-xl h-32" />

                                </Fragment>
                            }
                            {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                Object.values(object?.parameters || {}).map((param: any, index: number) => <Card key={index}>
                                    <CardHeader>
                                        <CardTitle>
                                            {param?.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p>{param?.value}</p>
                                        <p>{param?.reasoning}</p>
                                    </CardContent>
                                </Card>)
                            }
                        </div>
                    </div>
                </ScrollArea>

            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={70}>
                <ScrollArea className="h-dvh p-4">
                    {isLoading || !object?.parameters ? (
                        <div className="h-dvh flex justify-center items-center">

                            <Loader2 className="animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <DCF ticker={selectedCompany.ticker} params={{
                                revenueGrowth: object.parameters.revenueGrowth!.value!,
                                cogsMargin: object.parameters.cogsMargin!.value!,
                                sgaMargin: object.parameters.sgaMargin!.value!,
                                daCapex: object.parameters.daCapex!.value!,
                                taxRate: object.parameters.taxRate!.value!,
                                salesIntensity: object.parameters.salesIntensity!.value!,
                            }} />
                            <ScrollBar orientation="horizontal" />
                        </>
                    )}
                </ScrollArea>
            </ResizablePanel>

        </ResizablePanelGroup >
    }



    return <div className="flex flex-col min-w-0 h-dvh bg-background">
        <div className="flex-1 flex justify-center items-center">
            <CompanySelection setSelectedCompany={async (value) => {
                setSelectedCompany(value)
                submit({ stock: value });
            }} />

        </div>
    </div>



}