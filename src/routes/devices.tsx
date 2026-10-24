import { createFileRoute } from "@tanstack/react-router";
import { Battery, Bluetooth, BluetoothSearching, HeartPulse, Volume2, Watch } from "lucide-react";

import { PageTitle, Section } from "@/components/safeband/Section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSafeBand } from "@/lib/safeband/store";
import { cn } from "@/lib/utils";
import type { Device } from "@/lib/safeband/types";

export const Route = createFileRoute("/devices")({
  head: () => ({
    meta: [
      { title: "Bluetooth devices — Wrist Band" },
      {
        name: "description",
        content:
          "Pair everyday BLE devices with Wrist Band: inspect Heart Rate 0x180D, Immediate Alert 0x1802 and Battery 0x180F support, signal strength and disconnect alerts.",
      },
      { property: "og:title", content: "Bluetooth devices — Wrist Band" },
      {
        property: "og:description",
        content: "Pair phones, watches, bands and BLE tags, inspect their services and watch signal strength live.",
      },
    ],
  }),
  component: DevicesPage,
});

const kindIcon = { phone: Bluetooth, watch: Watch, band: HeartPulse, tag: Volume2 } as const;

function rssiBars(rssi: number) {
  if (rssi > -50) return 4;
  if (rssi > -65) return 3;
  if (rssi > -78) return 2;
  return 1;
}

function DevicesPage() {
  const {
    devices,
    togglePair,
    toggleConnected,
    buzzDevice,
    startAlert,
    realBand,
    connectRealBand,
    disconnectRealBand,
    buzzRealBand,
    currentBpm,
  } = useSafeBand();

  return (
    <div className="space-y-4">
      <PageTitle
        title="Bluetooth devices"
        subtitle="Wrist Band uses existing BLE hardware. Which features work depends on what each device exposes."
      />

      <Section
        title="Your wrist band (live)"
        description="Connect a real Bluetooth wrist band or smartwatch that shares heart rate. Live pulse replaces the demo data everywhere in the app."
        icon={Watch}
      >
        {realBand?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-safe/15 text-safe">
                <HeartPulse className="size-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{realBand.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Connected · {currentBpm ? `${currentBpm} bpm live` : "waiting for heart rate…"}
                  {realBand.battery !== null ? ` · battery ${realBand.battery}%` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Cap ok={realBand.hasHeartRate} label="Heart Rate 0x180D" />
              <Cap ok={realBand.hasBuzzer} label="Immediate Alert 0x1802" />
              <Cap ok={realBand.hasBattery} label="Battery 0x180F" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={buzzRealBand} disabled={!realBand.hasBuzzer}>
                <Volume2 className="size-4" /> Buzz band
              </Button>
              <Button size="sm" variant="secondary" onClick={disconnectRealBand}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button onClick={connectRealBand} className="w-full">
              <BluetoothSearching className="size-4" /> Connect wrist band
            </Button>
            <p className="text-[11px] text-muted-foreground">
              {realBand && !realBand.connected ? "Band lost connection. " : ""}
              Works in Chrome or Edge on Android, Windows and Mac (not iPhone Safari). Turn on heart-rate sharing on the band first.
            </p>
          </div>
        )}
      </Section>


      <Section
        title="Paired and nearby"
        description="Scan, pair and remember devices. Reconnection is automatic when they come back into range."
        icon={BluetoothSearching}
      >
        <div className="space-y-3">
          {devices.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              onPair={() => togglePair(d.id)}
              onToggleConnected={() => toggleConnected(d.id)}
              onBuzz={() => buzzDevice(d.id)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Disconnect alert"
        description="If a paired device suddenly drops out of range it may have been snatched. Wrist Band warns you, and the drop feeds the risk score."
        icon={Bluetooth}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => toggleConnected("dev_watch")}>
            Simulate watch out of range
          </Button>
          <Button variant="destructive" size="sm" onClick={() => startAlert("device-button")}>
            Paired device panic button pressed
          </Button>
        </div>
      </Section>
    </div>
  );
}

function DeviceCard({
  device,
  onPair,
  onToggleConnected,
  onBuzz,
}: {
  device: Device;
  onPair: () => void;
  onToggleConnected: () => void;
  onBuzz: () => void;
}) {
  const Icon = kindIcon[device.kind];
  const bars = rssiBars(device.rssi);

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-3">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg",
            device.connected ? "bg-safe/15 text-safe" : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{device.name}</p>
          <p className="text-[11px] capitalize text-muted-foreground">
            {device.kind} · {device.paired ? (device.connected ? "connected" : "out of range") : "not paired"}
          </p>
        </div>
        <Switch checked={device.paired} onCheckedChange={onPair} aria-label="Paired" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="flex items-end gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={cn(
                  "w-1 rounded-sm",
                  i <= bars && device.connected ? "bg-safe" : "bg-muted-foreground/30",
                )}
                style={{ height: `${4 + i * 3}px` }}
              />
            ))}
          </span>
          RSSI {device.rssi} dBm
        </span>
        <span className="flex items-center gap-1">
          <Battery className={cn("size-4", device.battery < 20 ? "text-primary" : "text-safe")} /> {device.battery}%
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Cap ok={device.services.heartRate} label="Heart Rate 0x180D" />
        <Cap ok={device.services.immediateAlert} label="Immediate Alert 0x1802" />
        <Cap ok={device.services.battery} label="Battery 0x180F" />
        <Cap ok={device.services.button} label="Button" />
        <Cap ok={device.services.motion} label="Motion" />
      </div>

      {device.paired ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={onToggleConnected}>
            {device.connected ? "Simulate disconnect" : "Reconnect"}
          </Button>
          <Button size="sm" variant="secondary" onClick={onBuzz} disabled={!device.connected}>
            <Volume2 className="size-4" /> Buzz device
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Cap({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-border text-[10px] font-normal",
        ok ? "bg-safe/12 text-safe" : "bg-secondary/60 text-muted-foreground line-through",
      )}
    >
      {label}
    </Badge>
  );
}
