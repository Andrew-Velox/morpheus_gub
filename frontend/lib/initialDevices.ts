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
    id: "draw_fan_1",
    name: "Fan 1",
    type: "fan",
    room: "drawingRoom",
    checked: false,
    wattage: 60,
  },
  {
    id: "draw_fan_2",
    name: "Fan 2",
    type: "fan",
    room: "drawingRoom",
    checked: false,
    wattage: 60,
  },
  {
    id: "draw_light_1",
    name: "Light 1",
    type: "light",
    room: "drawingRoom",
    checked: false,
    wattage: 15,
  },
  {
    id: "draw_light_2",
    name: "Light 2",
    type: "light",
    room: "drawingRoom",
    checked: false,
    wattage: 15,
  },
  {
    id: "draw_light_3",
    name: "Light 3",
    type: "light",
    room: "drawingRoom",
    checked: false,
    wattage: 15,
  },
  {
    id: "work1_fan_1",
    name: "Fan 1",
    type: "fan",
    room: "workRoom1",
    checked: false,
    wattage: 60,
  },
  {
    id: "work1_fan_2",
    name: "Fan 2",
    type: "fan",
    room: "workRoom1",
    checked: false,
    wattage: 60,
  },
  {
    id: "work1_light_1",
    name: "Light 1",
    type: "light",
    room: "workRoom1",
    checked: false,
    wattage: 15,
  },
  {
    id: "work1_light_2",
    name: "Light 2",
    type: "light",
    room: "workRoom1",
    checked: false,
    wattage: 15,
  },
  {
    id: "work1_light_3",
    name: "Light 3",
    type: "light",
    room: "workRoom1",
    checked: false,
    wattage: 15,
  },
  {
    id: "work2_fan_1",
    name: "Fan 1",
    type: "fan",
    room: "workRoom2",
    checked: false,
    wattage: 60,
  },
  {
    id: "work2_fan_2",
    name: "Fan 2",
    type: "fan",
    room: "workRoom2",
    checked: false,
    wattage: 60,
  },
  {
    id: "work2_light_1",
    name: "Light 1",
    type: "light",
    room: "workRoom2",
    checked: false,
    wattage: 15,
  },
  {
    id: "work2_light_2",
    name: "Light 2",
    type: "light",
    room: "workRoom2",
    checked: false,
    wattage: 15,
  },
  {
    id: "work2_light_3",
    name: "Light 3",
    type: "light",
    room: "workRoom2",
    checked: false,
    wattage: 15,
  },
]
