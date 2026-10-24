// Real Web Bluetooth connection to a wrist band (Chrome/Edge on Android, desktop).
/* eslint-disable @typescript-eslint/no-explicit-any */

export type RealBand = {
  device: any;
  name: string;
  hasHeartRate: boolean;
  hasBattery: boolean;
  alertChar: any | null;
  battery: number | null;
};

export function bluetoothSupported() {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

function parseHeartRate(view: DataView) {
  const flags = view.getUint8(0);
  const bpm = flags & 0x1 ? view.getUint16(1, true) : view.getUint8(1);
  // RR intervals (1/1024 s) if present
  let offset = flags & 0x1 ? 3 : 2;
  if (flags & 0x8) offset += 2;
  const rr: number[] = [];
  if (flags & 0x10) {
    while (offset + 1 < view.byteLength) {
      rr.push((view.getUint16(offset, true) / 1024) * 1000);
      offset += 2;
    }
  }
  return { bpm, rr };
}

export async function connectBand(handlers: {
  onHeartRate: (bpm: number, rr: number[]) => void;
  onBattery: (pct: number) => void;
  onDisconnect: () => void;
}): Promise<RealBand> {
  const bt = (navigator as any).bluetooth;
  const device = await bt.requestDevice({
    filters: [{ services: ["heart_rate"] }],
    optionalServices: ["battery_service", "immediate_alert"],
  });
  device.addEventListener("gattserverdisconnected", handlers.onDisconnect);
  const server = await device.gatt.connect();

  const band: RealBand = {
    device,
    name: device.name || "Wrist band",
    hasHeartRate: false,
    hasBattery: false,
    alertChar: null,
    battery: null,
  };

  try {
    const hr = await server.getPrimaryService("heart_rate");
    const ch = await hr.getCharacteristic("heart_rate_measurement");
    ch.addEventListener("characteristicvaluechanged", (e: any) => {
      const { bpm, rr } = parseHeartRate(e.target.value);
      handlers.onHeartRate(bpm, rr);
    });
    await ch.startNotifications();
    band.hasHeartRate = true;
  } catch {
    /* no HR */
  }

  try {
    const bs = await server.getPrimaryService("battery_service");
    const ch = await bs.getCharacteristic("battery_level");
    const v = await ch.readValue();
    band.battery = v.getUint8(0);
    handlers.onBattery(band.battery!);
    band.hasBattery = true;
    try {
      ch.addEventListener("characteristicvaluechanged", (e: any) => handlers.onBattery(e.target.value.getUint8(0)));
      await ch.startNotifications();
    } catch {
      /* battery notify optional */
    }
  } catch {
    /* no battery */
  }

  try {
    const ia = await server.getPrimaryService("immediate_alert");
    band.alertChar = await ia.getCharacteristic("alert_level");
  } catch {
    /* no buzzer */
  }

  return band;
}

export async function buzzBand(band: RealBand) {
  if (!band.alertChar) throw new Error("This band has no buzzer service");
  await band.alertChar.writeValueWithoutResponse(new Uint8Array([2]));
  setTimeout(() => band.alertChar?.writeValueWithoutResponse(new Uint8Array([0])).catch(() => {}), 2000);
}

export function disconnectBand(band: RealBand) {
  band.device?.gatt?.disconnect();
}
