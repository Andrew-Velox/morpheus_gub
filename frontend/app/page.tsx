"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

export default function Page() {
  const [switch1, setSwitch1] = useState(true)
  const [switch2, setSwitch2] = useState(false)
  const [switch3, setSwitch3] = useState(true)
  const [switch4, setSwitch4] = useState(false)

  return (
    <div className="flex min-h-svh flex-col gap-12 p-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-display text-sm text-muted-foreground">Variants</h2>
        <div className="flex flex-wrap items-start gap-3">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-display text-sm text-muted-foreground">Sizes</h2>
        <div className="flex flex-wrap items-start gap-3">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-display text-sm text-muted-foreground">States</h2>
        <div className="flex flex-wrap items-start gap-3">
          <Button disabled>Disabled</Button>
          <Button variant="outline" disabled>Disabled</Button>
          <Button variant="ghost" disabled>Disabled</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-display text-sm text-muted-foreground">Switches</h2>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Airplane mode
            </span>
            <Switch checked={switch1} onCheckedChange={setSwitch1} />
          </label>
          <label className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Dark mode
            </span>
            <Switch checked={switch2} onCheckedChange={setSwitch2} />
          </label>
          <label className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Disabled
            </span>
            <Switch checked disabled onCheckedChange={() => {}} />
          </label>
          <label className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Disabled off
            </span>
            <Switch checked={false} disabled onCheckedChange={() => {}} />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-display text-sm text-muted-foreground">Cards</h2>
        <div className="flex flex-wrap items-start gap-4">
          <Card className="max-w-xs surface-glow">
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>A brief description of this card.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-midground/70">
                Card body content goes here. This text demonstrates how the
                card content area looks with the Hermes styling.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
          <Card className="max-w-xs surface-glow">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure your preferences.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <label className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Notifications
                </span>
                <Switch checked={switch3} onCheckedChange={setSwitch3} />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Sound
                </span>
                <Switch checked={switch4} onCheckedChange={setSwitch4} />
              </label>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-display text-sm text-muted-foreground">Dialogs</h2>
        <div className="flex flex-wrap items-start gap-3">
          <Dialog>
            <DialogTrigger render={<Button />}>
              Open Dialog
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  A description of the dialog content and its purpose.
                </DialogDescription>
              </DialogHeader>
              <div className="p-4">
                <p className="text-sm text-midground/70">
                  This is a general-purpose dialog built on Base UI primitives.
                  It handles focus trapping, ESC to close, and backdrop click
                  automatically.
                </p>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Close
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-display text-sm text-muted-foreground">Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge>LIVE</Badge>
          <Badge variant="outline">DEMO</Badge>
          <Badge variant="success">ACTIVE</Badge>
          <Badge variant="warning">PENDING</Badge>
          <Badge variant="destructive">ERROR</Badge>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-display text-sm text-muted-foreground">Alerts</h2>
        <div className="flex w-full max-w-md flex-col gap-3">
          <Alert>
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>
              This is a default alert with grain overlay.
            </AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Operation completed successfully.
            </AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Please review before proceeding.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Something went wrong. Try again.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-display text-sm text-muted-foreground">Alert Dialog</h2>
        <div className="flex flex-wrap items-start gap-3">
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Are you sure you want to
                    proceed?
                  </AlertDialogDescription>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  )
}
