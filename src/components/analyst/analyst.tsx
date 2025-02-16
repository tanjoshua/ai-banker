"use client"

import { parameterSchema } from "@/app/(main)/api/analyst/gen-params/route";
import { CompanySelection } from "./company-selection"
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
    const [selectedCompany, setSelectedCompany] = useState("")
    const { object, submit, isLoading } = experimental_useObject(
        {
            api: 'api/analyst/gen-params',
            schema: parameterSchema,
        }
    );


    if (selectedCompany) {
        return <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={40}>
                <ScrollArea className="h-dvh">
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="font-bold text-xl ">
                                {selectedCompany}
                            </div>
                            <Button variant="outline" size="icon" onClick={() => setSelectedCompany("")}>
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
                                object?.parameters?.map((param, index) => <Card key={index}>
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
            <ResizablePanel defaultSize={60}>
                <ScrollArea className="h-dvh p-4">
                    {isLoading ? (
                        <div className="h-dvh flex justify-center items-center">

                            <Loader2 className="animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <DCF />
                            <ScrollBar orientation="horizontal" />
                        </>
                    )}
                </ScrollArea>
            </ResizablePanel>

        </ResizablePanelGroup>
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