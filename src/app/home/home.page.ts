import { Component, OnInit, OnDestroy, NgZone } from '@angular/core'; // 1. Импортируем NgZone и OnDestroy
import { Capacitor } from '@capacitor/core';
import { Device, DeviceId, BatteryInfo } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Network, ConnectionStatus } from '@capacitor/network';

import { Geolocation, PermissionStatus, Position } from '@capacitor/geolocation';
import { Motion, AccelListenerEvent} from '@capacitor/motion';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {

  public ptfName: string;
  public isNative: boolean;
  public isAvailable: boolean;

  public name: string | undefined;
  public OS: string | undefined;
  public OSversion: string | undefined;
  public manufacturer: string | undefined;
  public isVirtual: boolean | undefined;
  public UUID: string | undefined;

  public batteryLevel: string | undefined;
  public isCharging: boolean | undefined;

  public isConnected: boolean | undefined;
  public connectionType: string | undefined;

  public eventLog: string[] = [];

  public geolocationStatus: string = 'Checking...';
  public latitude: number | undefined;
  public longitude: number | undefined;

  public accelX: number | undefined;
  public accelY: number | undefined;
  public accelZ: number | undefined;

  constructor(private ngZone: NgZone) {
    this.ptfName = Capacitor.getPlatform();
    this.isNative = Capacitor.isNativePlatform();
    this.isAvailable = Capacitor.isPluginAvailable('Camera');
  }

  async ngOnInit() {
    const info = await Device.getInfo();
    this.name = info.name;
    this.OS = info.platform;
    this.OSversion = info.osVersion;
    this.manufacturer = info.manufacturer;
    this.isVirtual = info.isVirtual;
    const id: DeviceId = await Device.getId();
    this.UUID = id.identifier;

    const batteryInfo: BatteryInfo = await Device.getBatteryInfo();
    this.batteryLevel = `${Math.round((batteryInfo.batteryLevel ?? 0) * 100)}%`;
    this.isCharging = batteryInfo.isCharging;

    const networkStatus: ConnectionStatus = await Network.getStatus();
    this.isConnected = networkStatus.connected;
    this.connectionType = networkStatus.connectionType;

    this.setupListeners();

    this.loadGeolocationData();
  }

  async loadGeolocationData() {
    try {
      const permStatus: PermissionStatus = await Geolocation.requestPermissions();
      this.ngZone.run(() => {
        this.geolocationStatus = permStatus.location;
      });

      if (permStatus.location === 'granted') {
        const pos: Position = await Geolocation.getCurrentPosition();
        this.ngZone.run(() => {
          this.latitude = pos.coords.latitude;
          this.longitude = pos.coords.longitude;
        });
      }
    } catch (e: any) {
      this.ngZone.run(() => {
        this.geolocationStatus = `Error: ${e.message}`;
      });
    }
  }

  setupListeners() {
    App.addListener('appStateChange', ({ isActive }) => {
      this.ngZone.run(() => {
        const log = isActive ? 'onStart' : 'onStop';
        this.eventLog.push(log);
      });
    });

    App.addListener('pause', () => {
      this.ngZone.run(() => {
        this.eventLog.push('onPause');
      });
    });

    App.addListener('resume', () => {
      this.ngZone.run(() => {
        this.eventLog.push('onResume');
      });
    });

    Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      this.ngZone.run(() => {
        this.isConnected = status.connected;
        this.connectionType = status.connectionType;
        this.eventLog.push(`Cambio tipo conexión a ${status.connectionType}`);
      });
    });

    Motion.addListener('accel', (event: AccelListenerEvent) => {
      this.ngZone.run(() => {
        this.accelX = event.acceleration.x;
        this.accelY = event.acceleration.y;
        this.accelZ = event.acceleration.z;
      });
    });
  }

  ngOnDestroy() {
    App.removeAllListeners();
    Network.removeAllListeners();
  }
}

