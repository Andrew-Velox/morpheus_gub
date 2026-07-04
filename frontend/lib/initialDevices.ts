export interface Device {
  id: string
  name: string
  type: "fan" | "light"
  room: "drawingRoom" | "workRoom1" | "workRoom2"
  checked: boolean
  wattage: number
}

export const initialDevices: Device[] = [
  {
    id: "dr-fan-1",
    name: "Fan 1",
    type: "fan",
    room: "drawingRoom",
    checked: false,
    wattage: 60,
  },
  {
    id: "dr-fan-2",
    name: "Fan 2",
    type: "fan",
    room: "drawingRoom",
    checked: false,
    wattage: 60,
  },
  {
    id: "dr-light-1",
    name: "Light 1",
    type: "light",
    room: "drawingRoom",
    checked: false,
    wattage: 15,
  },
  {
    id: "dr-light-2",
    name: "Light 2",
    type: "light",
    room: "drawingRoom",
    checked: false,
    wattage: 15,
  },
  {
    id: "dr-light-3",
    name: "Light 3",
    type: "light",
    room: "drawingRoom",
    checked: false,
    wattage: 15,
  },
  {
    id: "wr1-fan-1",
    name: "Fan 1",
    type: "fan",
    room: "workRoom1",
    checked: false,
    wattage: 60,
  },
  {
    id: "wr1-fan-2",
    name: "Fan 2",
    type: "fan",
    room: "workRoom1",
    checked: false,
    wattage: 60,
  },
  {
    id: "wr1-light-1",
    name: "Light 1",
    type: "light",
    room: "workRoom1",
    checked: false,
    wattage: 15,
  },
  {
    id: "wr1-light-2",
    name: "Light 2",
    type: "light",
    room: "workRoom1",
    checked: false,
    wattage: 15,
  },
  {
    id: "wr1-light-3",
    name: "Light 3",
    type: "light",
    room: "workRoom1",
    checked: false,
    wattage: 15,
  },
  {
    id: "wr2-fan-1",
    name: "Fan 1",
    type: "fan",
    room: "workRoom2",
    checked: false,
    wattage: 60,
  },
  {
    id: "wr2-fan-2",
    name: "Fan 2",
    type: "fan",
    room: "workRoom2",
    checked: false,
    wattage: 60,
  },
  {
    id: "wr2-light-1",
    name: "Light 1",
    type: "light",
    room: "workRoom2",
    checked: false,
    wattage: 15,
  },
  {
    id: "wr2-light-2",
    name: "Light 2",
    type: "light",
    room: "workRoom2",
    checked: false,
    wattage: 15,
  },
  {
    id: "wr2-light-3",
    name: "Light 3",
    type: "light",
    room: "workRoom2",
    checked: false,
    wattage: 15,
  },
]
