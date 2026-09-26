import { db } from "@/lib/db"
import { inboundEmails } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminSupportPage() {
  const emails = await db
    .select()
    .from(inboundEmails)
    .orderBy(desc(inboundEmails.receivedAt))

  return (
    <div className="container mx-auto p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Support Inbox</h1>
        <p className="text-muted-foreground text-lg">
          Messages sent to staff@starcast.online
        </p>
      </div>

      <div className="grid gap-6">
        {emails.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-card/50">
            <h3 className="text-xl font-medium">No messages yet</h3>
            <p className="text-muted-foreground mt-2">When someone emails staff@starcast.online, it will appear here.</p>
          </div>
        ) : (
          emails.map((email) => (
            <Card key={email.id} className="overflow-hidden transition-all hover:shadow-md border-border/50 bg-gradient-to-br from-card to-card/90">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{email.subject || "No Subject"}</CardTitle>
                    <CardDescription className="text-sm mt-1.5 flex items-center gap-2">
                      <span className="font-medium text-foreground">{email.sender}</span>
                      <span className="text-muted-foreground/60">•</span>
                      <span>{email.receivedAt.toLocaleString()}</span>
                    </CardDescription>
                  </div>
                  <Badge variant={email.status === "unread" ? "default" : "secondary"} className="capitalize shadow-sm">
                    {email.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="whitespace-pre-wrap text-sm text-card-foreground/90 leading-relaxed font-medium">
                  {email.textBody || "No message body"}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
