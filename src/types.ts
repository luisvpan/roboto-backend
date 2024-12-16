
export interface Coords {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coors: Coords;
  orientation: number;
  speed: number;
}

export interface RawLocationData {
  coordinates: {
    coordinates: [number, number];
  },
  orientation: number;
  speed: number;
}

export enum MovementMode {
  CONTROL = "control",
  DOG = "dog",
  MAP = "map"
}

export interface RawCurrentStatus {
  movement_mode: MovementMode;
  running: boolean;
  movement_speed: number;
}

export interface CurrentStatus {
  movementMode: MovementMode;
  running: boolean;
  movementSpeed: number;
}
