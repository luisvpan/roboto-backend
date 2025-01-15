
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
  MAP = "map",
  PATH = "path" // not implemented
}

export interface RawCurrentStatus {
  movement_mode: MovementMode;
  running: boolean;
  movement_speed: number;
  target_coords: { latitude: number, longitude: number };
  target_orientation: number;
}

export interface CurrentStatus {
  movementMode: MovementMode;
  running: boolean;
  movementSpeed: number;
  targetCoords: Coords;
  targetOrientation: number;
}
