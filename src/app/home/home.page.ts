import { Component, OnInit, OnDestroy, NgZone } from '@angular/core'; // 1. Импортируем NgZone и OnDestroy
import { Capacitor } from '@capacitor/core';
import { Device, DeviceId, BatteryInfo } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Network, ConnectionStatus } from '@capacitor/network';

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

  constructor(private ngZone: NgZone) { // 1. Внедряем NgZone
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
  }

  ngOnDestroy() {
    App.removeAllListeners();
    Network.removeAllListeners();
  }
}

