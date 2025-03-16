import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// Server action to add a new company
async function addCompany(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const ticker = formData.get("ticker") as string;

    if (!name || !ticker) {
        return;
    }

    try {
        await db.insert(companies).values({
            name,
            ticker: ticker.toUpperCase(),
        });
    } catch (error) {
        console.error("Error adding company:", error);
    }

    revalidatePath("/companies");
}

// Server action to delete a company
async function deleteCompany(formData: FormData) {
    "use server";

    const id = formData.get("id") as string;

    if (!id) {
        return;
    }

    try {
        await db.delete(companies).where(eq(companies.id, id));
    } catch (error) {
        console.error("Error deleting company:", error);
    }

    revalidatePath("/companies");
}

export default async function CompaniesPage() {
    const allCompanies = await db.select().from(companies);


    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Add company form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Company</CardTitle>
                        <CardDescription>
                            Enter details to add a new company to the database
                        </CardDescription>
                    </CardHeader>
                    <form action={addCompany}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">Company Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="Apple Inc."
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="ticker" className="text-sm font-medium">Ticker Symbol</label>
                                <input
                                    id="ticker"
                                    name="ticker"
                                    required
                                    placeholder="AAPL"
                                    className="w-full p-2 border rounded uppercase"
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Company
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Companies list */}
                <Card>
                    <CardHeader>
                        <CardTitle>Companies List</CardTitle>
                        <CardDescription>
                            Showing {allCompanies.length} total companies
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {allCompanies.length === 0 ? (
                            <p className="text-center text-muted-foreground">No companies added yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Ticker</TableHead>
                                        <TableHead className="w-[80px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allCompanies.map((company) => (
                                        <TableRow key={company.id}>
                                            <TableCell>{company.name}</TableCell>
                                            <TableCell className="font-mono">{company.ticker}</TableCell>
                                            <TableCell>
                                                <form action={deleteCompany}>
                                                    <input type="hidden" name="id" value={company.id} />
                                                    <Button variant="ghost" size="sm" type="submit">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 